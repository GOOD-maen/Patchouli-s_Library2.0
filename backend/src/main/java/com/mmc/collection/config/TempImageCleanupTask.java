package com.mmc.collection.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


import java.io.File;

@Component
@EnableScheduling
public class TempImageCleanupTask {
    private static final Logger logger = LoggerFactory.getLogger(TempImageCleanupTask.class);
    private static final long EXPIRATION_HOURS = 1; // 过期时间1小时
    private static final long EXPIRATION_MINUTES = 10;
    @PostConstruct
    public void cleanOnStartup() {
        clean();
    }

    @Scheduled(cron = "0 */10 * * * ?") // 每小时执行一次
    public void scheduledClean() {
        clean();
    }

    private void clean() {
        String projectRoot = System.getProperty("user.dir");
        File tempDir = new File(projectRoot + "/uploads/temp/");
        if (!tempDir.exists()) return;


        long threshold = System.currentTimeMillis() - EXPIRATION_MINUTES * 60 * 1000L;
        int deletedCount = 0;
        File[] files = tempDir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile() && file.lastModified() < threshold) {
                    if (file.delete()) {
                        logger.info("删除过期临时文件: {}", file.getName());
                        deletedCount++;
                    } else {
                        logger.warn("删除失败: {}", file.getName());
                    }
                }
            }
        }
        if (deletedCount > 0) {
            logger.info("临时文件清理完成，共删除 {} 个文件", deletedCount);
        } else {
            logger.debug("没有需要清理的过期临时文件");
        }
    }
}