import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { sendRequest } from "@/features/payment-request/services/payment-request.services"

export function RequestMoneyCard({ onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    const numericAmount = Number(amount.replace(/,/g, ""));

    if (!identifier) {
      setError("Receiver identifier is required");
      return;
    }

    if (numericAmount < 10 || numericAmount > 100000) {
      setError("Amount must be between ₹10 and ₹1,00,000");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await sendRequest({
        identifier,
        amount: numericAmount,
        message,
      });

      setShowSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (e) {
      console.error(e);
      setError("Failed to send payment request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-100 max-w-[90%] rounded-2xl border bg-card p-6 shadow-xl relative animate-in scale-in duration-200">
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
        <Send className="h-6 w-6 text-muted-foreground rotate-180" />
        <h2 className="text-lg font-semibold">Request Money</h2>
      </div>

      <div className="grid gap-5">
        {/* Receiver */}
        <div className="grid gap-2">
          <Label>Request from</Label>
          <Input
            placeholder="Phone / Email / Payment ID"
            value={identifier}
            maxLength={39}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="grid gap-2">
          <Label>Amount</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => {
              let val = e.target.value.replace(/[^\d]/g, "");
              if (val.length > 6) val = val.slice(0, 6);
              setAmount(val.toLocaleString("en-IN"));
            }}
          />
          <p className="text-xs text-muted-foreground">
            Min ₹10 · Max ₹1,00,000
          </p>
        </div>

        {/* Message (taller) */}
        <div className="grid gap-2">
          <Label>Message</Label>
          <Textarea
            placeholder="What is this request for?"
            className="min-h-24"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Error */}
        <div className="min-h-4">
          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-lg border p-3 text-sm space-y-1 bg-muted/40">
          <div className="flex justify-between">
            <span className="text-muted-foreground">From</span>
            <span>{identifier || "—"}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Amount</span>
            <span>₹ {Number(amount || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !identifier || !amount}
        >
          {submitting ? "Requesting..." : "Request Money"}
        </Button>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center
          rounded-2xl bg-green-500/20 dark:bg-green-700/20
          backdrop-blur-md animate-fade-in"
        >
          <CheckCircle2 className="h-10 w-10 mb-2 text-green-700 dark:text-green-400 animate-bounce" />
          <p className="font-bold text-lg text-green-700 dark:text-green-300">
            Request Sent!
          </p>
          <span className="text-sm text-green-600 dark:text-green-200">
            The user has been notified
          </span>
        </div>
      )}
    </div>
  );
}
