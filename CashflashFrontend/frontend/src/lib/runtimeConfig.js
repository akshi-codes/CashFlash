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

const apiOrigin =
  trimOrEmpty(import.meta.env.VITE_API_ORIGIN) || buildOrigin(8080);
const apiBaseUrl =
  trimOrEmpty(import.meta.env.VITE_API_BASE_URL) || `${apiOrigin}/api`;

const aiOrigin =
  trimOrEmpty(import.meta.env.VITE_AI_API_BASE_URL) ||
  trimOrEmpty(import.meta.env.VITE_AI_BASE_URL) ||
  buildOrigin(8001);

const wsUrl =
  trimOrEmpty(import.meta.env.VITE_WS_URL) || `${apiOrigin}/websocket`;

export const runtimeConfig = {
  apiOrigin,
  apiBaseUrl,
  aiOrigin,
  wsUrl,
};
