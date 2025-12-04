// 简易粒子风场渲染工具（基于 Cesium 实现）
// 用于在给定的规则风场网格上生成和更新粒子点

import * as Cesium from 'cesium';

/**
 * 根据经纬度获取最近网格点的风矢量（最近邻插值）
 * @param {Object} grid - loadWindGrid 返回的对象 { header, points }
 * @param {number} lon
 * @param {number} lat
 * @returns {{u:number, v:number}} 风矢量
 */
function getWindAt(grid, lon, lat) {
  const { header, points } = grid;
  const { lo1, la1, dx, dy, nx, ny } = header;

  // 计算网格索引（最近邻）
  const i = Math.max(0, Math.min(nx - 1, Math.round((lon - lo1) / dx)));
  const j = Math.max(0, Math.min(ny - 1, Math.round((la1 - lat) / dy))); // 注意纬度方向

  const idx = j * nx + i;
  const p = points[idx];
  if (!p) {
    return { u: 0, v: 0 };
  }
  return { u: p.u, v: p.v };
}

/**
 * 创建一个简易的粒子风场图层
 * @param {Cesium.Viewer} viewer
 * @param {Object} grid - loadWindGrid 返回的对象 { header, points }
 * @param {Object} [options]
 * @returns {{ destroy: () => void }}
 */
export function createWindParticleLayer(viewer, grid, options = {}) {
  const { header } = grid;
  const { lo1, lo2, la1, la2 } = header;

  const particleCount = options.particleCount || 1000;        // 粒子数量：更密集
  const maxAge = options.maxAge || 250;                        // 寿命略长，轨迹更连贯
  const speedFactor = options.speedFactor || 0.12;             // 基础速度稍慢，避免跳跃
  const height = options.height || 80000.0;                    // 稍贴近地表
  const trailLength = options.trailLength || 24;               // 轨迹点数：更长的条纹
  const refSpeed = options.refSpeed || 5.0;                    // 参考风速，用于归一化速度和颜色

  const particles = [];
  const entities = [];

  const colorBySpeed = (speed) => {
    // 简单分级着色：弱风蓝绿色，中等风黄色，强风橙红
    const s = Math.max(0, speed);
    if (s > refSpeed * 1.5) {
      return Cesium.Color.fromBytes(255, 140, 0, 255);   // 强风：橙色
    }
    if (s > refSpeed) {
      return Cesium.Color.fromBytes(255, 220, 0, 235);   // 中等：黄
    }
    return Cesium.Color.fromBytes(120, 220, 255, 220);   // 弱风：青蓝
  };

  // 在给定经纬度范围内随机生成一个粒子
  function randomParticle() {
    const lon = lo1 + Math.random() * (lo2 - lo1);
    const lat = la2 + Math.random() * (la1 - la2); // la1 > la2
    const { u, v } = getWindAt(grid, lon, lat);
    const baseSpeed = Math.sqrt(u * u + v * v);

    const base = {
      lon,
      lat,
      age: Math.floor(Math.random() * maxAge),
      speed: baseSpeed,
      u,
      v,
      entity: null
    };
    // 初始轨迹：填充为同一点，避免首次渲染时折线塌缩
    const positions = [];
    for (let i = 0; i < trailLength; i++) {
      positions.push({ lon, lat });
    }
    base.trail = positions;
    return base;
  }

  // 初始化粒子与实体
  for (let i = 0; i < particleCount; i++) {
    const p = randomParticle();

    const entity = viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const flat = [];
          for (let k = 0; k < p.trail.length; k++) {
            flat.push(p.trail[k].lon, p.trail[k].lat);
          }
          return Cesium.Cartesian3.fromDegreesArray(flat);
        }, false),
        width: 1.4,
        material: new Cesium.PolylineArrowMaterialProperty(
          colorBySpeed(p.speed)
        )
      }
    });

    particles.push(p);
    p.entity = entity;
    entities.push(entity);
  }

  // 更新函数：在时钟 tick 时推进粒子位置
  const onTick = () => {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // 超龄或飞出区域则重置
      if (
        p.age > maxAge ||
        p.lon < lo1 || p.lon > lo2 ||
        p.lat < la2 || p.lat > la1
      ) {
        const np = randomParticle();
        Object.assign(p, np);
        continue;
      }

      const { u, v } = getWindAt(grid, p.lon, p.lat);
      const localSpeed = Math.sqrt(u * u + v * v);

      // 简化的位移更新（单位换算与时间步长都用经验参数控制）
      const speedScale = 0.3 + (localSpeed / (refSpeed || 1)) * 0.7;
      p.lon += u * speedFactor * speedScale;
      p.lat += v * speedFactor * speedScale;
      p.age += 1;

      p.speed = localSpeed;
      p.u = u;
      p.v = v;

      // 根据局地风速调整颜色
      if (p.entity && p.entity.polyline) {
        p.entity.polyline.material = new Cesium.PolylineArrowMaterialProperty(
          colorBySpeed(localSpeed)
        );
      }

      // 更新轨迹：追加新位置，超出长度则移除最旧的
      p.trail.push({ lon: p.lon, lat: p.lat });
      if (p.trail.length > trailLength) {
        p.trail.shift();
      }
    }

    viewer.scene.requestRender();
  };

  viewer.clock.onTick.addEventListener(onTick);

  return {
    destroy() {
      viewer.clock.onTick.removeEventListener(onTick);
      entities.forEach(e => viewer.entities.remove(e));
    }
  };
}


