package com.mmc.collection.common.storage;

import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

/**
 * 统一的文件存储入口。所有上传、转存、删除都应经过这里，
 * 避免各控制器各自拼路径、各自校验。
 */
public interface FileStorageService {

    /** 保存上传文件到指定区域 */
    StoredFile store(MultipartFile file, StorageScope scope);

    /**
     * 把 {@code /uploads/temp/xxx} 转存到正式目录。
     * 非临时文件原样返回；临时文件已不存在时抛出异常。
     */
    String promoteTemp(String tempUrl, StorageScope target);

    /**
     * 删除某个区域下的文件。只在 URL 指向该区域时生效，
     * 防止通过篡改 coverUrl 删除头像或默认资源。
     */
    boolean deleteByUrl(String url, StorageScope scope);

    /** 上传根目录 */
    Path root();

    String extractPath(String url);
}
