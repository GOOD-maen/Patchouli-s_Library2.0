package com.mmc.collection.common.storage;

import org.springframework.http.HttpStatus;

/**
 * 文件存储相关异常，由全局异常处理器转换为统一的 JSON 响应。
 */
public class StorageException extends RuntimeException {

    private final HttpStatus status;

    public StorageException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public StorageException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
