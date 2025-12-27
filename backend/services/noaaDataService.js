/**
 * NOAA NOMADS 数据下载和转换服务
 * 功能：
 * 1. 从 NOAA NOMADS 下载 GRIB2 数据（风、浪、流）
 * 2. 使用 grib2json 转换为 JSON
 * 3. 缓存和定时更新
 */

const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

class NOAADataService {
    constructor() {
        // 数据存储目录
        this.dataDir = path.join(__dirname, '../../public/data/noaa');
        this.cacheDir = path.join(__dirname, '../../cache/grib');
        
        // 转换工具类型（'cli' 或 'python'）
        this.converterType = null;
        
        // NOAA NOMADS 配置
        this.sources = {
            // 1. 风场数据 (GFS)
            wind: {
                baseUrl: 'https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl',
                params: {
                    file: 'gfs.t00z.pgrb2.0p25.f000',
                    lev_10_m_above_ground: 'on',
                    var_UGRD: 'on',
                    var_VGRD: 'on',
                    leftlon: 0,
                    rightlon: 360,
                    toplat: 90,
                    bottomlat: -90
                },
                updateInterval: 6 * 60 * 60 * 1000 // 6小时更新一次
            },
            
            // 2. 洋流数据 (RTOFS)
            current: {
                baseUrl: 'https://nomads.ncep.noaa.gov/cgi-bin/filter_rtofs_2d.pl',
                params: {
                    file: 'rtofs_glo_2ds_f001_daily_prog.grib2',
                    lev_surface: 'on',
                    var_u_velocity: 'on',
                    var_v_velocity: 'on',
                    subregion: '',
                    leftlon: 0,
                    rightlon: 360,
                    toplat: 90,
                    bottomlat: -90
                },
                updateInterval: 24 * 60 * 60 * 1000 // 24小时更新一次
            },
            
            // 3. 海浪数据 (GFS-Wave)
            wave: {
                baseUrl: 'https://nomads.ncep.noaa.gov/cgi-bin/filter_gfswave.pl',
                params: {
                    file: 'gfswave.t00z.global.0p25.f000.grib2',
                    var_HTSGW: 'on',  // 显著波高
                    var_WVDIR: 'on',  // 波浪方向
                    leftlon: 0,
                    rightlon: 360,
                    toplat: 90,
                    bottomlat: -90
                },
                updateInterval: 6 * 60 * 60 * 1000 // 6小时更新一次
            }
        };
        
        this.updateTimers = {};
    }
    
    /**
     * 初始化服务
     */
    async init() {
        try {
            // 创建必要的目录
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.mkdir(this.cacheDir, { recursive: true });
            
            console.log('✅ NOAA 数据服务初始化成功');
            console.log('   数据目录:', this.dataDir);
            console.log('   缓存目录:', this.cacheDir);
            
            // 检查 grib2json 是否安装
            await this.checkGrib2Json();
            
            // 初始加载所有数据
            await this.updateAllData();
            
            // 启动定时更新
            this.startAutoUpdate();
            
        } catch (err) {
            console.error('❌ NOAA 数据服务初始化失败:', err);
            throw err;
        }
    }
    
    /**
     * 检查转换工具是否可用
     */
    async checkGrib2Json() {
        // 方法1：尝试使用 grib2json 命令行工具
        try {
            await execPromise('grib2json --version');
            console.log('✅ grib2json 工具已安装（命令行版本）');
            this.converterType = 'cli';
            return;
        } catch (err) {
            // grib2json 命令行工具未安装，尝试其他方法
        }
        
        // 方法2：尝试使用 Python + pygrib
        try {
            await execPromise('python3 -c "import pygrib; print(pygrib.__version__)"');
            console.log('✅ Python pygrib 已安装');
            this.converterType = 'python';
            return;
        } catch (err) {
            // Python pygrib 未安装
        }
        
        // 所有方法都失败
        console.error('❌ 未找到可用的 GRIB2 转换工具');
        console.error('');
        console.error('请选择以下任一方法安装：');
        console.error('');
        console.error('方法1：安装 grib2json（推荐）');
        console.error('  1. 访问: https://github.com/cambecc/grib2json/releases');
        console.error('  2. 下载最新版本');
        console.error('  3. 解压并将 grib2json 复制到 /usr/local/bin/');
        console.error('  或运行: ./backend/install-grib2json.sh');
        console.error('');
        console.error('方法2：安装 Python pygrib');
        console.error('  pip install pygrib');
        console.error('');
        throw new Error('GRIB2 转换工具未安装');
    }
    
