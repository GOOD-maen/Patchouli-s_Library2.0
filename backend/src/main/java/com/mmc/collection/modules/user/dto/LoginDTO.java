package com.mmc.collection.modules.user.dto;

import lombok.Data;

/**
 * 用户登录请求参数
 */
@Data
public class LoginDTO {

    /**
     * 用户名或邮箱
     */
    private String account;

    /**
     * 密码
     */
    private String password;
}