package com.oceanmining.monitoring.controller;
import com.oceanmining.monitoring.service.TyphoonForecastService;
import com.oceanmining.monitoring.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/typhoon-forecast")
public class TyphoonForecastController {
    private final TyphoonForecastService service;
    public TyphoonForecastController(TyphoonForecastService service){this.service=service;}
    @GetMapping public Object latest(@RequestParam(required=false) String areaId){return ApiResponse.success(service.latest(areaId));}
    @PostMapping("/refresh") public Object refresh(){service.refresh();return ApiResponse.success(Map.of("loading",true));}
}
