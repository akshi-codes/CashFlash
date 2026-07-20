package com.endava.cashflash.service.impl;

import com.endava.cashflash.config.FileConfig;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.request.AdminReviewKycUpgradeRequest;
import com.endava.cashflash.dto.response.AdminReviewKycUpgradeResponse;
import com.endava.cashflash.dto.response.GetKycUpgradeStatusResponse;
import com.endava.cashflash.dto.response.PendingKycUpgradeResponse;
import com.endava.cashflash.dto.response.UploadKycUpgradeResponse;
import com.endava.cashflash.enums.KycStatus;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.service.KycUpgradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KycUpgradeServiceImpl implements KycUpgradeService {

    private final UserRepository userRepository;
    private final FileConfig fileConfig;

    @Override
    @Transactional
    public UploadKycUpgradeResponse uploadKycUpgrade(
            Long userId,
            MultipartFile file
    ) {

        User user = getUser(userId); // Fetches user by id

        validatePdf(file);

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalStateException(Literals.USER_INACTIVE_MESSAGE);
        }

        if (user.getKycStatus() == KycStatus.PENDING) {
            throw new IllegalStateException(Literals.KYC_UPGRADE_ALREADY_PENDING_MESSAGE);
        }

        if (user.getKycStatus() == KycStatus.APPROVED) {
            throw new IllegalStateException(Literals.KYC_ALREADY_APPROVED_MESSAGE);
        }

        String storedPath = storePdf(userId, file); // Stores uploaded KYC document on disk

        user.setKycDocumentPath(storedPath);
        user.setKycStatus(KycStatus.PENDING);

        userRepository.save(user);

        return new UploadKycUpgradeResponse(user.getKycStatus());
    }

    @Override
    @Transactional(readOnly = true)
    public GetKycUpgradeStatusResponse getKycUpgradeStatus(Long userId) {
        User user = getUser(userId);
        return new GetKycUpgradeStatusResponse(user.getKycStatus());
    }

    @Override
    @Transactional(readOnly = true)
    public Resource getKycDocument(Long userId) {
        User user = getUser(userId);

        if (user.getKycDocumentPath() == null || user.getKycDocumentPath().isBlank()) {
            throw new IllegalStateException(Literals.KYC_DOCUMENT_NOT_FOUND_MESSAGE);
        }

        Path path = Paths.get(user.getKycDocumentPath()).normalize();
        Resource resource = new FileSystemResource(path);

        if (!resource.exists() || !resource.isReadable()) {
            throw new IllegalStateException(Literals.KYC_DOCUMENT_NOT_READABLE_MESSAGE);
        }

        return resource;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PendingKycUpgradeResponse> getPendingKycUpgrades() {
        return userRepository.findAllByKycStatus(KycStatus.PENDING)
                .stream()
                .map(user -> new PendingKycUpgradeResponse(
                        user.getUserId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getKycStatus()
                ))
                .toList();
    }

    @Override
    @Transactional
    public AdminReviewKycUpgradeResponse reviewKycUpgrade(AdminReviewKycUpgradeRequest request) {
        User user = getUser(request.userId());

        if (user.getKycStatus() != KycStatus.PENDING) {
            throw new IllegalStateException(Literals.KYC_UPGRADE_NOT_PENDING_MESSAGE);
        }

        if (request.kycStatus() != KycStatus.APPROVED && request.kycStatus() != KycStatus.REJECTED) {
            throw new IllegalArgumentException(Literals.KYC_REVIEW_STATUS_INVALID_MESSAGE);
        }

        user.setKycStatus(request.kycStatus());
        userRepository.save(user);

        return new AdminReviewKycUpgradeResponse(
                user.getUserId(),
                user.getKycStatus()
        );
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.USER_RESOURCE, userId)); // Throws when user does not exist
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(Literals.PDF_FILE_REQUIRED_MESSAGE);
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        boolean pdfContentType = MediaType.APPLICATION_PDF_VALUE.equalsIgnoreCase(contentType);
        boolean pdfExtension = originalFilename != null
                && originalFilename.toLowerCase().endsWith(Literals.PDF_EXTENSION);

        if (!pdfContentType && !pdfExtension) {
            throw new IllegalArgumentException(Literals.ONLY_PDF_ALLOWED_MESSAGE);
        }
    }

    private String storePdf(
            Long userId,
            MultipartFile file
    ) {
        try {
            Path dirPath = Paths.get(fileConfig.getKycDir(), String.valueOf(userId))
                    .toAbsolutePath()
                    .normalize();

            Files.createDirectories(dirPath);

            String fileName = Literals.KYC_FILE_PREFIX + System.currentTimeMillis() + Literals.PDF_EXTENSION;
            Path targetPath = dirPath.resolve(fileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return targetPath.toString();
        } catch (IOException e) {
            throw new RuntimeException(Literals.KYC_PDF_STORE_FAILED_MESSAGE, e);
        }
    }
}