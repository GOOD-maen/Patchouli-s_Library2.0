package com.mmc.collection.common.storage.impl;

import com.mmc.collection.common.storage.StorageException;
import com.mmc.collection.common.storage.StorageProperties;
import com.mmc.collection.common.storage.StorageScope;
import com.mmc.collection.common.storage.StoredFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceImplTest {

    private static final byte[] PNG = {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0
    };

    @TempDir
    Path tempDir;

    private FileStorageServiceImpl service;

    @BeforeEach
    void setUp() {
        StorageProperties properties = new StorageProperties();
        properties.setUploadDir(tempDir.toString());
        properties.setMaxSize(DataSize.ofKilobytes(10));
        properties.setTempTtl(Duration.ofHours(24));
        properties.setAllowSvg(false);
        service = new FileStorageServiceImpl(properties);
    }

    @Test
    void storesPngIntoScopeDirectory() {
        StoredFile stored = service.store(multipart("photo.png", "image/png", PNG), StorageScope.TEMP);

        assertThat(stored.url()).startsWith("/uploads/temp/").endsWith(".png");
        assertThat(stored.mediaType()).isEqualTo("image/png");
        assertThat(stored.path()).exists();
        assertThat(stored.path()).startsWith(tempDir);
    }

    @Test
    void detectsRealTypeInsteadOfTrustingFileName() {
        StoredFile stored = service.store(multipart("evil.html", "image/png", PNG), StorageScope.COVER);

        assertThat(stored.path().getFileName().toString()).endsWith(".png");
        assertThat(stored.url()).startsWith("/uploads/images/covers/");
    }

    @Test
    void rejectsNonImageContent() {
        byte[] html = "<html><body>hi</body></html>".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> service.store(multipart("x.png", "image/png", html), StorageScope.TEMP))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("仅支持");
    }

    @Test
    void rejectsOversizedFile() {
        byte[] oversized = new byte[11 * 1024];
        System.arraycopy(PNG, 0, oversized, 0, PNG.length);

        assertThatThrownBy(() -> service.store(multipart("big.png", "image/png", oversized), StorageScope.TEMP))
                .isInstanceOfSatisfying(StorageException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE));
    }

    @Test
    void rejectsSvgByDefault() {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> service.store(multipart("x.svg", "image/svg+xml", svg), StorageScope.TEMP))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("SVG");
    }

    @Test
    void promotesTempFileToPermanentDirectory() throws IOException {
        StoredFile temp = service.store(multipart("photo.png", "image/png", PNG), StorageScope.TEMP);

        String promotedUrl = service.promoteTemp(temp.url(), StorageScope.INLINE);

        assertThat(promotedUrl).startsWith("/uploads/images/markdownImages/");
        Path promoted = tempDir.resolve(promotedUrl.substring("/uploads/".length()));
        assertThat(promoted).exists();
        assertThat(temp.path()).doesNotExist();
    }

    @Test
    void leavesNonTempUrlUntouched() {
        String url = "/uploads/images/covers/existing.png";

        assertThat(service.promoteTemp(url, StorageScope.INLINE)).isEqualTo(url);
    }

    @Test
    void failsWhenTempFileIsMissing() {
        assertThatThrownBy(() -> service.promoteTemp("/uploads/temp/missing.png", StorageScope.INLINE))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("已过期");
    }

    @Test
    void rejectsPathTraversalInTempUrl() {
        assertThatThrownBy(() -> service.promoteTemp("/uploads/temp/../secret.png", StorageScope.INLINE))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("非法");
    }

    @Test
    void deletesOnlyWithinRequestedScope() {
        StoredFile cover = service.store(multipart("cover.png", "image/png", PNG), StorageScope.COVER);

        assertThat(service.deleteByUrl(cover.url(), StorageScope.AVATAR)).isFalse();
        assertThat(service.deleteByUrl(cover.url(), StorageScope.COVER)).isTrue();
        assertThat(cover.path()).doesNotExist();
    }

    @Test
    void extractsPathFromAbsoluteUrl() {
        assertThat(service.extractPath("http://localhost:8080/uploads/temp/a.png?x=1#top"))
                .isEqualTo("/uploads/temp/a.png");
    }

    private MockMultipartFile multipart(String fileName, String contentType, byte[] content) {
        return new MockMultipartFile("file", fileName, contentType, content);
    }
}
