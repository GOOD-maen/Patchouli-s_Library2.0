package com.mmc.collection.modules.essay.controller;

import com.mmc.collection.common.storage.FileStorageService;
import com.mmc.collection.common.storage.StorageScope;
import com.mmc.collection.modules.essay.dto.response.EssayWithAuthorDTO;
import com.mmc.collection.modules.essay.entity.EssayDO;
import com.mmc.collection.modules.essay.entity.association.UserEssayDO;
import com.mmc.collection.modules.essay.service.EssayService;
import com.mmc.collection.modules.essay.service.association.UserEssayService;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.entity.UserDO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/essay")
@RequiredArgsConstructor
public class EssayController {

    private final EssayService essayService;
    private final UserDAO userDAO;
    private final UserEssayService userEssayService;
    private final FileStorageService fileStorageService;

    /**
     * 获取所有文章
     */
    @GetMapping
    public List<EssayWithAuthorDTO> getAllEssay() {
        List<EssayDO> essays = essayService.getAllEssay();
        return essays.stream()
                .filter(essay -> "published".equals(essay.getStatus()))
                .map(essay -> {
                    EssayWithAuthorDTO dto = new EssayWithAuthorDTO();
                    BeanUtils.copyProperties(essay, dto);
                    Optional<UserEssayDO> authorAssoc = userEssayService.findAuthorByEssayId(essay.getId());
                    if (authorAssoc.isPresent()) {
                        UserDO author = authorAssoc.get().getUser();
                        EssayWithAuthorDTO.AuthorInfo authorInfo = new EssayWithAuthorDTO.AuthorInfo();
                        authorInfo.setId(author.getId());
                        authorInfo.setUsername(author.getUsername());
                        authorInfo.setAvatar(author.getAvatar());
                        dto.setAuthor(authorInfo);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取指定用户的文章（需权限校验）
     */
    @GetMapping("/user/{userId}")
    public List<EssayDO> getEssaysByUser(@PathVariable Long userId) {

        String uuid = SecurityContextHolder.getContext().getAuthentication().getName();
        if (uuid == null || "anonymousUser".equals(uuid)) {
            throw new RuntimeException("用户未登录，无法访问");
        }

        UserDO currentUser = userDAO.findByUuid(uuid)
                .orElseThrow(() -> new RuntimeException("当前登录用户不存在"));
        return essayService.getEssaysByUserId(userId);
    }

    /**
     * 根据ID获取文章
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getEssayById(@PathVariable String id) {
        EssayDO essay = essayService.getEssayById(id);
        if (essay == null) {
            return ResponseEntity.notFound().build();
        }
        Optional<UserEssayDO> authorAssoc = userEssayService.findAuthorByEssayId(id);
        Long authorId = authorAssoc.map(assoc -> assoc.getUser().getId()).orElse(null);
        Map<String, Object> result = new HashMap<>();
        result.put("id", essay.getId());
        result.put("title", essay.getTitle());
        result.put("content", essay.getContent());
        result.put("summary", essay.getSummary());
        result.put("coverUrl", essay.getCoverUrl());
        result.put("authorId", authorId);
        result.put("views", essay.getViews());
        result.put("likes", essay.getLikes());
        result.put("createdAt", essay.getCreatedAt());
        result.put("updatedAt", essay.getUpdatedAt());
        return ResponseEntity.ok(result);
    }

    /**
     * 创建新文章
     */
    @PostMapping
    public EssayDO createEssay(@RequestBody EssayDO essayDO) {
        essayDO.setContent(promoteTempImages(essayDO.getContent()));
        essayDO.setCoverUrl(fileStorageService.promoteTemp(essayDO.getCoverUrl(), StorageScope.COVER));
        return essayService.createEssay(essayDO);
    }

    /**
     * 更新文章
     */
    @PutMapping("/{id}")
    public EssayDO updateEssay(@PathVariable String id, @RequestBody EssayDO essayDO) {
        essayDO.setContent(promoteTempImages(essayDO.getContent()));
        essayDO.setCoverUrl(fileStorageService.promoteTemp(essayDO.getCoverUrl(), StorageScope.COVER));
        return essayService.updateEssay(id, essayDO);
    }

    /**
     * 删除文章
     */
    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteEssay(@PathVariable String id) {
        System.out.println("🎯 DELETE /api/essay/" + id);
        Map<String, Object> response = new HashMap<>();
        try {
            essayService.deleteEssay(id);
            response.put("success", true);
            response.put("message", "文章删除成功");
            response.put("id", id);
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            System.err.println("❌ 删除失败: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("id", id);
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Map<String, Object>> addView(@PathVariable String id) {
        Integer views = essayService.incrementViews(id);
        if (views == null) {
            return ResponseEntity.notFound().build();
        }
        Map<String, Object> result = new HashMap<>();
        result.put("views", views);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(@PathVariable String id) {
        String uuid = SecurityContextHolder.getContext().getAuthentication().getName();
        if (uuid == null || "anonymousUser".equals(uuid)) {
            return ResponseEntity.status(401).body("未登录");
        }

        UserDO currentUser = userDAO.findByUuid(uuid)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        Map<String, Object> result = essayService.toggleLike(id, currentUser.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/like-status")
    public ResponseEntity<?> getLikeStatus(@PathVariable String id) {
        String uuid = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId = null;
        if (uuid != null && !"anonymousUser".equals(uuid)) {
            UserDO user = userDAO.findByUuid(uuid).orElse(null);
            if (user != null) userId = user.getId();
        }
        Map<String, Object> result = essayService.getLikeStatus(id, userId);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(result);
    }

    // ================== 辅助方法 ==================

    private static final Pattern TEMP_IMAGE_PATTERN =
            Pattern.compile("!\\[([^\\]]*)\\]\\((?:https?://[^/\\s)]+)?(/uploads/temp/[^)\\s]+)\\)");

    /**
     * 把正文里所有指向 /uploads/temp/ 的图片转存到正式目录，并替换为根相对 URL。
     * 同时兼容绝对地址（http://host/uploads/temp/...）与相对地址。
     */
    private String promoteTempImages(String content) {
        if (content == null || content.isEmpty()) {
            return content;
        }
        Matcher matcher = TEMP_IMAGE_PATTERN.matcher(content);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            String promoted = fileStorageService.promoteTemp(matcher.group(2), StorageScope.INLINE);
            String replacement = "![" + matcher.group(1) + "](" + promoted + ")";
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }
}
