import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { X, CheckCircle2 } from "lucide-react";
import chip from "@/assets/card-logos/chip.png";
import logo from "@/assets/cashflash-logos/logo-white.png";
import visa from "@/assets/card-logos/V.png";
import mast from "@/assets/card-logos/MA.png";
import rupy from "@/assets/card-logos/RUPAY.png";
import amex from "@/assets/card-logos/AXP.png";
import { addCard } from "@/features/card/services/card.services"

export function AddCardCard({ onClose, onSuccess }) {
  const providers = ["VISA", "MASTERCARD", "RUPAY", "AMERICAN EXPRESS"];
  const types = ["CREDIT", "DEBIT"];

  const providerLogoMap = {
    VISA: visa,
    MASTERCARD: mast,
    RUPAY: rupy,
    "AMERICAN EXPRESS": amex,
  };

  const providerGradientMap = {
    VISA: `
    linear-gradient(
      90deg,
      #7a5a1e,
      #c9a227,
      #7a5a1e
    )
  `,

    MASTERCARD: `
    linear-gradient(
      90deg,
      #000e21,
      #1e90ff,
      #000e21
    )
  `,

    RUPAY: `
    linear-gradient(
      90deg,
      #f00202,
      #0a0000,
      #f00202
    )
  `,

    "AMERICAN EXPRESS": `
    linear-gradient(
      90deg,
      #210033,
      #5f2eea,
      #210033
    )
  `,

    DEFAULT: `
    linear-gradient(
      135deg,
      #1e3c72,
      #2a5298
    )
  `,
  };

  const [form, setForm] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    type: "",
    provider: "",
    isDefault: false,
    cvv: "",
  });

  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successProvider, setSuccessProvider] = useState("");

  const detectCardProvider = (number) => {
    if (!number) return "";

    if (/^4/.test(number)) return "VISA";

    if (/^(5[1-5]|22[2-9]|2[3-6]|27[01]|2720)/.test(number))
      return "MASTERCARD";

    if (/^(34|37)/.test(number)) return "AMERICAN EXPRESS";

    if (/^(60|65|81|82|508|353|356)/.test(number)) return "RUPAY";

    return "";
  };

  const providerEnumMap = {
    VISA: "VISA",
    MASTERCARD: "MASTERCARD",
    RUPAY: "RUPAY",
    "AMERICAN EXPRESS": "AMERICAN_EXPRESS",
  };

  const handleChange = (field, value) => {
    if (field === "cardNumber") {
      value = value.replace(/\D/g, "");
      if (value.length > 16) value = value.slice(0, 16);

      const detectedProvider = detectCardProvider(value);

      setForm((prev) => ({
        ...prev,
        cardNumber: value,
        provider: detectedProvider,
      }));
      return;
    }

    if (field === "cvv") value = value.replace(/\D/g, "");

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        cardNumber: form.cardNumber,
        cvv: form.cvv,
        expiryMonth: form.expiryMonth,
        expiryYear: form.expiryYear,
        type: form.type,
        provider: providerEnumMap[form.provider],
        isDefault: form.isDefault,
      };

      await addCard(payload);

      setSuccessProvider(form.provider);
      setShowSuccess(true);

      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to add card", err);
    } finally {
      setLoading(false);
    }
  };

  const maskedCardNumber = (() => {
    const digits = form.cardNumber.replace(/\D/g, "");
    const padded = (digits + "################").slice(0, 16);

    return padded.match(/.{1,4}/g)?.join(" ") || "#### #### #### ####";
  })();

  const isFormValid =
    form.cardNumber.length === 16 &&
    form.expiryMonth.length === 2 &&
    Number(form.expiryMonth) >= 1 &&
    Number(form.expiryMonth) <= 12 &&
    form.expiryYear.length === 4 &&
    Number(form.expiryYear) >= new Date().getFullYear() &&
    form.type &&
    form.provider &&
    form.cvv.length === 3;

  return (
    <div className="mt-28 w-115 max-w-[95%] rounded-2xl border bg-card px-6 pb-6 pt-24 shadow-xl relative animate-in scale-in duration-200">
      {/* Close Button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        disabled={showSuccess}
        className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Animated Card Preview */}
      {!showSuccess && (
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-90 h-56 perspective">
          <div
            className={`relative w-full h-full transition-transform duration-700 ease-in-out transform ${
              isCardFlipped ? "rotate-y-180" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 rounded-xl shadow-xl text-white p-6 flex flex-col justify-between animate-gradient card-container overflow-hidden"
              style={{
                background:
                  providerGradientMap[form.provider] ||
                  providerGradientMap.DEFAULT,
                backfaceVisibility: "hidden",
              }}
            >
              {/* Glass reflection */}
              <div className="absolute inset-0 pointer-events-none rounded-xl glass-overlay" />

              {/* Noise texture */}
              <div className="absolute inset-0 pointer-events-none rounded-xl noise-overlay" />

              {/* Light sweep on hover */}
              <div className="absolute inset-0 pointer-events-none rounded-xl light-sweep" />

              <div className="flex justify-between items-center">
                <img
                  src={logo}
                  alt="App logo"
                  className="w-8 h-8 object-contain"
                />

                {form.provider ? (
                  <img
                    src={providerLogoMap[form.provider]}
                    alt={form.provider}
                    className="h-8 object-contain transition-opacity duration-300"
                  />
                ) : (
                  <span className="uppercase text-sm font-semibold">CARD</span>
                )}
              </div>
              <div className="text-2xl tracking-widest">{maskedCardNumber}</div>
              <div className="flex justify-between">
                <div>
                  <div className="text-xs opacity-70">Card type</div>
                  <div className="uppercase">{form.type || "-----"}</div>
                </div>
                <img
                  src={chip}
                  alt="chip"
                  className="w-16 h-12 object-contain"
                ></img>
                <div>
                  <div className="text-xs opacity-70">Expires</div>
                  <div>
                    {form.expiryMonth || "MM"}/
                    {form.expiryYear?.slice(2) || "YY"}
                  </div>
                </div>
              </div>
            </div>

            {/* Back Side */}
            <div
              className="card-container absolute inset-0 rounded-xl shadow-xl text-white p-6 flex flex-col justify-between animate-gradient overflow-hidden"
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                background:
                  providerGradientMap[form.provider] ||
                  providerGradientMap.DEFAULT,
              }}
            >
              {/* Noise */}
              <div className="absolute inset-0 noise-overlay pointer-events-none" />

              {/* Glass reflection */}
              <div className="absolute inset-0 glass-overlay pointer-events-none" />

              {/* Light sweep */}
              <div className="absolute inset-0 light-sweep pointer-events-none" />

              {/* Magnetic strip */}
              <div className="h-12 rounded-md bg-black/90 shadow-inner" />

              {/* Signature + CVV */}
              <div className="flex justify-end mt-6">
                <div className="bg-white/90 px-4 py-2 rounded-md text-black font-mono tracking-widest w-16 shadow-md">
                  {form.cvv || "***"}
                </div>
              </div>

              {/* Footer micro text */}
              <div className="text-[10px] opacity-60 tracking-wide mt-4">
                Digitally Signature · Not Valid Unless Signed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid gap-4 mt-10">
        <div className="grid gap-1">
          <Label className="text-xs">Card Number</Label>
          <Input
            value={form.cardNumber
              .replace(/\D/g, "")
              .replace(/(.{4})/g, "$1 ")
              .trim()}
            maxLength={19}
            onChange={(e) => handleChange("cardNumber", e.target.value)}
            onFocus={() => setIsCardFlipped(false)}
            placeholder="Enter card number"
            disabled={loading || showSuccess}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-xs">Expiry Month</Label>
            <Input
              value={form.expiryMonth}
              placeholder="MM"
              maxLength={2}
              inputMode="numeric"
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");

                if (value.length <= 1) {
                  handleChange("expiryMonth", value);
                  return;
                }

                const num = Number(value);
                if (num >= 1 && num <= 12) {
                  handleChange("expiryMonth", value);
                }
              }}
              onBlur={() => {
                // Normalize on blur
                if (form.expiryMonth === "0") {
                  handleChange("expiryMonth", "");
                } else if (form.expiryMonth.length === 1) {
                  handleChange("expiryMonth", `0${form.expiryMonth}`);
                }
              }}
              disabled={loading || showSuccess}
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Expiry Year</Label>
            <Input
              value={form.expiryYear}
              onChange={(e) => handleChange("expiryYear", e.target.value)}
              placeholder="YYYY"
              maxLength={4}
              disabled={loading || showSuccess}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-xs">Card Type</Label>
            <Select
              disabled={loading || showSuccess}
              value={form.type}
              onValueChange={(val) => handleChange("type", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Provider</Label>
            <Select value={form.provider} disabled>
              <SelectTrigger>
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1">
          <Label className="text-xs">CVV</Label>
          <Input
            disabled={loading || showSuccess}
            value={form.cvv}
            maxLength={3}
            onChange={(e) => handleChange("cvv", e.target.value)}
            onFocus={() => setIsCardFlipped(true)}
            onBlur={() => setIsCardFlipped(false)}
            placeholder="Enter CVV"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            disabled={loading || showSuccess}
            checked={form.isDefault}
            onCheckedChange={(val) => handleChange("isDefault", Boolean(val))}
          />
          <Label className="text-sm font-normal">Set as default card</Label>
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading || !isFormValid}
          //title={!isFormValid ? "Please complete all card details" : ""}
        >
          {loading ? "Adding..." : "Add Card"}
        </Button>
      </div>

      {showSuccess && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center
               rounded-2xl bg-green-500/20 dark:bg-green-700/20
               backdrop-blur-md animate-fade-in"
        >
          <CheckCircle2 className="h-10 w-10 mb-2 text-green-700 dark:text-green-400 animate-bounce" />
          <p className="font-bold text-lg text-green-700 dark:text-green-300">
            Card Added!
          </p>
          <span className="text-sm text-green-600 dark:text-green-200 text-center px-4">
            {successProvider} card is now linked to your account
          </span>
        </div>
      )}
    </div>
  );
}
