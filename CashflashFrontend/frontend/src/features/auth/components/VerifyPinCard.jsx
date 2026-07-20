import { useState, useEffect } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { verifyPin } from "@/features/user/services/user.services";
import { getAuthErrorMessage } from "@/features/auth/utils/authErrorMessage";

export function VerifyPinCard({ open, onSuccess, onClose }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);

  useEffect(() => {
    if (!open) {
      setPin("");
      setMessage("");
      setLockTimeLeft(0);
    }
  }, [open]);

  useEffect(() => {
    if (lockTimeLeft > 0) {
      const t = setInterval(() => {
        setLockTimeLeft((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(t);
    }
  }, [lockTimeLeft]);

  if (!open) return null;

  const handleVerify = async () => {
    setMessage("");

    if (pin.length !== 6) {
      setMessage("PIN must be exactly 6 digits");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyPin({ pin });

      if (res.success) {
        onSuccess();
        return;
      }

      setMessage(res.message);

      if (
        res.message.toLowerCase().includes("locked") ||
        res.message.toLowerCase().includes("too many")
      ) {
        setLockTimeLeft(30);
      }
    } catch (err) {
      setMessage(getAuthErrorMessage(err, "PIN verify failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center
                    bg-black/40 backdrop-blur-md rounded-2xl"
    >
      <Card className="w-85 shadow-none border">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Verify PIN</CardTitle>
          <CardDescription>Enter your 6-digit PIN</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={pin}
            onChange={setPin}
            pattern={REGEXP_ONLY_DIGITS}
            disabled={loading || lockTimeLeft > 0}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <div className="min-h-4.5 text-center">
            {message && <p className="text-sm text-red-600">{message}</p>}
          </div>

          <div className="min-h-4">
            {lockTimeLeft > 0 && (
              <p className="text-xs text-red-600">
                Try again in {lockTimeLeft}s
              </p>
            )}
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="w-1/2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              className="w-1/2"
              onClick={handleVerify}
              disabled={loading || lockTimeLeft > 0}
            >
              {loading ? "Verifying…" : "Verify"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
