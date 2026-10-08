package com.mmc.collection.modules.essay.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Entity
@Table(name = "essay_data")
public class EssayDO {

    @Id//id
    @Column(name = "id", length = 20)
    private String id;

    //标题
    @Column(name = "title", nullable = false)
    private String title;

    //内容
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    //封面url
    @Column(name = "cover_url")
    private String coverUrl;

    //分类
    @Column(name = "category")
    private String category;

    //创建时间
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    //更新时间
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 简介
    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    //浏览量
    @Column(name = "views")
    private Integer views = 0;

    //点赞量
    @Column(name = "likes")
    private Integer likes = 0;

    /**
     * 状态: draft(草稿), published(已发布)
     */
    @Column(name = "status", length = 20)
    private String status = "draft";   // 默认草稿
}