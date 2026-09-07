package com.oceanmining.monitoring.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * 船舶监控WebSocket处理器
 * 用于实时推送船舶进入/离开、预警等消息到前端
 */
@Component
public class ShipMonitoringWebSocketHandler extends TextWebSocketHandler {
    
    private static final Logger log = LoggerFactory.getLogger(ShipMonitoringWebSocketHandler.class);
    private final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());
    private final ObjectMapper objectMapper;

    public ShipMonitoringWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("✅ 客户端连接: {}, 当前连接数: {}", session.getId(), sessions.size());
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        log.info("❌ 客户端断开: {}, 当前连接数: {}", session.getId(), sessions.size());
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        log.debug("收到客户端消息 [{}]: {}", session.getId(), message.getPayload());
        // 可以处理客户端发送的消息，例如订阅特定区域的更新
    }
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket传输错误 [{}]: {}", session.getId(), exception.getMessage());
        if (session.isOpen()) {
            session.close();
        }
        sessions.remove(session);
    }
    
    /**
     * 广播消息到所有连接的客户端
     */
    public void broadcast(Object message) {
        if (sessions.isEmpty()) {
            log.debug("没有连接的客户端，跳过广播");
            return;
        }
        
        try {
            String json = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(json);
            
            synchronized (sessions) {
                sessions.forEach(session -> {
                    if (session.isOpen()) {
                        try {
                            session.sendMessage(textMessage);
                        } catch (IOException e) {
                            log.error("发送消息失败 [{}]: {}", session.getId(), e.getMessage());
                        }
                    }
                });
            }
            
            log.debug("📡 广播消息到 {} 个客户端", sessions.size());
        } catch (Exception e) {
            log.error("广播消息失败: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 发送消息到指定客户端
     */
    public void sendToSession(String sessionId, Object message) {
        sessions.stream()
                .filter(s -> s.getId().equals(sessionId))
                .findFirst()
                .ifPresent(session -> {
                    try {
                        String json = objectMapper.writeValueAsString(message);
                        session.sendMessage(new TextMessage(json));
                        log.debug("发送消息到客户端 [{}]", sessionId);
                    } catch (IOException e) {
                        log.error("发送消息失败 [{}]: {}", sessionId, e.getMessage());
                    }
                });
    }
    
    /**
     * 获取当前连接数
     */
    public int getConnectionCount() {
        return sessions.size();
    }
}
