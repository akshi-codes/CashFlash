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
import { BanknoteArrowDown, X, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { upgradeToMerchant } from "@/features/merchant/services/merchant.services"
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { disconnectNotificationSocket } from "@/features/notification/services/notification.ws";
import { appConfig } from "@/config/appConfig";
import { clearAuth } from "@/features/auth/state/authSlice";

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const MERCHANT_CATEGORIES = [
  { value: "FOOD_AND_BEVERAGES", label: "Food & Beverages" },
  { value: "GROCERY", label: "Grocery" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "FASHION_AND_APPAREL", label: "Fashion & Apparel" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "TRAVEL_AND_TRANSPORT", label: "Travel & Transport" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "BEAUTY_AND_WELLNESS", label: "Beauty & Wellness" },
  { value: "SERVICES", label: "Services" },
  { value: "OTHERS", label: "Others" },
];

export default function MerchantUpgrade({ open, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [gstin, setGstin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!open) return null;

  const handleLogout = () => {
    disconnectNotificationSocket();
    dispatch(clearAuth());
    navigate(appConfig.routes.root, { replace: true });
  };

  const validate = () => {
    const bn = businessName.trim();
    const g = (gstin || "").trim().toUpperCase();

    if (!bn) {
      setError("Business name is required");
      return false;
    }

    if (!category) {
      setError("Please select category");
      return false;
    }

    if (!GSTIN_REGEX.test(g)) {
      setError("Invalid GSTIN format");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");

    if (!validate()) return;

    try {
      setSubmitting(true);

      await upgradeToMerchant({
        businessName: businessName.trim(),
        category,
        gstin: gstin.trim().toUpperCase(),
      });

      setShowSuccess(true);

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose?.();
        handleLogout();
      }, 2000);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Upgrade failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm p-4">
      <div className="relative w-100 max-w-[90%] rounded-2xl border bg-card p-8 shadow-xl animate-in scale-in duration-200">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
          disabled={submitting || showSuccess}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex items-center gap-2 mb-16">
          <BanknoteArrowDown className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Upgrade to Merchant</h2>
        </div>

        {error ? (
          <div className="text-sm text-red-600 font-medium mb-3">{error}</div>
        ) : null}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Business Name</Label>
            <Input
              value={businessName}
              disabled={submitting || showSuccess}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter business name"
            />
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setError("");
              }}
              disabled={submitting || showSuccess}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {MERCHANT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 mb-16">
            <Label>GSTIN</Label>
            <Input
              value={gstin}
              maxLength={15}
              disabled={submitting || showSuccess}
              onChange={(e) => {
                setGstin(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Enter GSTIN"
            />
            <p className="text-xs text-muted-foreground">
              Format: 22AAAAA0000A1Z5
            </p>
          </div>

          <Button
            className="w-full"
            disabled={
              submitting ||
              showSuccess ||
              !businessName ||
              !category ||
              gstin.trim().length !== 15
            }
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Upgrade"
            )}
          </Button>
        </div>

        {showSuccess && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center
            rounded-2xl bg-green-500/20 dark:bg-green-700/20
            backdrop-blur-md animate-fade-in"
          >
            <CheckCircle2 className="h-10 w-10 mb-2 text-green-700 dark:text-green-400 animate-bounce" />
            <p className="font-bold text-lg text-green-700 dark:text-green-300">
              Upgrade Successful!
            </p>
            <span className="text-sm text-green-600 dark:text-green-200">
              Logging you out...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
