import { mkdir, readdir, stat, unlink, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8082';
const API_BASE_URL = (process.env.FORECAST_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const OUTPUT_DIR = path.resolve(process.env.FORECAST_REPORT_OUTPUT_DIR || './forecast-reports');
const INTERVAL_MINUTES = Math.max(5, Number(process.env.FORECAST_REPORT_INTERVAL_MINUTES || 60));
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.FORECAST_REPORT_REQUEST_TIMEOUT_MS || 30_000));
const REGION_CONCURRENCY = Math.max(1, Number(process.env.FORECAST_REPORT_REGION_CONCURRENCY || 3));
const RETENTION_DAYS = Math.max(1, Number(process.env.FORECAST_REPORT_RETENTION_DAYS || 30));
const RANGES = ['12h', '7d', '15d'];
const REPORT_NOW_OVERRIDE = String(process.env.FORECAST_REPORT_NOW || '').trim();

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
});
const formatParts = (formatter, date) => Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
);
const formatDateTime = (date) => {
    const parts = formatParts(dateTimeFormatter, date);
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};
const formatFileStamp = (date) => {
    const parts = formatParts(dateTimeFormatter, date);
    return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}`;
};
const getReportNow = () => {
    if (!REPORT_NOW_OVERRIDE) return new Date();
    const normalized = REPORT_NOW_OVERRIDE.replace(' ', 'T');
    const parsed = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}+08:00`);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`FORECAST_REPORT_NOW 无法解析：${REPORT_NOW_OVERRIDE}`);
    }
    return parsed;
};

const mapLimit = async (items, limit, handler) => {
    const results = new Array(items.length);
    let cursor = 0;
    const worker = async () => {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await handler(items[index], index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, Math.max(items.length, 1)) }, worker));
    return results;
};

const requestReport = async (endpoint, accept) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Accept: accept },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response;
};

const collectTarget = async target => {
    if (!target.stations.length) return [`${target.name} · 暂无预报站点`];
    const sections = [];
    for (const station of target.stations) {
        const name = [target.name, station.label].filter(Boolean).join(' · ');
        for (const range of RANGES) {
            const query = new URLSearchParams({ range, siteId: station.id, format: 'txt' });
            try {
                const response = await requestReport(
                    `/api/forecast/targets/${encodeURIComponent(target.id)}/bulletin/download?${query}`, 'text/plain'
                );
                sections.push(`【${name} · ${range}】\n${(await response.text()).trim()}`);
            } catch (error) {
                sections.push(`【${name} · ${range}】\n${error.status === 404 ? '暂无预报数据' : `读取失败（${error.message}）`}`);
            }
        }
    }
    return sections;
};

const cleanupReports = async () => {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 3600_000;
    const files = await readdir(OUTPUT_DIR, { withFileTypes: true });
    await Promise.all(files.filter(entry => entry.isFile() && /^预报报文_五矿区_\d{8}_\d{4}\.txt$/.test(entry.name)).map(async entry => {
        const file = path.join(OUTPUT_DIR, entry.name);
        const info = await stat(file).catch(() => null);
        if (info?.mtimeMs < cutoff) await unlink(file);
    }));
};

const runJob = async () => {
    const generatedAt = getReportNow();
    const payload = await (await requestReport('/api/forecast/targets', 'application/json')).json();
    const targets = payload.data;
    if (!Array.isArray(targets) || !targets.length) throw new Error('未取得服务矿区清单');
    const sections = (await mapLimit(targets, REGION_CONCURRENCY, collectTarget)).flat();
    await mkdir(OUTPUT_DIR, { recursive: true });
    const filename = `预报报文_五矿区_${formatFileStamp(generatedAt)}.txt`;
    const target = path.join(OUTPUT_DIR, filename);
    const temporary = `${target}.tmp`;
    await writeFile(temporary, sections.join('\n\n') + '\n', 'utf8');
    await rename(temporary, target);
    const latest = {
        filename,
        generatedAt: formatDateTime(generatedAt),
        generatedAtIso: generatedAt.toISOString(),
        apiBaseUrl: API_BASE_URL,
        regionCount: targets.length,
        siteCount: targets.reduce((sum, area) => sum + area.stations.length, 0),
        path: target
    };
    const index = path.join(OUTPUT_DIR, 'latest.json');
    await writeFile(`${index}.tmp`, JSON.stringify(latest, null, 2), 'utf8');
    await rename(`${index}.tmp`, index);
    await cleanupReports();
    console.log(`[forecast-report] 已生成：${target}`);
    return latest;
};

const runOnce = async () => {
    try {
        await runJob();
    } catch (error) {
        console.error(`[forecast-report] 生成失败：${error.message}`);
        process.exitCode = 1;
    }
};

const runWatch = async () => {
    let running = false;
    const execute = async () => {
        if (running) {
            console.warn('[forecast-report] 上一轮仍在执行，本轮跳过。');
            return;
        }
        running = true;
        try {
            await runJob();
        } catch (error) {
            console.error(`[forecast-report] 本轮失败：${error.message}`);
        } finally {
            running = false;
        }
    };
    await execute();
    const scheduleNext = () => setTimeout(async () => {
        await execute();
        scheduleNext();
    }, INTERVAL_MINUTES * 60_000);
    scheduleNext();
    console.log(`[forecast-report] 定时服务已启动，每 ${INTERVAL_MINUTES} 分钟执行一次。`);
};

if (process.argv.includes('--watch')) {
    await runWatch();
} else {
    await runOnce();
}
