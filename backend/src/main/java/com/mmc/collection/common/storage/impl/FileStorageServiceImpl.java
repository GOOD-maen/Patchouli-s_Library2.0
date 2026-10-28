package com.mmc.collection.common.storage.impl;

import com.mmc.collection.common.storage.FileStorageService;
import com.mmc.collection.common.storage.StorageException;
import com.mmc.collection.common.storage.StorageProperties;
import com.mmc.collection.common.storage.StorageScope;
import com.mmc.collection.common.storage.StoredFile;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * 文件存储的唯一实现：校验、命名、落盘、URL 生成、临时文件转存都集中在这里。
 */
@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageServiceImpl.class);
    private static final String URL_PREFIX = "/uploads/";
    private static final String TEMP_PREFIX = URL_PREFIX + "temp/";

    private final StorageProperties properties;

    @Override
    public StoredFile store(MultipartFile file, StorageScope scope) {
        if (scope == null) {
            throw new StorageException("未指定存储区域");
        }
        if (file == null || file.isEmpty()) {
            throw new StorageException("文件不能为空");
        }

        long maxBytes = properties.getMaxSize().toBytes();
        if (file.getSize() > maxBytes) {
            throw new StorageException("图片大小不能超过 " + properties.getMaxSize(),
                    HttpStatus.PAYLOAD_TOO_LARGE);
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new StorageException("读取上传文件失败", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        if (bytes.length > maxBytes) {
            throw new StorageException("图片大小不能超过 " + properties.getMaxSize(),
                    HttpStatus.PAYLOAD_TOO_LARGE);
        }

        ImageType type = detect(bytes);
        if (type == null) {
            throw new StorageException("仅支持 JPG/PNG/GIF/WebP 格式的图片");
        }
        if (type == ImageType.SVG && !properties.isAllowSvg()) {
            throw new StorageException("不支持 SVG 格式的图片");
        }

        String fileName = UUID.randomUUID().toString().replace("-", "") + type.extension;
        Path directory = resolveDirectory(scope);
        Path target = directory.resolve(fileName).normalize();
        ensureUnder(directory, target);

        try {
            Files.createDirectories(directory);
            Files.write(target, bytes);
        } catch (IOException e) {
            log.error("保存上传文件失败: {}", target, e);
            throw new StorageException("保存文件失败", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new StoredFile(toUrl(target), target, bytes.length, type.mediaType);
    }

    @Override
    public String promoteTemp(String tempUrl, StorageScope target) {
        if (tempUrl == null || tempUrl.isBlank()) {
            return tempUrl;
        }

        String path = extractPath(tempUrl);
        int index = path.indexOf(TEMP_PREFIX);
        if (index < 0) {
            // 不是临时文件，原样返回
            return tempUrl;
        }

        String fileName = path.substring(index + TEMP_PREFIX.length());
        if (fileName.isEmpty() || fileName.contains("/") || fileName.contains("\\")
                || fileName.contains("..")) {
            throw new StorageException("非法的临时文件路径");
        }

        Path tempDirectory = properties.root().resolve("temp").normalize();
        Path source = tempDirectory.resolve(fileName).normalize();
        if (!source.startsWith(tempDirectory) || !Files.isRegularFile(source)) {
            throw new StorageException("图片已过期，请重新上传");
        }

        Path targetDirectory = resolveDirectory(target);
        Path destination = targetDirectory.resolve(fileName).normalize();
        ensureUnder(targetDirectory, destination);

        try {
            Files.createDirectories(targetDirectory);
            try {
                Files.move(source, destination, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException moveFailed) {
                // 跨文件系统等场景下 move 可能失败，退化为复制后删除
                Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
                Files.deleteIfExists(source);
            }
        } catch (IOException e) {
            log.error("转存临时文件失败: {} -> {}", source, destination, e);
            throw new StorageException("图片转存失败，请重试", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return toUrl(destination);
    }

    @Override
    public boolean deleteByUrl(String url, StorageScope scope) {
        if (url == null || url.isBlank() || scope == null) {
            return false;
        }

        String path = extractPath(url);
        int index = path.indexOf(URL_PREFIX);
        if (index < 0) {
            return false;
        }

        String relative = path.substring(index + URL_PREFIX.length());
        if (!relative.startsWith(scope.directory() + "/")) {
            // 只允许删除目标区域内的文件，避免误删头像、背景或默认资源
            return false;
        }

        Path root = properties.root();
        Path file = root.resolve(relative).normalize();
        if (!file.startsWith(root)) {
            return false;
        }

        try {
            return Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("删除文件失败: {}", file, e);
            return false;
        }
    }

    @Override
    public Path root() {
        return properties.root();
    }

    @Override
    public String extractPath(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        String path = url.trim();

        int query = path.indexOf('?');
        if (query >= 0) {
            path = path.substring(0, query);
        }
        int anchor = path.indexOf('#');
        if (anchor >= 0) {
            path = path.substring(0, anchor);
        }

        if (path.startsWith("http://") || path.startsWith("https://")) {
            try {
                String uriPath = URI.create(path).getPath();
                if (uriPath != null) {
                    path = uriPath;
                }
            } catch (IllegalArgumentException e) {
                throw new StorageException("非法的图片地址");
            }
        }
        return path;
    }

    private Path resolveDirectory(StorageScope scope) {
        Path root = properties.root();
        Path directory = root.resolve(scope.directory()).normalize();
        if (!directory.startsWith(root)) {
            throw new StorageException("非法的存储区域");
        }
        return directory;
    }

    private void ensureUnder(Path directory, Path target) {
        if (!target.startsWith(directory)) {
            throw new StorageException("非法的文件路径");
        }
    }

    private String toUrl(Path file) {
        String relative = properties.root().relativize(file).toString().replace('\\', '/');
        return URL_PREFIX + relative;
    }

    private ImageType detect(byte[] bytes) {
        if (matches(bytes, 0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return ImageType.PNG;
        }
        if (matches(bytes, 0, 0xFF, 0xD8, 0xFF)) {
            return ImageType.JPEG;
        }
        if (matches(bytes, 0, 'G', 'I', 'F', '8')) {
            return ImageType.GIF;
        }
        if (matches(bytes, 0, 'R', 'I', 'F', 'F') && matches(bytes, 8, 'W', 'E', 'B', 'P')) {
            return ImageType.WEBP;
        }
        if (looksLikeSvg(bytes)) {
            return ImageType.SVG;
        }
        return null;
    }

    private boolean matches(byte[] bytes, int offset, int... expected) {
        if (bytes.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((bytes[offset + i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }

    private boolean looksLikeSvg(byte[] bytes) {
        int length = Math.min(bytes.length, 512);
        String head = new String(bytes, 0, length, StandardCharsets.UTF_8)
                .toLowerCase()
                .trim();
        return head.startsWith("<svg") || (head.startsWith("<?xml") && head.contains("<svg"));
    }

    private enum ImageType {
        PNG(".png", "image/png"),
        JPEG(".jpg", "image/jpeg"),
        GIF(".gif", "image/gif"),
        WEBP(".webp", "image/webp"),
        SVG(".svg", "image/svg+xml");

        private final String extension;
        private final String mediaType;

        ImageType(String extension, String mediaType) {
            this.extension = extension;
            this.mediaType = mediaType;
        }
    }
}
