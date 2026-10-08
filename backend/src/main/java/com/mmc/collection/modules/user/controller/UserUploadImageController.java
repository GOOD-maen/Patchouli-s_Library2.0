package com.mmc.collection.modules.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user/uploads")
@CrossOrigin(origins = "*")
public class UserUploadImageController {

    private static final String TYPE_AVATAR = "avatar";
    private static final String TYPE_BACKGROUND = "background";

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadUserImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {

        try {
            // 校验 type
            if (!TYPE_AVATAR.equals(type) && !TYPE_BACKGROUND.equals(type)) {
                return ResponseEntity.badRequest().body(Map.of("error", "type 必须是 avatar 或 background"));
            }

            // 文件非空校验
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "文件不能为空"));
            }

            // 图片类型校验
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "只能上传图片文件"));
            }

            // 根据类型决定子目录（包含 images/ 前缀）
            String subDir = TYPE_AVATAR.equals(type) ? "images/avatar" : "images/userBackground";

            // 创建上传目录（项目根目录下的 uploads/images/avatar/ 等）
            String projectRoot = System.getProperty("user.dir");
            String uploadDir = projectRoot + File.separator + "uploads" + File.separator + subDir + File.separator;
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

            // 返回相对路径，例如 /uploads/images/avatar/xxx.jpg
            String fileUrl = "/uploads/" + subDir + "/" + fileName;

            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", fileUrl);
            response.put("message", "上传成功");

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "上传失败: " + e.getMessage()));
        }
    }
}