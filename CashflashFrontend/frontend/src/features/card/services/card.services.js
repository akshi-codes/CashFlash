import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"

export const addCard = (payload) => {
  return api.post(appConfig.api.endpoints.addCard, payload)
}

export const setDefaultCard = (cardId) => {
  return api.put(appConfig.api.endpoints.setDefaultPaymentMethod, {
    type: appConfig.enums.paymentMethodType.card,
    methodId: cardId,
  })
}

export const deactivateCard = (cardId) => {
  return api.put(appConfig.api.endpoints.deactivatePaymentMethod, {
    type: appConfig.enums.paymentMethodType.card,
    methodId: cardId,
  })
}

export const activateCard = (cardId) => {
  return api.put(appConfig.api.endpoints.activatePaymentMethod, {
    type: appConfig.enums.paymentMethodType.card,
    methodId: cardId,
  })
}
