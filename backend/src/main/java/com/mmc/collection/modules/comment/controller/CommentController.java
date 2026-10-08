package com.mmc.collection.modules.comment.controller;

import com.mmc.collection.modules.comment.entity.CommentDO;
import com.mmc.collection.modules.comment.service.CommentService;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.entity.UserDO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserDAO userDAO;

    /**
     * 发表评论/回复
     * POST /api/comments
     * Body: { "content": "...", "targetType": "essay", "targetId": "...", "parentId": null 或 上级评论ID }
     */
    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody CommentDO commentDO) {
        String uuid = SecurityContextHolder.getContext().getAuthentication().getName();
        if (uuid == null || "anonymousUser".equals(uuid)) {
            return ResponseEntity.status(401).body("未登录");
        }
        UserDO currentUser = userDAO.findByUuid(uuid)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        commentDO.setUserId(currentUser.getId());
        CommentDO saved = commentService.createComment(commentDO);
        return ResponseEntity.ok(saved);
    }

    /**
     * 获取某个目标的所有评论（扁平列表，按时间升序）
     * GET /api/comments?targetType=essay&targetId=xxx
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getComments(
            @RequestParam String targetType,
            @RequestParam String targetId) {
        List<CommentDO> comments = commentService.getCommentsByTarget(targetType, targetId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (CommentDO comment : comments) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", comment.getId());
            map.put("content", comment.getContent());
            map.put("userId", comment.getUserId());
            map.put("targetType", comment.getTargetType());
            map.put("targetId", comment.getTargetId());
            map.put("parentId", comment.getParentId());
            map.put("createdAt", comment.getCreatedAt());
            map.put("updatedAt", comment.getUpdatedAt());

            // 获取用户信息
            UserDO user = userDAO.findById(comment.getUserId()).orElse(null);
            map.put("username", user != null ? user.getUsername() : "匿名");
            map.put("userAvatar", user != null ? user.getAvatar() : null);

            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * 分页获取顶级评论（按创建时间倒序）
     * GET /api/comments/top?targetType=essay&targetId=xxx&page=0&size=10
     */
    @GetMapping("/top")
    public ResponseEntity<Page<CommentDO>> getTopLevelComments(
            @RequestParam String targetType,
            @RequestParam String targetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CommentDO> comments = commentService.getTopLevelComments(targetType, targetId, pageable);
        return ResponseEntity.ok(comments);
    }

    /**
     * 获取某个评论的回复
     * GET /api/comments/{id}/replies
     */
    @GetMapping("/{id}/replies")
    public ResponseEntity<List<CommentDO>> getReplies(@PathVariable Long id) {
        List<CommentDO> replies = commentService.getReplies(id);
        return ResponseEntity.ok(replies);
    }

    /**
     * 删除评论
     * DELETE /api/comments/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        String uuid = SecurityContextHolder.getContext().getAuthentication().getName();
        if (uuid == null || "anonymousUser".equals(uuid)) {
            return ResponseEntity.status(401).body("未登录");
        }
        commentService.deleteComment(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}