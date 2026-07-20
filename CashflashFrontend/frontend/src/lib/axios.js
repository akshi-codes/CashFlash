import axios from "axios"
import { runtimeConfig } from "@/lib/runtimeConfig"
import { store } from "@/store/store"

const api = axios.create({
    baseURL: runtimeConfig.apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
})

api.interceptors.request.use(
  config => {
    const token = store.getState().auth.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => Promise.reject(error)
)

export default api
