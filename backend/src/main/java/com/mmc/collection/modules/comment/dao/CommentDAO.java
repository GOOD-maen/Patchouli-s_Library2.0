package com.mmc.collection.modules.comment.dao;

import com.mmc.collection.modules.comment.entity.CommentDO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CommentDAO extends JpaRepository<CommentDO, Long> {

    // 根据目标类型和目标ID获取所有评论（按创建时间升序）
    List<CommentDO> findByTargetTypeAndTargetIdOrderByCreatedAtAsc(String targetType, String targetId);

    // 分页获取顶级评论（parent_id = null）
    Page<CommentDO> findByTargetTypeAndTargetIdAndParentIdIsNullOrderByCreatedAtDesc(String targetType, String targetId, Pageable pageable);

    // 获取某个评论的所有子评论（回复）
    List<CommentDO> findByParentIdOrderByCreatedAtAsc(Long parentId);

    // 删除某个目标下的所有评论
    @Modifying
    @Transactional
    @Query("DELETE FROM CommentDO c WHERE c.targetType = :targetType AND c.targetId = :targetId")
    void deleteByTargetTypeAndTargetId(@Param("targetType") String targetType, @Param("targetId") String targetId);

    // 删除某个评论及其所有子评论（级联删除，需要递归，可以用 @Query 或 service 层处理）
    // 简单起见，在 service 层通过递归删除
}