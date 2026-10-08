package com.mmc.collection.modules.admin.service;

public interface AdminService {
    /**
     * 删除所有未被引用的图片文件
     * @return 删除的文件数量
     */
    int deleteUnusedImages();
}