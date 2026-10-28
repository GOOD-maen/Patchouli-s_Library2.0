package com.mmc.collection.config;

import com.mmc.collection.common.storage.StorageProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Path;

/**
 * 清理 uploads/temp 下超过配置 TTL 的临时文件。
 * 只处理 temp 目录，正式目录由 AdminService 的“打扫站点”负责。
 */
@Component
public class TempImageCleanupTask {

    private static final Logger logger = LoggerFactory.getLogger(TempImageCleanupTask.class);

    private final StorageProperties storageProperties;

    public TempImageCleanupTask(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    public void cleanOnStartup() {
        clean();
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void scheduledClean() {
        clean();
    }

    public int clean() {
        Path tempPath = storageProperties.root().resolve("temp");
        File tempDir = tempPath.toFile();
        if (!tempDir.isDirectory()) {
            return 0;
        }

        long threshold = System.currentTimeMillis() - storageProperties.getTempTtl().toMillis();
        int deletedCount = 0;
        File[] files = tempDir.listFiles();
        if (files == null) {
            return 0;
        }
        for (File file : files) {
            if (file.isFile() && file.lastModified() < threshold) {
                if (file.delete()) {
                    logger.info("删除过期临时文件: {}", file.getName());
                    deletedCount++;
                } else {
                    logger.warn("删除临时文件失败: {}", file.getName());
                }
            }
        }
        if (deletedCount > 0) {
            logger.info("临时文件清理完成，共删除 {} 个文件", deletedCount);
        }
        return deletedCount;
    }
}
