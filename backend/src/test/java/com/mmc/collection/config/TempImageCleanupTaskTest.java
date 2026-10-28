package com.mmc.collection.config;

import com.mmc.collection.common.storage.StorageProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class TempImageCleanupTaskTest {

    @TempDir
    Path tempDir;

    @Test
    void deletesOnlyExpiredFilesInTempDirectory() throws IOException {
        Path temp = Files.createDirectories(tempDir.resolve("temp"));
        Path oldFile = Files.writeString(temp.resolve("old.png"), "old");
        Path freshFile = Files.writeString(temp.resolve("fresh.png"), "fresh");
        Path permanent = Files.createDirectories(tempDir.resolve("images/covers")).resolve("keep.png");
        Files.writeString(permanent, "keep");

        Files.setLastModifiedTime(oldFile, FileTime.fromMillis(
                System.currentTimeMillis() - Duration.ofHours(25).toMillis()));

        StorageProperties properties = new StorageProperties();
        properties.setUploadDir(tempDir.toString());
        properties.setTempTtl(Duration.ofHours(24));
        TempImageCleanupTask task = new TempImageCleanupTask(properties);

        int deleted = task.clean();

        assertThat(deleted).isEqualTo(1);
        assertThat(oldFile).doesNotExist();
        assertThat(freshFile).exists();
        assertThat(permanent).exists();
    }
}
