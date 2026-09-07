package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oceanmining.monitoring.dto.WeatherMetadataJson;
import com.oceanmining.monitoring.entity.*;
import com.oceanmining.monitoring.repository.*;
import com.oceanmining.monitoring.util.BinaryDataConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 气象数据迁移服务
 * 用于将本地二进制文件迁移到数据库
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Service
public class WeatherDataMigrationService {
    
    private static final Logger log = LoggerFactory.getLogger(WeatherDataMigrationService.class);
    private final WeatherDataTypeRepository dataTypeRepository;
    private final WeatherMetadataRepository metadataRepository;
    private final WindDataRepository windDataRepository;
    private final OceanCurrentDataRepository currentDataRepository;
    private final WaveDataRepository waveDataRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${weather.data.path.wind:public/wind_data}")
    private String windDataPath;
    
    @Value("${weather.data.path.ocean_current:public/ocean_currents}")
    private String oceanCurrentDataPath;
    
    @Value("${weather.data.path.wave:public/wave_data}")
    private String waveDataPath;
    
    @Autowired
    public WeatherDataMigrationService(
            WeatherDataTypeRepository dataTypeRepository,
            WeatherMetadataRepository metadataRepository,
            WindDataRepository windDataRepository,
            OceanCurrentDataRepository currentDataRepository,
            WaveDataRepository waveDataRepository,
            ObjectMapper objectMapper) {
        this.dataTypeRepository = dataTypeRepository;
        this.metadataRepository = metadataRepository;
        this.windDataRepository = windDataRepository;
        this.currentDataRepository = currentDataRepository;
        this.waveDataRepository = waveDataRepository;
        this.objectMapper = objectMapper;
    }
    
