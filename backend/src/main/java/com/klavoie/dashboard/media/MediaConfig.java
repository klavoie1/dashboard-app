package com.klavoie.dashboard.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class MediaConfig implements WebMvcConfigurer {

    @Value("${app.media-root}")
    String root;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry r) {
        r.addResourceHandler("/media/**").addResourceLocations(
                "file:" + root + "/"
        ).setCachePeriod(86400);
    }
}
