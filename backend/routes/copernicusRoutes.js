/**
 * Copernicus 数据 API 路由
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

module.exports = (copernicusService) => {
    /**
     * 获取数据状态
     * GET /api/copernicus/status
     */
    router.get('/status', async (req, res) => {
        try {
            const status = await copernicusService.getStatus();
            res.json({
                success: true,
                data: status
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });
    
    /**
     * 手动触发数据更新
     * POST /api/copernicus/update
     */
    router.post('/update', async (req, res) => {
        try {
            // 异步更新，立即返回
            copernicusService.updateData().catch(err => {
                console.error('后台更新失败:', err);
            });
            
            res.json({
                success: true,
                message: '数据更新已启动（后台运行）'
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });
    
    /**
     * 查询指定区域的气象数据
     * POST /api/copernicus/query-area
     * Body: { polygon: [[lon, lat], ...], timeIndex: 0 }
     */
    router.post('/query-area', async (req, res) => {
        try {
            const { polygon, timeIndex = 0 } = req.body;
            
            if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
                return res.status(400).json({
                    success: false,
                    error: '无效的多边形数据'
                });
            }
            
            console.log(`📍 查询区域气象数据，时间索引: ${timeIndex}`);
            
            // 计算多边形的中心点
            let centerLon = 0;
            let centerLat = 0;
            polygon.forEach(([lon, lat]) => {
                centerLon += lon;
                centerLat += lat;
            });
            centerLon /= polygon.length;
            centerLat /= polygon.length;
            
            console.log(`   中心点: (${centerLon.toFixed(2)}, ${centerLat.toFixed(2)})`);
            
            // 读取元数据
            const waveMeta = await fs.readFile(
                path.join(__dirname, '../../public/wave_data/meta.json'),
                'utf-8'
            );
            const waveMetaData = JSON.parse(waveMeta);
            const { grid } = waveMetaData;
            
            // 计算网格索引
            const lonIndex = Math.floor((centerLon - grid.lon_min) / (grid.lon_max - grid.lon_min) * grid.lon_size);
            const latIndex = Math.floor((centerLat - grid.lat_min) / (grid.lat_max - grid.lat_min) * grid.lat_size);
            
            // 确保索引在有效范围内
            const validLonIndex = Math.max(0, Math.min(grid.lon_size - 1, lonIndex));
            const validLatIndex = Math.max(0, Math.min(grid.lat_size - 1, latIndex));
            
            const dataIndex = validLatIndex * grid.lon_size + validLonIndex;
            
            console.log(`   网格索引: (${validLonIndex}, ${validLatIndex}), 数据索引: ${dataIndex}`);
            
            // 读取波高数据
            const timeStr = String(timeIndex).padStart(2, '0');
            const hsPath = path.join(__dirname, `../../public/wave_data/hs_t${timeStr}.bin`);
            const hsBuffer = await fs.readFile(hsPath);
            const hsData = new Float32Array(hsBuffer.buffer, hsBuffer.byteOffset, hsBuffer.byteLength / 4);
            
            // 读取洋流数据（Stokes drift）
            const stokesUPath = path.join(__dirname, `../../public/wave_data/stokes_u_t${timeStr}.bin`);
            const stokesVPath = path.join(__dirname, `../../public/wave_data/stokes_v_t${timeStr}.bin`);
            const stokesUBuffer = await fs.readFile(stokesUPath);
            const stokesVBuffer = await fs.readFile(stokesVPath);
            const stokesUData = new Float32Array(stokesUBuffer.buffer, stokesUBuffer.byteOffset, stokesUBuffer.byteLength / 4);
            const stokesVData = new Float32Array(stokesVBuffer.buffer, stokesVBuffer.byteOffset, stokesVBuffer.byteLength / 4);
            
            // 提取数据
            const waveHeight = hsData[dataIndex];
            const currentU = stokesUData[dataIndex];
            const currentV = stokesVData[dataIndex];
            
            // 计算洋流速度
            const currentSpeed = Math.sqrt(currentU * currentU + currentV * currentV);
            
            // 模拟风速数据（实际应该从风场数据读取）
            // 这里使用波高作为风速的估算（经验公式：风速 ≈ 波高 × 5）
            const windSpeed = waveHeight * 5;
            
            console.log(`   波高: ${waveHeight.toFixed(2)}m, 洋流: ${currentSpeed.toFixed(3)}m/s, 风速: ${windSpeed.toFixed(1)}m/s`);
            
            res.json({
                success: true,
                data: {
                    location: {
                        lon: centerLon,
                        lat: centerLat
                    },
                    data: {
                        windSpeed: windSpeed,
                        waveHeight: waveHeight,
                        currentSpeed: currentSpeed
                    },
                    timeIndex: timeIndex
                }
            });
            
        } catch (err) {
            console.error('❌ 查询区域气象数据失败:', err);
            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });
    
    return router;
};
