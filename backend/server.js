/**
 * 区域监控后端服务
 * 功能：
 * 1. 接收前端创建区域请求，调用船讯网AddArea API
 * 2. 接收船讯网Webhook推送
 * 3. 查询船舶详情和气象数据
 * 4. 通过WebSocket推送实时数据到前端
 * 5. 数据持久化
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 导入 NOAA 服务
const NOAADataService = require('./services/noaaDataService');
const noaaRoutes = require('./routes/noaaRoutes');

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（提供 NOAA JSON 数据）
app.use('/data/noaa', express.static(path.join(__dirname, 'public/data/noaa')));

// PostgreSQL连接池配置
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_NAME || 'ship_monitoring',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 测试数据库连接
pool.on('connect', () => {
    console.log('✅ PostgreSQL连接成功');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL连接错误:', err);
});

// 船讯网API配置
const SHIPXY_CONFIG = {
    baseURL: process.env.SHIPXY_BASE_URL || 'https://api.shipxy.com',
    apiKey: process.env.SHIPXY_API_KEY
};

// ==================== 辅助函数 ====================

/**
 * 创建PostGIS多边形WKT格式
 */
function createPolygonWKT(polygon) {
    // 确保多边形闭合（首尾点相同）
    const coords = [...polygon];
    if (coords[0][0] !== coords[coords.length - 1][0] || 
        coords[0][1] !== coords[coords.length - 1][1]) {
        coords.push(coords[0]);
    }
    
    const coordsStr = coords.map(c => `${c[0]} ${c[1]}`).join(', ');
    return `POLYGON((${coordsStr}))`;
}

/**
 * 创建PostGIS点WKT格式
 */
function createPointWKT(lng, lat) {
    return `POINT(${lng} ${lat})`;
}

/**
 * 计算多边形的边界范围
 */
function calculateBounds(polygon) {
    if (!polygon || polygon.length === 0) {
        return { minLng: 0, maxLng: 0, minLat: 0, maxLat: 0 };
    }
    
    let minLng = polygon[0][0];
    let maxLng = polygon[0][0];
    let minLat = polygon[0][1];
    let maxLat = polygon[0][1];
    
    polygon.forEach(coord => {
        const [lng, lat] = coord;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    });
    
    return {
        minLng: minLng.toFixed(4),
        maxLng: maxLng.toFixed(4),
        minLat: minLat.toFixed(4),
        maxLat: maxLat.toFixed(4)
    };
}

/**
 * 计算多边形面积（平方公里）
 * 使用球面三角形公式计算地球表面的多边形面积
 */
function calculateArea(polygon) {
    if (!polygon || polygon.length < 3) {
        return 0;
    }
    
    const EARTH_RADIUS = 6371; // 地球半径（公里）
    
    // 将角度转换为弧度
    const toRadians = (degrees) => degrees * Math.PI / 180;
    
    let area = 0;
    const n = polygon.length;
    
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const [lng1, lat1] = polygon[i];
        const [lng2, lat2] = polygon[j];
        
        const lat1Rad = toRadians(lat1);
        const lat2Rad = toRadians(lat2);
        const lngDiff = toRadians(lng2 - lng1);
        
        area += lngDiff * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
    }
    
    area = Math.abs(area * EARTH_RADIUS * EARTH_RADIUS / 2);
    
    return area.toFixed(2); // 保留2位小数
}

// WebSocket服务器
const WS_PORT = process.env.WS_PORT || 8080;
const ENABLE_WEBSOCKET = process.env.ENABLE_WEBSOCKET !== 'false';

let wss = null;
const clients = new Map(); // 存储客户端连接

if (ENABLE_WEBSOCKET) {
    wss = new WebSocket.Server({ port: WS_PORT });
} else {
    console.log('⚠️  WebSocket已禁用');
}

if (wss) {
    wss.on('connection', (ws) => {
        const clientId = Date.now().toString();
        clients.set(clientId, ws);
        console.log(`✅ 客户端连接: ${clientId}`);

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleClientMessage(clientId, data);
            } catch (err) {
                console.error('消息解析失败:', err);
        }
    });

        ws.on('close', () => {
            clients.delete(clientId);
            console.log(`❌ 客户端断开: ${clientId}`);
        });
    });
}

