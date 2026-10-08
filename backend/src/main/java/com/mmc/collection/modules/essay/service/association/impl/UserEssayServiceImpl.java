package com.mmc.collection.modules.essay.service.association.impl;

import com.mmc.collection.modules.essay.dao.association.UserEssayDAO;
import com.mmc.collection.modules.essay.entity.association.UserEssayDO;
import com.mmc.collection.modules.essay.service.association.UserEssayService;
import com.mmc.collection.modules.user.dao.UserDAO;
import com.mmc.collection.modules.user.entity.UserDO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserEssayServiceImpl implements UserEssayService {

    @Autowired
    private UserEssayDAO userEssayDAO;

    @Autowired
    private UserDAO userDAO;

    @Override
    public UserEssayDO createAssociation(Long userId, String essayId, String role) {
        if (userEssayDAO.existsByUserIdAndEssayId(userId, essayId)) {
            throw new RuntimeException("关联已存在");
        }

        UserDO user = userDAO.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        UserEssayDO association = new UserEssayDO();
        association.setUser(user);
        association.setEssayId(essayId);
        association.setRole(role);

        return userEssayDAO.save(association);
    }

    @Override
    public List<String> findEssayIdsByUserId(Long userId) {
        return userEssayDAO.findByUserId(userId)
                .stream()
                .map(UserEssayDO::getEssayId)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserEssayDO> findUsersByEssayId(String essayId) {
        return userEssayDAO.findByEssayId(essayId);
    }

    @Override
    public Optional<UserEssayDO> findAuthorByEssayId(String essayId) {
        return userEssayDAO.findByEssayIdAndRole(essayId, "author");
    }

    @Override
    public boolean hasEssay(Long userId, String essayId) {
        return userEssayDAO.existsByUserIdAndEssayId(userId, essayId);
    }

    @Override
    @Transactional
    public boolean removeAssociation(Long userId, String essayId) {
        // 方案：先检查再删除（避免 void 返回问题）
        if (userEssayDAO.existsByUserIdAndEssayId(userId, essayId)) {
            userEssayDAO.deleteByUserIdAndEssayId(userId, essayId);
            return true;
        }
        return false;
    }

    @Override
    public long countUserEssays(Long userId) {
        return userEssayDAO.countByUserId(userId);
    }

    @Override
    @Transactional
    public void deleteAllByEssayId(String essayId) {
        List<UserEssayDO> associations = userEssayDAO.findByEssayId(essayId);
        userEssayDAO.deleteAll(associations);
    }
}