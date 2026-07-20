import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"

export const getTransactions = () => {
  return api.get(appConfig.api.endpoints.getTransactions)
}

export const getAllTransactions = () => {
  return api.get(appConfig.api.endpoints.getAllTransactions)
}

export const getLastTransaction = () => {
  return api.get(appConfig.api.endpoints.getLastTransaction)
}

export const topupWallet = (payload, idempotencyKey) => {
  return api.post(appConfig.api.endpoints.topupWallet, payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  })
}

export const withdrawWallet = (payload, idempotencyKey) => {
  return api.post(appConfig.api.endpoints.withdrawWallet, payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  })
}

export const sendMoney = (payload, idempotencyKey) => {
  return api.post(appConfig.api.endpoints.sendMoney, payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  })
}