package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.GridData;
import com.oceanmining.monitoring.dto.Vector2D;
import com.oceanmining.monitoring.dto.response.AvailableIndicesDTO;
import com.oceanmining.monitoring.dto.response.WeatherDataDTO;
import com.oceanmining.monitoring.dto.response.WeatherMetadataDTO;
import com.oceanmining.monitoring.dto.response.WeatherPointQueryDTO;
import com.oceanmining.monitoring.dto.response.WeatherTimeSeriesDTO;
import com.oceanmining.monitoring.entity.*;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.repository.*;
import com.oceanmining.monitoring.util.WeatherDataConverter;
import com.oceanmining.monitoring.util.WeatherInterpolationUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * 气象数据服务
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Service
@Transactional(readOnly = true)
public class WeatherDataService {
    
    private static final Logger log = LoggerFactory.getLogger(WeatherDataService.class);
    private final WeatherMetadataRepository metadataRepository;
    private final WindDataRepository windDataRepository;
    private final OceanCurrentDataRepository currentDataRepository;
    private final WaveDataRepository waveDataRepository;
    private final InternalWaveMetadataRepository internalWaveMetadataRepository;
    private final InternalWaveDataRepository internalWaveDataRepository;
    
    @Autowired
    public WeatherDataService(
            WeatherMetadataRepository metadataRepository,
            WindDataRepository windDataRepository,
            OceanCurrentDataRepository currentDataRepository,
            WaveDataRepository waveDataRepository,
            InternalWaveMetadataRepository internalWaveMetadataRepository,
            InternalWaveDataRepository internalWaveDataRepository) {
        this.metadataRepository = metadataRepository;
        this.windDataRepository = windDataRepository;
        this.currentDataRepository = currentDataRepository;
        this.waveDataRepository = waveDataRepository;
        this.internalWaveMetadataRepository = internalWaveMetadataRepository;
        this.internalWaveDataRepository = internalWaveDataRepository;
    }
    
    /**
     * 获取气象数据元数据
     * 
     * @param type 数据类型 (wind, ocean_current, wave)
     * @return 元数据DTO
     */
    @Cacheable(value = "weatherMetadata", key = "#type")
    public WeatherMetadataDTO getMetadata(String type) {
        log.info("获取气象数据元数据: type={}", type);
        
        WeatherMetadata metadata = metadataRepository
                .findByDataType_TypeCode(type)
                .orElseThrow(() -> new ResourceNotFoundException("未找到数据类型的元数据: " + type));
        
        return WeatherDataConverter.toMetadataDTO(metadata);
    }
    
    /**
     * 获取指定时间索引的气象数据
     * 
     * @param type 数据类型
     * @param timeIndex 时间索引
     * @return 气象数据DTO
     */
    @Cacheable(value = "weatherData", key = "#type + '_' + #timeIndex")
    public WeatherDataDTO getData(String type, Integer timeIndex) {
        log.info("获取气象数据: type={}, timeIndex={}", type, timeIndex);
        
        // 验证时间索引
        validateTimeIndex(type, timeIndex);
        
        WeatherMetadata metadata = metadataRepository
                .findByDataType_TypeCode(type)
                .orElseThrow(() -> new ResourceNotFoundException("未找到数据类型的元数据: " + type));
        
        switch (type) {
            case "wind":
                return getWindData(metadata, timeIndex);
            case "ocean_current":
                return getOceanCurrentData(metadata, timeIndex);
            case "wave":
                return getWaveData(metadata, timeIndex);
            default:
                throw new IllegalArgumentException("未知的数据类型: " + type);
        }
    }
    
    /**
     * 获取可用的时间索引列表
     * 
     * @param type 数据类型
     * @return 可用索引DTO
     */
    @Cacheable(value = "availableIndices", key = "#type")
    public AvailableIndicesDTO getAvailableIndices(String type) {
        log.info("获取可用时间索引: type={}", type);
        
        WeatherMetadata metadata = metadataRepository
                .findByDataType_TypeCode(type)
                .orElseThrow(() -> new ResourceNotFoundException("未找到数据类型的元数据: " + type));
        
        List<Integer> indices;
        switch (type) {
            case "wind":
                indices = windDataRepository.findTimeIndicesByMetadataId(metadata.getId());
                break;
            case "ocean_current":
                indices = currentDataRepository.findTimeIndicesByMetadataId(metadata.getId());
                break;
            case "wave":
                indices = waveDataRepository.findTimeIndicesByMetadataId(metadata.getId());
                break;
            default:
                throw new IllegalArgumentException("未知的数据类型: " + type);
        }
        
        return new AvailableIndicesDTO(type, indices, metadata.getTotalFrames());
    }
    
