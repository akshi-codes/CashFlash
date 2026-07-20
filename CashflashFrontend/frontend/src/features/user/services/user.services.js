import axios from "axios"
import api from "@/lib/axios"
import { appConfig } from "@/config/appConfig"
import { runtimeConfig } from "@/lib/runtimeConfig"
import { store } from "@/store/store"

export const signupApi = (payload) => {
  return api.post(appConfig.api.endpoints.signup, payload)
}

export const loginApi = (payload) => {
  return api.post(appConfig.api.endpoints.login, payload)
}

export const GetOtpApi = (payload) => {
  return api.post(appConfig.api.endpoints.getOtp, payload)
}

export const VerifyOtpApi = (payload) => {
  return api.post(appConfig.api.endpoints.verifyOtp, payload)
}

export const ResetPasswordApi = (payload) => {
  return api.post(appConfig.api.endpoints.resetPassword, payload)
}

export const setPin = (payload) => {
  return api.post(appConfig.api.endpoints.setPin, payload)
}

export const verifyPin = (payload) => {
  return api.post(appConfig.api.endpoints.verifyPin, payload).then((res) => res.data)
}

export const setProfilePictureApi = (payload) => {
  const token = store.getState().auth.token;
  return axios.post(
    `${runtimeConfig.apiBaseUrl}${appConfig.api.endpoints.setProfilePicture}`,
    payload,
    {
      withCredentials: false,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
};
