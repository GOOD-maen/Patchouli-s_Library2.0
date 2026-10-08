package com.mmc.collection.common.weather.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class WeatherForecastResponse {
    private String code;
    @JsonProperty("updateTime")
    private String updateTime;
    private List<Daily> daily;  // 预报数据数组

    @Data
    public static class Daily {
        @JsonProperty("fxDate")
        private String fxDate;           // 预报日期
        @JsonProperty("tempMax")
        private String tempMax;          // 最高温度
        @JsonProperty("tempMin")
        private String tempMin;          // 最低温度
        @JsonProperty("textDay")
        private String textDay;          // 白天天气描述
        @JsonProperty("iconDay")
        private String iconDay;          // 白天图标代码
        @JsonProperty("textNight")
        private String textNight;        // 夜间天气描述
        @JsonProperty("iconNight")
        private String iconNight;        // 夜间图标代码
    }
}