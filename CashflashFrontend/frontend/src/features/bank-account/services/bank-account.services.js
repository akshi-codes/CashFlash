import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"

export const addBankAccount = (payload) => {
  return api.post(appConfig.api.endpoints.addBankAccount, payload)
}

export const setDefaultBankAccount = (bankAccountId) => {
  return api.put(appConfig.api.endpoints.setDefaultPaymentMethod, {
    type: appConfig.enums.paymentMethodType.bankAccount,
    methodId: bankAccountId,
  })
}

export const deactivateAccount = (bankAccountId) => {
  return api.put(appConfig.api.endpoints.deactivatePaymentMethod, {
    type: appConfig.enums.paymentMethodType.bankAccount,
    methodId: bankAccountId,
  })
}

export const activateAccount = (bankAccountId) => {
  return api.put(appConfig.api.endpoints.activatePaymentMethod, {
    type: appConfig.enums.paymentMethodType.bankAccount,
    methodId: bankAccountId,
  })
}

export const getBalance = (bankAccountId) => {
  return api.post(appConfig.api.endpoints.getBalance, {bankAccountId})
}
