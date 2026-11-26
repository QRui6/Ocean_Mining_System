export const forecastTargetSeries = report => (report?.points || []).map(point => ({
  baseDate: report.summary?.baseDate,
  runCycle: report.summary?.runCycle,
  forecastDate: point.date,
  forecastTime: point.time,
  windSpeedAvg: point.windAvg,
  windSpeedMax: point.windMax,
  gustMax: point.gust,
  waveHeightAvg: point.waveAvg,
  waveHeightMax: point.waveMax,
  wavePeriodAvg: point.period,
  currentSpeedAvg: point.currentAvg,
  currentSpeedMax: point.currentMax
}));

export function forecastInitialTime(records = []) {
  const r=records.find(r=>r?.baseDate || r?.forecastBaseTime)||{};
  const date=String(r.baseDate||r.forecastBaseTime||'');
  const cycle=String(r.runCycle||'').match(/^t?(00|06|12|18)$/i);
  if(!date)return '未提供';
  if(!cycle)return /T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(date)?date:'未提供';
  const stamp=new Date(`${date.slice(0,10)}T${cycle[1]}:00:00Z`);
  return Number.isNaN(stamp.getTime())?date:stamp.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+' UTC+08:00';
}
export function warningExportText(item) {
  if(item.type!=='forecast_candidate')return item.bulletinText||item.warningMessage||'';
  if(!item.forecastData && item.bulletinText)return item.bulletinText;
  const data=item.forecastData||{},records=data.hourlySeries?.length?data.hourlySeries:data.series||[];
  const first=(r,keys)=>{for(const k of keys)if(r[k]!=null&&r[k]!==''&&Number.isFinite(Number(r[k])))return Number(r[k]).toFixed(2);return '--';};
  const coordinates=item.site||item.region||{};
  const expired = item.status === 'EXPIRED' && item.stale;
  const initialTime = expired && item.initialTimeUnverified
    ? `待核对（批次 ${item.sourceBase}）`
    : forecastInitialTime(records);
  const lines=[`${expired ? '矿区' : item.siteName ? '小矿区' : '区域'}预警分析`,
    `预报：${item.regionName}${item.siteName?' / '+item.siteName:''}；经度：${coordinates.lng??coordinates.centerLng??'--'}；纬度：${coordinates.lat??coordinates.centerLat??'--'}`,
    `初始时间：${initialTime}`,`等级：${item.candidateLevel||item.severity}`];
  if (expired) {
    const time = value => value.slice(0,16).replace('T',' ');
    lines.push('状态：已过期', `超限时段：${time(item.validFrom)} 至 ${time(item.validUntil)} UTC+08:00`);
    if (item.analysis?.recoveredAt) lines.push(`首次回落：${time(item.analysis.recoveredAt)}`);
    for (const trigger of item.triggerDetail || []) {
      lines.push(`${trigger.type}峰值：${trigger.value} ${trigger.unit}；阈值：${trigger.threshold} ${trigger.unit}`);
    }
  }
  lines.push('', '一、预报数据');
  const seen=new Set();
  for(const r of records){const time=r.forecastTime||r.forecastDate||r.time||r.date;if(seen.has(time))continue;seen.add(time);
    lines.push(`${time}：风速 ${first(r,['windSpeedMax','windSpeedAvg','windSpeed'])} m/s；浪高 ${first(r,['waveHeightMax','waveHeightAvg','waveHeight'])} m；流速 ${first(r,['currentSpeedMax','currentSpeedAvg','currentSpeed'])} m/s`);
  }
  lines.push('','二、作业建议',item.stale?'请查看最新预报和现场观测。':item.severity==='CRITICAL'?'暂停高风险作业，核查现场条件。':'加强值守，跟踪预报更新。');
  return lines.join('\n');
}
