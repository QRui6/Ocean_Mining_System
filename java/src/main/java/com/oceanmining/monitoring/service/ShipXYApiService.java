package com.oceanmining.monitoring.service;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 船讯网API服务
 * 负责与ShipXY API交互
 */
@Service
public class ShipXYApiService {
    
    private static final Logger log = LoggerFactory.getLogger(ShipXYApiService.class);

    private final RestTemplate restTemplate;

    @Value("${shipxy.api.base-url}")
    private String baseUrl;

    @Value("${shipxy.api.api-key}")
    private String apiKey;

    @Value("${webhook.public-url}${webhook.path}")
    private String webhookUrl;

    public ShipXYApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * 创建监控区域
     */
    public String addArea(String areaName, List<List<Double>> polygon) {
        try {
            // 转换为船讯网要求的字符串格式: "lng,lat-lng,lat-lng,lat"
            String areaBoundsStr = polygon.stream()
                    .map(coord -> coord.get(0) + "," + coord.get(1))
                    .reduce((a, b) -> a + "-" + b)
                    .orElse("");

            Map<String, Object> request = new HashMap<>();
            request.put("key", apiKey);
            request.put("area_name", areaName);
            request.put("area_bounds", areaBoundsStr);
            request.put("url", webhookUrl);
            request.put("filter_type", 1); // 全部船舶

            log.info("调用船讯网API创建区域: {}", areaName);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(
                    baseUrl + "/apicall/v3/AddArea",
                    entity,
                    String.class
            );

            JSONObject jsonResponse = JSONUtil.parseObj(response);
            if (jsonResponse.getInt("status") != 0) {
                throw new RuntimeException("船讯网API返回错误: " + jsonResponse.getStr("message"));
            }

            String areaId = jsonResponse.getJSONObject("data").getStr("area_id");
            log.info("区域创建成功, area_id: {}", areaId);
            return areaId;

        } catch (Exception e) {
            log.error("调用船讯网AddArea API失败", e);
            throw new RuntimeException("创建区域失败: " + e.getMessage());
        }
    }

    /**
     * 删除监控区域
     */
    public void deleteArea(String areaId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("key", apiKey);
            request.put("area_id", areaId);

            log.info("调用船讯网API删除区域: {}", areaId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(
                    baseUrl + "/apicall/v3/DeleteArea",
                    entity,
                    String.class
            );

            JSONObject jsonResponse = JSONUtil.parseObj(response);
            if (jsonResponse.getInt("status") != 0) {
                throw new RuntimeException("船讯网API返回错误: " + jsonResponse.getStr("message"));
            }

            log.info("区域删除成功");

        } catch (Exception e) {
            log.error("调用船讯网DeleteArea API失败", e);
            throw new RuntimeException("删除区域失败: " + e.getMessage());
        }
    }

    /**
     * 获取单个船舶信息
     */
    public JSONObject getShipInfo(String mmsi) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("key", apiKey);
            request.put("mmsi", mmsi);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(
                    baseUrl + "/apicall/v3/GetSingleShip",
                    entity,
                    String.class
            );

            JSONObject jsonResponse = JSONUtil.parseObj(response);
            if (jsonResponse.getInt("status") == 0) {
                return jsonResponse.getJSONObject("data");
            } else {
                log.warn("获取船舶信息失败: {}", jsonResponse.getStr("message"));
                return createDefaultShipInfo(mmsi);
            }

        } catch (Exception e) {
            log.error("获取船舶信息失败: {}", mmsi, e);
            return createDefaultShipInfo(mmsi);
        }
    }

    /**
     * 获取位置气象数据
     */
    public JSONObject getWeatherByPoint(double lat, double lng) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("key", apiKey);
            request.put("lat", lat);
            request.put("lng", lng);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(
                    baseUrl + "/apicall/v3/GetWeatherByPoint",
                    entity,
                    String.class
            );

            JSONObject jsonResponse = JSONUtil.parseObj(response);
            if (jsonResponse.getInt("status") == 0) {
                return jsonResponse.getJSONObject("data");
            } else {
                log.warn("获取气象数据失败: {}", jsonResponse.getStr("message"));
                return createDefaultWeather();
            }

        } catch (Exception e) {
            log.error("获取气象数据失败: lat={}, lng={}", lat, lng, e);
            return createDefaultWeather();
        }
    }

    private JSONObject createDefaultShipInfo(String mmsi) {
        JSONObject defaultInfo = new JSONObject();
        defaultInfo.set("mmsi", mmsi);
        defaultInfo.set("ship_name", "Unknown");
        defaultInfo.set("ship_cnname", "未知船舶");
        return defaultInfo;
    }

    private JSONObject createDefaultWeather() {
        JSONObject defaultWeather = new JSONObject();
        defaultWeather.set("windspeed", 0);
        defaultWeather.set("winddir", "N");
        defaultWeather.set("waveheight", 0);
        defaultWeather.set("temperature", 0);
        return defaultWeather;
    }
}
