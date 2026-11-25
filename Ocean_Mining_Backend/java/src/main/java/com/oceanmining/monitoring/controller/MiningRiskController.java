package com.oceanmining.monitoring.controller;
import com.oceanmining.monitoring.service.MiningRiskService;
import com.oceanmining.monitoring.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/mining-risk")
public class MiningRiskController {
    private final MiningRiskService service;
    public MiningRiskController(MiningRiskService service){this.service=service;}
    @GetMapping("/rules") public Object rules(){return ApiResponse.success(service.rules());}
    @PostMapping("/areas/{areaId}/runs") public Object start(@PathVariable String areaId){return ApiResponse.success(Map.of("id",service.start(areaId)));}
    @GetMapping("/runs/{id}") public Object run(@PathVariable UUID id){return ApiResponse.success(service.run(id));}
    @GetMapping("/areas/{areaId}/latest") public Object latest(@PathVariable String areaId){return ApiResponse.success(service.latest(areaId));}
    @GetMapping("/events") public Object events(@RequestParam(required=false) String areaId){return ApiResponse.success(service.events(areaId));}
    @PostMapping("/events/{id}/acknowledgement") public Object acknowledge(@PathVariable long id){return ApiResponse.success(service.acknowledge(id));}
    @GetMapping("/events/{id}/versions") public Object versions(@PathVariable long id){return ApiResponse.success(service.versions(id));}
}
