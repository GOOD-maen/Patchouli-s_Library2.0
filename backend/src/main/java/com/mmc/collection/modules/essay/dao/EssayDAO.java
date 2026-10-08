package com.mmc.collection.modules.essay.dao;

import com.mmc.collection.modules.essay.entity.EssayDO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface EssayDAO extends JpaRepository<EssayDO, String> {

    // 基础的CRUD方法已经由JpaRepository自动提供了
    // 包括：findAll(), findById(), save(), deleteById() 等
    @Modifying
    @Transactional
    @Query("UPDATE EssayDO e SET e.views = e.views + 1 WHERE e.id = :essayId")
    int incrementViews(@Param("essayId") String essayId);

    @Modifying
    @Transactional
    @Query("UPDATE EssayDO e SET e.likes = e.likes + :delta WHERE e.id = :essayId")
    int incrementLikes(@Param("essayId") String essayId, @Param("delta") int delta);
}