const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_USER_KEY = "authUser";

function readJson(key) {
  const value = localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function readPersistedAuth() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  return {
    token,
    user: token ? readJson(AUTH_USER_KEY) : null,
  };
}

export function persistAuth({ token, user }) {
  if (!token) {
    clearPersistedAuth();
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);

  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return;
  }

  localStorage.removeItem(AUTH_USER_KEY);
}

export function clearPersistedAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
