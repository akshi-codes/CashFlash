import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, CheckCircle2, BanknoteArrowUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPaymentMethodDetails } from "@/features/payment-methods/services/payment-methods.services";
import { withdrawWallet } from "@/features/transaction/services/transaction.services";
import { VerifyPinCard } from "@/features/auth/components/VerifyPinCard";
import sbi from "@/assets/bank-logos/SBIN.NS.png";
import can from "@/assets/bank-logos/CANBK.NS.png";
import bob from "@/assets/bank-logos/BANKBARODA.NS.png";
import ind from "@/assets/bank-logos/BANKINDIA.NS.png";
import pnb from "@/assets/bank-logos/PNB.NS.png";
import uni from "@/assets/bank-logos/UNIONBANK.NS.png";
import { generateClientUuid } from "@/lib/uuid";

const normalizeDecimalAmountInput = (raw) => {
  let value = String(raw || "").replace(/[^\d.]/g, "");
  const firstDotIndex = value.indexOf(".");

  if (firstDotIndex !== -1) {
    const integerPart = value.slice(0, firstDotIndex + 1);
    const fractionalPart = value
      .slice(firstDotIndex + 1)
      .replace(/\./g, "")
      .slice(0, 2);
    value = `${integerPart}${fractionalPart}`;
  }

  return value;
};

const parseAmount = (value) => Number.parseFloat(String(value || "").trim()) || 0;

const clampAmountInput = (raw, max) => {
  const normalized = normalizeDecimalAmountInput(raw);

  if (!normalized) {
    return "";
  }

  const numericValue = parseAmount(normalized);
  if (!numericValue) {
    return normalized;
  }

  return numericValue > max ? String(max) : normalized;
};