// 广播消息到所有客户端
function broadcast(data) {
    if (!ENABLE_WEBSOCKET || clients.size === 0) return;
    
    const message = JSON.stringify(data);
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// 处理客户端消息
function handleClientMessage(clientId, data) {
    console.log(`收到客户端消息 [${clientId}]:`, data);
    // 可以处理订阅、取消订阅等操作
}

// ==================== API路由 ====================

/**
 * 1. 创建监控区域
 * POST /api/areas
 */
app.post('/api/areas', async (req, res) => {
    try {
        const { name, polygon, thresholds } = req.body;

        // 1. 调用船讯网AddArea API
        console.log('📡 调用船讯网API创建区域:', { name, polygon });
        
        // 转换为船讯网要求的字符串格式: "lng,lat-lng,lat-lng,lat"
        const areaBoundsStr = polygon.map(coord => `${coord[0]},${coord[1]}`).join('-');
        
        // 使用环境变量中配置的完整webhook URL
        const webhookUrl = `${process.env.PUBLIC_URL}${process.env.WEBHOOK_PATH}`;
        console.log('📡 Webhook URL:', webhookUrl);
        
        const shipxyResponse = await axios.post(
            `${SHIPXY_CONFIG.baseURL}/apicall/v3/AddArea`,
            {
                key: SHIPXY_CONFIG.apiKey,
                area_name: name,
                area_bounds: areaBoundsStr,
                url: webhookUrl,
                filter_type: 1 // 全部船舶
            }
        );

        console.log('📡 船讯网API响应:', shipxyResponse.data);

        if (shipxyResponse.data.status !== 0) {
            console.error('❌ 船讯网API返回错误:', shipxyResponse.data);
            throw new Error(shipxyResponse.data.message || '创建区域失败');
        }

        const areaId = shipxyResponse.data.data.area_id;

        // 2. 创建PostGIS几何对象
        const polygonWKT = createPolygonWKT(polygon);
        
        // 3. 保存到数据库
        const result = await pool.query(
            `INSERT INTO monitoring_areas 
            (area_id, name, polygon, geometry, threshold_wind_speed, threshold_wave_height) 
            VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5, $6)
            RETURNING id, area_id, name, polygon, threshold_wind_speed, threshold_wave_height, created_at`,
            [
                areaId,
                name,
                JSON.stringify(polygon),
                polygonWKT,
                thresholds.windSpeed || 15,
                thresholds.waveHeight || 3
            ]
        );

        const areaData = result.rows[0];
        const area = {
            id: areaData.id,
            areaId: areaData.area_id,
            name: areaData.name,
            polygon: areaData.polygon, // JSONB类型自动返回对象，无需JSON.parse
            thresholds: {
                windSpeed: parseFloat(areaData.threshold_wind_speed),
                waveHeight: parseFloat(areaData.threshold_wave_height)
            },
            createdAt: areaData.created_at
        };

        // 3. 推送到前端
        broadcast({
            type: 'area_created',
            payload: area
        });

        res.json({
            success: true,
            data: area
        });

    } catch (err) {
        console.error('创建区域失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 2. 获取区域列表
 * GET /api/areas
 */
app.get('/api/areas', async (req, res) => {
    try {
        // 使用视图获取区域统计
        const result = await pool.query(
            `SELECT 
                id, area_id, name, polygon, 
                threshold_wind_speed, threshold_wave_height,
                is_active, created_at, ship_count, warning_count
            FROM v_area_statistics 
            WHERE is_active = TRUE
            ORDER BY created_at DESC`
        );

        const areas = result.rows.map(area => {
            // 计算区域范围和面积
            const bounds = calculateBounds(area.polygon);
            const areaSize = calculateArea(area.polygon);
            
            return {
                id: area.id,
                areaId: area.area_id,
                name: area.name,
                polygon: area.polygon,
                thresholds: {
                    windSpeed: parseFloat(area.threshold_wind_speed),
                    waveHeight: parseFloat(area.threshold_wave_height)
                },
                isActive: area.is_active,
                createdAt: area.created_at,
                shipCount: parseInt(area.ship_count) || 0,
                warningCount: parseInt(area.warning_count) || 0,
                bounds: bounds,
                area: areaSize
            };
        });

        res.json({
            success: true,
            data: areas
        });

    } catch (err) {
        console.error('获取区域列表失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 3. 获取区域内船舶（详细信息）
 * GET /api/areas/:id/ships
 */
app.get('/api/areas/:id/ships', async (req, res) => {
    try {
        const areaId = req.params.id;

        const result = await pool.query(
            `SELECT 
                mmsi, ship_name, enter_time, leave_time,
                status, last_position, last_weather, risk_level
            FROM area_ships 
            WHERE area_id = $1 AND status IN ('in_area', 'warning')
            ORDER BY enter_time DESC`,
            [areaId]
        );

        // 获取每艘船的详细信息
        const shipsWithDetails = await Promise.all(result.rows.map(async (ship) => {
            try {
                // 调用船讯网API获取详细信息
                const shipInfo = await getShipInfo(ship.mmsi);
                
                // 转换气象数据字段名为驼峰命名
                const lastWeather = ship.last_weather ? {
                    windSpeed: ship.last_weather.windspeed,
                    waveHeight: ship.last_weather.waveheight,
                    temperature: ship.last_weather.temperature,
                    windDir: ship.last_weather.winddir,
                    humidity: ship.last_weather.humidity,
                    pressure: ship.last_weather.pressure,
                    visibility: ship.last_weather.visibility,
                    publishTime: ship.last_weather.publish_time
                } : null;
                
                return {
                    mmsi: ship.mmsi,
                    shipName: ship.ship_name,
                    shipCnName: shipInfo.ship_cnname,
                    enterTime: ship.enter_time,
                    leaveTime: ship.leave_time,
                    status: ship.status,
                    lastPosition: ship.last_position,
                    lastWeather: lastWeather,
                    riskLevel: ship.risk_level,
                    // 补充详细信息
                    imo: shipInfo.imo,
                    callSign: shipInfo.call_sign,
                    shipType: shipInfo.ship_type,
                    length: shipInfo.length,
                    width: shipInfo.width,
                    draught: shipInfo.draught,
                    destination: shipInfo.dest,
                    eta: shipInfo.eta,
                    sog: shipInfo.sog,
                    cog: shipInfo.cog,
                    hdg: shipInfo.hdg,
                    lat: shipInfo.lat,
                    lng: shipInfo.lng,
                    lastTime: shipInfo.last_time
                };
            } catch (err) {
                console.error(`获取船舶 ${ship.mmsi} 详细信息失败:`, err);
                // 如果获取失败，返回基本信息
                return {
                    mmsi: ship.mmsi,
                    shipName: ship.ship_name,
                    enterTime: ship.enter_time,
                    status: ship.status,
                    riskLevel: ship.risk_level,
                    lastWeather: null
                };
            }
        }));

        res.json({
            success: true,
            data: shipsWithDetails
        });

    } catch (err) {
        console.error('获取区域船舶失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 4. 获取区域事件日志
 * GET /api/areas/:id/events
 */
app.get('/api/areas/:id/events', async (req, res) => {
    try {
        const areaId = req.params.id;
        const limit = parseInt(req.query.limit) || 50;

        // 获取事件日志
        const eventsResult = await pool.query(
            `SELECT 
                id, mmsi, event_type, event_data, created_at
            FROM event_logs 
            WHERE area_id = $1
            ORDER BY created_at DESC
            LIMIT $2`,
            [areaId, limit]
        );

        // 获取预警记录
        const warningsResult = await pool.query(
            `SELECT 
                id, mmsi, warning_type, severity, message, 
                weather_data, created_at, is_resolved, resolved_at
            FROM warnings 
            WHERE area_id = $1
            ORDER BY created_at DESC
            LIMIT $2`,
            [areaId, limit]
        );

        // 合并并排序
        const events = [
            ...eventsResult.rows.map(e => ({
                id: `event_${e.id}`,
                type: e.event_type,
                mmsi: e.mmsi,
                data: e.event_data,
                time: e.created_at,
                category: 'event'
            })),
            ...warningsResult.rows.map(w => ({
                id: `warning_${w.id}`,
                type: 'warning',
                mmsi: w.mmsi,
                warningType: w.warning_type,
                severity: w.severity,
                message: w.message,
                weatherData: w.weather_data,
                time: w.created_at,
                isResolved: w.is_resolved,
                resolvedAt: w.resolved_at,
                category: 'warning'
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            success: true,
            data: events.slice(0, limit)
        });

    } catch (err) {
        console.error('获取事件日志失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 4. 删除监控区域
 * DELETE /api/areas/:id
 */
app.delete('/api/areas/:id', async (req, res) => {
    try {
        const areaId = req.params.id;

        // 1. 获取area_id
        const result = await pool.query(
            'SELECT area_id FROM monitoring_areas WHERE id = $1',
            [areaId]
        );

        if (result.rows.length === 0) {
            throw new Error('区域不存在');
        }

        const shipxyAreaId = result.rows[0].area_id;

        // 2. 调用船讯网DeleteArea API
        await axios.post(
            `${SHIPXY_CONFIG.baseURL}/apicall/v3/DeleteArea`,
            {
                key: SHIPXY_CONFIG.apiKey,
                area_id: shipxyAreaId
            }
        );

        // 3. 软删除数据库记录
        await pool.query(
            'UPDATE monitoring_areas SET is_active = FALSE WHERE id = $1',
            [areaId]
        );

        // 4. 推送到前端
        broadcast({
            type: 'area_deleted',
            payload: { id: parseInt(areaId) }
        });

        res.json({
            success: true,
            message: '区域已删除'
        });

    } catch (err) {
        console.error('删除区域失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 5. Webhook接收端点 - 接收船讯网推送
 * POST /webhook/area 或自定义路径
 */
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook/area';

// 通用Webhook处理函数
async function handleWebhookData(req, res) {
    try {
        console.log('📨 收到Webhook推送:', JSON.stringify(req.body, null, 2));

        const webhookData = req.body;
        
        // 解析推送数据（船讯网实际格式）
        const {
            area_id,
            event_type,  // 1=进入, 2=离开
            mmsi,
            ship_name,
            lat,
            lng,
            event_time,
            event_time_utc,
            imo,
            call_sign
        } = webhookData;

        // 查询数据库中的区域ID
        const result = await pool.query(
            'SELECT id, name, threshold_wind_speed, threshold_wave_height FROM monitoring_areas WHERE area_id = $1',
            [area_id]
        );

        if (result.rows.length === 0) {
            console.warn('⚠️  未找到对应区域:', area_id);
            return res.json({ success: true, message: '区域不存在' });
        }

        const area = result.rows[0];
        console.log(`✅ 找到区域: ${area.name} (ID: ${area.id})`);

        // 船讯网 event_type: 1=进入, 2=离开
        if (event_type === 1 || event_type === '1' || event_type === 'enter') {
            console.log(`🚢 处理船舶进入事件: MMSI=${mmsi}, 船名=${ship_name}`);
            await handleShipEnter(area, { 
                mmsi, 
                ship_name, 
                lat: lat || 0, 
                lng: lng || 0, 
                timestamp: event_time_utc || Date.now() / 1000,
                imo,
                call_sign
            });
        } else if (event_type === 2 || event_type === '2' || event_type === 'leave') {
            console.log(`🚢 处理船舶离开事件: MMSI=${mmsi}, 船名=${ship_name}`);
            await handleShipLeave(area, { 
                mmsi, 
                timestamp: event_time_utc || Date.now() / 1000 
            });
        } else {
            console.warn('⚠️  未知的事件类型:', event_type);
        }

        res.json({ success: true, message: '事件已处理' });

    } catch (err) {
        console.error('❌ Webhook处理失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

// 注册Webhook路由
app.post(WEBHOOK_PATH, handleWebhookData);
app.post('/webhook/area', handleWebhookData); // 兼容默认路径

console.log(`📡 Webhook路径: ${WEBHOOK_PATH}`);

/**
 * 测试接口：模拟船舶进入事件
 * POST /api/test/ship-enter
 * 
 * 使用方法：
 * curl -X POST http://localhost:5678/api/test/ship-enter \
 *   -H "Content-Type: application/json" \
 *   -d '{"areaId": 9, "mmsi": 413961925, "shipName": "测试船舶"}'
 */
app.post('/api/test/ship-enter', async (req, res) => {
    try {
        const { areaId, mmsi, shipName, lat, lng } = req.body;
        
        console.log('🧪 测试：模拟船舶进入事件');
        console.log('参数:', { areaId, mmsi, shipName, lat, lng });
        
        // 查询区域（支持通过 id 或 area_id 查询）
        const result = await pool.query(
            `SELECT id, area_id, name, threshold_wind_speed, threshold_wave_height, polygon 
            FROM monitoring_areas 
            WHERE id = $1 OR area_id = $2`,
            [areaId, String(areaId)]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '区域不存在'
            });
        }
        
        const area = result.rows[0];
        const polygon = area.polygon;
        
        // 使用区域第一个坐标点作为默认位置
        const defaultLat = polygon?.[0]?.[1] || 0;
        const defaultLng = polygon?.[0]?.[0] || 0;
        
        // 模拟船舶进入
        await handleShipEnter(area, {
            mmsi: mmsi || 413961925,
            ship_name: shipName || '测试船舶',
            lat: lat || defaultLat,
            lng: lng || defaultLng,
            timestamp: Date.now()
        });
        
        res.json({
            success: true,
            message: '✅ 测试事件已触发',
            area: area.name,
            mmsi: mmsi || 413961925,
            position: { lat: lat || defaultLat, lng: lng || defaultLng }
        });
        
    } catch (err) {
        console.error('❌ 测试失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 测试接口：模拟船舶离开事件
 * POST /api/test/ship-leave
 * 
 * 使用方法：
 * curl -X POST http://localhost:5678/api/test/ship-leave \
 *   -H "Content-Type: application/json" \
 *   -d '{"areaId": 9, "mmsi": 413961925}'
 */
app.post('/api/test/ship-leave', async (req, res) => {
    try {
        const { areaId, mmsi } = req.body;
        
        console.log('🧪 测试：模拟船舶离开事件');
        console.log('参数:', { areaId, mmsi });
        
        // 查询区域
        const result = await pool.query(
            `SELECT id, area_id, name, threshold_wind_speed, threshold_wave_height 
            FROM monitoring_areas 
            WHERE id = $1 OR area_id = $2`,
            [areaId, String(areaId)]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '区域不存在'
            });
        }
        
        const area = result.rows[0];
        
        // 模拟船舶离开
        await handleShipLeave(area, {
            mmsi: mmsi || 413961925,
            timestamp: Date.now()
        });
        
        res.json({
            success: true,
            message: '✅ 测试离开事件已触发',
            area: area.name,
            mmsi: mmsi || 413961925
        });
        
    } catch (err) {
        console.error('❌ 测试失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 测试接口：模拟预警事件
 * POST /api/test/warning
 * 
 * 使用方法：
 * curl -X POST http://localhost:5678/api/test/warning \
 *   -H "Content-Type: application/json" \
 *   -d '{"areaId": 9, "mmsi": 413961925, "message": "风速超标"}'
 */
app.post('/api/test/warning', async (req, res) => {
    try {
        const { areaId, mmsi, message, severity } = req.body;
        
        console.log('🧪 测试：模拟预警事件');
        console.log('参数:', { areaId, mmsi, message, severity });
        
        // 查询区域
        const result = await pool.query(
            `SELECT id, name FROM monitoring_areas WHERE id = $1 OR area_id = $2`,
            [areaId, String(areaId)]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '区域不存在'
            });
        }
        
        const area = result.rows[0];
        const warningMessage = message || '测试预警消息';
        const warningSeverity = severity || 'high';
        const warningMmsi = mmsi || 413961925;
        
        // 1. 保存预警到数据库
        const insertResult = await pool.query(
            `INSERT INTO warnings (
                area_id, mmsi, warning_type, severity, message, 
                weather_data, is_resolved, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id`,
            [
                area.id,
                warningMmsi,
                'weather',
                warningSeverity,
                warningMessage,
                JSON.stringify({ test: true, windSpeed: 20, waveHeight: 4 }),
                false
            ]
        );
        
        console.log('✅ 预警已保存到数据库, ID:', insertResult.rows[0].id);
        
        // 2. 广播预警消息
        broadcast({
            type: 'warning',
            payload: {
                areaId: area.id,
                areaName: area.name,
                mmsi: warningMmsi,
                message: warningMessage,
                severity: warningSeverity
            }
        });
        
        console.log('✅ 预警消息已广播');
        
        res.json({
            success: true,
            message: '✅ 测试预警已触发并保存',
            area: area.name,
            warning: {
                id: insertResult.rows[0].id,
                message: warningMessage,
                severity: warningSeverity
            }
        });
        
    } catch (err) {
        console.error('❌ 测试失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 测试接口：查看所有区域和船舶
 * GET /api/test/status
 */
app.get('/api/test/status', async (req, res) => {
    try {
        // 查询所有区域
        const areasResult = await pool.query(
            'SELECT id, area_id, name FROM monitoring_areas WHERE is_active = TRUE'
        );
        
        // 查询所有区域内的船舶
        const shipsResult = await pool.query(
            `SELECT 
                a.id as area_id, 
                a.name as area_name,
                s.mmsi, 
                s.ship_name, 
                s.status,
                s.enter_time,
                s.risk_level
            FROM monitoring_areas a
            LEFT JOIN area_ships s ON a.id = s.area_id
            WHERE a.is_active = TRUE
            ORDER BY a.id, s.enter_time DESC`
        );
        
        res.json({
            success: true,
            areas: areasResult.rows,
            ships: shipsResult.rows,
            summary: {
                totalAreas: areasResult.rows.length,
                totalShips: shipsResult.rows.filter(s => s.mmsi).length
            }
        });
        
    } catch (err) {
        console.error('查询状态失败:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==================== 核心业务逻辑 ====================

/**
 * 处理船舶进入事件
 */
async function handleShipEnter(area, shipData) {
    console.log(`🚢 船舶进入区域 [${area.name}]:`, shipData);

    try {
        // 1. 调用GetSingleShip获取完整船舶信息
        const shipInfo = await getShipInfo(shipData.mmsi);

        // 2. 调用GetWeatherByPoint获取位置气象
        const weather = await getWeatherByPoint(shipData.lat, shipData.lng);

        // 3. 风险评估
        const risk = assessRisk(area, weather);

        // 4. 保存到数据库（PostgreSQL使用ON CONFLICT）
        const pointWKT = createPointWKT(shipData.lng, shipData.lat);
        
        await pool.query(
            `INSERT INTO area_ships 
            (area_id, mmsi, ship_name, enter_time, status, last_position, last_point, last_weather, risk_level)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, ST_GeomFromText($6, 4326), $7, $8)
            ON CONFLICT (area_id, mmsi, status) 
            DO UPDATE SET
                enter_time = CURRENT_TIMESTAMP,
                status = EXCLUDED.status,
                last_position = EXCLUDED.last_position,
                last_point = EXCLUDED.last_point,
                last_weather = EXCLUDED.last_weather,
                risk_level = EXCLUDED.risk_level`,
            [
                area.id,
                shipData.mmsi,
                shipInfo.ship_cnname || shipInfo.ship_name,
                risk.isWarning ? 'warning' : 'in_area',
                JSON.stringify({ lat: shipData.lat, lng: shipData.lng }),
                pointWKT,
                JSON.stringify(weather),
                risk.level
            ]
        );

        // 5. 如果有风险，创建预警
        if (risk.isWarning) {
            await createWarning(area.id, shipData.mmsi, risk, weather);
        }

        // 6. 记录日志
        await pool.query(
            `INSERT INTO event_logs (area_id, mmsi, event_type, event_data)
            VALUES ($1, $2, 'enter', $3)`,
            [area.id, shipData.mmsi, JSON.stringify({ shipInfo, weather, risk })]
        );

        // 7. 推送到前端
        console.log('📡 准备广播消息，当前连接数:', clients.size);
        broadcast({
            type: 'ship_enter',
            payload: {
                areaId: area.id,
                areaName: area.name,
                ship: {
                    mmsi: shipData.mmsi,
                    ship_cnname: shipInfo.ship_cnname,
                    ship_name: shipInfo.ship_name,
                    lat: shipData.lat,
                    lng: shipData.lng,
                    sog: shipInfo.sog
                },
                weather,
                risk
            }
        });
        console.log('✅ 消息已广播');

    } catch (err) {
        console.error('处理船舶进入事件失败:', err);
    }
}

/**
 * 处理船舶离开事件
 */
async function handleShipLeave(area, shipData) {
    console.log(`🚢 船舶离开区域 [${area.name}]:`, shipData);

    try {
        // 1. 更新数据库
        await pool.query(
            `UPDATE area_ships 
            SET leave_time = CURRENT_TIMESTAMP, status = 'left'
            WHERE area_id = $1 AND mmsi = $2 AND status = 'in_area'`,
            [area.id, shipData.mmsi]
        );

        // 2. 解决未关闭的预警
        await pool.query(
            `UPDATE warnings 
            SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
            WHERE area_id = $1 AND mmsi = $2 AND is_resolved = FALSE`,
            [area.id, shipData.mmsi]
        );

        // 3. 记录日志
        await pool.query(
            `INSERT INTO event_logs (area_id, mmsi, event_type, event_data)
            VALUES ($1, $2, 'leave', $3)`,
            [area.id, shipData.mmsi, JSON.stringify(shipData)]
        );

        // 4. 推送到前端
        broadcast({
            type: 'ship_leave',
            payload: {
                areaId: area.id,
                mmsi: shipData.mmsi
            }
        });

    } catch (err) {
        console.error('处理船舶离开事件失败:', err);
    }
}

/**
 * 获取船舶信息
 */
async function getShipInfo(mmsi) {
    try {
        const response = await axios.post(
            `${SHIPXY_CONFIG.baseURL}/apicall/v3/GetSingleShip`,
            {
                key: SHIPXY_CONFIG.apiKey,
                mmsi: mmsi
            }
        );

        if (response.data.status === 0) {
            return response.data.data;
        } else {
            throw new Error('获取船舶信息失败');
        }
    } catch (err) {
        console.error('获取船舶信息失败:', err);
        return { mmsi, ship_name: 'Unknown' };
    }
}

/**
 * 获取位置气象
 */
async function getWeatherByPoint(lat, lng) {
    try {
        const response = await axios.post(
            `${SHIPXY_CONFIG.baseURL}/apicall/v3/GetWeatherByPoint`,
            {
                key: SHIPXY_CONFIG.apiKey,
                lat: lat,
                lng: lng
            }
        );

        if (response.data.status === 0) {
            return response.data.data;
        } else {
            throw new Error('获取气象数据失败');
        }
    } catch (err) {
        console.error('获取气象数据失败:', err);
        return {
            windSpeed: 0,
            windDirection: 'N',
            waveHeight: 0,
            temperature: 0
        };
    }
}

/**
 * 风险评估
 */
function assessRisk(area, weather) {
    const risks = [];
    let level = 'safe';

    // 风速检查
    if (weather.windSpeed > area.threshold_wind_speed) {
        risks.push({
            type: 'wind',
            value: weather.windSpeed,
            threshold: area.threshold_wind_speed
        });
        level = 'high';
    }

    // 浪高检查
    if (weather.waveHeight > area.threshold_wave_height) {
        risks.push({
            type: 'wave',
            value: weather.waveHeight,
            threshold: area.threshold_wave_height
        });
        level = level === 'high' ? 'high' : 'medium';
    }

    return {
        level,
        isWarning: risks.length > 0,
        risks,
        weather
    };
}

/**
 * 创建预警
 */
async function createWarning(areaId, mmsi, risk, weather) {
    try {
        // 1. 生成预警消息
        const message = risk.risks.map(r => {
            if (r.type === 'wind') {
                return `风速 ${r.value}m/s 超过阈值 ${r.threshold}m/s`;
            } else if (r.type === 'wave') {
                return `浪高 ${r.value}m 超过阈值 ${r.threshold}m`;
            }
        }).join('; ');

        // 2. 获取区域名称
        const areaResult = await pool.query(
            'SELECT name FROM monitoring_areas WHERE id = $1',
            [areaId]
        );
        const areaName = areaResult.rows[0]?.name || '未知区域';

        // 3. 保存预警到数据库
        const insertResult = await pool.query(
            `INSERT INTO warnings 
            (area_id, mmsi, warning_type, severity, message, weather_data, is_resolved, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())
            RETURNING id`,
            [
                areaId,
                mmsi,
                risk.risks.map(r => r.type).join(','),
                risk.level,
                message,
                JSON.stringify(weather)
            ]
        );

        console.log(`⚠️ 预警已创建 [ID: ${insertResult.rows[0].id}] 区域: ${areaName}, MMSI: ${mmsi}, 消息: ${message}`);

        // 4. 推送预警到前端
        broadcast({
            type: 'warning',
            payload: {
                areaId,
                areaName,
                mmsi,
                message,
                severity: risk.level
            }
        });

    } catch (err) {
        console.error('❌ 创建预警失败:', err);
    }
}

// ==================== 定时任务 ====================

/**
 * 定时更新区域内船舶状态（每10分钟）
 */
setInterval(async () => {
    console.log('⏰ 执行定时更新任务...');

    try {
        // 获取所有活跃区域
        const areasResult = await pool.query(
            'SELECT id, area_id, name, threshold_wind_speed, threshold_wave_height FROM monitoring_areas WHERE is_active = TRUE'
        );

        for (const area of areasResult.rows) {
            // 获取区域内的船舶
            const shipsResult = await pool.query(
                'SELECT mmsi, last_position FROM area_ships WHERE area_id = $1 AND status = $2',
                [area.id, 'in_area']
            );

            for (const ship of shipsResult.rows) {
                const position = ship.last_position;

                // 获取最新船舶信息
                const shipInfo = await getShipInfo(ship.mmsi);

                // 获取最新气象
                const weather = await getWeatherByPoint(position.lat, position.lng);

                // 重新评估风险
                const risk = assessRisk(area, weather);

                // 更新数据库
                const pointWKT = createPointWKT(shipInfo.lng, shipInfo.lat);
                
                await pool.query(
                    `UPDATE area_ships 
                    SET last_position = $1, last_point = ST_GeomFromText($2, 4326), 
                        last_weather = $3, risk_level = $4, status = $5, updated_at = NOW()
                    WHERE area_id = $6 AND mmsi = $7`,
                    [
                        JSON.stringify({ lat: shipInfo.lat, lng: shipInfo.lng }),
                        pointWKT,
                        JSON.stringify(weather),
                        risk.level,
                        risk.isWarning ? 'warning' : 'in_area',
                        area.id,
                        ship.mmsi
                    ]
                );

                // 如果有新的预警，创建预警记录
                if (risk.isWarning) {
                    // 检查是否已经有未解决的相同类型预警
                    const existingWarning = await pool.query(
                        `SELECT id FROM warnings 
                        WHERE area_id = $1 AND mmsi = $2 AND is_resolved = FALSE 
                        AND created_at > NOW() - INTERVAL '1 hour'
                        LIMIT 1`,
                        [area.id, ship.mmsi]
                    );

                    // 如果1小时内没有相同的预警，创建新预警
                    if (existingWarning.rows.length === 0) {
                        await createWarning(area.id, ship.mmsi, risk, weather);
                    }
                }

                // 推送更新到前端
                broadcast({
                    type: 'ship_update',
                    payload: {
                        areaId: area.id,
                        areaName: area.name,
                        ship: shipInfo,
                        weather,
                        risk
                    }
                });
            }
        }

        console.log('✅ 定时更新完成');

    } catch (err) {
        console.error('定时更新失败:', err);
    }
}, 10 * 60 * 1000); // 10分钟

// 初始化 NOAA 服务
const noaaService = new NOAADataService();

// 注册 NOAA API 路由
app.use('/api/noaa', noaaRoutes(noaaService));

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器启动成功: http://localhost:${PORT}`);
    console.log(`📡 WebSocket服务: ws://localhost:${process.env.WS_PORT || 8080}`);
    
    // 注意：NOAA 数据下载已禁用（国内网络无法访问）
    // 如需启用，请配置代理或部署到海外服务器
    console.log('\n💡 提示：NOAA 实时数据下载已禁用');
    console.log('   原因：NOAA 服务器从中国大陆无法直接访问');
    console.log('   当前使用：本地示例数据（public/data/）');
    console.log('   如需启用：配置代理或部署到海外服务器');
    console.log('   手动触发：curl -X POST http://localhost:' + PORT + '/api/noaa/update -H "Content-Type: application/json" -d \'{"type": "wind"}\'');
    
    // 如果你有代理或在海外服务器，可以取消下面的注释
    // noaaService.init().catch(err => {
    //     console.error('⚠️  NOAA 服务初始化失败:', err.message);
    // });
});
