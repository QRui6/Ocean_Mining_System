# NOAA NOMADS 数据源实施方案

## 📋 方案概述

使用 NOAA NOMADS 作为核心数据源，替代 Windy API，实现风、浪、流三种气象数据的可视化。

### ✅ 可行性评估

**高度可行**，原因：
1. 你的项目已有完整的后端服务器（Node.js + Express）
2. 已有数据加载和时间轴管理架构
3. 已使用 `cesium-wind-layer` 库，完美支持 GRIB2 转 JSON 格式
4. NOAA 数据免费、稳定、更新及时

---

## 🎯 实施步骤

### 第一步：安装 grib2json 工具

这是整个方案的核心工具，用于将 GRIB2 格式转换为 JSON。

#### 方法一：使用 npm（推荐）

```bash
npm install -g grib2json
```

#### 方法二：从源码编译

```bash
# 需要 Java 8+
git clone https://github.com/cambecc/grib2json.git
cd grib2json
mvn package
# 将生成的 jar 文件添加到 PATH
```

#### 验证安装

```bash
grib2json --version
```

---

### 第二步：集成后端服务

#### 1. 安装依赖（如果还没有）

```bash
cd backend
npm install axios
```

#### 2. 在 server.js 中集成 NOAA 服务

在 `backend/server.js` 中添加：

```javascript
// 导入 NOAA 服务
const NOAADataService = require('./services/noaaDataService');
const noaaRoutes = require('./routes/noaaRoutes');

// 初始化 NOAA 服务
const noaaService = new NOAADataService();

// 启动时初始化（异步，不阻塞服务器启动）
noaaService.init().catch(err => {
    console.error('⚠️  NOAA 服务初始化失败，将在后台重试:', err.message);
});

// 注册路由
app.use('/api/noaa', noaaRoutes(noaaService));

// 静态文件服务（提供 JSON 数据）
app.use('/data/noaa', express.static(path.join(__dirname, 'public/data/noaa')));
```

#### 3. 创建必要的目录

```bash
mkdir -p backend/public/data/noaa
mkdir -p backend/cache/grib
mkdir -p backend/services
mkdir -p backend/routes
```

---

### 第三步：更新前端配置

#### 1. 更新 constants.js 中的气象图层配置

将 Windy 图层替换为 NOAA 图层：

```javascript
export const WEATHER_LAYER_GROUPS = [
    {
        id: 'noaa_data',
        label: 'NOAA 实时数据',
        active: true,
        subLayers: [
            { 
                id: 'noaa_wind', 
                label: '风场动画 (GFS)', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'NOAA GFS 0.25°',
                type: 'noaa',
                dataType: 'wind'
            },
            { 
                id: 'noaa_current', 
                label: '洋流动画 (RTOFS)', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'NOAA RTOFS',
                type: 'noaa',
                dataType: 'current'
            },
            { 
                id: 'noaa_wave', 
                label: '海浪动画 (GFS-Wave)', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'NOAA GFS-Wave',
                type: 'noaa',
                dataType: 'wave'
            }
        ]
    },
    // ... 保留其他图层组
];
```

#### 2. 在 MapContainer.vue 中集成 NOAA 数据加载器

