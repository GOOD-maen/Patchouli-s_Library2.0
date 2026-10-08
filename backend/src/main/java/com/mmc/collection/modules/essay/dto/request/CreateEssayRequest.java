// src/main/java/com/mmc/collection/modules/essay/dto/request/EssayCreateRequest.java
package com.mmc.collection.modules.essay.dto.request;

import lombok.Data;

@Data
public class CreateEssayRequest {
    private String coverUrl;
    private String title;
    private String content;
    // 不需要传id，会自动生成
}