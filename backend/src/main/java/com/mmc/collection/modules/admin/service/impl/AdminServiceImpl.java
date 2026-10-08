package com.mmc.collection.modules.admin.service.impl;

import com.mmc.collection.modules.admin.service.AdminService;
import com.mmc.collection.modules.essay.dao.EssayDAO;
import com.mmc.collection.modules.essay.entity.EssayDO;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.entity.UserDO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    private final EssayDAO essayDAO;
    private final UserDAO userDAO;

    private static final String PROJECT_ROOT = System.getProperty("user.dir");
    private static final String UPLOADS_DIR = PROJECT_ROOT + "/uploads";
    private static final Pattern MARKDOWN_IMAGE_PATTERN = Pattern.compile("!\\[.*?\\]\\((.*?)\\)");

    @Override
    public int deleteUnusedImages() {
        // 1. 收集所有被引用的图片路径（相对路径）
        Set<String> referencedPaths = new HashSet<>();

        // 从文章封面收集
        List<EssayDO> allEssays = essayDAO.findAll();
        for (EssayDO essay : allEssays) {
            String coverUrl = essay.getCoverUrl();
            if (coverUrl != null && !coverUrl.isEmpty()) {
                referencedPaths.add(convertToRelativePath(coverUrl));
            }
            // 从文章正文中提取图片
            String content = essay.getContent();
            if (content != null) {
                Matcher matcher = MARKDOWN_IMAGE_PATTERN.matcher(content);
                while (matcher.find()) {
                    String imgUrl = matcher.group(1);
                    referencedPaths.add(convertToRelativePath(imgUrl));
                }
            }
        }

        // 从用户头像和背景图收集
        List<UserDO> allUsers = userDAO.findAll();
        for (UserDO user : allUsers) {
            if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
                referencedPaths.add(convertToRelativePath(user.getAvatar()));
            }
            if (user.getBackgroundImage() != null && !user.getBackgroundImage().isEmpty()) {
                referencedPaths.add(convertToRelativePath(user.getBackgroundImage()));
            }
        }

        // 2. 遍历 uploads 目录下的所有文件，删除未被引用的
        File uploadsDir = new File(UPLOADS_DIR);
        if (!uploadsDir.exists() || !uploadsDir.isDirectory()) {
            return 0;
        }

        int deletedCount = 0;
        Path projectRootPath = Paths.get(PROJECT_ROOT); // 修正：将字符串转为 Path
        try (Stream<Path> walk = Files.walk(uploadsDir.toPath())) {
            List<Path> allFiles = walk.filter(Files::isRegularFile).collect(Collectors.toList()); // 兼容低版本 Java
            for (Path filePath : allFiles) {
                String relative = projectRootPath.relativize(filePath).toString().replace("\\", "/");
                if (!referencedPaths.contains(relative)) {
                    boolean deleted = Files.deleteIfExists(filePath);
                    if (deleted) {
                        deletedCount++;
                        System.out.println("删除未使用图片: " + relative);
                    } else {
                        System.err.println("删除失败: " + relative);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return deletedCount;
    }

    private String convertToRelativePath(String url) {
        if (url == null) return "";
        // 去除域名部分（如果存在 http://localhost:8080/）
        String path = url.replaceAll("^https?://[^/]+/", "");
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        if (!path.startsWith("uploads/")) {
            path = "uploads/" + path;
        }
        return path;
    }
}