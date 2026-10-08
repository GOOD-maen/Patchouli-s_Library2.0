package com.mmc.collection.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String projectRoot = System.getProperty("user.dir");
        System.out.println("🔍 项目根目录: " + projectRoot);

        String uploadsPath = "file:" + projectRoot + "/uploads/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsPath);
        System.out.println("静态资源映射: /uploads/** -> " + uploadsPath);

        String imagesPath = "file:" + projectRoot + "/images/";
        registry.addResourceHandler("/images/**")
                .addResourceLocations(imagesPath);
        System.out.println("静态资源映射: /images/** -> " + imagesPath);
    }

    @Bean
    public RestTemplate restTemplate() {
        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
        return new RestTemplate(requestFactory);
    }
}