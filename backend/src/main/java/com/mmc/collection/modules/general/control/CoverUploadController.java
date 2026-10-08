package com.mmc.collection.modules.general.control;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
public class CoverUploadController {
    private final Path coverStoragePath = Paths.get("uploads/images/covers/").toAbsolutePath().normalize();

    @PostMapping("/covers")
    public String uploadCover(@RequestParam("file") MultipartFile file) {
        try {
            Files.createDirectories(coverStoragePath);

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
            }

            if (!fileExtension.equals(".jpg") && !fileExtension.equals(".jpeg")
                    && !fileExtension.equals(".png") && !fileExtension.equals(".svg")) {
                throw new RuntimeException("只支持 JPG, PNG, SVG 格式的图片");
            }

            // 生成唯一文件名
            String newFileName = System.currentTimeMillis() + "_" + UUID.randomUUID() + fileExtension;

            // 保存文件
            Path targetLocation = coverStoragePath.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 返回访问URL
            return "/uploads/images/covers/" + newFileName;

        } catch (Exception e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }
}