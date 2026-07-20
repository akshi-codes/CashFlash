import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Send, X, CheckCircle2 } from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { sendPaymentRequestApi } from "@/features/payment-request/services/payment-request.services";
import { getContacts } from "@/features/contact/services/contact.services";

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

const parseAmount = (value) =>
  Number.parseFloat(String(value || "").trim()) || 0;
const amountsMatch = (left, right) => Math.abs(left - right) < 0.005;
const REQUEST_AMOUNT_ERROR = "Amount must be between ₹10 and ₹1,00,000";
const REQUEST_SHARE_ERROR = "Each share must be between ₹10 and ₹1,00,000";

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

export function SendRequestForm({ open, onClose, onSuccess }) {
  const role = useSelector((state) => state.auth.user?.role);
  const isMerchant = role === "MERCHANT";

  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [amountError, setAmountError] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  // Merchant
  const [merchantAlias, setMerchantAlias] = useState("");
  const [merchantSelectedContact, setMerchantSelectedContact] = useState(null);
  const [merchantAmount, setMerchantAmount] = useState("");
  const [merchantExpiryMinutes, setMerchantExpiryMinutes] = useState("2");

  // User
  const [splitMode, setSplitMode] = useState("EQUAL");
  const [userTotalAmount, setUserTotalAmount] = useState("");
  const [participants, setParticipants] = useState([
    { alias: "", selectedContact: null, shareAmount: "" },
    { alias: "", selectedContact: null, shareAmount: "" },
  ]);

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await getContacts();
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadContacts();
  }, [open, loadContacts]);

  const numericMerchantAmount = useMemo(
    () => parseAmount(merchantAmount),
    [merchantAmount],
  );

  const numericUserTotalAmount = useMemo(
    () => parseAmount(userTotalAmount),
    [userTotalAmount],
  );

  const buildExpiresAtIso = () => {
    if (!isMerchant) return null;
    const mins = Number(merchantExpiryMinutes || "0");
    if (!mins || mins < 1) return null;
    return new Date(Date.now() + mins * 60 * 1000).toISOString();
  };

  const getSuggestions = (value) => {
    const v = (value || "").trim().toLowerCase();
    if (!v) return [];
    return (Array.isArray(contacts) ? contacts : []).filter((c) =>
      (c?.alias || "").toLowerCase().includes(v),
    );
  };

  const computedUserParticipants = useMemo(() => {
    if (isMerchant) return [];

    const cleaned = participants
      .filter((p) => p.selectedContact)
      .map((p) => ({
        identifierType: p.selectedContact.identifierType,
        identifierValue: p.selectedContact.identifierValue,
        shareAmount: parseAmount(p.shareAmount),
      }));

    if (
      splitMode === "EQUAL" &&
      cleaned.length > 0 &&
      numericUserTotalAmount > 0
    ) {
      const perHead =
        Math.floor((numericUserTotalAmount / cleaned.length) * 100) / 100;
      return cleaned.map((p) => ({ ...p, shareAmount: perHead }));
    }

    return cleaned;
  }, [participants, splitMode, numericUserTotalAmount, isMerchant]);

  const userSharesSum = computedUserParticipants.reduce(
    (acc, p) => acc + p.shareAmount,
    0,
  );

  const canSubmit = useMemo(() => {
    if (amountError) return false;

    if (isMerchant) {
      return Boolean(merchantSelectedContact) && numericMerchantAmount > 0;
    }

    if (!numericUserTotalAmount || computedUserParticipants.length < 1)
      return false;

    if (participants.some((p) => !p.selectedContact)) return false;

    if (splitMode === "CUSTOM") {
      return (
        amountsMatch(userSharesSum, numericUserTotalAmount) &&
        computedUserParticipants.every((p) => p.shareAmount > 0)
      );
    }

    return true;
  }, [
    isMerchant,
    merchantSelectedContact,
    numericMerchantAmount,
    numericUserTotalAmount,
    computedUserParticipants,
    splitMode,
    userSharesSum,
    participants,
    amountError,
  ]);

  const handleAddParticipant = () => {
    setParticipants((prev) => [
      ...prev,
      { alias: "", selectedContact: null, shareAmount: "" },
    ]);
  };

  const handleRemoveParticipant = (idx) => {
    setParticipants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateParticipant = (idx, patch) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    );
  };

  const resetForm = () => {
    setMessage("");
    setError("");
    setAmountError("");
    setMerchantAlias("");
    setMerchantSelectedContact(null);
    setMerchantAmount("");
    setMerchantExpiryMinutes("2");
    setSplitMode("EQUAL");
    setUserTotalAmount("");
    setParticipants([
      { alias: "", selectedContact: null, shareAmount: "" },
      { alias: "", selectedContact: null, shareAmount: "" },
    ]);
  };

  const handleSubmit = async () => {
    setError("");

    try {
      setSubmitting(true);

      if (isMerchant) {
        if (!merchantSelectedContact) {
          setError("Contact not found");
          return;
        }

        if (numericMerchantAmount < 10 || numericMerchantAmount > 100000) {
          setError("Amount must be between ₹10 and ₹1,00,000");
          return;
        }

        await sendPaymentRequestApi({
          totalAmount: numericMerchantAmount,
          expiresAt: buildExpiresAtIso(),
          message,
          participants: [
            {
              identifierType: merchantSelectedContact.identifierType,
              identifierValue: merchantSelectedContact.identifierValue,
              shareAmount: numericMerchantAmount,
            },
          ],
        });
      } else {
        if (participants.some((p) => !p.selectedContact)) {
          setError("Please select all participants from your contacts");
          return;
        }

        if (numericUserTotalAmount < 10 || numericUserTotalAmount > 100000) {
          setError("Amount must be between ₹10 and ₹1,00,000");
          return;
        }

        if (
          splitMode === "CUSTOM" &&
          !amountsMatch(userSharesSum, numericUserTotalAmount)
        ) {
          setError("Sum of splits must equal total amount");
          return;
        }

        if (
          splitMode === "CUSTOM" &&
          computedUserParticipants.some(
            (participant) =>
              participant.shareAmount < 10 || participant.shareAmount > 100000,
          )
        ) {
          setError("Each share must be between ₹10 and ₹1,00,000");
          return;
        }

        await sendPaymentRequestApi({
          totalAmount: numericUserTotalAmount,
          expiresAt: null,
          message,
          participants: computedUserParticipants,
        });
      }

      setShowSuccess(true);

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        onClose?.();
      }, 1800);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to send payment request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm p-3">
      <div className="w-full max-w-140 md:max-w-140 h-[85vh] md:h-[75vh] rounded-2xl border bg-card shadow-xl relative animate-in scale-in duration-200 flex flex-col">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            if (submitting || showSuccess) return;
            setError("");
            onClose?.();
          }}
          className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
          disabled={submitting || showSuccess}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Send className="h-5 w-5 text-muted-foreground" />
            <span className="text-md font-medium">New Payment Request</span>
          </div>

          {loadingContacts ? (
            <p className="text-xs text-muted-foreground font-medium mt-3">
              Loading contacts...
            </p>
          ) : null}

          {error ? (
            <p className="text-xs text-red-600 font-medium mt-3">{error}</p>
          ) : null}
        </div>

        <div className="flex-1 min-h-0 px-6 pb-6">
          <ScrollArea className="h-full pr-2 **:data-radix-scroll-area-scrollbar:hidden">
            <div className="grid gap-5">
              {isMerchant ? (
                <div className="grid gap-4">
                  <div className="grid gap-2 relative">
                    <Label>Request from</Label>
                    <Input
                      value={merchantAlias}
                      onChange={(e) => {
                        setMerchantAlias(e.target.value);
                        setMerchantSelectedContact(null);
                      }}
                      placeholder="Type alias..."
                      disabled={submitting || showSuccess}
                    />

                    {merchantAlias &&
                    !merchantSelectedContact &&
                    getSuggestions(merchantAlias).length === 0 ? (
                      <p className="text-xs text-red-600 font-medium">
                        Contact not found
                      </p>
                    ) : null}

                    {!merchantSelectedContact &&
                    getSuggestions(merchantAlias).length > 0 ? (
                      <div className="absolute z-20 top-18 w-full bg-card border rounded-md shadow overflow-hidden">
                        {getSuggestions(merchantAlias)
                          .slice(0, 8)
                          .map((c) => (
                            <div
                              key={c.contactId}
                              className="px-3 py-2 hover:bg-muted cursor-pointer"
                              onClick={() => {
                                setMerchantAlias(c.alias);
                                setMerchantSelectedContact(c);
                              }}
                            >
                              <div className="font-medium">{c.alias}</div>
                              <div className="text-xs text-muted-foreground">
                                {c.identifierType} • {c.identifierValue}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <Label>Amount</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={merchantAmount}
                      onChange={(e) => {
                        const value = clampAmountInput(e.target.value, 100000);
                        setMerchantAmount(value);

                        if (!value) {
                          setAmountError("");
                          return;
                        }

                        const numericValue = parseAmount(value);
                        if (numericValue < 10 || numericValue > 100000) {
                          setAmountError(REQUEST_AMOUNT_ERROR);
                        } else {
                          setAmountError("");
                        }
                      }}
                      disabled={submitting || showSuccess}
                    />
                    <p className="text-xs text-muted-foreground">
                      Min ₹10 · Max ₹1,00,000
                    </p>
                    <div className="min-h-4">
                      {amountError && (
                        <p className="text-xs font-medium text-red-600">
                          {amountError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Set expiry</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Minutes"
                        value={merchantExpiryMinutes}
                        onChange={(e) =>
                          setMerchantExpiryMinutes(
                            e.target.value.replace(/[^\d]/g, ""),
                          )
                        }
                        disabled={submitting || showSuccess}
                      />
                      <div className="sm:col-span-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Expires at
                        </span>
                        <span className="font-medium">
                          {buildExpiresAtIso()
                            ? new Date(buildExpiresAtIso()).toLocaleString()
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default is 2 minutes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Total Amount</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Enter total amount"
                      value={userTotalAmount}
                      onChange={(e) => {
                        const value = clampAmountInput(e.target.value, 100000);
                        setUserTotalAmount(value);

                        if (!value) {
                          setAmountError("");
                          return;
                        }

                        const numericValue = parseAmount(value);
                        if (numericValue < 10 || numericValue > 100000) {
                          setAmountError(REQUEST_AMOUNT_ERROR);
                        } else {
                          setAmountError("");
                        }
                      }}
                      disabled={submitting || showSuccess}
                    />
                    <p className="text-xs text-muted-foreground">
                      Min ₹10 · Max ₹1,00,000
                    </p>
                    <div className="min-h-4">
                      {amountError && (
                        <p className="text-xs font-medium text-red-600">
                          {amountError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 mt-3">
                    <Label>Split Mode</Label>
                    <RadioGroup
                      value={splitMode}
                      onValueChange={setSplitMode}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                      disabled={submitting || showSuccess}
                    >
                      <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                        <RadioGroupItem value="EQUAL" id="split-equal" />
                        <div className="leading-tight">
                          <p className="font-medium">Equal Split</p>
                          <p className="text-xs text-muted-foreground pt-1">
                            Auto divides total across recipients
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                        <RadioGroupItem value="CUSTOM" id="split-custom" />
                        <div className="leading-tight">
                          <p className="font-medium">Custom Split</p>
                          <p className="text-xs text-muted-foreground pt-1">
                            You enter each share amount
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <Label>Participants</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddParticipant}
                        className="gap-2"
                        disabled={submitting || showSuccess}
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      {participants.map((p, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border p-3 bg-muted/20 relative"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                            <div className="sm:col-span-5 grid gap-2 relative">
                              <Label className="text-xs text-muted-foreground">
                                Recipient Alias
                              </Label>
                              <Input
                                placeholder="Type alias..."
                                value={p.alias}
                                onChange={(e) =>
                                  handleUpdateParticipant(idx, {
                                    alias: e.target.value,
                                    selectedContact: null,
                                  })
                                }
                                disabled={submitting || showSuccess}
                              />

                              {p.alias &&
                              !p.selectedContact &&
                              getSuggestions(p.alias).length === 0 ? (
                                <p className="text-xs text-red-600 font-medium">
                                  Contact not found
                                </p>
                              ) : null}

                              {!p.selectedContact &&
                              getSuggestions(p.alias).length > 0 ? (
                                <div className="absolute z-20 top-17 w-full bg-card border rounded-md shadow overflow-hidden">
                                  {getSuggestions(p.alias)
                                    .slice(0, 8)
                                    .map((c) => (
                                      <div
                                        key={c.contactId}
                                        className="px-3 py-2 hover:bg-muted cursor-pointer"
                                        onClick={() =>
                                          handleUpdateParticipant(idx, {
                                            alias: c.alias,
                                            selectedContact: c,
                                          })
                                        }
                                      >
                                        <div className="font-medium">
                                          {c.alias}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {c.identifierType} •{" "}
                                          {c.identifierValue}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="sm:col-span-5 grid gap-2">
                              <Label className="text-xs text-muted-foreground">
                                Share Amount
                              </Label>
                              <Input
                                placeholder={
                                  splitMode === "EQUAL" ? "Auto" : "Enter share"
                                }
                                disabled={
                                  splitMode === "EQUAL" ||
                                  submitting ||
                                  showSuccess
                                }
                                inputMode="decimal"
                                value={
                                  splitMode === "EQUAL"
                                    ? Number(
                                        computedUserParticipants[idx]
                                          ?.shareAmount || 0,
                                      ).toLocaleString("en-IN")
                                    : p.shareAmount
                                }
                                onChange={(e) => {
                                  const value = clampAmountInput(
                                    e.target.value,
                                    100000,
                                  );

                                  handleUpdateParticipant(idx, {
                                    shareAmount: value,
                                  });

                                  if (!value) {
                                    setAmountError("");
                                    return;
                                  }

                                  const numericValue = parseAmount(value);
                                  if (
                                    numericValue < 10 ||
                                    numericValue > 100000
                                  ) {
                                    setAmountError(REQUEST_SHARE_ERROR);
                                  } else {
                                    setAmountError("");
                                  }
                                }}
                              />
                            </div>

                            <div className="sm:col-span-2 flex sm:justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveParticipant(idx)}
                                className="text-red-600 hover:bg-red-500/10"
                                disabled={
                                  participants.length <= 1 ||
                                  submitting ||
                                  showSuccess
                                }
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border p-3 text-sm space-y-1 bg-muted/40">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Recipients
                        </span>
                        <span>{computedUserParticipants.length || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-medium">
                          ₹{" "}
                          {Number(numericUserTotalAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Split Sum</span>
                        <span
                          className={
                            splitMode === "CUSTOM" &&
                            !amountsMatch(userSharesSum, numericUserTotalAmount)
                              ? "text-red-600 font-medium"
                              : "font-medium"
                          }
                        >
                          ₹ {Number(userSharesSum || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {splitMode === "CUSTOM" &&
                        !amountsMatch(
                          userSharesSum,
                          numericUserTotalAmount,
                        ) && (
                          <p className="text-xs text-red-600 font-medium pt-1">
                            Sum of shares must equal total amount
                          </p>
                        )}
                      {splitMode === "CUSTOM" && amountError && (
                        <p className="text-xs text-red-600 font-medium pt-1">
                          {amountError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="What is this request for?"
                  className="min-h-24"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={submitting || showSuccess}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting || showSuccess}
              >
                {submitting ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Success Overlay*/}
        {showSuccess && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center
            rounded-2xl bg-green-500/20 dark:bg-green-700/20
            backdrop-blur-md animate-fade-in"
          >
            <CheckCircle2 className="h-10 w-10 mb-2 text-green-700 dark:text-green-400 animate-bounce" />
            <p className="font-bold text-lg text-green-700 dark:text-green-300">
              Request Sent!
            </p>
            <span className="text-sm text-green-600 dark:text-green-200">
              Your payment request has been created
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
