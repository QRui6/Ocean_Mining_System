package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.AvailableIndicesDTO;
import com.oceanmining.monitoring.dto.response.WeatherDataDTO;
import com.oceanmining.monitoring.dto.response.WeatherMetadataDTO;
import com.oceanmining.monitoring.entity.InternalWaveData;
import com.oceanmining.monitoring.entity.InternalWaveMetadata;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.repository.InternalWaveDataRepository;
import com.oceanmining.monitoring.repository.InternalWaveMetadataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;
import java.util.Map;

/**
 * 内波数据服务
 */
@Service
@Transactional(readOnly = true)
public class InternalWaveDataService {
    
    private static final Logger log = LoggerFactory.getLogger(InternalWaveDataService.class);
    private static final String TYPE = "internal_wave";
    
    private final InternalWaveMetadataRepository metadataRepository;
    private final InternalWaveDataRepository dataRepository;
    
    @Autowired
    public InternalWaveDataService(
            InternalWaveMetadataRepository metadataRepository,
            InternalWaveDataRepository dataRepository) {
        this.metadataRepository = metadataRepository;
        this.dataRepository = dataRepository;
    }
    
    /**
     * 获取内波元数据
     */
    @Cacheable(value = "weatherMetadata", key = "'internal_wave'")
    public WeatherMetadataDTO getMetadata() {
        log.info("获取内波元数据");
        
        InternalWaveMetadata metadata = metadataRepository
                .findByType(TYPE)
                .orElseThrow(() -> new ResourceNotFoundException("未找到内波元数据"));
        
        return convertToDTO(metadata);
    }
    
