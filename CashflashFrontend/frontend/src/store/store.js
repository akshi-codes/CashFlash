import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/state/authSlice"
import walletReducer from "@/features/wallet/state/walletSlice";
import {
  clearPersistedAuth,
  persistAuth,
} from "@/features/auth/state/authStorage";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
  },
});

let previousToken = store.getState().auth.token;
let previousUser = store.getState().auth.user;

store.subscribe(() => {
  const { auth } = store.getState();

  if (!auth.isHydrated) {
    return;
  }

  if (!auth.token) {
    if (previousToken || previousUser) {
      clearPersistedAuth();
    }
  } else if (auth.token !== previousToken || auth.user !== previousUser) {
    persistAuth({
      token: auth.token,
      user: auth.user,
    });
  }

  previousToken = auth.token;
  previousUser = auth.user;
});
