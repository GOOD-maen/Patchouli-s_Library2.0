package com.mmc.collection.modules.essay.controller;

import com.mmc.collection.common.storage.FileStorageService;
import com.mmc.collection.common.storage.StorageException;
import com.mmc.collection.common.storage.StorageScope;
import com.mmc.collection.common.storage.StoredFile;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 统一上传入口。
 * <ul>
 *   <li>POST /api/uploads/temp      草稿期图片（正文插图、封面）</li>
 *   <li>POST /api/uploads/avatar    用户头像</li>
 *   <li>POST /api/uploads/background 用户背景</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/temp")
    public Map<String, Object> uploadTemp(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        MultipartFile upload = file != null ? file : image;
        return ok(fileStorageService.store(upload, StorageScope.TEMP));
    }

    @PostMapping("/avatar")
    public Map<String, Object> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ok(fileStorageService.store(file, StorageScope.AVATAR));
    }

    @PostMapping("/background")
    public Map<String, Object> uploadBackground(@RequestParam("file") MultipartFile file) {
        return ok(fileStorageService.store(file, StorageScope.BACKGROUND));
    }

    private Map<String, Object> ok(StoredFile storedFile) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("url", storedFile.url());
        return body;
    }
}
