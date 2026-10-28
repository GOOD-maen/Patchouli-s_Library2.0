package com.mmc.collection.modules.admin.service.impl;

import com.mmc.collection.common.storage.StorageProperties;
import com.mmc.collection.config.AppConfig;
import com.mmc.collection.modules.admin.service.AdminService;
import com.mmc.collection.modules.essay.dao.EssayDAO;
import com.mmc.collection.modules.essay.entity.EssayDO;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.entity.UserDO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private static final Pattern MARKDOWN_IMAGE_PATTERN = Pattern.compile("!\\[.*?\\]\\((.*?)\\)");
    private static final String URL_PREFIX = "uploads/";
    private static final String TEMP_PREFIX = "uploads/temp/";

    private final EssayDAO essayDAO;
    private final UserDAO userDAO;
    private final StorageProperties storageProperties;
    private final AppConfig appConfig;

    @Override
    public int deleteUnusedImages() {
        // 1. 收集所有被引用的图片路径，并把默认资源视为受保护
        Set<String> referencedPaths = new HashSet<>(protectedAssets());

        List<EssayDO> allEssays = essayDAO.findAll();
        for (EssayDO essay : allEssays) {
            referencedPaths.add(convertToRelativePath(essay.getCoverUrl()));
            String content = essay.getContent();
            if (content != null) {
                Matcher matcher = MARKDOWN_IMAGE_PATTERN.matcher(content);
                while (matcher.find()) {
                    referencedPaths.add(convertToRelativePath(matcher.group(1)));
                }
            }
        }

        List<UserDO> allUsers = userDAO.findAll();
        for (UserDO user : allUsers) {
            referencedPaths.add(convertToRelativePath(user.getAvatar()));
            referencedPaths.add(convertToRelativePath(user.getBackgroundImage()));
        }

        // 2. 遍历上传根目录，删除未被引用且不在 temp 下的文件
        Path uploadsRoot = storageProperties.root();
        if (!Files.isDirectory(uploadsRoot)) {
            return 0;
        }

        int deletedCount = 0;
        try (Stream<Path> walk = Files.walk(uploadsRoot)) {
            List<Path> allFiles = walk.filter(Files::isRegularFile).collect(Collectors.toList());
            for (Path filePath : allFiles) {
                String relative = URL_PREFIX + uploadsRoot.relativize(filePath).toString().replace('\\', '/');
                if (relative.startsWith(TEMP_PREFIX)) {
                    // 草稿期的临时文件由 TempImageCleanupTask 按 TTL 处理
                    continue;
                }
                if (referencedPaths.contains(relative)) {
                    continue;
                }
                if (Files.deleteIfExists(filePath)) {
                    deletedCount++;
                    System.out.println("删除未使用图片: " + relative);
                } else {
                    System.err.println("删除失败: " + relative);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return deletedCount;
    }

    /**
     * 这些文件即使暂时没有被数据库引用也不能删：
     * 默认头像/背景是注册时的兜底资源，删除后新用户会直接 404。
     */
    private Set<String> protectedAssets() {
        Set<String> protectedPaths = new HashSet<>();
        protectedPaths.add("uploads/images/avatar/default_avatar.jpg");
        protectedPaths.add("uploads/images/userBackground/default_background.png");
        protectedPaths.add("uploads/images/covers/default-cover.jpg");
        addIfPresent(protectedPaths, appConfig.getAvatar());
        addIfPresent(protectedPaths, appConfig.getBackground());
        return protectedPaths;
    }

    private void addIfPresent(Set<String> paths, String url) {
        if (url != null && !url.isBlank()) {
            paths.add(convertToRelativePath(url));
        }
    }

    private String convertToRelativePath(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        String path = url.trim().replace('\\', '/');
        // 去除域名部分（如果存在 http://localhost:8080/）
        path = path.replaceAll("^https?://[^/]+/", "");
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        if (!path.startsWith(URL_PREFIX)) {
            path = URL_PREFIX + path;
        }
        return path;
    }
}