    /**
     * 获取内波数据
     */
    @Cacheable(value = "weatherData", key = "'internal_wave_' + #timeIndex")
    public WeatherDataDTO getData(Integer timeIndex) {
        log.info("获取内波数据: timeIndex={}", timeIndex);
        
        InternalWaveData data = dataRepository
                .findByTimeIndex(timeIndex)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("未找到内波数据: timeIndex=%d", timeIndex)));
        
        return convertToWeatherDataDTO(data);
    }
    
    /**
     * 获取可用的时间索引列表
     */
    @Cacheable(value = "availableIndices", key = "'internal_wave'")
    public AvailableIndicesDTO getAvailableIndices() {
        log.info("获取内波可用时间索引");
        
        List<Integer> indices = dataRepository.findAllTimeIndices();
        long totalFrames = dataRepository.countByTimeIndexIsNotNull();
        
        return new AvailableIndicesDTO(TYPE, indices, (int) totalFrames);
    }
    
    /**
     * 转换元数据为DTO
     */
    private WeatherMetadataDTO convertToDTO(InternalWaveMetadata metadata) {
        WeatherMetadataDTO dto = new WeatherMetadataDTO();
        dto.setId(metadata.getId());
        dto.setType(metadata.getType());
        dto.setDataSource(metadata.getDataSource());
        dto.setStartTime(metadata.getStartTime().toString());
        dto.setTimeStepHours(metadata.getTimeStepHours());
        dto.setFrames(metadata.getFrames());
        
        // 解析grid数据
        Map<String, Object> gridData = metadata.getGridData();
        WeatherMetadataDTO.GridInfo grid = new WeatherMetadataDTO.GridInfo();
        grid.setLonSize(((Number) gridData.get("lonSize")).intValue());
        grid.setLatSize(((Number) gridData.get("latSize")).intValue());
        grid.setLonMin(((Number) gridData.get("lonMin")).doubleValue());
        grid.setLatMin(((Number) gridData.get("latMin")).doubleValue());
        grid.setLonMax(((Number) gridData.get("lonMax")).doubleValue());
        grid.setLatMax(((Number) gridData.get("latMax")).doubleValue());
        grid.setLonStep(((Number) gridData.get("lonStep")).doubleValue());
        grid.setLatStep(((Number) gridData.get("latStep")).doubleValue());
        
        dto.setGrid(grid);
        
        return dto;
    }
    
    /**
     * 转换数据为WeatherDataDTO
     */
    private WeatherDataDTO convertToWeatherDataDTO(InternalWaveData data) {
        WeatherDataDTO dto = new WeatherDataDTO();
        dto.setTimeIndex(data.getTimeIndex());
        dto.setWidth(data.getWidth());
        dto.setHeight(data.getHeight());
        
        // 转换U分量
        float[] uArray = bytesToFloatArray(data.getUData());
        WeatherDataDTO.ComponentData uComponent = new WeatherDataDTO.ComponentData();
        uComponent.setArray(uArray);
        uComponent.setMin(data.getUMin());
        uComponent.setMax(data.getUMax());
        dto.setU(uComponent);
        
        // 转换V分量
        float[] vArray = bytesToFloatArray(data.getVData());
        WeatherDataDTO.ComponentData vComponent = new WeatherDataDTO.ComponentData();
        vComponent.setArray(vArray);
        vComponent.setMin(data.getVMin());
        vComponent.setMax(data.getVMax());
        dto.setV(vComponent);
        
        log.info("内波数据转换完成: timeIndex={}, uLength={}, vLength={}", 
                data.getTimeIndex(), uArray.length, vArray.length);
        
        return dto;
    }
    
    /**
     * 将字节数组转换为float数组
     */
    private float[] bytesToFloatArray(byte[] bytes) {
        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        float[] floats = new float[bytes.length / 4];
        for (int i = 0; i < floats.length; i++) {
            floats[i] = buffer.getFloat();
        }
        return floats;
    }
    
    /**
     * 获取内波数据（二进制格式）
     */
    @Cacheable(value = "weatherDataBinary", key = "'internal_wave_' + #timeIndex")
    public byte[] getDataBinary(Integer timeIndex) {
        log.info("获取内波数据(二进制): timeIndex={}", timeIndex);
        
        // 获取元数据
        InternalWaveMetadata metadata = metadataRepository
                .findByType(TYPE)
                .orElseThrow(() -> new ResourceNotFoundException("未找到内波元数据"));
        
        // 获取数据
        InternalWaveData data = dataRepository
                .findByTimeIndex(timeIndex)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("未找到内波数据: timeIndex=%d", timeIndex)));
        
        try {
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            
            // 构建 header
            StringBuilder headerJson = new StringBuilder();
            headerJson.append("{");
            headerJson.append("\"width\":").append(data.getWidth()).append(",");
            headerJson.append("\"height\":").append(data.getHeight()).append(",");
            headerJson.append("\"uMin\":").append(data.getUMin()).append(",");
            headerJson.append("\"uMax\":").append(data.getUMax()).append(",");
            headerJson.append("\"vMin\":").append(data.getVMin()).append(",");
            headerJson.append("\"vMax\":").append(data.getVMax()).append(",");
            
            Map<String, Object> gridData = metadata.getGridData();
            headerJson.append("\"bounds\":{");
            headerJson.append("\"west\":").append(gridData.get("lonMin")).append(",");
            headerJson.append("\"south\":").append(gridData.get("latMin")).append(",");
            headerJson.append("\"east\":").append(gridData.get("lonMax")).append(",");
            headerJson.append("\"north\":").append(gridData.get("latMax"));
            headerJson.append("}");
            headerJson.append("}");
            
            byte[] headerBytes = headerJson.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            
            // 计算 padding
            int headerLength = headerBytes.length;
            int totalHeaderSize = 4 + headerLength;
            int padding = (4 - (totalHeaderSize % 4)) % 4;
            
            // 写入 header 长度
            ByteBuffer headerLengthBuffer = ByteBuffer.allocate(4);
            headerLengthBuffer.putInt(headerLength);
            baos.write(headerLengthBuffer.array());
            
            // 写入 header 内容
            baos.write(headerBytes);
            
            // 写入 padding
            for (int i = 0; i < padding; i++) {
                baos.write(0);
            }
            
            // 写入 U 和 V 数据
            baos.write(data.getUData());
            baos.write(data.getVData());
            
            byte[] result = baos.toByteArray();
            log.info("内波二进制数据构建完成: 总大小={}MB", result.length / 1024.0 / 1024.0);
            
            return result;
            
        } catch (java.io.IOException e) {
            log.error("构建内波二进制数据失败", e);
            throw new RuntimeException("构建内波二进制数据失败", e);
        }
    }
}
