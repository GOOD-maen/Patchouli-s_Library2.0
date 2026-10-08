package com.mmc.collection.modules.tts.controller;

import com.mmc.collection.modules.tts.service.TtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tts")
@RequiredArgsConstructor
public class TtsController {

    private final TtsService ttsService;

    /**
     * 文字转语音
     * POST /api/tts
     * Body: { "text": "...", "voice": "...", "rate": "+0%", "volume": "+0%" }
     * 返回: 音频字节流（audio/mpeg）
     */
    @PostMapping
    public ResponseEntity<byte[]> synthesize(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        String voice = request.getOrDefault("voice", "zh-CN-XiaoxiaoNeural");
        String rate = request.getOrDefault("rate", "+0%");
        String volume = request.getOrDefault("volume", "+0%");

        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            byte[] audio = ttsService.synthesize(text, voice, rate, volume);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            headers.setContentLength(audio.length);
            headers.set("Content-Disposition", "inline; filename=\"speech.mp3\"");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(audio);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}