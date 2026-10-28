package com.mmc.collection.common.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;

/**
 * 上传相关配置，对应 application.yml 中的 {@code file.*}。
 */
@Component
@ConfigurationProperties(prefix = "file")
public class StorageProperties {

    /** 上传根目录，支持相对路径（相对启动工作目录） */
    private String uploadDir = "uploads";

    /** 单文件大小上限 */
    private DataSize maxSize = DataSize.ofMegabytes(5);

    /** 临时文件保留时长 */
    private Duration tempTtl = Duration.ofHours(24);

    /** 是否允许上传 SVG（默认关闭，避免同源存储型 XSS） */
    private boolean allowSvg = false;

    /** 解析为绝对路径，所有读写都必须基于它做越界校验 */
    public Path root() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String getUploadDir() {
        return uploadDir;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public DataSize getMaxSize() {
        return maxSize;
    }

    public void setMaxSize(DataSize maxSize) {
        this.maxSize = maxSize;
    }

    public Duration getTempTtl() {
        return tempTtl;
    }

    public void setTempTtl(Duration tempTtl) {
        this.tempTtl = tempTtl;
    }

    public boolean isAllowSvg() {
        return allowSvg;
    }

    public void setAllowSvg(boolean allowSvg) {
        this.allowSvg = allowSvg;
    }
}
