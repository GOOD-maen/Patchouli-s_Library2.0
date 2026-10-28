package com.mmc.collection.modules.essay.controller;

import com.mmc.collection.common.storage.FileStorageService;
import com.mmc.collection.common.storage.StorageException;
import com.mmc.collection.common.storage.StorageScope;
import com.mmc.collection.common.storage.StoredFile;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 旧上传路由的兼容壳：只做参数转换，不复制任何存储逻辑。
 * 前端全部切换到 /api/uploads/** 后即可整体删除本类。
 *
 * @deprecated 使用 {@link UploadController} 的新路由
 */
@Deprecated
@RestController
@RequiredArgsConstructor
public class LegacyUploadController {

    private final FileStorageService fileStorageService;

    @Deprecated
    @PostMapping("/api/upload/temp-image")
    public Map<String, Object> legacyTempImage(
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        MultipartFile upload = image != null ? image : file;
        return ok(fileStorageService.store(upload, StorageScope.TEMP));
    }

    @Deprecated
    @PostMapping("/api/user/uploads")
    public Map<String, Object> legacyUserUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {
        StorageScope scope;
        if ("avatar".equals(type)) {
            scope = StorageScope.AVATAR;
        } else if ("background".equals(type)) {
            scope = StorageScope.BACKGROUND;
        } else {
            throw new StorageException("type 必须是 avatar 或 background");
        }
        return ok(fileStorageService.store(file, scope));
    }

    private Map<String, Object> ok(StoredFile storedFile) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("url", storedFile.url());
        // 兼容旧前端读取 fileUrl 的逻辑
        body.put("fileUrl", storedFile.url());
        body.put("message", "上传成功");
        return body;
    }
}
