import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getWalletDetailsApi } from "@/features/wallet/services/wallet.services";

export const fetchWalletBalance = createAsyncThunk(
  "wallet/fetchBalance",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getWalletDetailsApi();
      return res.data.balance; // <-- only return balance
    } catch (err) {
      return rejectWithValue("Failed to load wallet balance", err);
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
    balance: null,
    status: "idle",
    error: null,
  },
  reducers: {
    setBalance: (state, action) => {
      state.balance = action.payload;
    },
    clearBalance: (state) => {
      state.balance = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletBalance.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload;
      })
      .addCase(fetchWalletBalance.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { setBalance, clearBalance } = walletSlice.actions;
export default walletSlice.reducer;