package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.request.WebhookRequest;
import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.service.WebhookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Webhook接收控制器
 */
@RestController
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    private final WebhookService webhookService;

    @Autowired
    public WebhookController(WebhookService webhookService) {
        this.webhookService = webhookService;
    }

    /**
     * 接收船讯网Webhook推送
     */
    @PostMapping("/webhook/area")
    public ApiResponse<String> handleWebhook(@RequestBody WebhookRequest request) {
        log.info("收到Webhook推送: area_id={}, event_type={}, mmsi={}", 
                request.getAreaId(), request.getEventType(), request.getMmsi());
        
        webhookService.handleWebhook(request);
        return ApiResponse.success("事件已处理");
    }
}