    /**
     * 迁移所有气象数据
     */
    public void migrateAllData() {
        log.info("========================================");
        log.info("开始迁移所有气象数据...");
        log.info("Wind数据路径: {}", windDataPath);
        log.info("Ocean Current数据路径: {}", oceanCurrentDataPath);
        log.info("Wave数据路径: {}", waveDataPath);
        log.info("========================================");
        
        try {
            log.info("开始迁移Wind数据...");
            migrateDataType("wind", windDataPath);
            log.info("Wind数据迁移完成");
            
            log.info("开始迁移Ocean Current数据...");
            migrateDataType("ocean_current", oceanCurrentDataPath);
            log.info("Ocean Current数据迁移完成");
            
            log.info("开始迁移Wave数据...");
            migrateDataType("wave", waveDataPath);
            log.info("Wave数据迁移完成");
            
            log.info("========================================");
            log.info("所有气象数据迁移完成！");
            log.info("========================================");
        } catch (Exception e) {
            log.error("数据迁移失败", e);
            throw new RuntimeException("数据迁移失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取路径信息（用于调试）
     */
    public String getPathInfo() {
        File windFile = new File(windDataPath + "/meta.json");
        File oceanFile = new File(oceanCurrentDataPath + "/meta.json");
        File waveFile = new File(waveDataPath + "/meta.json");
        
        return String.format(
            "Wind Path: %s (exists: %s, absolute: %s)\n" +
            "Ocean Current Path: %s (exists: %s, absolute: %s)\n" +
            "Wave Path: %s (exists: %s, absolute: %s)",
            windDataPath, windFile.exists(), windFile.getAbsolutePath(),
            oceanCurrentDataPath, oceanFile.exists(), oceanFile.getAbsolutePath(),
            waveDataPath, waveFile.exists(), waveFile.getAbsolutePath()
        );
    }
    
    /**
     * 根据类型代码迁移数据（使用配置的路径）
     */
    public void migrateDataTypeByCode(String typeCode) {
        String path = switch (typeCode.toLowerCase()) {
            case "wind" -> windDataPath;
            case "ocean_current" -> oceanCurrentDataPath;
            case "wave" -> waveDataPath;
            default -> throw new IllegalArgumentException("不支持的数据类型: " + typeCode);
        };
        
        migrateDataType(typeCode, path);
    }
    
    /**
     * 迁移指定类型的数据
     */
    public void migrateDataType(String type, String basePath) {
        log.info("----------------------------------------");
        log.info("开始迁移 {} 数据...", type);
        log.info("数据路径: {}", basePath);
        
        try {
            // 1. 读取元数据
            String metaPath = basePath + "/meta.json";
            log.info("读取元数据文件: {}", metaPath);
            WeatherMetadataJson metaJson = readMetadataJson(metaPath);
            log.info("元数据读取成功: {} 帧数据", metaJson.getFrames());
            
            // 2. 获取或创建数据类型
            log.info("获取数据类型: {}", type);
            WeatherDataType dataType = getOrCreateDataType(type);
            log.info("数据类型获取成功: ID={}, Code={}", dataType.getId(), dataType.getTypeCode());
            
            // 3. 创建元数据记录
            log.info("创建元数据记录...");
            WeatherMetadata metadata = createMetadata(dataType, metaJson);
            log.info("元数据记录创建成功: ID={}", metadata.getId());
            
            // 4. 迁移所有时间帧
            int successCount = 0;
            int failCount = 0;
            
            for (int t = 0; t < metaJson.getFrames(); t++) {
                try {
                    migrateTimeFrame(type, metadata, t, basePath);
                    successCount++;
                    
                    if ((t + 1) % 5 == 0) {
                        log.info("进度: {}/{} 帧已完成", t + 1, metaJson.getFrames());
                    }
                } catch (Exception e) {
                    log.error("迁移时间帧 {} 失败: {}", t, e.getMessage(), e);
                    failCount++;
                }
            }
            
            log.info("{} 数据迁移完成: 成功 {} 帧, 失败 {} 帧", type, successCount, failCount);
            log.info("----------------------------------------");
            
        } catch (Exception e) {
            log.error("迁移 {} 数据失败", type, e);
            throw new RuntimeException("数据迁移失败: " + type + " - " + e.getMessage(), e);
        }
    }
    
    /**
     * 迁移单个时间帧
     */
    private void migrateTimeFrame(String type, WeatherMetadata metadata, int timeIndex, String basePath) 
            throws IOException {
        
        // 根据数据类型确定文件名前缀
        String uPrefix = "u";
        String vPrefix = "v";
        
        if ("wave".equals(type)) {
            uPrefix = "stokes_u";
            vPrefix = "stokes_v";
        }
        
        // 读取U分量
        String uPath = String.format("%s/%s_t%02d.bin", basePath, uPrefix, timeIndex);
        byte[] uBytes = readBinaryFile(uPath);
        
        // 读取V分量
        String vPath = String.format("%s/%s_t%02d.bin", basePath, vPrefix, timeIndex);
        byte[] vBytes = readBinaryFile(vPath);
        
        // 转换为float数组并计算统计信息
        float[] uFloats = BinaryDataConverter.bytesToFloatArray(uBytes);
        float[] vFloats = BinaryDataConverter.bytesToFloatArray(vBytes);
        
        float uMin = BinaryDataConverter.findMin(uFloats);
        float uMax = BinaryDataConverter.findMax(uFloats);
        float vMin = BinaryDataConverter.findMin(vFloats);
        float vMax = BinaryDataConverter.findMax(vFloats);
        
        // 对于wave数据，还需要读取波高数据
        Float hsMin = null;
        Float hsMax = null;
        byte[] hsBytes = null;
        if ("wave".equals(type)) {
            try {
                String hsPath = String.format("%s/hs_t%02d.bin", basePath, timeIndex);
                hsBytes = readBinaryFile(hsPath);
                float[] hsFloats = BinaryDataConverter.bytesToFloatArray(hsBytes);
                hsMin = BinaryDataConverter.findMin(hsFloats);
                hsMax = BinaryDataConverter.findMax(hsFloats);
                log.debug("波高数据读取成功: timeIndex={}, hsMin={}, hsMax={}, size={}", timeIndex, hsMin, hsMax, hsBytes.length);
            } catch (IOException e) {
                log.warn("波高数据读取失败: timeIndex={}, 将跳过波高数据", timeIndex);
            }
        }
        
        // 保存到数据库
        switch (type) {
            case "wind":
                saveWindData(metadata, timeIndex, uBytes, vBytes, uMin, uMax, vMin, vMax, uFloats.length);
                break;
            case "ocean_current":
                saveOceanCurrentData(metadata, timeIndex, uBytes, vBytes, uMin, uMax, vMin, vMax, uFloats.length);
                break;
            case "wave":
                saveWaveData(metadata, timeIndex, uBytes, vBytes, hsBytes, uMin, uMax, vMin, vMax, uFloats.length, hsMin, hsMax);
                break;
        }
    }
    
    /**
     * 读取元数据JSON文件
     */
    private WeatherMetadataJson readMetadataJson(String path) throws IOException {
        File file = new File(path);
        if (!file.exists()) {
            throw new IOException("元数据文件不存在: " + path);
        }
        return objectMapper.readValue(file, WeatherMetadataJson.class);
    }
    
    /**
     * 读取二进制文件
     */
    private byte[] readBinaryFile(String path) throws IOException {
        Path filePath = Paths.get(path);
        if (!Files.exists(filePath)) {
            throw new IOException("二进制文件不存在: " + path);
        }
        return Files.readAllBytes(filePath);
    }
    
    /**
     * 获取或创建数据类型
     */
    private WeatherDataType getOrCreateDataType(String typeCode) {
        return dataTypeRepository.findByTypeCode(typeCode)
                .orElseThrow(() -> new RuntimeException("数据类型不存在: " + typeCode + 
                        "。请先执行数据库初始化脚本！"));
    }
    
    /**
     * 创建元数据记录
     */
    private WeatherMetadata createMetadata(WeatherDataType dataType, WeatherMetadataJson metaJson) {
        // 检查是否已存在
        metadataRepository.findByDataType_TypeCode(dataType.getTypeCode())
                .ifPresent(existing -> {
                    log.warn("元数据已存在，将删除旧数据");
                    metadataRepository.delete(existing);
                });
        
        WeatherMetadata metadata = new WeatherMetadata();
        metadata.setDataType(dataType);
        metadata.setGridLonSize(metaJson.getGrid().getLonSize());
        metadata.setGridLatSize(metaJson.getGrid().getLatSize());
        metadata.setGridLonMin(BigDecimal.valueOf(metaJson.getGrid().getLonMin()));
        metadata.setGridLatMin(BigDecimal.valueOf(metaJson.getGrid().getLatMin()));
        metadata.setGridLonMax(BigDecimal.valueOf(metaJson.getGrid().getLonMax()));
        metadata.setGridLatMax(BigDecimal.valueOf(metaJson.getGrid().getLatMax()));
        metadata.setGridLonStep(BigDecimal.valueOf(metaJson.getGrid().getLonStep()));
        metadata.setGridLatStep(BigDecimal.valueOf(metaJson.getGrid().getLatStep()));
        metadata.setTotalFrames(metaJson.getFrames());
        metadata.setTimeStepHours(metaJson.getTimeStepHours());
        metadata.setDataSource(metaJson.getDataSource());
        
        // 解析起始时间
        if (metaJson.getStartTime() != null) {
            try {
                metadata.setStartTime(LocalDateTime.parse(metaJson.getStartTime(), 
                        DateTimeFormatter.ISO_DATE_TIME));
            } catch (Exception e) {
                log.warn("解析起始时间失败: {}", metaJson.getStartTime());
            }
        }
        
        return metadataRepository.save(metadata);
    }
    
    /**
     * 保存风场数据
     */
    private void saveWindData(WeatherMetadata metadata, Integer timeIndex, 
                             byte[] uBytes, byte[] vBytes,
                             Float uMin, Float uMax, Float vMin, Float vMax, 
                             Integer dataSize) {
        WindData windData = new WindData();
        windData.setMetadata(metadata);
        windData.setTimeIndex(timeIndex);
        windData.setUComponent(uBytes);
        windData.setVComponent(vBytes);
        windData.setUMin(uMin);
        windData.setUMax(uMax);
        windData.setVMin(vMin);
        windData.setVMax(vMax);
        windData.setDataSize(dataSize);
        
        windDataRepository.save(windData);
    }
    
    /**
     * 保存洋流数据
     */
    private void saveOceanCurrentData(WeatherMetadata metadata, Integer timeIndex,
                                     byte[] uBytes, byte[] vBytes,
                                     Float uMin, Float uMax, Float vMin, Float vMax,
                                     Integer dataSize) {
        OceanCurrentData currentData = new OceanCurrentData();
        currentData.setMetadata(metadata);
        currentData.setTimeIndex(timeIndex);
        currentData.setUComponent(uBytes);
        currentData.setVComponent(vBytes);
        currentData.setUMin(uMin);
        currentData.setUMax(uMax);
        currentData.setVMin(vMin);
        currentData.setVMax(vMax);
        currentData.setDataSize(dataSize);
        
        currentDataRepository.save(currentData);
    }
    
    /**
     * 保存波浪数据
     */
    private void saveWaveData(WeatherMetadata metadata, Integer timeIndex,
                             byte[] uBytes, byte[] vBytes, byte[] hsBytes,
                             Float uMin, Float uMax, Float vMin, Float vMax,
                             Integer dataSize, Float hsMin, Float hsMax) {
        WaveData waveData = new WaveData();
        waveData.setMetadata(metadata);
        waveData.setTimeIndex(timeIndex);
        waveData.setUComponent(uBytes);
        waveData.setVComponent(vBytes);
        waveData.setWaveHeight(hsBytes);  // 设置波高数据
        waveData.setUMin(uMin);
        waveData.setUMax(uMax);
        waveData.setVMin(vMin);
        waveData.setVMax(vMax);
        waveData.setDataSize(dataSize);
        waveData.setHsMin(hsMin);
        waveData.setHsMax(hsMax);
        
        waveDataRepository.save(waveData);
    }
}
