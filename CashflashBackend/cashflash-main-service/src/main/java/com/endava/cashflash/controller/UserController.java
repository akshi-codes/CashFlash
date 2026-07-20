package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.SignUpRequest;
import com.endava.cashflash.dto.response.*;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.KycUpgradeService;
import com.endava.cashflash.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.USER_BASE)
// Serves authenticated user profile operations.
public class UserController {

    private final UserService userService; // Service that handles user signup logic
    private final KycUpgradeService kycUpgradeService;

    @PostMapping(ApiPaths.SIGN_UP)
    public SignUpResponse signUp(
            @Valid @RequestBody SignUpRequest request
    ) { // Accepts signup request data
        return userService.signUp(request);  // Returns signup response from service
    }

    @GetMapping(ApiPaths.USER_PAYMENT_METHODS)
    public UserPaymentMethodsResponse getUserPaymentMethods(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return userService.getUserPaymentMethods(principal.getUserId());
    }

    @PostMapping(value = ApiPaths.USER_PROFILE_PICTURE, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SetProfilePictureResponse updateProfilePicture(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestPart("file") MultipartFile file
    ) {
        String url = userService.setProfilePicture(principal.getUserId(), file);
        return new SetProfilePictureResponse(url);
    }

    @PostMapping(value = ApiPaths.USER_KYC_UPGRADE, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadKycUpgradeResponse uploadKycUpgrade(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestPart("file") MultipartFile file
    ) {
        return kycUpgradeService.uploadKycUpgrade(principal.getUserId(), file);
    }

    @GetMapping(ApiPaths.USER_KYC_UPGRADE_STATUS)
    public GetKycUpgradeStatusResponse getKycUpgradeStatus(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return kycUpgradeService.getKycUpgradeStatus(principal.getUserId());
    }

    @GetMapping(value = ApiPaths.USER_KYC_UPGRADE_DOCUMENT, produces = MediaType.APPLICATION_PDF_VALUE)
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> getKycUpgradeDocument(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        org.springframework.core.io.Resource resource = kycUpgradeService.getKycDocument(principal.getUserId());

        return org.springframework.http.ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }
}
