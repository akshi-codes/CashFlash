import api from "@/lib/axios";
import { appConfig } from "@/config/appConfig";

export const uploadKycUpgradeApi = (payload) => {
  return api.post(appConfig.api.endpoints.kycUpgrade, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getKycUpgradeStatusApi = () => {
  return api.get(appConfig.api.endpoints.getKycUpgradeStatus);
};

export const getKycUpgradeDocumentApi = () => {
  return api.get(appConfig.api.endpoints.getKycUpgradeDocument, {
    responseType: "blob",
  });
};

export const getAdminPendingKycUpgradesApi = () => {
  return api.get(appConfig.api.endpoints.adminPendingKycUpgrades);
};

export const reviewKycUpgradeApi = (payload) => {
  return api.post(appConfig.api.endpoints.adminReviewKycUpgrade, payload);
};

export const getAdminKycUpgradeDocumentApi = (userId) => {
  return api.get(appConfig.api.endpoints.adminGetKycUpgradeDocument, {
    params: { userId },
    responseType: "blob",
  });
};