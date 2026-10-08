package com.mmc.collection.modules.essay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class UploadController {

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // 检查文件是否为空
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "文件不能为空"));
            }

            // 检查文件类型
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "只能上传图片文件"));
            }

            // 创建上传目录
            String projectRoot = System.getProperty("user.dir");
            String uploadDir = projectRoot + "/uploads/images/covers/";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // 生成唯一文件名
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // 保存文件
            File dest = new File(uploadDir + fileName);
            file.transferTo(dest);

            // 返回文件路径
            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", "images/covers/" + fileName);
            response.put("message", "文件上传成功");

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "文件上传失败: " + e.getMessage()));
        }
    }


    // 专门接收 Markdown 编辑器上传的图片
    @PostMapping("/markdown-image")
    public ResponseEntity<Map<String, Object>> uploadMarkdownImage(@RequestParam("image") MultipartFile file) {
        try {
            // 检查文件是否为空
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "文件不能为空"));
            }

            // 检查文件类型
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "只能上传图片文件"));
            }

            // 限制大小（例如 5MB）
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "图片大小不能超过 5MB"));
            }

            // 创建上传目录: uploads/images/markdownImages/
            String projectRoot = System.getProperty("user.dir");
            String uploadDir = projectRoot + "/uploads/images/markdownImages/";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // 生成唯一文件名（使用时间戳 + 随机数，保持原扩展名）
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + fileExtension;

            // 保存文件
            File dest = new File(uploadDir + fileName);
            file.transferTo(dest);

            // 构造可访问的 URL（假设你的后端静态资源映射了 /uploads/**）
            String baseUrl = "http://localhost:8080"; // 可根据 request 动态获取
            String fileUrl = baseUrl + "/uploads/images/markdownImages/" + fileName;

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", fileUrl);
            response.put("message", "上传成功");

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "文件上传失败: " + e.getMessage()));
        }
    }


    @PostMapping("/temp-image")
    public ResponseEntity<Map<String, Object>> uploadTempImage(@RequestParam("image") MultipartFile file) {
        try {

            // 创建临时目录：uploads/temp/
            String projectRoot = System.getProperty("user.dir");
            String tempDir = projectRoot + "/uploads/temp/";
            File directory = new File(tempDir);
            if (!directory.exists()) directory.mkdirs();

            // 生成唯一文件名
            String originalFileName = file.getOriginalFilename();
            String ext = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                ext = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0,8) + ext;
            File dest = new File(tempDir + fileName);
            file.transferTo(dest);

            String url = "/uploads/temp/" + fileName;
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", url);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }


}

