package com.mmc.collection.modules.user.controller;

import com.mmc.collection.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;

    /**
     * 用 Refresh Token 换新的 Access Token
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(HttpServletRequest request, HttpServletResponse response) {
        // 1. 从 Cookie 中读取 refreshToken
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "未登录"));
        }

        // 2. 验证 Refresh Token
        try {
            String uuid = jwtUtil.getUuidFromToken(refreshToken);
            if (!jwtUtil.validateToken(refreshToken, uuid)) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Refresh Token 无效"));
            }

            // 3. 签发新的 Access Token
            String newAccessToken = jwtUtil.generateAccessToken(uuid);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("token", newAccessToken);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Refresh Token 已过期"));
        }
    }

    /**
     * 退出登录：清除 Refresh Token Cookie
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);   // 立即失效
        response.addCookie(cookie);

        return ResponseEntity.ok(Map.of("success", true, "message", "已退出登录"));
    }
}