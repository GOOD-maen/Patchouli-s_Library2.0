// src/main/java/com/mmc/collection/modules/essay/dto/response/EssayResponse.java
package com.mmc.collection.modules.essay.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class EssayResponse {
    private UUID id;
    private String coverUrl;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}