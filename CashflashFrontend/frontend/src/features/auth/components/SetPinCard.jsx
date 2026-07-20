import { useState } from "react";
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
import { setPin } from "@/features/user/services/user.services";
import { getAuthErrorMessage } from "@/features/auth/utils/authErrorMessage";

export function SetPinCard({ onSuccess }) {
  const [pin, setPinValue] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (pin.length !== 6) {
      setError("PIN must be exactly 6 digits");
      return;
    }

    try {
      setLoading(true);
      await setPin({ pin });
      onSuccess?.();
    } catch (err) {
      setError(getAuthErrorMessage(err, "PIN set failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-96 max-w-md">
        <CardHeader className="text-center mt-10">
          <CardTitle className="text-xl">Set your PIN</CardTitle>
          <CardDescription>
            This PIN will be required for payments
          </CardDescription>
        </CardHeader>

        <CardContent className="flex mt-20 flex-col items-center gap-6">
          <InputOTP
            maxLength={6}
            value={pin}
            onChange={setPinValue}
            pattern={REGEXP_ONLY_DIGITS}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            className="w-full mt-32"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Setting PIN..." : "Set PIN"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
