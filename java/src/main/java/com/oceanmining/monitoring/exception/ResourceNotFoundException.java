package com.oceanmining.monitoring.exception;

/**
 * 资源未找到异常
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
public class ResourceNotFoundException extends RuntimeException {
    
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
