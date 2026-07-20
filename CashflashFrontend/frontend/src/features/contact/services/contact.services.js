import api from "@/lib/axios";
import { appConfig } from "@/config/appConfig";

export const getContacts = () => {
  return api.get(appConfig.api.endpoints.getContacts);
};

export const addContact = (payload) => {
  return api.post(appConfig.api.endpoints.addContact, payload);
};

export const setTrusted = (payload) => {
  return api.put(appConfig.api.endpoints.setTrusted, payload);
};

export const removeTrusted = (payload) => {
  return api.put(appConfig.api.endpoints.removeTrusted, payload);
}
