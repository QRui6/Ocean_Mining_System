// src/utils/windLoader.js
// 默认使用全局 1° 分辨率风场数据；如需切回小样本，可传入 '/data/wind_sample.json'
// 全局数据结构示例：
// { "wind": [ { "lat": -90, "lon": -180, "u": ..., "v": ... }, ... ] }
export async function loadWindGrid(url = '/data/global_wind_1deg.json') {
  const resp = await fetch(url);
  const raw = await resp.json();

  const arr = Array.isArray(raw) ? raw : raw.wind;
  if (!arr || !Array.isArray(arr)) {
    throw new Error('wind 数据格式错误：期望 { wind: [...] } 或数组');
  }

  // 提取所有经纬度并排序
  const latSet = new Set();
  const lonSet = new Set();
  for (const p of arr) {
    latSet.add(p.lat);
    lonSet.add(p.lon);
  }
  const lats = Array.from(latSet).sort((a, b) => a - b);   // 从小到大
  const lons = Array.from(lonSet).sort((a, b) => a - b);   // 从小到大

  const ny = lats.length;
  const nx = lons.length;

  const la1 = lats[ny - 1];   // 最大纬度（北）
  const la2 = lats[0];        // 最小纬度（南）
  const lo1 = lons[0];        // 最小经度（西）
  const lo2 = lons[nx - 1];   // 最大经度（东）

  const dy = ny > 1 ? Math.abs(lats[1] - lats[0]) : 1;
  const dx = nx > 1 ? Math.abs(lons[1] - lons[0]) : 1;

  // 建一个快速查表：lat,lon -> {u,v}
  const valueMap = new Map();
  for (const p of arr) {
    const key = `${p.lat},${p.lon}`;
    valueMap.set(key, p);
  }

  const points = [];

  // 生成与旧版相同的规则网格顺序：从北到南，从西到东
  for (let j = 0; j < ny; j++) {
    const lat = la1 - j * dy;
    for (let i = 0; i < nx; i++) {
      const lon = lo1 + i * dx;
      const key = `${lat},${lon}`;
      const rec = valueMap.get(key);

      const u = rec ? rec.u : 0;
      const v = rec ? rec.v : 0;
      const speed = Math.sqrt(u * u + v * v);
      const dir = Math.atan2(u, v); // 与之前定义保持一致

      points.push({ lon, lat, dir, speed, u, v });
    }
  }

  const header = {
    lo1,
    la1,
    lo2,
    la2,
    dx,
    dy,
    nx,
    ny
  };

  return { header, points };
}