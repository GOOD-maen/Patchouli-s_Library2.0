package com.mmc.collection.common.storage;

/**
 * 上传文件的存放区域。
 * <p>
 * 目录统一相对上传根目录（默认 {@code uploads/}），对应 URL 为 {@code /uploads/<directory>/...}。
 */
public enum StorageScope {

    /** 草稿期临时文件，保存文章时转存到正式目录 */
    TEMP("temp"),

    /** 文章封面 */
    COVER("images/covers"),

    /** 正文 Markdown 插图 */
    INLINE("images/markdownImages"),

    /** 用户头像 */
    AVATAR("images/avatar"),

    /** 用户主页背景 */
    BACKGROUND("images/userBackground");

    private final String directory;

    StorageScope(String directory) {
        this.directory = directory;
    }

    public String directory() {
        return directory;
    }
}
