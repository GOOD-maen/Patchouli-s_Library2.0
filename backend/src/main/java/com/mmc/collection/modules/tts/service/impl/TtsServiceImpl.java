package com.mmc.collection.modules.tts.service.impl;

import com.mmc.collection.modules.tts.service.TtsService;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class TtsServiceImpl implements TtsService {

    @Override
    public byte[] synthesize(String text, String voice, String rate, String volume) throws Exception {
        // 1. 生成临时文件路径
        String tempDir = System.getProperty("java.io.tmpdir");
        String fileName = UUID.randomUUID().toString() + ".mp3";
        String outputPath = tempDir + File.separator + fileName;

        // 2. 调用 edge-tts（用 cmd /c 前缀）
        ProcessBuilder pb = new ProcessBuilder(
                "cmd", "/c",
                "edge-tts",
                "--voice", voice,
                "--rate", rate,
                "--volume", volume,
                "--text", text,
                "--write-media", outputPath
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // 3. 等待执行完成
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Edge TTS 调用失败，退出码: " + exitCode);
        }

        // 4. 读取生成的音频文件
        Path path = Path.of(outputPath);
        if (!Files.exists(path)) {
            throw new RuntimeException("Edge TTS 未生成音频文件");
        }
        byte[] audio = Files.readAllBytes(path);

        // 5. 删除临时文件
        Files.deleteIfExists(path);

        return audio;
    }
}