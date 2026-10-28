package com.mmc.collection.modules.essay.controller;

import com.mmc.collection.common.storage.FileStorageService;
import com.mmc.collection.common.storage.StorageScope;
import com.mmc.collection.modules.essay.entity.EssayDO;
import com.mmc.collection.modules.essay.service.EssayService;
import com.mmc.collection.modules.essay.service.association.UserEssayService;
import com.mmc.collection.modules.user.dao.UserDAO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EssayControllerTest {

    private EssayService essayService;
    private FileStorageService storageService;
    private EssayController controller;

    @BeforeEach
    void setUp() {
        essayService = mock(EssayService.class);
        storageService = mock(FileStorageService.class);
        controller = new EssayController(
                essayService,
                mock(UserDAO.class),
                mock(UserEssayService.class),
                storageService
        );
    }

    @Test
    void promotesTempImagesAndCoverWhenCreatingEssay() {
        EssayDO essay = new EssayDO();
        essay.setContent("![alt](http://localhost:8080/uploads/temp/a.png) 和 ![b](/uploads/temp/b.png)");
        essay.setCoverUrl("/uploads/temp/cover.png");

        when(storageService.promoteTemp("/uploads/temp/a.png", StorageScope.INLINE))
                .thenReturn("/uploads/images/markdownImages/a.png");
        when(storageService.promoteTemp("/uploads/temp/b.png", StorageScope.INLINE))
                .thenReturn("/uploads/images/markdownImages/b.png");
        when(storageService.promoteTemp("/uploads/temp/cover.png", StorageScope.COVER))
                .thenReturn("/uploads/images/covers/cover.png");
        when(essayService.createEssay(any())).thenAnswer(invocation -> invocation.getArgument(0));

        EssayDO saved = controller.createEssay(essay);

        assertThat(saved.getContent()).isEqualTo(
                "![alt](/uploads/images/markdownImages/a.png) 和 ![b](/uploads/images/markdownImages/b.png)");
        assertThat(saved.getCoverUrl()).isEqualTo("/uploads/images/covers/cover.png");
        verify(storageService).promoteTemp("/uploads/temp/cover.png", StorageScope.COVER);
    }

    @Test
    void leavesNonTempMarkdownUntouched() {
        EssayDO essay = new EssayDO();
        essay.setContent("![x](/uploads/images/markdownImages/existing.png)");

        when(essayService.createEssay(any())).thenAnswer(invocation -> invocation.getArgument(0));

        EssayDO saved = controller.createEssay(essay);

        assertThat(saved.getContent()).isEqualTo("![x](/uploads/images/markdownImages/existing.png)");
    }
}
