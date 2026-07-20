package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.AdminReviewKycUpgradeRequest;
import com.endava.cashflash.dto.response.AdminReviewKycUpgradeResponse;
import com.endava.cashflash.dto.response.GetKycUpgradeStatusResponse;
import com.endava.cashflash.dto.response.PendingKycUpgradeResponse;
import com.endava.cashflash.dto.response.UploadKycUpgradeResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// Defines the KYC upload, review, and document-access flow.
public interface KycUpgradeService {

    UploadKycUpgradeResponse uploadKycUpgrade(Long userId, MultipartFile file);

    GetKycUpgradeStatusResponse getKycUpgradeStatus(Long userId);

    Resource getKycDocument(Long userId);

    List<PendingKycUpgradeResponse> getPendingKycUpgrades();

    AdminReviewKycUpgradeResponse reviewKycUpgrade(AdminReviewKycUpgradeRequest request);
}
