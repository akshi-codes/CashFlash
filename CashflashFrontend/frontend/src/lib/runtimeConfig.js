const DEFAULT_BACKEND_HOST = "172.26.204.51";

function trimOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getCurrentHostname() {
  if (typeof window === "undefined") {
    return DEFAULT_BACKEND_HOST;
  }

  const hostname = trimOrEmpty(window.location?.hostname);
  return hostname || DEFAULT_BACKEND_HOST;
}

function buildOrigin(port) {
  return `http://${getCurrentHostname()}:${port}`;
}

const sameOriginApi = import.meta.env.VITE_SAME_ORIGIN_API === "true";
const currentOrigin =
  typeof window === "undefined" ? "" : window.location.origin;
const apiOrigin = sameOriginApi
  ? currentOrigin
  : trimOrEmpty(import.meta.env.VITE_API_ORIGIN) || buildOrigin(28080);
const apiBaseUrl = sameOriginApi
  ? "/api"
  : trimOrEmpty(import.meta.env.VITE_API_BASE_URL) || `${apiOrigin}/api`;

const aiOrigin =
  trimOrEmpty(import.meta.env.VITE_AI_API_BASE_URL) ||
  trimOrEmpty(import.meta.env.VITE_AI_BASE_URL) ||
  buildOrigin(28001);

const wsUrl = sameOriginApi
  ? `${currentOrigin}/websocket`
  : trimOrEmpty(import.meta.env.VITE_WS_URL) || `${apiOrigin}/websocket`;

export const runtimeConfig = {
  apiOrigin,
  apiBaseUrl,
  aiOrigin,
  wsUrl,
};
