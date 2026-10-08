package com.mmc.collection.modules.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateDTO {

    @Size(max = 50, message = "昵称不能超过50字")
    private String username;

    @Size(max = 300, message = "签名不能超过300字")
    private String signature;

    private String avatar;

    private String backgroundImage;
}