    /**
     * 下载 GRIB2 数据
     */
    async downloadGrib(type, forecast = 0) {
        const source = this.sources[type];
        if (!source) {
            throw new Error(`未知的数据类型: ${type}`);
        }
        
        // 构建 URL
        const params = new URLSearchParams(source.params);
        
        // 修改预报时间（f000, f003, f006...）
        if (params.has('file')) {
            const file = params.get('file');
            const newFile = file.replace(/f\d{3}/, `f${String(forecast).padStart(3, '0')}`);
            params.set('file', newFile);
        }
        
        const url = `${source.baseUrl}?${params.toString()}`;
        const outputPath = path.join(this.cacheDir, `${type}_f${String(forecast).padStart(3, '0')}.grib2`);
        
        console.log(`📡 下载 ${type} 数据 (预报+${forecast}h)...`);
        console.log(`   URL: ${url}`);
        
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                timeout: 60000 // 60秒超时
            });
            
            await fs.writeFile(outputPath, response.data);
            console.log(`✅ 下载完成: ${outputPath}`);
            
            return outputPath;
        } catch (err) {
            console.error(`❌ 下载失败:`, err.message);
            throw err;
        }
    }
    
    /**
     * 转换 GRIB2 到 JSON
     */
    async convertToJson(gribPath, type, forecast = 0) {
        const jsonPath = path.join(this.dataDir, `${type}_f${String(forecast).padStart(3, '0')}.json`);
        
        console.log(`🔄 转换 GRIB2 到 JSON...`);
        console.log(`   输入: ${gribPath}`);
        console.log(`   输出: ${jsonPath}`);
        
        try {
            let command;
            
            if (this.converterType === 'cli') {
                // 使用 grib2json 命令行工具
                command = `grib2json -d -n -o "${jsonPath}" "${gribPath}"`;
            } else if (this.converterType === 'python') {
                // 使用 Python 脚本
                const scriptPath = path.join(__dirname, '../scripts/grib2json.py');
                command = `python3 "${scriptPath}" "${gribPath}" "${jsonPath}"`;
            } else {
                throw new Error('未找到可用的转换工具');
            }
            
            const { stdout, stderr } = await execPromise(command, {
                maxBuffer: 50 * 1024 * 1024 // 50MB buffer
            });
            
            if (stderr && !stderr.includes('✅')) {
                console.warn('⚠️  转换警告:', stderr);
            }
            
            console.log(`✅ 转换完成: ${jsonPath}`);
            
            // 验证 JSON 文件
            const data = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
            console.log(`   数据点数: ${data[0]?.data?.length || 0}`);
            
            return jsonPath;
        } catch (err) {
            console.error(`❌ 转换失败:`, err.message);
            throw err;
        }
    }
    
    /**
     * 处理海浪数据（需要将高度+方向转换为U/V分量）
     */
    async processWaveData(jsonPath) {
        console.log('🌊 处理海浪数据...');
        
        try {
            const data = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
            
            // GRIB2JSON 输出格式：
            // [
            //   { header: {...}, data: [...] },  // HTSGW (波高)
            //   { header: {...}, data: [...] }   // WVDIR (方向)
            // ]
            
            const heightData = data.find(d => d.header.parameterCategory === 0 && d.header.parameterNumber === 3);
            const directionData = data.find(d => d.header.parameterCategory === 0 && d.header.parameterNumber === 4);
            
            if (!heightData || !directionData) {
                throw new Error('海浪数据格式不正确');
            }
            
            // 转换为 U/V 分量
            const uData = [];
            const vData = [];
            
            for (let i = 0; i < heightData.data.length; i++) {
                const height = heightData.data[i];
                const direction = directionData.data[i]; // 度数
                
                if (height !== null && direction !== null) {
                    const radians = (direction * Math.PI) / 180;
                    uData.push(height * Math.sin(radians));
                    vData.push(height * Math.cos(radians));
                } else {
                    uData.push(null);
                    vData.push(null);
                }
            }
            
            // 创建新的数据结构（兼容 cesium-wind-layer）
            const processedData = [
                {
                    header: { ...heightData.header, parameterNumberName: 'U-component_of_wave' },
                    data: uData
                },
                {
                    header: { ...heightData.header, parameterNumberName: 'V-component_of_wave' },
                    data: vData
                }
            ];
            
            // 保存处理后的数据
            await fs.writeFile(jsonPath, JSON.stringify(processedData));
            console.log('✅ 海浪数据处理完成');
            
        } catch (err) {
            console.error('❌ 海浪数据处理失败:', err);
            throw err;
        }
    }
    
    /**
     * 更新指定类型的数据
     */
    async updateData(type, forecastHours = [0, 6, 12, 24, 48, 72]) {
        console.log(`\n🔄 更新 ${type} 数据...`);
        
        try {
            for (const forecast of forecastHours) {
                // 1. 下载 GRIB2
                const gribPath = await this.downloadGrib(type, forecast);
                
                // 2. 转换为 JSON
                const jsonPath = await this.convertToJson(gribPath, type, forecast);
                
                // 3. 如果是海浪数据，需要额外处理
                if (type === 'wave') {
                    await this.processWaveData(jsonPath);
                }
                
                // 4. 清理 GRIB2 文件（节省空间）
                await fs.unlink(gribPath);
            }
            
            console.log(`✅ ${type} 数据更新完成\n`);
        } catch (err) {
            console.error(`❌ ${type} 数据更新失败:`, err);
        }
    }
    
    /**
     * 更新所有数据
     */
    async updateAllData() {
        console.log('\n🌍 开始更新所有气象数据...\n');
        
        await this.updateData('wind');
        await this.updateData('current');
        await this.updateData('wave');
        
        console.log('✅ 所有数据更新完成\n');
    }
    
    /**
     * 启动自动更新
     */
    startAutoUpdate() {
        console.log('⏰ 启动自动更新定时器...');
        
        for (const [type, source] of Object.entries(this.sources)) {
            this.updateTimers[type] = setInterval(() => {
                console.log(`⏰ 定时更新 ${type} 数据`);
                this.updateData(type);
            }, source.updateInterval);
            
            console.log(`   ${type}: 每 ${source.updateInterval / 3600000} 小时更新一次`);
        }
    }
    
    /**
     * 停止自动更新
     */
    stopAutoUpdate() {
        for (const [type, timer] of Object.entries(this.updateTimers)) {
            clearInterval(timer);
            console.log(`⏹️  停止 ${type} 自动更新`);
        }
        this.updateTimers = {};
    }
    
    /**
     * 获取可用的数据列表
     */
    async getAvailableData() {
        try {
            const files = await fs.readdir(this.dataDir);
            const data = {
                wind: [],
                current: [],
                wave: []
            };
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const match = file.match(/^(wind|current|wave)_f(\d{3})\.json$/);
                    if (match) {
                        const [, type, forecast] = match;
                        data[type].push({
                            forecast: parseInt(forecast),
                            file: file,
                            path: `/data/noaa/${file}`
                        });
                    }
                }
            }
            
            return data;
        } catch (err) {
            console.error('获取数据列表失败:', err);
            return { wind: [], current: [], wave: [] };
        }
    }
}

module.exports = NOAADataService;
