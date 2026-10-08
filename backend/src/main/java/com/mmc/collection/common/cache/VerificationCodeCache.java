package com.mmc.collection.common.cache;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class VerificationCodeCache {

    // 存储验证码的缓存，key: 邮箱, value: {验证码, 过期时间}
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /**
     * 存储验证码
     * @param email 邮箱
     * @param code 验证码
     * @param expireSeconds 过期时间（秒）
     */
    public void put(String email, String code, long expireSeconds) {
        long expireTime = System.currentTimeMillis() + expireSeconds * 1000;
        cache.put(email, new CacheEntry(code, expireTime));
        System.out.println("验证码已存储: " + email + " -> " + code + "，过期时间: " + expireSeconds + "秒");
    }

    /**
     * 获取验证码
     * @param email 邮箱
     * @return 验证码（如果不存在或已过期返回null）
     */
    public String get(String email) {
        CacheEntry entry = cache.get(email);
        if (entry == null) {
            return null;
        }

        // 检查是否过期
        if (entry.expireTime < System.currentTimeMillis()) {
            cache.remove(email); // 过期删除
            System.out.println("验证码已过期: " + email);
            return null;
        }

        return entry.code;
    }

    /**
     * 删除验证码（验证成功后调用）
     * @param email 邮箱
     */
    public void remove(String email) {
        cache.remove(email);
        System.out.println("验证码已删除: " + email);
    }

    /**
     * 缓存条目内部类
     */
    private static class CacheEntry {
        private String code;
        private long expireTime;

        public CacheEntry(String code, long expireTime) {
            this.code = code;
            this.expireTime = expireTime;
        }
    }
}