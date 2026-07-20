import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Landmark, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import sbi from "@/assets/bank-logos/SBIN.NS.png";
import can from "@/assets/bank-logos/CANBK.NS.png";
import bob from "@/assets/bank-logos/BANKBARODA.NS.png";
import ind from "@/assets/bank-logos/BANKINDIA.NS.png";
import pnb from "@/assets/bank-logos/PNB.NS.png";
import uni from "@/assets/bank-logos/UNIONBANK.NS.png";
import { addBankAccount } from "@/features/bank-account/services/bank-account.services";

export function AddAccountCard({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successBankName, setSuccessBankName] = useState("");

  const banks = {
    "State Bank of India": sbi,
    "Canara Bank": can,
    "Bank of Baroda": bob,
    "Bank of India": ind,
    "Punjab National Bank": pnb,
    "Union Bank of India": uni,
  };

  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    ifsc: "",
    isDefault: false,
  });

  const isFormInvalid =
    !form.bankName || form.accountNumber.length < 9 || form.ifsc.length !== 11;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await addBankAccount({
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifsc: form.ifsc.toUpperCase().trim(),
        isDefault: form.isDefault,
      });

      setSuccessBankName(form.bankName);
      setShowSuccess(true);

      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to add bank account", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-100 max-w-[90%] rounded-2xl border bg-card p-6 shadow-xl relative animate-in scale-in duration-200">
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        disabled={showSuccess}
        className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="flex items-center gap-2 mb-6">
        <Landmark className="h-6 w-6 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Add Bank Account</h2>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label>Choose your bank</Label>

          <Select
            value={form.bankName}
            disabled={loading || showSuccess}
            onValueChange={(value) => handleChange("bankName", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>

            <SelectContent>
              {Object.entries(banks).map(([bankName, logo]) => (
                <SelectItem key={bankName} value={bankName}>
                  <div className="flex items-center gap-2">
                    <img
                      src={logo}
                      alt={bankName}
                      className="h-4 w-4 object-contain"
                    />
                    <span>{bankName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Account number</Label>
          <Input
            disabled={loading || showSuccess}
            value={form.accountNumber}
            onChange={(e) =>
              handleChange("accountNumber", e.target.value.replace(/\D/g, ""))
            }
            placeholder="Enter account number"
            minLength={9}
            maxLength={18}
          />
          <p className="text-xs text-muted-foreground">
            9–18 characters, numbers only
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ifsc">IFSC code</Label>
          <Input
            disabled={loading || showSuccess}
            value={form.ifsc}
            onChange={(e) => handleChange("ifsc", e.target.value.toUpperCase())}
            className="uppercase"
            maxLength={11}
          />
          <p className="text-xs text-muted-foreground">
            11 characters · Format: ABCD0XXXXXX
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            disabled={loading || showSuccess}
            checked={form.isDefault}
            onCheckedChange={(value) =>
              handleChange("isDefault", Boolean(value))
            }
          />
          <Label htmlFor="isDefault" className="text-sm font-normal">
            Set as default bank account
          </Label>
        </div>
        <div
          className="
                rounded-lg border
                border-yellow-300 dark:border-yellow-700/40
                bg-yellow-300/30 dark:bg-yellow-900/30
                backdrop-blur-lg 
                p-3
                text-xs text-center
                text-yellow-800 dark:text-yellow-300
                shadow-md
            "
        >
          The default account handles all incoming payments.
        </div>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading || isFormInvalid}
        >
          {loading ? "Adding..." : "Add Bank Account"}
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
            Bank Added!
          </p>
          <span className="text-sm text-green-600 dark:text-green-200 text-center px-4">
            {successBankName} is now linked to your account
          </span>
        </div>
      )}
    </div>
  );
}
