package com.mmc.collection.common.weather.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class WeatherNowResponse {
    private String code;
    @JsonProperty("updateTime")
    private String updateTime;
    private Now now;

    @Data
    public static class Now {
        private String temp;
        private String text;
        private String icon;
    }
}