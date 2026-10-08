package com.mmc.collection.modules.essay.dao.association;

import com.mmc.collection.modules.essay.entity.association.UserEssayLikeDO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserEssayLikeDAO extends JpaRepository<UserEssayLikeDO, Long> {
    Optional<UserEssayLikeDO> findByUserIdAndEssayId(Long userId, String essayId);
    boolean existsByUserIdAndEssayId(Long userId, String essayId);
    void deleteByUserIdAndEssayId(Long userId, String essayId);
}