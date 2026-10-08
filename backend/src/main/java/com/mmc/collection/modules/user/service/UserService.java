package com.mmc.collection.modules.user.service;

import com.mmc.collection.modules.user.dto.RegisterDTO;
import com.mmc.collection.modules.user.dto.LoginDTO;
import com.mmc.collection.modules.user.dto.UserDTO;
import com.mmc.collection.modules.user.dto.UserUpdateDTO;

import java.util.Map;

public interface UserService {

    /**
     * 用户注册
     * @param registerDTO 注册信息
     * @return 注册成功的用户信息
     */
    UserDTO register(RegisterDTO registerDTO);

    /**
     * 用户登录
     * @param loginDTO 登录信息
     * @return JWT token（后面实现）
     */
    Map<String, String> login(LoginDTO loginDTO);

    /**
     * 根据ID查询用户
     * @param id 用户ID
     * @return 用户信息
     */
    UserDTO getUserById(Long id);

    /**
     * 根据用户名查询用户
     * @param username 用户名
     * @return 用户信息
     */
    UserDTO getUserByUsername(String username);

    UserDTO getUserByUuid(String uuid);

    void sendVerificationCode(String email);

    UserDTO getUserByAccount(String account);

    /**
     * 发送找回密码验证码
     * @param email 用户邮箱
     */
    void sendResetCode(String email);

    /**
     * 验证找回密码验证码
     * @param email 邮箱
     * @param code 验证码
     * @return true 表示验证通过
     */
    boolean verifyResetCode(String email, String code);

    /**
     * 重置密码
     * @param email 邮箱
     * @param newPassword 新密码
     */
    void resetPassword(String email, String newPassword);


    UserDTO updateUserProfile(String uuid, UserUpdateDTO updateDTO);
}
