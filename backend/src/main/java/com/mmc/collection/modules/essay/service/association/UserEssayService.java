package com.mmc.collection.modules.essay.service.association;

import com.mmc.collection.modules.essay.entity.association.UserEssayDO;
import java.util.List;
import java.util.Optional;

public interface UserEssayService {

    /**
     * 创建用户-随笔关联
     * @param userId 用户ID
     * @param essayId 随笔ID
     * @param role 角色（author/contributor）
     * @return 创建的关联对象
     */
    UserEssayDO createAssociation(Long userId, String essayId, String role);

    /**
     * 获取用户的所有随笔ID
     * @param userId 用户ID
     * @return 随笔ID列表
     */
    List<String> findEssayIdsByUserId(Long userId);

    /**
     * 获取随笔的所有关联用户
     * @param essayId 随笔ID
     * @return 关联列表
     */
    List<UserEssayDO> findUsersByEssayId(String essayId);

    /**
     * 获取随笔的作者
     * @param essayId 随笔ID
     * @return 作者关联（可能为空）
     */
    Optional<UserEssayDO> findAuthorByEssayId(String essayId);

    /**
     * 检查用户是否拥有某篇随笔
     * @param userId 用户ID
     * @param essayId 随笔ID
     * @return true=已关联
     */
    boolean hasEssay(Long userId, String essayId);

    /**
     * 删除用户与随笔的关联
     * @param userId 用户ID
     * @param essayId 随笔ID
     * @return true=删除成功
     */
    boolean removeAssociation(Long userId, String essayId);

    /**
     * 统计用户的随笔数量
     * @param userId 用户ID
     * @return 随笔数量
     */
    long countUserEssays(Long userId);

    /**
     * 删除随笔的所有关联（随笔被删除时调用）
     * @param essayId 随笔ID
     */
    void deleteAllByEssayId(String essayId);
}