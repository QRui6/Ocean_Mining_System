package com.oceanmining.monitoring.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 统一API响应格式
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    /**
     * 是否成功
     */
    private Boolean success;
    
    /**
     * 响应数据
     */
    private T data;
    
    /**
     * 错误信息
     */
    private String error;
    
    /**
     * 时间戳
     */
    private Long timestamp;
    
    // Constructors
    public ApiResponse() {}
    
    public ApiResponse(Boolean success, T data, String error, Long timestamp) {
        this.success = success;
        this.data = data;
        this.error = error;
        this.timestamp = timestamp;
    }
    
    // Getters and Setters
    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean success) { this.success = success; }
    
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    
    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
    
    /**
     * 成功响应
     */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setData(data);
        response.setTimestamp(System.currentTimeMillis());
        return response;
    }
    
    /**
     * 成功响应（无数据）
     */
    public static <T> ApiResponse<T> success() {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setTimestamp(System.currentTimeMillis());
        return response;
    }
    
    /**
     * 错误响应
     */
    public static <T> ApiResponse<T> error(String error) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setError(error);
        response.setTimestamp(System.currentTimeMillis());
        return response;
    }
    
    /**
     * 错误响应（带异常）
     */
    public static <T> ApiResponse<T> error(Exception e) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setError(e.getMessage());
        response.setTimestamp(System.currentTimeMillis());
        return response;
    }
}
