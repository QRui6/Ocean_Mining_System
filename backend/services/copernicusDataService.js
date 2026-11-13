/**
 * Copernicus Marine 数据服务
 * 功能：定时下载和更新海浪、洋流数据
 */

const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

class CopernicusDataService {
    constructor() {
        this.updateInterval = 24 * 60 * 60 * 1000; // 24小时更新一次
        this.updateTimer = null;
        this.isUpdating = false;
    }
    
    /**
     * 初始化服务
     */
    async init() {
        console.log('🌊 Copernicus 数据服务初始化...');
        
        // 检查是否已有数据
        const hasData = await this.checkDataExists();
        
        if (!hasData) {
            console.log('⚠️  未检测到数据文件，建议手动运行一次下载');
            console.log('   命令: cd backend/scripts && bash download_copernicus_data.sh');
        } else {
            console.log('✅ 检测到现有数据文件');
        }
        
        // 启动定时更新（可选）
        // this.startAutoUpdate();
    }
    
    /**
     * 检查数据文件是否存在
     */
    async checkDataExists() {
        const fs = require('fs').promises;
        
        try {
            await fs.access(path.join(__dirname, '../../export_out/meta.json'));
            await fs.access(path.join(__dirname, '../../export_currents_out/meta.json'));
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 手动触发数据更新
     */
    async updateData() {
        if (this.isUpdating) {
            console.log('⚠️  数据更新正在进行中...');
            return { success: false, message: '更新正在进行中' };
        }
        
        this.isUpdating = true;
        console.log('🔄 开始更新 Copernicus 数据...');
        
        try {
            const scriptPath = path.join(__dirname, '../scripts/download_copernicus_data.sh');
            
            const { stdout, stderr } = await execPromise(`bash ${scriptPath}`, {
                cwd: path.join(__dirname, '..'),
                maxBuffer: 50 * 1024 * 1024 // 50MB buffer
            });
            
            console.log(stdout);
            if (stderr) console.error(stderr);
            
            console.log('✅ Copernicus 数据更新完成');
            this.isUpdating = false;
            
            return { success: true, message: '数据更新完成' };
        } catch (err) {
            console.error('❌ Copernicus 数据更新失败:', err);
            this.isUpdating = false;
            
            return { success: false, message: err.message };
        }
    }
    
    /**
     * 启动自动更新
     */
    startAutoUpdate() {
        console.log('⏰ 启动 Copernicus 数据自动更新（每24小时）');
        
        this.updateTimer = setInterval(() => {
            console.log('⏰ 定时更新 Copernicus 数据');
            this.updateData();
        }, this.updateInterval);
    }
    
    /**
     * 停止自动更新
     */
    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
            console.log('⏹️  停止 Copernicus 数据自动更新');
        }
    }
    
    /**
     * 获取数据状态
     */
    async getStatus() {
        const fs = require('fs').promises;
        const status = {
            wave: { exists: false, lastModified: null },
            current: { exists: false, lastModified: null }
        };
        
        try {
            const waveMeta = path.join(__dirname, '../../export_out/meta.json');
            const waveStats = await fs.stat(waveMeta);
            status.wave.exists = true;
            status.wave.lastModified = waveStats.mtime;
        } catch {}
        
        try {
            const currentMeta = path.join(__dirname, '../../export_currents_out/meta.json');
            const currentStats = await fs.stat(currentMeta);
            status.current.exists = true;
            status.current.lastModified = currentStats.mtime;
        } catch {}
        
        return status;
    }
}

module.exports = CopernicusDataService;
