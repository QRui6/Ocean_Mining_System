/**
 * NOAA 数据 API 路由
 */

const express = require('express');
const router = express.Router();

module.exports = (noaaService) => {
    /**
     * 获取可用的数据列表
     * GET /api/noaa/available
     */
    router.get('/available', async (req, res) => {
        try {
            const data = await noaaService.getAvailableData();
            res.json({
                success: true,
                data: data
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
     * POST /api/noaa/update
     */
    router.post('/update', async (req, res) => {
        try {
            const { type } = req.body; // 'wind', 'current', 'wave', 或 'all'
            
            if (type === 'all') {
                // 异步更新，立即返回
                noaaService.updateAllData().catch(err => {
                    console.error('后台更新失败:', err);
                });
                res.json({
                    success: true,
                    message: '数据更新已启动（后台运行）'
                });
            } else if (['wind', 'current', 'wave'].includes(type)) {
                noaaService.updateData(type).catch(err => {
                    console.error('后台更新失败:', err);
                });
                res.json({
                    success: true,
                    message: `${type} 数据更新已启动（后台运行）`
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: '无效的数据类型'
                });
            }
        } catch (err) {
            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });
    
    /**
     * 获取数据更新状态
     * GET /api/noaa/status
     */
    router.get('/status', async (req, res) => {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const dataDir = path.join(__dirname, '../public/data/noaa');
            
            const files = await fs.readdir(dataDir);
            const status = {};
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const stats = await fs.stat(path.join(dataDir, file));
                    status[file] = {
                        size: stats.size,
                        modified: stats.mtime
                    };
                }
            }
            
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
    
    return router;
};
