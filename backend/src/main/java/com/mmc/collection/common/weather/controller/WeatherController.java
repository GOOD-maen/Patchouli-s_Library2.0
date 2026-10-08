package com.mmc.collection.common.weather.controller;

import com.mmc.collection.common.weather.dto.WeatherNowResponse;
import com.mmc.collection.common.weather.dto.WeatherForecastResponse;
import com.mmc.collection.common.weather.service.WeatherService;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {
    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/now")
    public Map<String, Object> getCurrentWeather(@RequestParam(defaultValue = "101190101") String city) {
        // 获取实时天气
        WeatherNowResponse nowResponse = weatherService.getCurrentWeather(city);
        // 获取天气预报（3天）
        WeatherForecastResponse forecastResponse = weatherService.getWeatherForecast(city);

        Map<String, Object> result = new HashMap<>();

        // 实时数据
        if (nowResponse != null && nowResponse.getNow() != null) {
            result.put("temp", nowResponse.getNow().getTemp());
            result.put("text", nowResponse.getNow().getText());
            result.put("icon", nowResponse.getNow().getIcon());
            result.put("obsTime", nowResponse.getUpdateTime());
        }

        // 预报数据：取第一天的最高/最低温
        if (forecastResponse != null && forecastResponse.getDaily() != null && !forecastResponse.getDaily().isEmpty()) {
            WeatherForecastResponse.Daily today = forecastResponse.getDaily().get(0);
            result.put("tempMax", today.getTempMax());
            result.put("tempMin", today.getTempMin());
            result.put("fxDate", today.getFxDate());
        }

        return result;
    }

    @GetMapping("/forecast")
    public List<WeatherForecastResponse.Daily> getForecast(@RequestParam(defaultValue = "101190101") String city) {
        WeatherForecastResponse forecast = weatherService.getWeatherForecast(city);
        if (forecast != null && forecast.getDaily() != null) {
            return forecast.getDaily();
        }
        return Collections.emptyList();
    }

}