```javascript
import { noaaLoader } from '../utils/noaaDataLoader.js';

// 在 watch weatherLayerState 中添加 NOAA 图层处理
watch(() => props.weatherLayerState, async (weatherLayers) => {
    for (const group of weatherLayers) {
        if (group.id === 'noaa_data' && group.subLayers) {
            const activeLayer = group.subLayers.find(sub => sub.active && sub.type === 'noaa');
            
            if (activeLayer) {
                console.log(`✅ 激活 NOAA 图层: ${activeLayer.label}`);
                
                try {
                    // 加载数据
                    let data;
                    if (activeLayer.dataType === 'wind') {
                        data = await noaaLoader.loadWind(0); // 0小时预报（当前）
                    } else if (activeLayer.dataType === 'current') {
                        data = await noaaLoader.loadCurrent(0);
                    } else if (activeLayer.dataType === 'wave') {
                        data = await noaaLoader.loadWave(0);
                    }
                    
                    // 使用 cesium-wind-layer 渲染
                    if (windLayer) {
                        windLayer.removeAllPrimitives();
                    }
                    
                    windLayer = new Cesium.WindLayer(viewer, data, {
                        particlesTextureSize: 64,
                        maxParticles: 64 * 64,
                        particleHeight: 100.0,
                        fadeOpacity: 0.996,
                        dropRate: 0.003,
                        dropRateBump: 0.01,
                        speedFactor: activeLayer.dataType === 'current' ? 0.5 : 1.0,
                        lineWidth: 2.0
                    });
                    
                    console.log('✅ NOAA 图层渲染完成');
                } catch (err) {
                    console.error('❌ NOAA 图层加载失败:', err);
                }
            } else {
                // 清除图层
                if (windLayer) {
                    windLayer.removeAllPrimitives();
                }
            }
        }
    }
}, { deep: true });
```

---

### 第四步：测试和验证

#### 1. 启动后端服务

```bash
cd backend
npm start
```

#### 2. 手动触发数据更新（首次运行）

```bash
# 更新所有数据
curl -X POST http://localhost:3000/api/noaa/update \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'

# 或单独更新某一类
curl -X POST http://localhost:3000/api/noaa/update \
  -H "Content-Type: application/json" \
  -d '{"type": "wind"}'
```

#### 3. 检查数据文件

```bash
ls -lh backend/public/data/noaa/
# 应该看到：
# wind_f000.json
# wind_f006.json
# current_f000.json
# wave_f000.json
# ...
```

#### 4. 启动前端

```bash
npm run dev
```

#### 5. 测试功能

1. 切换到"气象监测"选项卡
2. 打开"气象图层"面板
3. 激活"NOAA 实时数据" → "风场动画"
4. 观察地图上是否出现风场流线

---

## 🔧 高级配置

### 1. 调整数据更新频率

在 `noaaDataService.js` 中修改：

```javascript
this.sources = {
    wind: {
        // ...
        updateInterval: 3 * 60 * 60 * 1000 // 改为3小时更新一次
    }
};
```

### 2. 限制数据范围（节省流量和存储）

如果只关注太平洋区域，修改下载参数：

```javascript
wind: {
    baseUrl: 'https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl',
    params: {
        // ...
        leftlon: 100,    // 东经100°
        rightlon: 180,   // 东经180°
        toplat: 50,      // 北纬50°
        bottomlat: -10   // 南纬10°
    }
}
```

### 3. 添加深度层数据（针对深海采矿）

RTOFS 支持多个深度层，修改 `noaaDataService.js`：

```javascript
// 下载不同深度的洋流数据
async downloadCurrentAtDepth(depth) {
    // depth: 'surface', '100m', '1000m', '3000m'
    const params = {
        ...this.sources.current.params,
        lev_depth: depth
    };
    // ...
}
```

### 4. 历史数据支持

NOAA NOMADS 只保留最近几天的数据。如需历史数据：

1. 访问 NOAA NCEI 存档：https://www.ncei.noaa.gov/
2. 下载 NetCDF 格式
3. 使用 Python 脚本转换：

```python
import xarray as xr
import json

# 读取 NetCDF
ds = xr.open_dataset('gfs_historical.nc')

# 提取 U/V 分量
u = ds['u10'].values
v = ds['v10'].values

# 转换为 grib2json 格式
data = [
    {
        "header": {
            "nx": u.shape[1],
            "ny": u.shape[0],
            "lo1": 0,
            "la1": 90,
            "lo2": 360,
            "la2": -90
        },
        "data": u.flatten().tolist()
    },
    {
        "header": {...},
        "data": v.flatten().tolist()
    }
]

with open('wind_historical.json', 'w') as f:
    json.dump(data, f)
```

---

## 📊 数据说明

### 1. 风场数据 (GFS)

- **分辨率**: 0.25° × 0.25° (约28km)
- **更新频率**: 每6小时
- **预报时长**: 0-384小时（16天）
- **参数**: UGRD (U分量), VGRD (V分量)
- **高度**: 10m above ground

