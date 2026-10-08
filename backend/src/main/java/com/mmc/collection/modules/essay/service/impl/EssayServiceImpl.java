package com.mmc.collection.modules.essay.service.impl;

import com.mmc.collection.modules.essay.dao.EssayDAO;
import com.mmc.collection.modules.essay.dao.association.UserEssayDAO;
import com.mmc.collection.modules.essay.dao.association.UserEssayLikeDAO;
import com.mmc.collection.modules.essay.entity.EssayDO;
import com.mmc.collection.modules.essay.entity.association.UserEssayDO;
import com.mmc.collection.modules.essay.entity.association.UserEssayLikeDO;
import com.mmc.collection.modules.essay.service.EssayService;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.entity.UserDO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EssayServiceImpl implements EssayService {

    private final EssayDAO essayDAO;
    private final UserDAO userDAO;
    private final UserEssayDAO userEssayDAO;
    private final UserEssayLikeDAO userEssayLikeDAO;

    @Value("${file.upload-dir:uploads}")
    private String baseUploadDir;

    @Override
    public List<EssayDO> getAllEssay() {
        List<EssayDO> essays = essayDAO.findAll();
        essays.sort((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()));
        return essays;
    }

    @Override
    public EssayDO getEssayById(String id) {
        return essayDAO.findById(id)
                .orElseThrow(() -> new RuntimeException("Essay数据未找到，ID: " + id));
    }

    @Override
    public EssayDO createEssay(EssayDO essayDO) {

        String timestamp = LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
        );
        String userId = "01";
        essayDO.setId(timestamp + userId);

        if (essayDO.getCategory() == null || essayDO.getCategory().isEmpty()) {
            essayDO.setCategory("默认分类");
        }
        if (essayDO.getCoverUrl() == null || essayDO.getCoverUrl().isEmpty()) {
            essayDO.setCoverUrl("/images/default-cover.jpg");
        }

        EssayDO savedEssay = essayDAO.save(essayDO);

        String uuid = SecurityContextHolder.getContext().getAuthentication().getName();

        UserDO currentUser = userDAO.findByUuid(uuid)
                .orElseThrow(() -> new RuntimeException("当前登录用户不存在: " + uuid));

        UserEssayDO userEssay = new UserEssayDO();
        userEssay.setUser(currentUser);
        userEssay.setEssayId(savedEssay.getId());
        userEssay.setRole("author");

        userEssayDAO.save(userEssay);

        return savedEssay;
    }

    @Override
    public EssayDO updateEssay(String id, EssayDO essayDO) {
        EssayDO existingEssay = getEssayById(id);
        String oldCoverUrl = existingEssay.getCoverUrl();

        if (essayDO.getTitle() != null && !essayDO.getTitle().trim().isEmpty()) {
            existingEssay.setTitle(essayDO.getTitle().trim());
        }
        if (essayDO.getContent() != null) {
            existingEssay.setContent(essayDO.getContent().trim());
        }
        if (essayDO.getCoverUrl() != null) {
            String newCoverUrl = essayDO.getCoverUrl().trim();
            if (!newCoverUrl.equals(oldCoverUrl)) {
                existingEssay.setCoverUrl(newCoverUrl);
            }
        }
        if (essayDO.getCategory() != null) {
            existingEssay.setCategory(essayDO.getCategory().trim());
        }
        if (essayDO.getSummary() != null) {
            existingEssay.setSummary(essayDO.getSummary().trim());
        }

        if (essayDO.getStatus() != null) {
            existingEssay.setStatus(essayDO.getStatus());
        }

        if (essayDO.getCoverUrl() != null) {
            String newCoverUrl = essayDO.getCoverUrl().trim();
            if (!newCoverUrl.equals(oldCoverUrl)) {
                deleteCoverImageIfNeeded(oldCoverUrl);
            }
        }

        return essayDAO.save(existingEssay);
    }

    @Override
    @Transactional
    public void deleteEssay(String id) {
        System.out.println("🗑️ 删除文章，ID: " + id);

        try {
            EssayDO essay = essayDAO.findById(id)
                    .orElseThrow(() -> new RuntimeException("文章不存在，ID: " + id));
            deleteCoverImageIfNeeded(essay.getCoverUrl());

            // 删除数据库记录
            essayDAO.deleteById(id);

        } catch (Exception e) {
            System.err.println("❌ 删除失败: " + e.getMessage());
            throw new RuntimeException("删除失败: " + e.getMessage());
        }
    }

    private void deleteCoverImageIfNeeded(String coverUrl) {
        if (coverUrl == null || coverUrl.trim().isEmpty()) {
            return;
        }
        if (isDefaultCover(coverUrl)) {
            return;
        }
        try {
            String filePath = "uploads/" + coverUrl.trim();
            File file = new File(filePath);
            if (file.exists()) {
                if (file.delete()) {
                    System.out.println("✅ 封面文件删除成功");
                } else {
                    System.err.println("❌ 文件删除失败（可能被占用或无权限）");
                }
            } else {
                System.out.println("⚠️  文件不存在，可能已被删除");
            }
        } catch (SecurityException e) {
            System.err.println("🔒 权限错误: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("💥 删除异常: " + e.getMessage());
        }
    }

    private boolean isDefaultCover(String coverUrl) {
        if (coverUrl == null) return true;
        String url = coverUrl.toLowerCase().trim();
        return url.contains("default-cover") ||
                url.equals("/images/default-cover.jpg") ||
                url.equals("default-cover.jpg");
    }

    @Override
    public List<EssayDO> getEssaysByUserId(Long userId) {
        System.out.println("========== getEssaysByUserId ==========");
        System.out.println("传入 userId: " + userId + " (类型: " + userId.getClass().getSimpleName() + ")");

        List<UserEssayDO> userEssays = userEssayDAO.findByUserId(userId);

        if (userEssays.isEmpty()) {
            System.out.println("未找到关联记录，返回空列表");
            return new ArrayList<>();
        }

        List<String> essayIds = userEssays.stream()
                .map(UserEssayDO::getEssayId)
                .collect(Collectors.toList());

        List<EssayDO> essays = essayDAO.findAllById(essayIds);

        essays.sort((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()));
        return essays;
    }

    @Override
    public Integer incrementViews(String essayId) {
        int updated = essayDAO.incrementViews(essayId);
        if (updated == 0) {
            return null;
        }
        EssayDO essay = essayDAO.findById(essayId).orElse(null);
        return essay != null ? essay.getViews() : null;
    }

    @Override
    public Map<String, Object> toggleLike(String essayId, Long userId) {
        boolean exists = userEssayLikeDAO.existsByUserIdAndEssayId(userId, essayId);
        if (exists) {
            // 取消点赞
            userEssayLikeDAO.deleteByUserIdAndEssayId(userId, essayId);
            essayDAO.incrementLikes(essayId, -1);
        } else {
            // 点赞
            UserEssayLikeDO like = new UserEssayLikeDO();
            like.setUserId(userId);
            like.setEssayId(essayId);
            userEssayLikeDAO.save(like);
            essayDAO.incrementLikes(essayId, 1);
        }
        EssayDO essay = essayDAO.findById(essayId)
                .orElseThrow(() -> new RuntimeException("文章不存在"));
        Map<String, Object> result = new HashMap<>();
        result.put("liked", !exists); // 当前是否已点赞（点赞后为true，取消后为false）
        result.put("likes", essay.getLikes());
        return result;
    }

    @Override
    public Map<String, Object> getLikeStatus(String essayId, Long userId) {
        EssayDO essay = essayDAO.findById(essayId).orElse(null);
        if (essay == null) return null;
        boolean liked = false;
        if (userId != null) {
            liked = userEssayLikeDAO.existsByUserIdAndEssayId(userId, essayId);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("liked", liked);
        result.put("likes", essay.getLikes());
        return result;
    }
}