package com.mmc.collection.modules.tts.service;

public interface TtsService {
    /**
     * 将文本合成为音频
     * @param text 要转换的文本
     * @param voice 音色名称
     * @param rate 语速（如 "+0%"、"+20%"、"-20%"）
     * @param volume 音量（如 "+0%"、"+50%"、"-50%"）
     * @return 音频字节数组（MP3 格式）
     */
    byte[] synthesize(String text, String voice, String rate, String volume) throws Exception;
}