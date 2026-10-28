package com.mmc.collection.common.storage;

import java.nio.file.Path;

/**
 * 已保存文件的描述。
 *
 * @param url       根相对访问路径，例如 {@code /uploads/images/covers/xxx.png}
 * @param path      磁盘绝对路径
 * @param size      字节数
 * @param mediaType 实际检测出的 MIME 类型
 */
public record StoredFile(String url, Path path, long size, String mediaType) {
}
