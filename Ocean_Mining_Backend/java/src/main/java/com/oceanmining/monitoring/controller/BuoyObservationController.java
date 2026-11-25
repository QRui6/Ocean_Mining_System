package com.oceanmining.monitoring.controller;
import com.fasterxml.jackson.databind.*;
import com.oceanmining.monitoring.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.LocalDate;
import java.util.*;
@RestController @RequestMapping("/api/buoy-observations") @DependsOn("monitoringSchema")
public class BuoyObservationController {
    @org.springframework.beans.factory.annotation.Value("${buoy.flux-test.latitude:${BUOY_FLUX_TEST_LATITUDE:}}")
    private String latitude;
    @org.springframework.beans.factory.annotation.Value("${buoy.flux-test.longitude:${BUOY_FLUX_TEST_LONGITUDE:}}")
    private String longitude;
    @org.springframework.beans.factory.annotation.Value("${buoy.flux-test.mooring-depth-m:${BUOY_FLUX_TEST_MOORING_DEPTH_M:}}")
    private String mooringDepth;
    private final JdbcTemplate db;private final ObjectMapper json;
    public BuoyObservationController(JdbcTemplate db,ObjectMapper json){this.db=db;this.json=json;}
    private JsonNode parse(String text){try{return json.readTree(text);}catch(Exception e){throw new IllegalArgumentException(e);}}
    @GetMapping("/{station}/manifest") public Object manifest(@PathVariable String station){
        var result=(com.fasterxml.jackson.databind.node.ObjectNode)parse(db.queryForObject("SELECT manifest::text FROM buoy_test_imports WHERE station_id=?",String.class,station));
        if("deepsea-flux-test".equals(station)) {
            if(!latitude.isBlank() && !longitude.isBlank()) {
                double lat=Double.parseDouble(latitude),lon=Double.parseDouble(longitude);
                if(!Double.isFinite(lat)||!Double.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new IllegalArgumentException("浮标经纬度配置无效");
                result.putObject("location").put("latitude",lat).put("longitude",lon);
            }
            if(!mooringDepth.isBlank()) {
                double depth=Double.parseDouble(mooringDepth);
                if(!Double.isFinite(depth)||depth<=0)throw new IllegalArgumentException("浮标系泊深度配置无效");
                result.put("mooringDepthM",depth);
            }
        }
        return ApiResponse.success(result);
    }
    @GetMapping("/{station}/days/{day}") public Object observations(@PathVariable String station,@PathVariable LocalDate day){
        return ApiResponse.success(db.query("SELECT observed_at,device_time,values_json::text,quality::text,source_file,source_line FROM buoy_test_observations WHERE station_id=? AND observed_at>=? AND observed_at<? ORDER BY observed_at,source_file,source_line",(rs,n)->{
            Map<String,Object> row=new LinkedHashMap<>();row.put("time",rs.getTimestamp(1).toLocalDateTime().toString().replace('T',' '));row.put("deviceTime",rs.getTimestamp(2)==null?null:rs.getTimestamp(2).toLocalDateTime().toString());row.put("values",parse(rs.getString(3)));row.put("invalid",parse(rs.getString(4)).path("invalid"));row.put("source",rs.getString(5));row.put("line",rs.getInt(6));return row;
        },station,day.atStartOfDay(),day.plusDays(1).atStartOfDay()));
    }
    @GetMapping("/{station}/attitudes/{day}") public Object attitudes(@PathVariable String station,@PathVariable LocalDate day){
        return ApiResponse.success(db.query("SELECT observed_at,decoded::text,quality::text,raw_hex,source_file,source_line FROM buoy_test_attitudes WHERE station_id=? AND observed_at>=? AND observed_at<? ORDER BY observed_at",(rs,n)->Map.of("time",rs.getTimestamp(1).toLocalDateTime().toString().replace('T',' '),"decoded",parse(rs.getString(2)),"quality",parse(rs.getString(3)),"raw",rs.getString(4),"source",rs.getString(5),"line",rs.getInt(6)),station,day.atStartOfDay(),day.plusDays(1).atStartOfDay()));
    }
}
