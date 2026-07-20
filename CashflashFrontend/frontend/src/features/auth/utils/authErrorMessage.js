const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Incorrect username or password",
  INVALID_EMAIL: "Invalid email",
  INVALID_OTP: "Invalid OTP",
  OTP_EXPIRED: "OTP expired",
  OTP_ATTEMPTS_EXCEEDED: "Too many OTP attempts",
  OTP_NOT_VERIFIED: "OTP not verified",
  NO_OTP_REQUESTED: "Request OTP first",
  WEAK_PASSWORD: "Weak password",
  INVALID_PIN: "Invalid PIN",
  RESOURCE__EXISTS: "Already exists",
};

const STATUS_FALLBACKS = {
  400: "Invalid request",
  401: "Invalid credentials",
  404: "Not found",
  409: "Conflict",
  422: "Invalid input",
};

const BACKEND_MESSAGE_OVERRIDES = {
  "Email does not exist": "Email does not exist",
  "Invalid email or password": "Incorrect username or password",
};

export function getAuthErrorMessage(error, fallback = "Request failed") {
  const code = error?.response?.data?.errorCode;
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message;

  if (backendMessage && BACKEND_MESSAGE_OVERRIDES[backendMessage]) {
    return BACKEND_MESSAGE_OVERRIDES[backendMessage];
  }

  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  if (typeof backendMessage === "string" && backendMessage.trim()) {
    return backendMessage.trim().slice(0, 32);
  }

  if (status && STATUS_FALLBACKS[status]) {
    return STATUS_FALLBACKS[status];
  }

  return fallback;
}
