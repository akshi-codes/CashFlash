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
import {
  Send,
  X,
  Wallet,
  Landmark,
  CreditCard,
  CheckCircle2,
  Mic,
  Square,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPaymentMethodDetails } from "@/features/payment-methods/services/payment-methods.services";
import { sendMoney } from "@/features/transaction/services/transaction.services";
import { VerifyPinCard } from "@/features/auth/components/VerifyPinCard";
import { parseVoiceSendMoney } from "@/features/ai/services/ai_chat.services";

/* ===================== BANK LOGOS ===================== */
import sbi from "@/assets/bank-logos/SBIN.NS.png";
import can from "@/assets/bank-logos/CANBK.NS.png";
import bob from "@/assets/bank-logos/BANKBARODA.NS.png";
import ind from "@/assets/bank-logos/BANKINDIA.NS.png";
import pnb from "@/assets/bank-logos/PNB.NS.png";
import uni from "@/assets/bank-logos/UNIONBANK.NS.png";

/* ===================== CARD PROVIDER ICONS ===================== */
import visa from "@/assets/card-logos/V.png";
import mast from "@/assets/card-logos/MA.png";
import rupy from "@/assets/card-logos/RUPAY.png";
import amex from "@/assets/card-logos/AXP.png";
import { generateClientUuid } from "@/lib/uuid";

const bankLogoMap = {
  "State Bank of India": sbi,
  "Canara Bank": can,
  "Bank of Baroda": bob,
  "Bank of India": ind,
  "Punjab National Bank": pnb,
  "Union Bank of India": uni,
};

const cardProviderMap = {
  VISA: visa,
  MASTERCARD: mast,
  RUPAY: rupy,
  AMERICAN_EXPRESS: amex,
};

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

