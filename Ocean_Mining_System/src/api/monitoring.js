import { API_BASE_URL } from './config.js';
export async function monitoringRequest(path, options={}) {
  const response=await fetch(`${API_BASE_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...options.headers},signal:options.signal||AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error(`请求失败（${response.status}）`);
  const body=await response.json();if(body.success===false)throw new Error(body.message||body.error||'请求失败');
  return body.data??body;
}
