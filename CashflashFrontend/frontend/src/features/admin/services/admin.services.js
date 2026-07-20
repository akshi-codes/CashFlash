import { appConfig } from "@/config/appConfig"
import api from "@/lib/axios"

export const adminOverviewApi = () => {
    return api.get(appConfig.api.endpoints.adminOverview)
}

export const getAllUsersApi = () => {
    return api.get(appConfig.api.endpoints.getAllUsers)
}

export const activateUserApi = (payload) => {
    return api.put(appConfig.api.endpoints.activateUser, payload)
}

export const deactivateUserApi = (payload) => {
    return api.put(appConfig.api.endpoints.deactivateUser, payload)
}