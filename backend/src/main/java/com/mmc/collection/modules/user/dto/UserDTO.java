package com.mmc.collection.modules.user.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户信息（返回给前端）
 */
@Data
public class UserDTO {

    /**
     * 用户ID
     */
    private Long id;

    /**
     * 用户名
     */
    private String username;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 注册时间
     */
    private LocalDateTime createdAt;

    private String uuid;

    /**
     * 头像
     */
    private String avatar;

    /**
     * 背景图片
     */
    private String backgroundImage;

    /**
     * 签名
     */
    private String signature;
}