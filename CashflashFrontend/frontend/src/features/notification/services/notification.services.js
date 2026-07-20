import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"

export const getNotifications = () => {
  return api.get(appConfig.api.endpoints.getNotifications)
}

export const markAsRead = () => {
  return api.put(appConfig.api.endpoints.markNotificationsRead)
}
