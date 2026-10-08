package com.mmc.collection.modules.user.service.impl;

import com.mmc.collection.config.AppConfig;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.dto.RegisterDTO;
import com.mmc.collection.modules.user.dto.LoginDTO;
import com.mmc.collection.modules.user.dto.UserDTO;
import com.mmc.collection.modules.user.dto.UserUpdateDTO;
import com.mmc.collection.modules.user.entity.UserDO;
import com.mmc.collection.modules.user.service.UserService;
import com.mmc.collection.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mmc.collection.common.email.service.EmailService;
import com.mmc.collection.common.cache.VerificationCodeCache;

import java.util.*;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    @Autowired
    private UserDAO userDAO;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private VerificationCodeCache codeCache;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AppConfig appConfig;



    private String generateCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    @Override
    public UserDTO register(RegisterDTO registerDTO) {
        // 1. 验证验证码
        String email = registerDTO.getEmail();
        String inputCode = registerDTO.getVerificationCode();

        if (inputCode == null || inputCode.trim().isEmpty()) {
            throw new RuntimeException("验证码不能为空");
        }

        String storedCode = codeCache.get(email);
        if (storedCode == null) {
            throw new RuntimeException("验证码已过期，请重新获取");
        }
        if (!storedCode.equals(inputCode)) {
            throw new RuntimeException("验证码错误");
        }

        codeCache.remove(email);

        if (userDAO.existsByUsername(registerDTO.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        if (userDAO.existsByEmail(registerDTO.getEmail())) {
            throw new RuntimeException("邮箱已被注册");
        }

        UserDO user = new UserDO();
        user.setUsername(registerDTO.getUsername());
        user.setEmail(registerDTO.getEmail());

        String encodedPassword = passwordEncoder.encode(registerDTO.getPassword());
        user.setPassword(encodedPassword);

        char[] alphabet = "0123456789".toCharArray();
        String nanoId = NanoIdUtils.randomNanoId(NanoIdUtils.DEFAULT_NUMBER_GENERATOR, alphabet, 16);
        user.setUuid(nanoId);

        user.setAvatar(appConfig.getAvatar());
        user.setBackgroundImage(appConfig.getBackground());

        UserDO savedUser = userDAO.save(user);
        return convertToDTO(savedUser);
    }

    @Override
    public Map<String, String> login(LoginDTO loginDTO) {
        if (loginDTO.getAccount() == null || loginDTO.getAccount().trim().isEmpty()) {
            throw new RuntimeException("账号不能为空");
        }
        if (loginDTO.getPassword() == null || loginDTO.getPassword().trim().isEmpty()) {
            throw new RuntimeException("密码不能为空");
        }

        Optional<UserDO> userOpt = userDAO.findByUsername(loginDTO.getAccount());
        if (userOpt.isEmpty()) {
            userOpt = userDAO.findByEmail(loginDTO.getAccount());
        }
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户名或密码错误");
        }

        UserDO user = userOpt.get();

        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        // ⬇️ 生成双 Token
        String accessToken = jwtUtil.generateAccessToken(user.getUuid());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUuid());

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        return tokens;
    }

    @Override
    public UserDTO getUserById(Long id) {
        UserDO user = userDAO.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return convertToDTO(user);
    }

    @Override
    public UserDTO getUserByUsername(String username) {
        UserDO user = userDAO.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return convertToDTO(user);
    }

    @Override
    public UserDTO getUserByUuid(String uuid) {
        UserDO user = userDAO.findByUuid(uuid)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return convertToDTO(user);
    }

    @Override
    public void sendVerificationCode(String email) {
        if (userDAO.existsByEmail(email)) {
            throw new RuntimeException("该邮箱已被注册");
        }

        String code = generateCode();
        codeCache.put(email, code, 300);
        emailService.sendVerificationCode(email, code, "Patchouli's Library的注册验证码",
                "亲爱的用户，您好。\n很高兴与您的相遇，希望我们能够陪您一起度过一段愉快的时光。");
        System.out.println("已向 " + email + " 发送验证码: " + code);
    }

    private UserDTO convertToDTO(UserDO user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUuid(user.getUuid());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setAvatar(user.getAvatar());
        dto.setBackgroundImage(user.getBackgroundImage());
        dto.setSignature(user.getSignature());
        return dto;
    }

    @Override
    public UserDTO getUserByAccount(String account) {
        Optional<UserDO> userOpt = userDAO.findByUsername(account);
        if (userOpt.isEmpty()) {
            userOpt = userDAO.findByEmail(account);
        }
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户不存在");
        }
        return convertToDTO(userOpt.get());
    }

    @Override
    public void sendResetCode(String email) {
        if (!userDAO.existsByEmail(email)) {
            throw new RuntimeException("该邮箱未注册");
        }

        String code = generateCode();
        codeCache.put(email, code, 300);
        emailService.sendVerificationCode(email, code, "Patchouli's Library的重置密码验证码",
                "亲爱的用户，您好。\n很高兴与您的再次相遇，我们将继续竭诚为您服务。");
        System.out.println("已向 " + email + " 发送找回密码验证码: " + code);
    }

    @Override
    public boolean verifyResetCode(String email, String code) {
        if (email == null || code == null) {
            return false;
        }
        String storedCode = codeCache.get(email);
        if (storedCode == null) {
            return false;
        }
        boolean isValid = storedCode.equals(code);
        if (isValid) {
            codeCache.remove(email);
        }
        return isValid;
    }

    @Override
    public void resetPassword(String email, String newPassword) {
        UserDO user = userDAO.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        userDAO.save(user);
    }

    // ⭐ 改动点 3：updateUserProfile 参数从 username 改为 uuid
    @Override
    @Transactional
    public UserDTO updateUserProfile(String uuid, UserUpdateDTO updateDTO) {
        UserDO user = userDAO.findByUuid(uuid)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (updateDTO.getUsername() != null && !updateDTO.getUsername().equals(user.getUsername())) {
            if (userDAO.existsByUsername(updateDTO.getUsername())) {
                throw new RuntimeException("昵称已被使用");
            }
            user.setUsername(updateDTO.getUsername());
        }

        if (updateDTO.getSignature() != null) {
            user.setSignature(updateDTO.getSignature());
        }
        if (updateDTO.getAvatar() != null && !updateDTO.getAvatar().trim().isEmpty()) {
            user.setAvatar(updateDTO.getAvatar());
        }
        if (updateDTO.getBackgroundImage() != null && !updateDTO.getBackgroundImage().trim().isEmpty()) {
            user.setBackgroundImage(updateDTO.getBackgroundImage());
        }

        userDAO.save(user);
        return convertToDTO(user);
    }
}