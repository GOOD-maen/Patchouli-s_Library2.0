package com.mmc.collection.modules.essay.service;

import com.mmc.collection.modules.essay.entity.EssayDO;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface EssayService {

    /**
     * 获取所有CSS数据
     */
    List<EssayDO> getAllEssay();

    /**
     * 根据ID获取CSS数据
     */
    EssayDO getEssayById(String id);

    EssayDO createEssay(EssayDO essayDO);

    //更新
    EssayDO updateEssay(String id, EssayDO essayDO);

    //删除
    void deleteEssay(String id);

    List<EssayDO> getEssaysByUserId(Long userId);

    Integer incrementViews(String essayId);

    Map<String, Object> toggleLike(String essayId, Long userId);

    Map<String, Object> getLikeStatus(String essayId, Long userId);
}