export function SendMoneyCard({ onClose, onWalletChanged }) {
  const [identifier, setIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [error, setError] = useState("");
  const [statusNotice, setStatusNotice] = useState(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceNotice, setVoiceNotice] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isParsingVoice, setIsParsingVoice] = useState(false);

  const [banks, setBanks] = useState([]);
  const [cards, setCards] = useState([]);

  const [selectedBank, setSelectedBank] = useState("");
  const [selectedCard, setSelectedCard] = useState("");

  const [loading, setLoading] = useState(true);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceAbortRef = useRef(null);

  useEffect(() => {
    async function loadMethods() {
      try {
        const res = await getPaymentMethodDetails();

        const activeBanks =
          res.data.bankAccounts?.filter((b) => b.isActive) || [];
        const activeCards = res.data.cards?.filter((c) => c.isActive) || [];

        setBanks(activeBanks);
        setCards(activeCards);

        const defaultBank = activeBanks.find((b) => b.isDefault);
        if (defaultBank) setSelectedBank(String(defaultBank.bankAccountId));

        const defaultCard = activeCards.find((c) => c.isDefault);
        if (defaultCard) setSelectedCard(String(defaultCard.cardId));
      } catch (e) {
        console.error("Failed to load payment methods", e);
      } finally {
        setLoading(false);
      }
    }

    loadMethods();
  }, []);

  useEffect(() => {
    return () => {
      if (voiceAbortRef.current) {
        voiceAbortRef.current.abort();
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      stopRecordingTracks();
    };
  }, []);

  const getStatusTone = (status) => {
    if (status === "SUCCESSFUL") return "success";
    if (status === "FAILED") return "failure";
    return "warning";
  };

  const getStatusNoticeClassName = (tone) => {
    if (tone === "success") {
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300";
    }

    if (tone === "failure") {
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
    }

    return "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300";
  };

  const formatAmountInput = (value) => {
    return clampAmountInput(value, 100000);
  };

  const stopRecordingTracks = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const applyVoicePayload = (payload) => {
    let missingFields = [];

    if (payload.identifier) {
      setIdentifier(payload.identifier);
    } else {
      missingFields.push("receiver");
    }

    if (payload.amount) {
      setAmount(formatAmountInput(payload.amount));
    } else {
      missingFields.push("amount");
    }

    if (payload.paymentMethod) {
      setPaymentMethod(payload.paymentMethod);
    } else {
      setPaymentMethod("WALLET");
    }

    if (missingFields.length === 0) {
      setVoiceNotice("Please review before sending.");
      return;
    }

    setVoiceNotice(
      `Filled what I could. Please confirm ${missingFields.join(", ")}.`,
    );
  };

  const handleVoiceParse = async (audioBlob) => {
    if (voiceAbortRef.current) {
      voiceAbortRef.current.abort();
    }

    const controller = new AbortController();
    voiceAbortRef.current = controller;
    setIsParsingVoice(true);
    setVoiceNotice("");
    setError("");

    try {
      const result = await parseVoiceSendMoney(audioBlob, controller.signal);
      setVoiceTranscript(result.transcript);
      applyVoicePayload(result.payload);
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }

      setVoiceNotice("");
      setError(err?.message || "Unable to process the voice command.");
    } finally {
      setIsParsingVoice(false);
      voiceAbortRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    if (
      isRecording ||
      isParsingVoice ||
      typeof window === "undefined" ||
      !navigator?.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      if (
        typeof MediaRecorder === "undefined" ||
        !navigator?.mediaDevices?.getUserMedia
      ) {
        setError("Voice recording is not supported in this browser.");
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setVoiceNotice("Listening... tap stop when you're done.");
      setError("");
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        stopRecordingTracks();

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        if (audioBlob.size === 0) {
          setVoiceNotice("");
          setError("No audio was recorded. Please try again.");
          return;
        }

        handleVoiceParse(audioBlob);
      };

      recorder.start();
    } catch (err) {
      stopRecordingTracks();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setVoiceNotice("");
      setError(
        err?.name === "NotAllowedError"
          ? "Microphone access is blocked. Please allow microphone access and try again."
          : "Unable to start voice recording right now.",
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendMoney = () => {
    const numericAmount = parseAmount(amount);

    if (numericAmount < 10 || numericAmount > 100000) {
      setError("Amount must be between ₹10 and ₹1,00,000");
      return;
    }

    setError("");
    setStatusNotice(null);
    setShowPinVerify(true);
  };

  const handlePinSuccess = async () => {
    setShowPinVerify(false);
    setSubmitting(true);
    setStatusNotice(null);

    try {
      const payload = {
        identifier,
        amount: parseAmount(amount),
        paymentMethod,
      };

      if (paymentMethod === "BANK")
        payload.bankAccountId = Number(selectedBank);
      if (paymentMethod === "CARD") payload.cardId = Number(selectedCard);

      const idempotencyKey = generateClientUuid();

      const res = await sendMoney(payload, idempotencyKey);
      const transaction = res?.data;

      if (!transaction) {
        setError("No response received from server.");
        return;
      }

      const status = String(transaction.status || "").toUpperCase();

      if (status !== "SUCCESSFUL") {
        const tone = getStatusTone(status);

        if (tone === "failure") {
          setError(
            `Transaction ${status.toLowerCase()}. Check balance or try again later`,
          );
          return;
        }

        setStatusNotice({
          status,
          tone,
          message: `Transaction is currently ${status.toLowerCase()}. Please wait or refresh your transaction history.`,
        });
        return;
      }

      if (paymentMethod === "WALLET") {
        onWalletChanged?.(payload.amount);
      }

      setSuccessAmount(payload.amount);
      setShowSuccess(true);

      setTimeout(() => onClose(), 2000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Payment failed. Please try again.";
      setError(msg);
      console.error("Payment failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBankObj = banks.find(
    (b) => String(b.bankAccountId) === selectedBank,
  );
  const selectedCardObj = cards.find((c) => String(c.cardId) === selectedCard);

  return (
    <div className="relative w-100 max-w-[90%]">
      {(voiceTranscript || voiceNotice) && (
        <div className="absolute top-13 -right-82 z-20 w-72 rounded-2xl border border-white/25 bg-background/95 px-4 py-3 text-xs shadow-lg backdrop-blur">
          {voiceTranscript && (
            <p className="text-white">
              Heard:{" "}
              <span className="text-white/85">{voiceTranscript}</span>
            </p>
          )}
          {voiceNotice && (
            <p className="mt-1 text-white/75">{voiceNotice}</p>
          )}
          <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-l border-b border-white/25 bg-background/95" />
        </div>
      )}

      <div className="h-165 rounded-2xl border bg-card p-6 shadow-xl relative animate-in scale-in duration-200">
      {/* Close */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Send className="h-6 w-6 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Send Money</h2>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center">
          Loading payment methods…
        </p>
      ) : (
        <div className="grid gap-5">
          {/* Receiver */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Receiver</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="xs"
                    className="border-none px-0"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={loading || submitting || isParsingVoice}
                  >
                    {isParsingVoice ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Parsing...</span>
                      </>
                    ) : isRecording ? (
                      <>
                        <Square className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Mic className="w-4" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {isParsingVoice
                    ? "Parsing voice command"
                    : isRecording
                      ? "Stop recording"
                      : "Start voice fill"}
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              placeholder="Phone / Email / Payment ID"
              value={identifier}
              maxLength={40}
              onChange={(e) => setIdentifier(e.target.value.slice(0, 50))}
            />
          </div>

          {/* Payment Method */}
          <div className="grid gap-2">
            <Label>Pay using</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Choose payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WALLET">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Wallet
                  </div>
                </SelectItem>
                <SelectItem value="BANK">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    Bank Account
                  </div>
                </SelectItem>
                <SelectItem value="CARD">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!paymentMethod && (
            <div className="grid gap-2">
              <Label className="opacity-0 select-none">
                Select bank account
              </Label>
              <div className="h-9" />
            </div>
          )}

          {paymentMethod === "WALLET" && (
            <div className="grid gap-2">
              <Label className="opacity-0 select-none">
                Select bank account
              </Label>
              <div className="h-9" />
            </div>
          )}

          {/* Bank Selector */}
          {paymentMethod === "BANK" && (
            <div className="grid gap-2">
              <Label>Select bank account</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  {selectedBankObj ? (
                    <div className="flex items-center gap-2">
                      {bankLogoMap[selectedBankObj.bankName] ? (
                        <img
                          src={bankLogoMap[selectedBankObj.bankName]}
                          alt={selectedBankObj.bankName}
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded bg-muted" />
                      )}
                      <span className="text-sm font-medium">
                        {selectedBankObj.bankName}
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Choose bank account" />
                  )}
                </SelectTrigger>

                <SelectContent className="max-h-60 overflow-y-auto">
                  {banks.map((b) => (
                    <SelectItem
                      key={b.bankAccountId}
                      value={String(b.bankAccountId)}
                    >
                      <div className="flex items-center gap-3 w-full rounded-md px-2 py-1 hover:bg-muted/50 transition">
                        {bankLogoMap[b.bankName] ? (
                          <img
                            src={bankLogoMap[b.bankName]}
                            alt={`${b.bankName} logo`}
                            className="h-6 w-6 object-contain"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted" />
                        )}

                        <div className="flex flex-col leading-tight flex-1">
                          <span className="text-sm font-medium">
                            {b.bankName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •••• {b.last4}
                          </span>
                        </div>

                        {b.isDefault && (
                          <Badge
                            variant="secondary"
                            className="ml-auto bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Card Selector */}
          {paymentMethod === "CARD" && (
            <div className="grid gap-2">
              <Label>Select card</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  {selectedCardObj ? (
                    <div className="flex items-center gap-2">
                      {cardProviderMap[selectedCardObj.provider] ? (
                        <img
                          src={cardProviderMap[selectedCardObj.provider]}
                          alt={selectedCardObj.provider}
                          className="h-5 w-8 object-contain"
                        />
                      ) : (
                        <div className="h-5 w-8 rounded bg-muted" />
                      )}
                      <span className="text-sm font-medium">
                        {selectedCardObj.type}
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Choose card" />
                  )}
                </SelectTrigger>

                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.cardId} value={String(c.cardId)}>
                      <div className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted/50 transition">
                        {cardProviderMap[c.provider] ? (
                          <img
                            src={cardProviderMap[c.provider]}
                            alt={`${c.provider} logo`}
                            className="h-6 w-9 object-contain"
                          />
                        ) : (
                          <div className="h-6 w-9 rounded bg-muted" />
                        )}

                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">{c.type}</span>
                          <span className="text-xs text-muted-foreground">
                            •••• {c.last4}
                          </span>
                        </div>

                        {c.isDefault && (
                          <Badge
                            variant="secondary"
                            className="ml-auto bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                const val = formatAmountInput(e.target.value);

                if (!val) {
                  setError("");
                  setAmount("");
                  return;
                }

                const num = parseAmount(val);

                if (num < 10 || num > 100000) {
                  setError("Amount must be between ₹10 and ₹1,00,000");
                } else {
                  setError("");
                }

                setAmount(val);
              }}
            />

            <p className="text-xs text-muted-foreground">
              Min ₹10 · Max ₹1,00,000
            </p>

            <div className="min-h-4">
              {error && (
                <p className="text-xs text-red-600 font-medium">{error}</p>
              )}
            </div>
          </div>

          {statusNotice && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${getStatusNoticeClassName(statusNotice.tone)}`}
            >
              {statusNotice.message}
            </div>
          )}

          {/* Quick amounts */}
          <div className="flex gap-2 flex-wrap">
            {[500, 1000, 2000, 5000].map((v) => (
              <Button
                key={v}
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(v))}
              >
                ₹{v.toLocaleString("en-IN")}
              </Button>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-lg border p-3 text-sm space-y-1 bg-muted/40">
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span>{identifier || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span>{paymentMethod || "—"}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Amount</span>
              <span>
                ₹{" "}
                {parseAmount(amount).toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSendMoney}
            disabled={
              submitting ||
              showSuccess ||
              !identifier ||
              !amount ||
              !paymentMethod ||
              (paymentMethod === "BANK" && !selectedBank) ||
              (paymentMethod === "CARD" && !selectedCard)
            }
          >
            {submitting ? "Processing..." : "Send Money"}
          </Button>
        </div>
      )}

      {showSuccess && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center
               rounded-2xl bg-green-500/20 dark:bg-green-700/20
               backdrop-blur-md animate-fade-in"
        >
          <CheckCircle2 className="h-10 w-10 mb-2 text-green-700 dark:text-green-400 animate-bounce" />
          <p className="font-bold text-lg text-green-700 dark:text-green-300">
            ₹{successAmount.toLocaleString("en-IN")} Sent!
          </p>
          <span className="text-sm text-green-600 dark:text-green-200">
            Payment completed successfully
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
  );
}
