import { collectWarningCandidates } from '../src/utils/warning/warningCandidateService.js';
import { miningRiskWarning } from '../src/utils/warning/miningRiskWarningService.js';
import { warningExportText } from '../src/utils/forecastReportText.js';
import { mkdir, readdir, stat, unlink, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8082';
const API_BASE_URL = (process.env.WARNING_API_BASE_URL || process.env.FORECAST_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const OUTPUT_DIR = path.resolve(process.env.WARNING_REPORT_OUTPUT_DIR || './warning-reports');
const INTERVAL_MINUTES = Math.max(5, Number(process.env.WARNING_REPORT_INTERVAL_MINUTES || 60));
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.WARNING_REPORT_REQUEST_TIMEOUT_MS || 30_000));
const RETENTION_DAYS = Math.max(1, Number(process.env.WARNING_REPORT_RETENTION_DAYS || 90));
const REPORT_NOW_OVERRIDE = String(process.env.WARNING_REPORT_NOW || '').trim();

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', { timeZone: SHANGHAI_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { timeZone: SHANGHAI_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const formatParts = (formatter, date) => Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
const formatDateTime = (date) => { const parts = formatParts(dateTimeFormatter, date); return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`; };
const formatDate = (date) => { const parts = formatParts(dateFormatter, date); return `${parts.year}-${parts.month}-${parts.day}`; };
const formatFileStamp = (date) => { const parts = formatParts(dateTimeFormatter, date); return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}`; };
const getReportNow = () => {
    if (!REPORT_NOW_OVERRIDE) return new Date();
    const normalized = REPORT_NOW_OVERRIDE.replace(' ', 'T');
    const parsed = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}+08:00`);
    if (Number.isNaN(parsed.getTime())) throw new Error(`WARNING_REPORT_NOW 无法解析：${REPORT_NOW_OVERRIDE}`);
    return parsed;
};

const requestJson = async endpoint => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.success === false) throw new Error(payload.message || '接口返回失败');
    return payload.data;
};

const fetchProduct = (id, range, siteId) => requestJson(
    `/api/forecast/targets/${encodeURIComponent(id)}?${new URLSearchParams({ range, siteId })}`
);
const fingerprint = item => JSON.stringify({
    severity: item.severity,
    sourceBase: item.sourceBase,
    validFrom: item.validFrom,
    validUntil: item.validUntil,
    triggers: item.triggerDetail
});
const readJson = async (file, fallback) => {
    const { readFile } = await import('node:fs/promises');
    try { return JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
};
const writeAtomic = async (file, content) => {
    const temporary = `${file}.tmp`;
    await writeFile(temporary, content, 'utf8');
    await rename(temporary, file);
};
const writeReport = async (directory, filename, content) => {
    await mkdir(directory, { recursive: true });
    const file = path.join(directory, filename);
    await writeAtomic(file, content);
    return path.relative(OUTPUT_DIR, file).split(path.sep).join('/');
};

const cleanupReports = async () => {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 3600_000;
    const visit = async directory => {
        const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) await visit(file);
            else if (/^预警(?:快照|事件)_五矿区_/.test(entry.name) && (await stat(file).catch(() => null))?.mtimeMs < cutoff) await unlink(file);
        }
    };
    await visit(path.join(OUTPUT_DIR, 'snapshots'));
    await visit(path.join(OUTPUT_DIR, 'events'));
};

const runJob = async () => {
    const generatedAt = getReportNow();
    const now = generatedAt.getTime();
    const targets = await requestJson('/api/forecast/targets');
    if (!Array.isArray(targets) || !targets.length) throw new Error('未取得服务矿区清单');
    const byId = new Map(targets.map(target => [target.id, target]));
    const [gridResult, candidateResult] = await Promise.allSettled([
        requestJson('/api/mining-risk/events'),
        requestJson('/api/mining-risk/rules').then(rules => collectWarningCandidates(targets, rules, fetchProduct, now))
    ]);
    const errors = [];
    if (gridResult.status === 'rejected') errors.push(`矿区预警读取失败：${gridResult.reason.message}`);
    if (candidateResult.status === 'rejected') errors.push(`预报研判读取失败：${candidateResult.reason.message}`);
    const warnings = (gridResult.value || []).filter(row => byId.has(row.area_id) && row.area_name === byId.get(row.area_id).name)
        .map(row => miningRiskWarning(row, now));
    const active = warnings.filter(item => item.status === 'ACTIVE' && !item.stale);
    const candidates = (candidateResult.value?.items || []).filter(item => byId.has(item.areaId) && !item.stale);
    const staleCount = candidateResult.value?.staleCount || 0;

    const stamp = formatFileStamp(generatedAt);
    const day = formatDate(generatedAt).replace(/-/g, '/');
    const snapshot = [
        '深海采矿自动预警报文快照',
        `当前预警 ${active.length} 条 · 预报候选 ${candidates.length} 条`,
        ...(staleCount ? [`${staleCount} 个站点预报已过期`] : []),
        ...errors,
        ...active.map(warningExportText),
        ...candidates.map(warningExportText)
    ].join('\n\n') + '\n';
    const snapshotFile = await writeReport(path.join(OUTPUT_DIR, 'snapshots', day), `预警快照_五矿区_${stamp}.txt`, snapshot);
    const stateFile = path.join(OUTPUT_DIR, 'state-china-contracts.json');
    const prior = await readJson(stateFile, { active: {}, history: [] });
    const nextActive = { ...prior.active };
    const events = [];
    for (const item of warnings) {
        const previous = prior.active[item.id];
        const next = fingerprint(item);
        let type;
        if (item.status === 'RESOLVED' && previous) {
            type = 'resolved';
            delete nextActive[item.id];
        } else if (item.status === 'ACTIVE' && !item.stale) {
            if (next !== previous) type = previous ? 'updated' : 'created';
            nextActive[item.id] = next;
        }
        if (!type) continue;
        const title = { created: '预警新增报文', updated: '预警更新报文', resolved: '预警解除报文' }[type];
        const file = await writeReport(path.join(OUTPUT_DIR, 'events', day),
            `预警事件_五矿区_${item.areaId}_${item.eventId}_${type}_${stamp}.txt`,
            `${title}\n${warningExportText(item)}\n`);
        events.push({ type, id: item.id, warningCode: item.warningCode, file, at: generatedAt.toISOString() });
    }
    const latest = {
        snapshot: snapshotFile,
        generatedAt: formatDateTime(generatedAt),
        generatedAtIso: generatedAt.toISOString(),
        counts: { total: active.length + candidates.length, formal: active.length, candidate: candidates.length },
        events, errors
    };
    await writeAtomic(stateFile, JSON.stringify({ active: nextActive, history: [...prior.history, ...events].slice(-1000) }, null, 2));
    await writeAtomic(path.join(OUTPUT_DIR, 'latest.json'), JSON.stringify(latest, null, 2));
    const indexFile = path.join(OUTPUT_DIR, 'index-china-contracts.json');
    const index = await readJson(indexFile, { reports: [] });
    await writeAtomic(indexFile, JSON.stringify({ reports: [latest, ...index.reports].slice(0, 500) }, null, 2));
    await cleanupReports();
    console.log(`[warning-report] 已生成快照：${snapshotFile}，当前预警 ${active.length} 条`);
    return latest;
};

const runOnce = async () => { try { await runJob(); } catch (error) { console.error(`[warning-report] 生成失败：${error.message}`); process.exitCode = 1; } };
const runWatch = async () => { let running = false; const execute = async () => { if (running) return; running = true; try { await runJob(); } catch (error) { console.error(`[warning-report] 本轮失败：${error.message}`); } finally { running = false; } }; await execute(); const scheduleNext = () => setTimeout(async () => { await execute(); scheduleNext(); }, INTERVAL_MINUTES * 60_000); scheduleNext(); console.log(`[warning-report] 定时服务已启动，每 ${INTERVAL_MINUTES} 分钟执行一次。`); };

if (process.argv.includes('--watch')) await runWatch(); else await runOnce();
