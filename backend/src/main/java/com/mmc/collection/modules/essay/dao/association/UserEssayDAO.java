package com.mmc.collection.modules.essay.dao.association;

import com.mmc.collection.modules.essay.entity.association.UserEssayDO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserEssayDAO extends JpaRepository<UserEssayDO, Long> {


    List<UserEssayDO> findByUserId(Long userId);


    Optional<UserEssayDO> findByEssayIdAndRole(String essayId, String role);


    boolean existsByUserIdAndEssayId(Long userId, String essayId);


    Long deleteByUserIdAndEssayId(Long userId, String essayId);


    List<UserEssayDO> findByEssayId(String essayId);


    Long countByUserId(Long userId);
}