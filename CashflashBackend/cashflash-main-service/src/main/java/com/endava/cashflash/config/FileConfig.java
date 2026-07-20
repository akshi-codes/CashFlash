package com.endava.cashflash.config;

import com.endava.cashflash.constants.ApiPaths;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Getter
@Configuration
// Maps uploaded profile files to public resource URLs.
public class FileConfig implements WebMvcConfigurer {

    @Value("${app.upload.profile.dir}")
    private String profileDir;

    @Value("${app.upload.kyc.dir}")
    private String kycDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Paths.get(profileDir).toAbsolutePath().normalize().toUri().toString();

        registry.addResourceHandler(ApiPaths.FILE_PROFILE)
                .addResourceLocations(location)
                .setCacheControl(
                        CacheControl.maxAge(365, TimeUnit.DAYS)
                                .cachePublic()
                                .immutable()
                );
    }
}
