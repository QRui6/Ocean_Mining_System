/**
 * Copernicus 数据 API 路由
 */

const express = require('express');
const router = express.Router();

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
    
    return router;
};
