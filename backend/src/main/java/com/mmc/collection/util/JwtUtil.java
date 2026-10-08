package com.mmc.collection.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-expiration}")
    private Long accessExpiration;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        System.out.println("========== JWT 初始化 ==========");
        System.out.println("✅ JWT 密钥已加载");
        System.out.println("✅ Access Token 过期时间: " + accessExpiration + " ms");
        System.out.println("✅ Refresh Token 过期时间: " + refreshExpiration + " ms");
        System.out.println("=================================");
    }

    /**
     * 生成 Access Token（短命）
     */
    public String generateAccessToken(String uuid) {
        return generateToken(uuid, accessExpiration);
    }

    /**
     * 生成 Refresh Token（长寿）
     */
    public String generateRefreshToken(String uuid) {
        return generateToken(uuid, refreshExpiration);
    }

    /**
     * 通用生成逻辑
     */
    private String generateToken(String uuid, Long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setSubject(uuid)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 从 token 中获取用户 uuid
     */
    public String getUuidFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    /**
     * 验证 token 是否有效
     */
    public boolean validateToken(String token, String uuid) {
        try {
            String tokenUuid = getUuidFromToken(token);
            return tokenUuid.equals(uuid) && !isTokenExpired(token);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            System.out.println("⚠️ Token 已过期: " + e.getClaims().getExpiration());
            return false;
        } catch (io.jsonwebtoken.JwtException e) {
            System.out.println("❌ Token 无效: " + e.getMessage());
            return false;
        }
    }

    /**
     * 检查 token 是否过期
     */
    public boolean isTokenExpired(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getExpiration().before(new Date());
    }
}