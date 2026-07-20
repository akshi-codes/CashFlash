import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,        // { fullName, email, phoneNumber, role, profileimageurl, isPinSet }
  token: null,
  isLoggedIn: false,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth: (state, action) => {
      const { user, token } = action.payload || {};
      state.user = user || null;
      state.token = token || null;
      state.isLoggedIn = Boolean(token);
      state.isHydrated = true;
    },
    setAuth: (state, action) => {
      const { user, token } = action.payload || {};
      state.user = user ?? state.user ?? null;
      state.token = token ?? state.token ?? null;
      state.isLoggedIn = Boolean(state.token);
      state.isHydrated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.isHydrated = true;
    },
    updateUser: (state, action) => {
      state.user = { ...(state.user || {}), ...(action.payload || {}) };
      state.isHydrated = true;
    },
  },
});

export const { hydrateAuth, setAuth, clearAuth, updateUser } = authSlice.actions;
export default authSlice.reducer;