    /**
     * 获取风场数据
     */
    private WeatherDataDTO getWindData(WeatherMetadata metadata, Integer timeIndex) {
        WindData windData = windDataRepository
                .findByMetadataAndTimeIndex(metadata, timeIndex)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("未找到风场数据: timeIndex=%d", timeIndex)));
        
        return WeatherDataConverter.toWeatherDataDTO(windData, metadata);
    }
    
    /**
     * 获取洋流数据
     */
    private WeatherDataDTO getOceanCurrentData(WeatherMetadata metadata, Integer timeIndex) {
        OceanCurrentData currentData = currentDataRepository
                .findByMetadataAndTimeIndex(metadata, timeIndex)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("未找到洋流数据: timeIndex=%d", timeIndex)));
        
        return WeatherDataConverter.toWeatherDataDTO(currentData, metadata);
    }
    
    /**
     * 获取波浪数据
     */
    private WeatherDataDTO getWaveData(WeatherMetadata metadata, Integer timeIndex) {
        WaveData waveData = waveDataRepository
                .findByMetadataAndTimeIndex(metadata, timeIndex)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("未找到波浪数据: timeIndex=%d", timeIndex)));
        
        return WeatherDataConverter.toWeatherDataDTO(waveData, metadata);
    }
    
    /**
     * 验证时间索引是否有效
     */
    private void validateTimeIndex(String type, Integer timeIndex) {
        if (timeIndex == null || timeIndex < 0) {
            throw new IllegalArgumentException("时间索引必须为非负整数");
        }
        
        WeatherMetadata metadata = metadataRepository
                .findByDataType_TypeCode(type)
                .orElseThrow(() -> new ResourceNotFoundException("未找到数据类型的元数据: " + type));
        
        if (timeIndex >= metadata.getTotalFrames()) {
            throw new IllegalArgumentException(
                    String.format("时间索引超出范围: %d (最大值: %d)", timeIndex, metadata.getTotalFrames() - 1));
        }
    }
    
    /**
     * 获取指定时间索引的气象数据（二进制格式）
     * 性能优化版本：直接返回二进制数据，避免JSON序列化开销
     * 
     * 数据格式：
     * [4字节: header长度] + [header JSON] + [U数据 byte[]] + [V数据 byte[]] + [可选: 波高数据 byte[]]
     * 
     * @param type 数据类型
     * @param timeIndex 时间索引
     * @return 二进制数据
     */
    @Cacheable(value = "weatherDataBinary", key = "#type + '_' + #timeIndex")
    public byte[] getDataBinary(String type, Integer timeIndex) {
        log.info("获取气象数据(二进制): type={}, timeIndex={}", type, timeIndex);
        
        // 验证时间索引
        validateTimeIndex(type, timeIndex);
        
        WeatherMetadata metadata = metadataRepository
                .findByDataType_TypeCode(type)
                .orElseThrow(() -> new ResourceNotFoundException("未找到数据类型的元数据: " + type));
        
        try {
            switch (type) {
                case "wind":
                    return buildWindDataBinary(metadata, timeIndex);
                case "ocean_current":
                    return buildOceanCurrentDataBinary(metadata, timeIndex);
                case "wave":
                    return buildWaveDataBinary(metadata, timeIndex);
                default:
                    throw new IllegalArgumentException("未知的数据类型: " + type);
            }
        } catch (IOException e) {
            log.error("构建二进制数据失败", e);
            throw new RuntimeException("构建二进制数据失败", e);
        }
    }
    
    /**
     * 构建风场数据的二进制格式
     */
    private byte[] buildWindDataBinary(WeatherMetadata metadata, Integer timeIndex) throws IOException {
        WindData windData = windDataRepository
                .findByMetadataAndTimeIndex(metadata, timeIndex)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("未找到风场数据: timeIndex=%d", timeIndex)));
        
        return buildBinaryData(
                metadata,
                windData.getUComponent(),
                windData.getVComponent(),
                null,
                windData.getUMin(),
                windData.getUMax(),
                windData.getVMin(),
                windData.getVMax(),
                null,
                null
        );
    }
    
    /**
     * 构建洋流数据的二进制格式
     */
    private byte[] buildOceanCurrentDataBinary(WeatherMetadata metadata, Integer timeIndex) throws IOException {
        OceanCurrentData currentData = currentDataRepository
                .findByMetadataAndTimeIndex(metadata, timeIndex)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("未找到洋流数据: timeIndex=%d", timeIndex)));
        
        return buildBinaryData(
                metadata,
                currentData.getUComponent(),
                currentData.getVComponent(),
                null,
                currentData.getUMin(),
                currentData.getUMax(),
                currentData.getVMin(),
                currentData.getVMax(),
                null,
                null
        );
    }
    
    /**
     * 构建波浪数据的二进制格式
     */
    private byte[] buildWaveDataBinary(WeatherMetadata metadata, Integer timeIndex) throws IOException {
        WaveData waveData = waveDataRepository
                .findByMetadataAndTimeIndex(metadata, timeIndex)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("未找到波浪数据: timeIndex=%d", timeIndex)));
        
        return buildBinaryData(
                metadata,
                waveData.getUComponent(),
                waveData.getVComponent(),
                waveData.getWaveHeight(),
                waveData.getUMin(),
                waveData.getUMax(),
                waveData.getVMin(),
                waveData.getVMax(),
                waveData.getHsMin(),
                waveData.getHsMax()
        );
    }
    
    /**
     * 构建通用二进制数据格式
     * 
     * @param metadata 元数据
     * @param uData U分量数据
     * @param vData V分量数据
     * @param hsData 波高数据（可选）
     * @param uMin U最小值
     * @param uMax U最大值
     * @param vMin V最小值
     * @param vMax V最大值
     * @param hsMin 波高最小值（可选）
     * @param hsMax 波高最大值（可选）
     * @return 二进制数据
     */
    private byte[] buildBinaryData(
            WeatherMetadata metadata,
            byte[] uData,
            byte[] vData,
            byte[] hsData,
            Float uMin,
            Float uMax,
            Float vMin,
            Float vMax,
            Float hsMin,
            Float hsMax) throws IOException {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        // 1. 构建header（JSON格式）
        StringBuilder headerJson = new StringBuilder();
        headerJson.append("{");
        headerJson.append("\"width\":").append(metadata.getGridLonSize()).append(",");
        headerJson.append("\"height\":").append(metadata.getGridLatSize()).append(",");
        headerJson.append("\"uMin\":").append(uMin).append(",");
        headerJson.append("\"uMax\":").append(uMax).append(",");
        headerJson.append("\"vMin\":").append(vMin).append(",");
        headerJson.append("\"vMax\":").append(vMax).append(",");
        
        if (hsMin != null && hsMax != null) {
            headerJson.append("\"hsMin\":").append(hsMin).append(",");
            headerJson.append("\"hsMax\":").append(hsMax).append(",");
        }
        
        headerJson.append("\"bounds\":{");
        headerJson.append("\"west\":").append(metadata.getGridLonMin()).append(",");
        headerJson.append("\"south\":").append(metadata.getGridLatMin()).append(",");
        headerJson.append("\"east\":").append(metadata.getGridLonMax()).append(",");
        headerJson.append("\"north\":").append(metadata.getGridLatMax());
        headerJson.append("}");
        headerJson.append("}");
        
        byte[] headerBytes = headerJson.toString().getBytes(StandardCharsets.UTF_8);
        
        // 2. 计算padding,确保数据部分4字节对齐
        // 总的header部分 = 4字节(长度) + headerBytes.length + padding
        // 需要确保 (4 + headerBytes.length + padding) % 4 == 0
        int headerLength = headerBytes.length;
        int totalHeaderSize = 4 + headerLength; // 4字节长度 + header内容
        int padding = (4 - (totalHeaderSize % 4)) % 4; // 计算需要的padding
        
        // 3. 写入header长度（4字节，big-endian）
        ByteBuffer headerLengthBuffer = ByteBuffer.allocate(4);
        headerLengthBuffer.putInt(headerLength);
        baos.write(headerLengthBuffer.array());
        
        // 4. 写入header内容
        baos.write(headerBytes);
        
        // 5. 写入padding字节(0x00)
        for (int i = 0; i < padding; i++) {
            baos.write(0);
        }
        
        log.info("Header长度: {}, Padding: {}, 总偏移: {}", headerLength, padding, totalHeaderSize + padding);
        
        // 6. 写入U数据
        log.info("写入U数据: {} 字节", uData.length);
        baos.write(uData);
        
        // 7. 写入V数据
        log.info("写入V数据: {} 字节", vData.length);
        baos.write(vData);
        
        // 8. 写入波高数据（如果有）
        if (hsData != null) {
            baos.write(hsData);
        }
        
        byte[] result = baos.toByteArray();
        log.info("二进制数据构建完成: 总大小={}MB", result.length / 1024.0 / 1024.0);
        
        return result;
    }
    
    /**
     * 查询指定点的风浪流数据
     * 
     * @param lat 纬度
     * @param lon 经度
     * @param timeIndex 时间索引（可选，默认0）
     * @return 点查询结果
     */
    public WeatherPointQueryDTO queryPointWeather(double lat, double lon, Integer timeIndex) {
        log.info("查询点气象数据: lat={}, lon={}, timeIndex={}", lat, lon, timeIndex);
        
        if (timeIndex == null) {
            timeIndex = 0;
        }
        
        WeatherPointQueryDTO result = new WeatherPointQueryDTO();
        result.setLocation(new WeatherPointQueryDTO.LocationInfo(lat, lon));
        
        try {
            // 查询风场数据
            WeatherMetadata windMetadata = metadataRepository
                    .findByDataType_TypeCode("wind")
                    .orElse(null);
            if (windMetadata != null) {
                WindData windData = windDataRepository
                        .findByMetadataAndTimeIndex(windMetadata, timeIndex)
                        .orElse(null);
                if (windData != null) {
                    GridData windGrid = WeatherInterpolationUtil.parseBinaryData(
                            windData.getUComponent(),
                            windData.getVComponent(),
                            windMetadata.getGridLonSize(),
                            windMetadata.getGridLatSize(),
                            windMetadata.getGridLonMin().doubleValue(),
                            windMetadata.getGridLatMin().doubleValue(),
                            windMetadata.getGridLonMax().doubleValue(),
                            windMetadata.getGridLatMax().doubleValue()
                    );
                    Vector2D windVector = WeatherInterpolationUtil.bilinearInterpolation(windGrid, lat, lon);
                    result.setWind(WeatherInterpolationUtil.calculateSpeedAndDirection(windVector));
                }
            }
            
            // 查询波浪数据
            WeatherMetadata waveMetadata = metadataRepository
                    .findByDataType_TypeCode("wave")
                    .orElse(null);
            if (waveMetadata != null) {
                WaveData waveData = waveDataRepository
                        .findByMetadataAndTimeIndex(waveMetadata, timeIndex)
                        .orElse(null);
                if (waveData != null) {
                    GridData waveGrid = WeatherInterpolationUtil.parseBinaryData(
                            waveData.getUComponent(),
                            waveData.getVComponent(),
                            waveMetadata.getGridLonSize(),
                            waveMetadata.getGridLatSize(),
                            waveMetadata.getGridLonMin().doubleValue(),
                            waveMetadata.getGridLatMin().doubleValue(),
                            waveMetadata.getGridLonMax().doubleValue(),
                            waveMetadata.getGridLatMax().doubleValue()
                    );
                    Vector2D waveVector = WeatherInterpolationUtil.bilinearInterpolation(waveGrid, lat, lon);
                    WeatherPointQueryDTO.WeatherVector waveInfo = WeatherInterpolationUtil.calculateSpeedAndDirection(waveVector);
                    
                    // 添加浪高数据
                    if (waveData.getWaveHeight() != null) {
                        GridData heightGrid = WeatherInterpolationUtil.parseBinaryDataSingleChannel(
                                waveData.getWaveHeight(),
                                waveMetadata.getGridLonSize(),
                                waveMetadata.getGridLatSize(),
                                waveMetadata.getGridLonMin().doubleValue(),
                                waveMetadata.getGridLatMin().doubleValue(),
                                waveMetadata.getGridLonMax().doubleValue(),
                                waveMetadata.getGridLatMax().doubleValue()
                        );
                        double height = WeatherInterpolationUtil.bilinearInterpolationSingleValue(heightGrid, lat, lon);
                        waveInfo.setHeight(height);
                    }
                    
                    result.setWave(waveInfo);
                }
            }
            
            // 查询洋流数据
            WeatherMetadata currentMetadata = metadataRepository
                    .findByDataType_TypeCode("ocean_current")
                    .orElse(null);
            if (currentMetadata != null) {
                OceanCurrentData currentData = currentDataRepository
                        .findByMetadataAndTimeIndex(currentMetadata, timeIndex)
                        .orElse(null);
                if (currentData != null) {
                    GridData currentGrid = WeatherInterpolationUtil.parseBinaryData(
                            currentData.getUComponent(),
                            currentData.getVComponent(),
                            currentMetadata.getGridLonSize(),
                            currentMetadata.getGridLatSize(),
                            currentMetadata.getGridLonMin().doubleValue(),
                            currentMetadata.getGridLatMin().doubleValue(),
                            currentMetadata.getGridLonMax().doubleValue(),
                            currentMetadata.getGridLatMax().doubleValue()
                    );
                    Vector2D currentVector = WeatherInterpolationUtil.bilinearInterpolation(currentGrid, lat, lon);
                    result.setCurrent(WeatherInterpolationUtil.calculateSpeedAndDirection(currentVector));
                }
            }
            
            // 查询内波数据
            InternalWaveMetadata internalWaveMetadata = internalWaveMetadataRepository
                    .findByType("internal_wave")
                    .orElse(null);
            if (internalWaveMetadata != null) {
                InternalWaveData internalWaveData = internalWaveDataRepository
                        .findByTimeIndex(timeIndex)
                        .orElse(null);
                if (internalWaveData != null) {
                    Map<String, Object> gridData = internalWaveMetadata.getGridData();
                    int lonSize = ((Number) gridData.get("lonSize")).intValue();
                    int latSize = ((Number) gridData.get("latSize")).intValue();
                    double lonMin = ((Number) gridData.get("lonMin")).doubleValue();
                    double latMin = ((Number) gridData.get("latMin")).doubleValue();
                    double lonMax = ((Number) gridData.get("lonMax")).doubleValue();
                    double latMax = ((Number) gridData.get("latMax")).doubleValue();
                    
                    GridData internalWaveGrid = WeatherInterpolationUtil.parseBinaryData(
                            internalWaveData.getUData(),
                            internalWaveData.getVData(),
                            lonSize,
                            latSize,
                            lonMin,
                            latMin,
                            lonMax,
                            latMax
                    );
                    Vector2D internalWaveVector = WeatherInterpolationUtil.bilinearInterpolation(internalWaveGrid, lat, lon);
                    result.setInternalWave(WeatherInterpolationUtil.calculateSpeedAndDirection(internalWaveVector));
                }
            }
            
            log.info("点查询完成: wind={}, wave={}, current={}, internalWave={}", 
                    result.getWind() != null, result.getWave() != null, result.getCurrent() != null, result.getInternalWave() != null);
            
        } catch (Exception e) {
            log.error("查询点气象数据失败", e);
            throw new RuntimeException("查询点气象数据失败", e);
        }
        
        return result;
    }
    
    /**
     * 查询指定点的气象时间序列数据（用于详情面板）
     * 
     * @param lat 纬度
     * @param lon 经度
     * @param startIndex 起始时间索引（可选，默认0）
     * @param count 查询数量（可选，默认24，最大48）
     * @return 时间序列数据
     */
    public WeatherTimeSeriesDTO queryPointWeatherTimeSeries(double lat, double lon, Integer startIndex, Integer count) {
        log.info("查询点气象时间序列: lat={}, lon={}, startIndex={}, count={}", lat, lon, startIndex, count);
        
        if (startIndex == null) {
            startIndex = 0;
        }
        if (count == null) {
            count = 24;
        }
        // 限制最大查询数量
        if (count > 48) {
            count = 48;
        }
        
        WeatherTimeSeriesDTO result = new WeatherTimeSeriesDTO();
        result.setLocation(new WeatherTimeSeriesDTO.LocationInfo(lat, lon));
        
        List<WeatherTimeSeriesDTO.TimeStepData> timeSteps = new java.util.ArrayList<>();
        
        try {
            // 获取元数据
            WeatherMetadata windMetadata = metadataRepository.findByDataType_TypeCode("wind").orElse(null);
            WeatherMetadata waveMetadata = metadataRepository.findByDataType_TypeCode("wave").orElse(null);
            WeatherMetadata currentMetadata = metadataRepository.findByDataType_TypeCode("ocean_current").orElse(null);
            InternalWaveMetadata internalWaveMetadata = internalWaveMetadataRepository.findByType("internal_wave").orElse(null);
            
            // 确定实际可查询的时间范围
            int maxFrames = Integer.MAX_VALUE;
            if (windMetadata != null) {
                maxFrames = Math.min(maxFrames, windMetadata.getTotalFrames());
            }
            if (waveMetadata != null) {
                maxFrames = Math.min(maxFrames, waveMetadata.getTotalFrames());
            }
            if (currentMetadata != null) {
                maxFrames = Math.min(maxFrames, currentMetadata.getTotalFrames());
            }
            if (internalWaveMetadata != null) {
                maxFrames = Math.min(maxFrames, internalWaveMetadata.getFrames());
            }
            
            int endIndex = Math.min(startIndex + count, maxFrames);
            
            // 遍历每个时间步骤
            for (int timeIndex = startIndex; timeIndex < endIndex; timeIndex++) {
                WeatherTimeSeriesDTO.TimeStepData stepData = new WeatherTimeSeriesDTO.TimeStepData();
                stepData.setTimeIndex(timeIndex);
                
                // 查询风场数据
                if (windMetadata != null) {
                    WindData windData = windDataRepository
                            .findByMetadataAndTimeIndex(windMetadata, timeIndex)
                            .orElse(null);
                    if (windData != null) {
                        GridData windGrid = WeatherInterpolationUtil.parseBinaryData(
                                windData.getUComponent(),
                                windData.getVComponent(),
                                windMetadata.getGridLonSize(),
                                windMetadata.getGridLatSize(),
                                windMetadata.getGridLonMin().doubleValue(),
                                windMetadata.getGridLatMin().doubleValue(),
                                windMetadata.getGridLonMax().doubleValue(),
                                windMetadata.getGridLatMax().doubleValue()
                        );
                        Vector2D windVector = WeatherInterpolationUtil.bilinearInterpolation(windGrid, lat, lon);
                        WeatherTimeSeriesDTO.WeatherVector wind = new WeatherTimeSeriesDTO.WeatherVector(
                                windVector.getU(),
                                windVector.getV(),
                                Math.sqrt(windVector.getU() * windVector.getU() + windVector.getV() * windVector.getV()),
                                Math.toDegrees(Math.atan2(windVector.getU(), windVector.getV()))
                        );
                        stepData.setWind(wind);
                    }
                }
                
                // 查询波浪数据
                if (waveMetadata != null) {
                    WaveData waveData = waveDataRepository
                            .findByMetadataAndTimeIndex(waveMetadata, timeIndex)
                            .orElse(null);
                    if (waveData != null) {
                        GridData waveGrid = WeatherInterpolationUtil.parseBinaryData(
                                waveData.getUComponent(),
                                waveData.getVComponent(),
                                waveMetadata.getGridLonSize(),
                                waveMetadata.getGridLatSize(),
                                waveMetadata.getGridLonMin().doubleValue(),
                                waveMetadata.getGridLatMin().doubleValue(),
                                waveMetadata.getGridLonMax().doubleValue(),
                                waveMetadata.getGridLatMax().doubleValue()
                        );
                        Vector2D waveVector = WeatherInterpolationUtil.bilinearInterpolation(waveGrid, lat, lon);
                        
                        // 获取波高
                        Double height = null;
                        if (waveData.getWaveHeight() != null) {
                            GridData heightGrid = WeatherInterpolationUtil.parseBinaryDataSingleChannel(
                                    waveData.getWaveHeight(),
                                    waveMetadata.getGridLonSize(),
                                    waveMetadata.getGridLatSize(),
                                    waveMetadata.getGridLonMin().doubleValue(),
                                    waveMetadata.getGridLatMin().doubleValue(),
                                    waveMetadata.getGridLonMax().doubleValue(),
                                    waveMetadata.getGridLatMax().doubleValue()
                            );
                            height = WeatherInterpolationUtil.bilinearInterpolationSingleValue(heightGrid, lat, lon);
                        }
                        
                        WeatherTimeSeriesDTO.WaveData wave = new WeatherTimeSeriesDTO.WaveData(
                                waveVector.getU(),
                                waveVector.getV(),
                                Math.sqrt(waveVector.getU() * waveVector.getU() + waveVector.getV() * waveVector.getV()),
                                Math.toDegrees(Math.atan2(waveVector.getU(), waveVector.getV())),
                                height
                        );
                        stepData.setWave(wave);
                    }
                }
                
                // 查询洋流数据
                if (currentMetadata != null) {
                    OceanCurrentData currentData = currentDataRepository
                            .findByMetadataAndTimeIndex(currentMetadata, timeIndex)
                            .orElse(null);
                    if (currentData != null) {
                        GridData currentGrid = WeatherInterpolationUtil.parseBinaryData(
                                currentData.getUComponent(),
                                currentData.getVComponent(),
                                currentMetadata.getGridLonSize(),
                                currentMetadata.getGridLatSize(),
                                currentMetadata.getGridLonMin().doubleValue(),
                                currentMetadata.getGridLatMin().doubleValue(),
                                currentMetadata.getGridLonMax().doubleValue(),
                                currentMetadata.getGridLatMax().doubleValue()
                        );
                        Vector2D currentVector = WeatherInterpolationUtil.bilinearInterpolation(currentGrid, lat, lon);
                        WeatherTimeSeriesDTO.WeatherVector current = new WeatherTimeSeriesDTO.WeatherVector(
                                currentVector.getU(),
                                currentVector.getV(),
                                Math.sqrt(currentVector.getU() * currentVector.getU() + currentVector.getV() * currentVector.getV()),
                                Math.toDegrees(Math.atan2(currentVector.getU(), currentVector.getV()))
                        );
                        stepData.setCurrent(current);
                    }
                }
                
                // 查询内波数据
                if (internalWaveMetadata != null) {
                    InternalWaveData internalWaveData = internalWaveDataRepository
                            .findByTimeIndex(timeIndex)
                            .orElse(null);
                    if (internalWaveData != null) {
                        Map<String, Object> gridData = internalWaveMetadata.getGridData();
                        int lonSize = ((Number) gridData.get("lonSize")).intValue();
                        int latSize = ((Number) gridData.get("latSize")).intValue();
                        double lonMin = ((Number) gridData.get("lonMin")).doubleValue();
                        double latMin = ((Number) gridData.get("latMin")).doubleValue();
                        double lonMax = ((Number) gridData.get("lonMax")).doubleValue();
                        double latMax = ((Number) gridData.get("latMax")).doubleValue();
                        
                        GridData internalWaveGrid = WeatherInterpolationUtil.parseBinaryData(
                                internalWaveData.getUData(),
                                internalWaveData.getVData(),
                                lonSize,
                                latSize,
                                lonMin,
                                latMin,
                                lonMax,
                                latMax
                        );
                        Vector2D internalWaveVector = WeatherInterpolationUtil.bilinearInterpolation(internalWaveGrid, lat, lon);
                        WeatherTimeSeriesDTO.WeatherVector internalWave = new WeatherTimeSeriesDTO.WeatherVector(
                                internalWaveVector.getU(),
                                internalWaveVector.getV(),
                                Math.sqrt(internalWaveVector.getU() * internalWaveVector.getU() + internalWaveVector.getV() * internalWaveVector.getV()),
                                Math.toDegrees(Math.atan2(internalWaveVector.getU(), internalWaveVector.getV()))
                        );
                        stepData.setInternalWave(internalWave);
                    }
                }
                
                timeSteps.add(stepData);
            }
            
            result.setTimeSteps(timeSteps);
            log.info("时间序列查询完成: 共{}个时间点", timeSteps.size());
            
        } catch (Exception e) {
            log.error("查询气象时间序列失败", e);
            throw new RuntimeException("查询气象时间序列失败", e);
        }
        
        return result;
    }
}