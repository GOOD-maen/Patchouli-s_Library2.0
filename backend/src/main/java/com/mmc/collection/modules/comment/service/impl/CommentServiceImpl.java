package com.mmc.collection.modules.comment.service.impl;

import com.mmc.collection.modules.comment.dao.CommentDAO;
import com.mmc.collection.modules.comment.entity.CommentDO;
import com.mmc.collection.modules.comment.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentDAO commentDAO;

    @Override
    public CommentDO createComment(CommentDO commentDO) {
        // 这里可以添加业务校验，如用户是否存在、目标是否存在等
        return commentDAO.save(commentDO);
    }

    @Override
    public List<CommentDO> getCommentsByTarget(String targetType, String targetId) {
        return commentDAO.findByTargetTypeAndTargetIdOrderByCreatedAtAsc(targetType, targetId);
    }

    @Override
    public Page<CommentDO> getTopLevelComments(String targetType, String targetId, Pageable pageable) {
        return commentDAO.findByTargetTypeAndTargetIdAndParentIdIsNullOrderByCreatedAtDesc(targetType, targetId, pageable);
    }

    @Override
    public List<CommentDO> getReplies(Long parentId) {
        return commentDAO.findByParentIdOrderByCreatedAtAsc(parentId);
    }

    @Override
    public void deleteComment(Long commentId) {
        // 先递归删除所有子评论
        List<CommentDO> children = commentDAO.findByParentIdOrderByCreatedAtAsc(commentId);
        for (CommentDO child : children) {
            deleteComment(child.getId()); // 递归删除子评论的子评论
        }
        // 再删除自身
        commentDAO.deleteById(commentId);
    }
}