export function WithdrawMoneyCard({ onClose, onSuccess }) {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusNotice, setStatusNotice] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [showPinVerify, setShowPinVerify] = useState(false);

  const idempotencyKeyRef = useRef("");

  useEffect(() => {
    fetchBanks();
  }, []);

  const bankLogos = useMemo(
    () => ({
      "State Bank of India": sbi,
      "Canara Bank": can,
      "Bank of Baroda": bob,
      "Bank of India": ind,
      "Punjab National Bank": pnb,
      "Union Bank of India": uni,
    }),
    [],
  );

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await getPaymentMethodDetails();
      const data = res.data;

      const bankSources = data.bankAccounts
        .filter((b) => b.isActive)
        .map((b) => ({
          id: b.bankAccountId,
          label: b.bankName,
          last4: b.last4,
          isDefault: b.isDefault,
        }));

      setBanks(bankSources);

      const defaultBank = bankSources.find((b) => b.isDefault);
      if (defaultBank) {
        setSelectedBank(String(defaultBank.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusNoticeClassName = (status) => {
    if (status === "FAILED") {
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
    }

    return "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300";
  };

  const selectedItem = banks.find((b) => String(b.id) === selectedBank);

  const handleWithdraw = async () => {
    const numericAmount = parseAmount(amount);

    if (numericAmount < 10 || numericAmount > 50000) {
      setError("Amount must be between ₹10 and ₹50,000");
      return;
    }

    if (!selectedBank) {
      setError("Please select a bank account");
      return;
    }

    setError("");
    setStatusNotice(null);
    idempotencyKeyRef.current = generateClientUuid();
    setShowPinVerify(true);
  };

  const handlePinSuccess = async () => {
    setShowPinVerify(false);
    setSubmitting(true);
    setError("");
    setStatusNotice(null);

    try {
      const res = await withdrawWallet(
        {
          bankAccountId: Number(selectedBank),
          amount: parseAmount(amount),
        },
        idempotencyKeyRef.current,
      );

      const status = String(res?.data?.status || "").toUpperCase();

      if (status !== "SUCCESSFUL") {
        if (status === "FAILED") {
          setError("Withdrawal failed (insufficient wallet balance)");
          return;
        }

        setStatusNotice({
          status,
          message: `Withdrawal is currently ${status.toLowerCase()}. Please check your bank or transaction history in a moment.`,
        });
        return;
      }

      setSuccessAmount(parseAmount(amount));
      setShowSuccess(true);

      if (onSuccess) onSuccess(parseAmount(amount));

      setTimeout(() => onClose(), 2000);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Wallet withdrawal failed";
      setError(message);
      console.error("wallet withdraw failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm">
      <div className="absolute inset-0" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative h-125 w-100 max-w-[90%] rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="mb-6 flex items-center gap-2 pr-10">
            <BanknoteArrowUp className="h-6 w-6 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Withdraw Money</h2>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label>Select bank account</Label>
              <Select
                value={selectedBank}
                onValueChange={(v) => {
                  setSelectedBank(v);
                  setError("");
                }}
                disabled={loading || showSuccess || submitting}
              >
                <SelectTrigger>
                  {selectedItem ? (
                    <div className="flex items-center gap-2">
                      {bankLogos[selectedItem.label] ? (
                        <img
                          src={bankLogos[selectedItem.label]}
                          alt={selectedItem.label}
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded bg-muted" />
                      )}
                      <span className="text-sm font-medium">
                        {selectedItem.label}
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Choose bank account" />
                  )}
                </SelectTrigger>

                <SelectContent className="max-h-60 overflow-y-auto">
                  {banks.map((b) => {
                    const logo = bankLogos[b.label];
                    return (
                      <SelectItem key={b.id} value={String(b.id)}>
                        <div className="flex w-full items-center gap-3 rounded-md px-2 py-1 transition hover:bg-muted/50">
                          {logo ? (
                            <img
                              src={logo}
                              alt={`${b.label} logo`}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded bg-muted" />
                          )}

                          <div className="flex flex-1 flex-col leading-tight">
                            <span className="text-sm font-medium">{b.label}</span>
                            <span className="text-xs text-muted-foreground">
                              •••• {b.last4}
                            </span>
                          </div>

                          {b.isDefault && (
                            <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400">
                              Default
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Money will be credited to the selected bank account
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                disabled={showSuccess || submitting}
                onChange={(e) => {
                  const val = clampAmountInput(e.target.value, 50000);
                  setAmount(val);

                  if (!val) {
                    setError("");
                    return;
                  }

                  const num = parseAmount(val);
                  if (num >= 10 && num <= 50000) setError("");
                  else setError("Amount must be between ₹10 and ₹50,000");
                }}
                placeholder="Enter amount"
              />
              <p className="text-xs text-muted-foreground">
                Min ₹10 · Max ₹50,000
              </p>
              <div className="min-h-4">
                {error && (
                  <p className="text-xs font-medium text-red-600">{error}</p>
                )}
              </div>
            </div>

            {statusNotice && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${getStatusNoticeClassName(statusNotice.status)}`}
              >
                {statusNotice.message}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000, 5000].map((v) => (
                <Button
                  key={v}
                  variant="outline"
                  size="sm"
                  disabled={showSuccess || submitting}
                  onClick={() => {
                    setAmount(String(v));
                    setError("");
                  }}
                >
                  ₹{v.toLocaleString()}
                </Button>
              ))}
            </div>

            <div className="space-y-1 rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span>
                  {selectedItem
                    ? `${selectedItem.label} •••• ${selectedItem.last4}`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Amount</span>
                <span>₹ {Number(amount || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={
                !selectedBank || !amount || !!error || showSuccess || submitting
              }
              onClick={handleWithdraw}
            >
              {submitting ? "Processing..." : "Withdraw"}
            </Button>
          </div>

          {showSuccess && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-green-500/20 backdrop-blur-sm animate-fade-in dark:bg-green-700/20">
              <CheckCircle2 className="mb-2 h-10 w-10 animate-bounce text-green-700 dark:text-green-400" />
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                ₹{successAmount.toLocaleString("en-IN")} Withdrawn!
              </p>
              <span className="px-4 text-center text-sm text-green-600 dark:text-green-200">
                Your wallet has been updated
              </span>
            </div>
          )}

          {showPinVerify && !showSuccess && (
            <VerifyPinCard
              open={showPinVerify}
              onClose={() => setShowPinVerify(false)}
              onSuccess={handlePinSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
