package com.mmc.collection.config;

import com.mmc.collection.common.storage.StorageProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    public WebConfig(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadsPath = asDirectoryUri(storageProperties.root());
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsPath);
        System.out.println("静态资源映射: /uploads/** -> " + uploadsPath);

        Path imagesRoot = Paths.get("images").toAbsolutePath().normalize();
        String imagesPath = asDirectoryUri(imagesRoot);
        registry.addResourceHandler("/images/**")
                .addResourceLocations(imagesPath);
        System.out.println("静态资源映射: /images/** -> " + imagesPath);
    }

    private String asDirectoryUri(Path directory) {
        String uri = directory.toUri().toString();
        return uri.endsWith("/") ? uri : uri + "/";
    }

    @Bean
    public RestTemplate restTemplate() {
        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
        return new RestTemplate(requestFactory);
    }
}
