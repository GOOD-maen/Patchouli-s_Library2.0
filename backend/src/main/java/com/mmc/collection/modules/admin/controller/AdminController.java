package com.mmc.collection.modules.admin.controller;

import com.mmc.collection.modules.admin.service.AdminService;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.entity.UserDO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserDAO userDAO;

    /**
     * 清理未使用的图片文件
     * POST /api/admin/clean-unused-images
     */
    @PostMapping("/clean-unused-images")
    public ResponseEntity<Map<String, Object>> cleanUnusedImages() {
        String uuid = SecurityContextHolder.getContext().getAuthentication().getName();
        if (uuid == null || "anonymousUser".equals(uuid)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "未登录"));
        }
        UserDO currentUser = userDAO.findByUuid(uuid)
                .orElseThrow(() -> new RuntimeException("当前登录用户不存在"));

        if (!"2871521632043014".equals(currentUser.getUuid())) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "无权限执行此操作"));
        }

        int deletedCount = adminService.deleteUnusedImages();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("deletedCount", deletedCount);
        return ResponseEntity.ok(response);
    }
}