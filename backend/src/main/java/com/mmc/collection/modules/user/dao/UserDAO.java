package com.mmc.collection.modules.user.dao;

import com.mmc.collection.modules.user.entity.UserDO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserDAO extends JpaRepository<UserDO, Long> {

    // 根据用户名查询
    Optional<UserDO> findByUsername(String username);

    // 根据邮箱查询
    Optional<UserDO> findByEmail(String email);

    // 检查用户名是否存在
    boolean existsByUsername(String username);

    // 检查邮箱是否存在
    boolean existsByEmail(String email);

    //通过uuid查询用户
    Optional<UserDO> findByUuid(String uuid);
    boolean existsByUuid(String uuid);
}