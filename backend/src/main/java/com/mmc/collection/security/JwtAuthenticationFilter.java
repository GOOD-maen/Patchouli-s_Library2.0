package com.mmc.collection.security;

import com.mmc.collection.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();

        // 放行静态资源
        if (requestURI.startsWith("/uploads/") || requestURI.startsWith("/images/")) {
            chain.doFilter(request, response);
            return;
        }

        System.out.println("========== JwtAuthenticationFilter 开始 ==========");
        System.out.println("请求路径: " + request.getRequestURI());
        System.out.println("请求方法: " + request.getMethod());
        System.out.println("请求头 Authorization: " + request.getHeader("Authorization"));

        String token = getTokenFromRequest(request);

        if (StringUtils.hasText(token)) {
            try {
                // ✅ 改动点 1：从 token 中解析 uuid
                String uuid = jwtUtil.getUuidFromToken(token);

                // ✅ 改动点 2：用 uuid 验证 token
                if (uuid != null && jwtUtil.validateToken(token, uuid)) {
                    // ✅ 改动点 3：把 uuid 存入 SecurityContext
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(uuid, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                    authentication.setDetails(new org.springframework.security.web.authentication.WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    System.out.println("✅ 用户认证成功，UUID: " + uuid);
                } else {
                    System.out.println("❌ Token 无效或已过期");
                }
            } catch (ExpiredJwtException e) {
                System.out.println("⚠️ Token 已过期: " + e.getMessage());
            } catch (Exception e) {
                System.out.println("⚠️ Token 解析错误: " + e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}