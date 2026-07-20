package com.endava.cashflash.service.impl;

import com.endava.cashflash.exception.InvalidFieldException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
// Stores validated profile-picture uploads under a user-specific directory.
public class ProfilePictureStorageService {

    private final Path baseDir;

    public ProfilePictureStorageService(@Value("${app.upload.profile.dir}") String dir) {
        this.baseDir = Paths.get(dir).toAbsolutePath().normalize();
    }

    public String storeProfilePicture(Long userId, MultipartFile file) {
        try {
            Path userDir = baseDir.resolve(String.valueOf(userId)).normalize();
            Files.createDirectories(userDir);

            String ext = extensionFromContentType(Objects.requireNonNull(file.getContentType()));
            String filename = UUID.randomUUID() + ext;

            Path target = userDir.resolve(filename).normalize();
            if (!target.startsWith(userDir)) {
                throw new SecurityException("Invalid path");
            }

            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return filename;
        } catch (IOException e) {
            throw new InvalidFieldException("Failed to store profile picture");
        }
    }

    private String extensionFromContentType(String ct) {
        return switch (ct) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".img";
        };
    }
}
