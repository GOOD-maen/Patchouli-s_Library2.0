package com.mmc.collection.modules.essay.controller;

import com.mmc.collection.common.exception.GlobalExceptionHandler;
import com.mmc.collection.common.storage.FileStorageService;
import com.mmc.collection.common.storage.StorageException;
import com.mmc.collection.common.storage.StorageScope;
import com.mmc.collection.common.storage.StoredFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Path;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LegacyUploadControllerTest {

    private FileStorageService storageService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        storageService = mock(FileStorageService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new LegacyUploadController(storageService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void keepsLegacyTempImageContract() throws Exception {
        when(storageService.store(any(), eq(StorageScope.TEMP)))
                .thenReturn(new StoredFile("/uploads/temp/a.png", Path.of("a.png"), 3, "image/png"));

        mockMvc.perform(multipart("/api/upload/temp-image")
                        .file(new MockMultipartFile("image", "a.png", "image/png", new byte[]{1, 2, 3})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("/uploads/temp/a.png"))
                .andExpect(jsonPath("$.fileUrl").value("/uploads/temp/a.png"));
    }

    @Test
    void keepsLegacyUserUploadContract() throws Exception {
        when(storageService.store(any(), eq(StorageScope.AVATAR)))
                .thenReturn(new StoredFile("/uploads/images/avatar/a.png", Path.of("a.png"), 3, "image/png"));

        mockMvc.perform(multipart("/api/user/uploads")
                        .file(new MockMultipartFile("file", "a.png", "image/png", new byte[]{1, 2, 3}))
                        .param("type", "avatar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileUrl").value("/uploads/images/avatar/a.png"));

        verify(storageService).store(any(), eq(StorageScope.AVATAR));
    }

    @Test
    void rejectsUnknownUserUploadType() throws Exception {
        mockMvc.perform(multipart("/api/user/uploads")
                        .file(new MockMultipartFile("file", "a.png", "image/png", new byte[]{1, 2, 3}))
                        .param("type", "banner"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void mapsMissingFileToBadRequest() throws Exception {
        when(storageService.store(any(), eq(StorageScope.TEMP)))
                .thenThrow(new StorageException("文件不能为空"));

        mockMvc.perform(multipart("/api/upload/temp-image"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("文件不能为空"));
    }
}
