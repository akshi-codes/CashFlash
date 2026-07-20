package com.endava.cashflash.service.impl;

import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.request.MerchantUpgradeRequest;
import com.endava.cashflash.dto.response.MerchantUpgradeResponse;
import com.endava.cashflash.enums.UserRole;
import com.endava.cashflash.exception.ResourceAlreadyExistsException;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.Merchant;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.MerchantRepository;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.service.NotificationService;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.MerchantService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MerchantServiceImpl implements MerchantService {

    private final MerchantRepository merchantRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    /**
     * Upgrades an existing user to merchant by creating merchant profile and updating user role.
     * @param userId user identifier
     * @param request merchant upgrade details
     * @return merchant upgrade response containing created merchant details
     * @throws ResourceNotFoundException when user is not found
     * @throws ResourceAlreadyExistsException when merchant profile already exists for user
     */
    @Override
    @Transactional
    public MerchantUpgradeResponse upgradeToMerchant(
            Long userId,
            MerchantUpgradeRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId)); // Validates user exists

        if (merchantRepository.existsByUser_userId(user.getUserId())) {
            throw new ResourceAlreadyExistsException("Merchant"); // Prevents duplicate merchant creation
        }

        UserRole oldRole = user.getRole();

        Merchant merchant = new Merchant();
        merchant.setUser(user);
        merchant.setBusinessName(request.businessName());
        merchant.setCategory(request.category());
        merchant.setGstin(request.gstin());
        merchantRepository.save(merchant); // Saves merchant profile

        user.setRole(UserRole.MERCHANT);
        userRepository.save(user); // Updates user role to MERCHANT

        auditLogService.log(
                merchant.getMerchantId(),
                Literals.MERCHANT,
                "MERCHANT_UPGRADE",
                """
                {
                  "USER_ID": "%s",
                  "OLD_ROLE": "%s"
                }
                """.formatted(
                        user.getUserId(),
                        oldRole
                ),
                """
                {
                  "USER_ID": "%s",
                  "BUSINESS_NAME": "%s",
                  "CATEGORY": "%s",
                  "GSTIN": "%s",
                  "NEW_ROLE": "%s",
                  "STATUS": "%s"
                }
                """.formatted(
                        user.getUserId(),
                        merchant.getBusinessName(),
                        merchant.getCategory(),
                        merchant.getGstin(),
                        user.getRole(),
                        "SUCCESSFUL"
                )
        ); // Audit log for merchant upgrade

        notificationService.notification(
                user,
                "Your CashFlash account has been upgraded to merchant successfully.",
                NotificationStatus.UNREAD
        );

        return new MerchantUpgradeResponse(
                merchant.getMerchantId(),
                merchant.getBusinessName(),
                merchant.getCategory(),
                merchant.getGstin()
        );
    }
}
