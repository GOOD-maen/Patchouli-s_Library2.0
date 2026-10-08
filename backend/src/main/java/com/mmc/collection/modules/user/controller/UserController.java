package com.mmc.collection.modules.user.controller;

import com.mmc.collection.modules.essay.service.association.UserEssayService;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.dto.RegisterDTO;
import com.mmc.collection.modules.user.dto.LoginDTO;
import com.mmc.collection.modules.user.dto.UserDTO;
import com.mmc.collection.modules.user.dto.UserUpdateDTO;
import com.mmc.collection.modules.user.entity.UserDO;
import com.mmc.collection.modules.user.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserEssayService userEssayService;

    @Autowired
    private UserDAO userDAO;

    /**
     * 用户注册
     * POST /api/user/register
     */
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterDTO registerDTO) {
        try {
            UserDTO userDTO = userService.register(registerDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "注册成功");
            response.put("data", userDTO);
            return response;
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return response;
        }
    }

    /**
     * 用户登录
     * POST /api/user/login
     */
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginDTO loginDTO, HttpServletResponse response) {
        try {
            Map<String, String> tokens = userService.login(loginDTO);
            String accessToken = tokens.get("accessToken");
            String refreshToken = tokens.get("refreshToken");

            UserDTO userDTO = userService.getUserByAccount(loginDTO.getAccount());

            // ⬇️ 把 Refresh Token 写入 HttpOnly Cookie
            Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
            refreshCookie.setHttpOnly(true);
            refreshCookie.setSecure(false);        // 开发环境用 false，生产环境用 true
            refreshCookie.setPath("/");
            refreshCookie.setMaxAge(7 * 24 * 60 * 60);  // 7 天（秒）
            response.addCookie(refreshCookie);

            // ⬇️ 响应只返回 Access Token
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "登录成功");
            result.put("token", accessToken);
            result.put("user", userDTO);
            return result;
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return result;
        }
    }

    /**
     * 获取用户信息
     * GET /api/user/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        Optional<UserDO> userOpt = userDAO.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        UserDO user = userOpt.get();

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("avatar", user.getAvatar());
        result.put("backgroundImage", user.getBackgroundImage());
        result.put("signature", user.getSignature());
        result.put("email", user.getEmail());
        result.put("createdAt", user.getCreatedAt());
        result.put("uuid", user.getUuid());
        // 作品数
        long totalEssays = userEssayService.countUserEssays(user.getId());
        result.put("totalEssays", totalEssays);

        // 站龄（天数）
        long days = ChronoUnit.DAYS.between(user.getCreatedAt().toLocalDate(), LocalDate.now());
        result.put("accountAge", days);

        return ResponseEntity.ok(result);
    }
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        String uuid = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UserDTO userDTO = userService.getUserByUuid(uuid);
        return ResponseEntity.ok(userDTO);
    }

    @PostMapping("/send-code")
    public Map<String, Object> testSendCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Map<String, Object> response = new HashMap<>();

        try {
            // 直接调用一个简单的发送方法
            userService.sendVerificationCode(email);
            response.put("success", true);
            response.put("message", "验证码已发送");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "发送失败：" + e.getMessage());
        }
        return response;
    }

    /**
     * 发送找回密码验证码
     */
    @PostMapping("/send-reset-code")
    public Map<String, Object> sendResetCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Map<String, Object> response = new HashMap<>();
        try {
            userService.sendResetCode(email);
            response.put("success", true);
            response.put("message", "验证码已发送");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    /**
     * 验证找回密码验证码
     */
    @PostMapping("/verify-reset-code")
    public Map<String, Object> verifyResetCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isValid = userService.verifyResetCode(email, code);
            if (isValid) {
                response.put("success", true);
                response.put("message", "验证成功");
            } else {
                response.put("success", false);
                response.put("message", "验证码错误或已过期");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    /**
     * 重置密码
     */
    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        Map<String, Object> response = new HashMap<>();
        try {
            // 可以在这里添加密码强度校验（长度至少6位）
            if (password == null || password.length() < 6) {
                throw new RuntimeException("密码长度至少6位");
            }
            userService.resetPassword(email, password);
            response.put("success", true);
            response.put("message", "密码重置成功");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(@RequestBody @Valid UserUpdateDTO updateDTO) {
        try {
            String uuid = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            UserDTO updatedUser = userService.updateUserProfile(uuid, updateDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "更新成功");
            response.put("data", updatedUser);
            return response;
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return response;
        }
    }

    @GetMapping("/profile")
    public Map<String, Object> getCurrentUserProfile() {
        try {
            String uuid = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            UserDTO userDTO = userService.getUserByUuid(uuid);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", userDTO);
            return response;
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return response;
        }
    }
}