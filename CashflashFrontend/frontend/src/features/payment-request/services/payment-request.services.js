import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"

export const sendPaymentRequestApi = (payload) => {
  return api.post(appConfig.api.endpoints.sendPaymentRequest, payload)
}

export const respondToPaymentRequestApi = (payload) => {
  return api.put(appConfig.api.endpoints.respondToPaymentRequest, payload)
}

export const cancelPaymentRequestApi = (payload) => {
  return api.put(appConfig.api.endpoints.cancelPaymentRequest, payload)
}

export const getAllPaymentRequestApi = () => {
  return api.get(appConfig.api.endpoints.getAllPaymentRequests)
}

export const sendRequest = (payload) => {
  return api.post(appConfig.api.endpoints.sendPaymentRequest, payload)
}



