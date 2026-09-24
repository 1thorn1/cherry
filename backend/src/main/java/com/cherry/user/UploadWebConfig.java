package com.cherry.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

// 업로드된 프로필 사진을 /api/uploads/** 로 서빙한다. 프론트 dev 서버(Vite)가
// 이미 /api를 프록시하고 있어서 별도 proxy 설정을 추가하지 않아도 된다.
// v1은 로컬 디스크에 파일을 두고 경로만 DB에 저장 (S3/R2 도입은 v2, B-9 참고).
@Configuration
public class UploadWebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = new File(uploadDir).getAbsolutePath();
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:" + absolutePath + File.separator);
    }
}
