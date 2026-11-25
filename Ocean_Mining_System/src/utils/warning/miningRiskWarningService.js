import {monitoringRequest as request} from '../../api/monitoring.js';
const labels={wind:'风速',wave:'浪高',ocean_current:'流速'};
export async function fetchMiningRiskWarnings(){
  const rows=await request('/api/mining-risk/events');
  return rows.map(e=>{
    const s=e.snapshot,label=labels[e.metric],value=s.value==null?'--':s.value.toFixed(2),unit=s.rule?.unit||'';
    return {id:`grid-${e.id}`,eventId:e.id,areaId:e.area_id,source:'矿区评估',sourceType:'grid',severity:e.severity,status:e.status,
      warningCode:`${label}预警 · ${e.area_id}`,regionName:e.area_id,timeRange:'',sourceBase:s.initialTime,validUntil:s.end,
      warningMessage:e.status==='RESOLVED'?`${e.area_id}的${label}已低于阈值。`:`${e.area_id}预计${label}达到${value} ${unit}。`,
      createdAt:e.created_at,resolvedAt:e.resolved_at,stale:e.status==='ACTIVE'&&new Date(s.end)<new Date(),
      triggerDetail:s.value==null?[]:[{type:label,value,unit,threshold:s.rule.warning,forecastDate:s.start}],
      bulletinText:`矿区作业预警\n预报：${e.area_id}；经度：${s.point?.lon?.toFixed(4)??"未提供"}；纬度：${s.point?.lat?.toFixed(4)??"未提供"}\n初始时间：${s.initialTime}\n状态：${e.status==='ACTIVE'?'生效':'解除'}\n${label}：${value} ${unit}\n阈值：${s.rule.warning} ${unit}\n时段：${s.start||'--'} 至 ${s.end||'--'}`};
  });
}
export async function fetchMiningRiskVersions(id){
  return (await request(`/api/mining-risk/events/${id}/versions`)).map(v=>({at:v.created_at,type:{CREATED:'created',UPDATED:'updated',ACKNOWLEDGED:'acknowledged',RESOLVED:'resolved'}[v.action],text:''}));
}
