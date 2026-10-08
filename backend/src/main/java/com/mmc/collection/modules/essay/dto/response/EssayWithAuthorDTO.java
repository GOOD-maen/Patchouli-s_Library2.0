package com.mmc.collection.modules.essay.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EssayWithAuthorDTO {
    private String id;
    private String title;
    private String content;
    private String summary;
    private String coverUrl;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer views;
    private Integer likes;
    private String status;
    private AuthorInfo author;

    @Data
    public static class AuthorInfo {
        private Long id;
        private String username;
        private String avatar;
        // 如果需要背景图等可扩展
    }
}