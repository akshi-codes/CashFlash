import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"

export const getPaymentMethodDetails = () => {
  return api.get(appConfig.api.endpoints.getPaymentMethodDetails)
}