package com.mmc.collection.modules.user.dto;

import lombok.Data;

/**
 * 用户注册请求参数
 */
@Data
public class RegisterDTO {

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;

    /**
     * 邮箱
     */
    private String email;
    /**
     * 验证码
     */
    private String verificationCode;
}