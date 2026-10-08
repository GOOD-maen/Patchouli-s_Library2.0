package com.mmc.collection.modules.comment.service;

import com.mmc.collection.modules.comment.entity.CommentDO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentService {
    // 发表评论
    CommentDO createComment(CommentDO commentDO);

    // 获取目标的所有评论（扁平列表，按时间升序）
    List<CommentDO> getCommentsByTarget(String targetType, String targetId);

    // 分页获取顶级评论
    Page<CommentDO> getTopLevelComments(String targetType, String targetId, Pageable pageable);

    // 获取某个评论的子评论（回复）
    List<CommentDO> getReplies(Long parentId);

    // 删除评论（级联删除子评论）
    void deleteComment(Long commentId);
}