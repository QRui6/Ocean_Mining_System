/**
 * 数据源配置
 * 控制气象数据从哪里加载
 */

// 数据源类型
export const DATA_SOURCE_TYPE = {
    LOCAL: 'local',  // 从本地文件加载
    API: 'api'       // 从后端API加载
};

// 当前使用的数据源（可以通过环境变量配置）
export const CURRENT_DATA_SOURCE = import.meta.env.VITE_WEATHER_DATA_SOURCE || DATA_SOURCE_TYPE.API;

// 根据配置动态导入对应的加载器
export async function getWindDataLoader() {
    if (CURRENT_DATA_SOURCE === DATA_SOURCE_TYPE.API) {
        const module = await import('../utils/windDataLoaderAPI.js');
        console.log('🌐 使用API版本的风场数据加载器');
        return module;
    } else {
        const module = await import('../utils/windDataLoader.js');
        console.log('📁 使用本地文件版本的风场数据加载器');
        return module;
    }
}

export async function getOceanCurrentLoader() {
    if (CURRENT_DATA_SOURCE === DATA_SOURCE_TYPE.API) {
        const module = await import('../utils/oceanCurrentLoaderAPI.js');
        console.log('🌐 使用API版本的洋流数据加载器');
        return module;
    } else {
        const module = await import('../utils/oceanCurrentLoader.js');
        console.log('📁 使用本地文件版本的洋流数据加载器');
        return module;
    }
}

export async function getWaveDataLoader() {
    if (CURRENT_DATA_SOURCE === DATA_SOURCE_TYPE.API) {
        const module = await import('../utils/waveDataLoaderAPI.js');
        console.log('🌐 使用API版本的波浪数据加载器');
        return module;
    } else {
        const module = await import('../utils/waveDataLoader.js');
        console.log('📁 使用本地文件版本的波浪数据加载器');
        return module;
    }
}

// 内波数据加载器
export async function getInternalWaveLoader() {
    if (CURRENT_DATA_SOURCE === DATA_SOURCE_TYPE.API) {
        const module = await import('../utils/internalWaveLoaderAPI.js');
        console.log('🌐 使用API版本的内波数据加载器');
        return module;
    } else {
        const module = await import('../utils/internalWaveLoader.js');
        console.log('📁 使用本地文件版本的内波数据加载器');
        return module;
    }
}

console.log(`📊 气象数据源配置: ${CURRENT_DATA_SOURCE === DATA_SOURCE_TYPE.API ? 'API模式' : '本地文件模式'}`);
