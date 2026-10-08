package com.mmc.collection.common.weather.service;

import com.mmc.collection.common.weather.dto.WeatherNowResponse;
import com.mmc.collection.common.weather.dto.WeatherForecastResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class WeatherService {
    @Value("${weather.api.key}")
    private String apiKey;

    @Value("${weather.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public WeatherService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // 实时天气（/now）
    public WeatherNowResponse getCurrentWeather(String city) {
        String url = apiUrl + "?location=" + city + "&key=" + apiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept-Encoding", "identity");
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<WeatherNowResponse> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, WeatherNowResponse.class);
        return response.getBody();
    }


    public WeatherForecastResponse getWeatherForecast(String city) {

        String forecastUrl = apiUrl.replace("now", "3d") + "?location=" + city + "&key=" + apiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept-Encoding", "identity");
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<WeatherForecastResponse> response = restTemplate.exchange(
                forecastUrl, HttpMethod.GET, entity, WeatherForecastResponse.class);
        return response.getBody();
    }


}