### 2. 洋流数据 (RTOFS)

- **分辨率**: 约1/12° (约9km)
- **更新频率**: 每24小时
- **预报时长**: 0-192小时（8天）
- **参数**: u_velocity, v_velocity
- **深度**: Surface, 100m, 1000m, 3000m 等

### 3. 海浪数据 (GFS-Wave)

- **分辨率**: 0.25° × 0.25°
- **更新频率**: 每6小时
- **预报时长**: 0-384小时
- **参数**: HTSGW (显著波高), WVDIR (波浪方向)

---

## ⚠️ 注意事项

### 1. 首次下载时间较长

- 全球数据文件约 50-200MB
- GRIB2 转 JSON 需要 1-5 分钟
- 建议首次运行时手动触发，观察日志

### 2. 存储空间

- 每个时间步约 10-50MB（JSON格式）
- 如果保存 7 天 × 4 次/天 × 3 种数据 = 约 3-10GB
- 建议定期清理旧数据

### 3. 网络稳定性

- NOAA 服务器在美国，国内访问可能较慢
- 建议设置重试机制
- 可以考虑使用代理或镜像

### 4. grib2json 依赖 Java

- 确保服务器安装了 Java 8+
- 检查：`java -version`

---

## 🚀 优化建议

### 1. 使用 CDN 加速

将生成的 JSON 文件上传到 CDN（如阿里云 OSS）：

```javascript
// 修改 noaaDataLoader.js
this.baseUrl = 'https://your-cdn.com/noaa';
```

### 2. 数据压缩

```javascript
// 在 noaaDataService.js 中添加压缩
const zlib = require('zlib');

async convertToJson(gribPath, type, forecast) {
    // ... 转换逻辑
    
    // 压缩 JSON
    const compressed = zlib.gzipSync(JSON.stringify(data));
    await fs.writeFile(jsonPath + '.gz', compressed);
}
```

### 3. 增量更新

只下载变化的预报时间，而不是每次都下载所有时间步。

### 4. 多线程下载

使用 `Promise.all` 并行下载多个预报时间：

```javascript
async updateData(type) {
    const forecasts = [0, 6, 12, 24, 48, 72];
    await Promise.all(
        forecasts.map(f => this.downloadAndConvert(type, f))
    );
}
```

---

## 📞 故障排查

### 问题1：grib2json 命令找不到

```bash
# 检查安装
which grib2json

# 如果没有，重新安装
npm install -g grib2json
```

### 问题2：下载超时

```javascript
// 增加超时时间
const response = await axios({
    // ...
    timeout: 300000 // 5分钟
});
```

### 问题3：数据格式错误

检查 NOAA URL 是否正确，参数是否有效：

```bash
# 手动测试下载
curl "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t00z.pgrb2.0p25.f000&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&leftlon=0&rightlon=360&toplat=90&bottomlat=-90" \
  -o test.grib2
```

### 问题4：前端无法加载数据

检查静态文件服务是否正确配置：

```bash
# 测试访问
curl http://localhost:3000/data/noaa/wind_f000.json
```

---

## 📚 参考资源

1. **NOAA NOMADS 官网**: https://nomads.ncep.noaa.gov/
2. **grib2json 项目**: https://github.com/cambecc/grib2json
3. **GFS 文档**: https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast-system
4. **RTOFS 文档**: https://polar.ncep.noaa.gov/ofs/
5. **cesium-wind-layer**: https://github.com/RaymanNg/3D-Wind-Field

---

## ✅ 总结

这个方案完全可行，且相比 Windy 有以下优势：

1. **免费**: 无需 API Key
2. **稳定**: 官方数据源，长期维护
3. **专业**: 适合深海采矿的专业需求
4. **可控**: 数据在自己服务器上，可自定义处理
5. **深度数据**: RTOFS 提供多层深度数据，非常适合深海作业

唯一的挑战是首次搭建需要一些时间，但一旦运行起来，就是一个非常可靠的解决方案。
