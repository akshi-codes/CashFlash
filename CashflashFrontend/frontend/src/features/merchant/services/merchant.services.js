import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"

export const upgradeToMerchant = (payload) => {
    return api.post(appConfig.api.endpoints.upgradeToMerchant, payload)
}