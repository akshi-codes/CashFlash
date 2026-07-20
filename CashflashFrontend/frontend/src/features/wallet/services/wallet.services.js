import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"

export const getWalletDetailsApi = () => {
  return api.get(appConfig.api.endpoints.getWalletDetails)
}