import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, EyeClosed, InfoIcon } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GetOtpApi, ResetPasswordApi, VerifyOtpApi } from "@/features/user/services/user.services";
import { appConfig } from "@/config/appConfig";
import { getAuthErrorMessage } from "@/features/auth/utils/authErrorMessage";

export default function ResetPasswordForm({ className, ...props }) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [step, setStep] = useState("EMAIL"); // EMAIL | OTP | PASSWORD | DONE

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [responseOtp, setResponseOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-[\]\\/+=~`]).{8,12}$/;

  const isOtpValid = otp?.length === 6;
  const isPasswordMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = passwordRegex.test(newPassword);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const setTopError = (message) => {
    setError(message);
    setSuccess(null);
  };

  const setTopSuccess = (message) => {
    setSuccess(message);
    setError(null);
  };

  const validatePasswordsAndSetTopError = (
    nextNewPassword,
    nextConfirmPassword,
  ) => {
    if (step !== "PASSWORD") return;

    if (success) setSuccess(null);

    if (nextNewPassword.length > 0 && nextNewPassword.length < 8) {
      setError("Password must be 8 - 12 characters long");
      return;
    }

    if (nextNewPassword.length > 12) {
      setError("Password must be 8 - 12 characters long");
      return;
    }

    if (
      nextNewPassword.length >= 8 &&
      nextNewPassword.length <= 12 &&
      !passwordRegex.test(nextNewPassword)
    ) {
      setError(
        "Please meet the password requirements",
      );
      return;
    }

    if (
      nextConfirmPassword.length > 0 &&
      nextNewPassword !== nextConfirmPassword
    ) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
  };

  const handleGetOtp = async (event) => {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await GetOtpApi({ email });
      const data = res.data;

      setResponseOtp(data?.otp || "");
      setStep("OTP");
      setTopSuccess("OTP sent.");
    } catch (err) {
      setTopError(getAuthErrorMessage(err, "OTP send failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    clearMessages();
    setLoading(true);

    try {
      const res = await VerifyOtpApi({ email, otp });
      setTopSuccess(res.data?.message || "OTP verified");
      setStep("PASSWORD");
    } catch (err) {
      setTopError(getAuthErrorMessage(err, "OTP verify failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 8 || newPassword.length > 12) {
      setTopError("Password must be 8 - 12 characters long");
      return;
    }

    if (!isPasswordValid) {
      setTopError(
        "Please meet the password requirements",
      );
      return;
    }

    if (!isPasswordMatch) {
      setTopError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await ResetPasswordApi({ email, newPassword });
      setTopSuccess(res.data?.message || "Password updated");
      setStep("DONE");
    } catch (err) {
      setTopError(getAuthErrorMessage(err, "Reset failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn("mx-auto w-full max-w-md flex flex-col gap-3", className)}
      {...props}
    >
      <Card className="landing-card-glow w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            {step === "EMAIL" &&
              "Enter your registered email to receive an OTP"}
            {step === "OTP" && "Enter the OTP sent to your email"}
            {step === "PASSWORD" && "Set your new password"}
            {step === "DONE" && "You can now log in with your new password"}
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-90 flex flex-col">
          <div className="min-h-5 mb-4 text-center">
            {error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : success ? (
              <p className="text-sm text-green-600">{success}</p>
            ) : null}
          </div>

          {step === "EMAIL" && (
            <form
              onSubmit={handleGetOtp}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="grid gap-6">
                <div className="grid gap-2 mt-8">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error || success) clearMessages();
                    }}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Get OTP"}
                </Button>

                <FieldDescription className="text-center pt-26">
                  Don&apos;t have an account?{" "}
                  <a href={appConfig.routes.signup} className="underline underline-offset-4">
                    Sign up
                  </a>
                </FieldDescription>
              </div>

              <div />
            </form>
          )}

          {step === "OTP" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="grid gap-6">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>OTP sent to</AlertTitle>
                  <AlertDescription>
                    <div>
                      Email: <b>{email}</b>
                    </div>
                    <div>
                      OTP: <b>{responseOtp}</b>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-2">
                  <Label>Enter your OTP</Label>
                  <div className="flex justify-center mt-4">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => {
                        setOtp(value);
                        if (error || success) clearMessages();
                      }}
                      pattern={REGEXP_ONLY_DIGITS}
                      disabled={loading}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || !isOtpValid}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => {
                      setOtp("");
                      setStep("EMAIL");
                      clearMessages();
                    }}
                  >
                    Change email
                  </Button>
                </div>
              </div>

              <div />
            </div>
          )}

          {step === "PASSWORD" && (
            <form
              onSubmit={handleResetPassword}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="grid gap-6 mt-6">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Verified</AlertTitle>
                  <AlertDescription>
                    <div>
                      Email: <b>{email}</b>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New password</Label>

                    <Tooltip open={isPasswordFocused}>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Input
                            maxLength={12}
                            minLength={8}
                            id="newPassword"
                            name="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => {
                              const value = e.target.value;
                              setNewPassword(value);
                              validatePasswordsAndSetTopError(
                                value,
                                confirmPassword,
                              );
                            }}
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                            required
                            className="pr-10"
                            disabled={loading}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-muted-foreground hover:bg-transparent"
                          >
                            {showPassword ? (
                              <EyeClosed className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>

                      <TooltipContent
                        side="left"
                        sideOffset={24}
                        className="w-fit max-w-64 px-3 py-2 text-xs leading-relaxed"
                      >
                        <div className="grid gap-1">
                          <div className="font-medium">
                            Password must include:
                          </div>
                          <div>• At least 1 number</div>
                          <div>• At least 1 uppercase letter</div>
                          <div>• At least 1 special character</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>

                    <div className="relative">
                      <Input
                        maxLength={12}
                        minLength={8}
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setConfirmPassword(value);
                          validatePasswordsAndSetTopError(newPassword, value);
                        }}
                        required
                        className="pr-10"
                        disabled={loading}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-muted-foreground hover:bg-transparent"
                      >
                        {showConfirmPassword ? (
                          <EyeClosed className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <FieldDescription className="text-center">
                  Must be 8 - 12 characters long.
                </FieldDescription>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          )}

          {step === "DONE" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="grid gap-4">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Password updated</AlertTitle>
                  <AlertDescription>
                    Your password has been changed successfully.
                  </AlertDescription>
                </Alert>
              </div>

              <Button
                type="button"
                onClick={() => (window.location.href = appConfig.routes.login)}
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
