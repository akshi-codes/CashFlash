import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signupApi } from "@/features/user/services/user.services";
import { Eye, EyeClosed } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { appConfig } from "@/config/appConfig";
import { getAuthErrorMessage } from "@/features/auth/utils/authErrorMessage";

export default function SignupForm({ className, ...props }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.target);

    const password = formData.get("password");
    const confirmPassword = formData.get("confirm-password");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8 || password.length > 12) {
      setError("Password must be 8 - 12 characters long");
      setLoading(false);
      return;
    }

    const payload = {
      fullName: formData.get("name"),
      email: formData.get("email"),
      phoneNumber: formData.get("phoneNumber"),
      password,
    };

    try {
      await signupApi(payload);
      navigate(appConfig.routes.login);
    } catch (errorResponse) {
      setError(getAuthErrorMessage(errorResponse, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="landing-card-glow">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your details below to set up your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>

                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 px-2 text-sm text-muted-foreground bg-muted">
                    +91
                  </span>

                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="rounded-l-none"
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                    }}
                    placeholder="XXXXX XXXXX"
                    required
                  />
                </div>
              </Field>

              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  {/* Password */}
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>

                    <Tooltip open={isPasswordFocused}>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Input
                            maxLength={12}
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            className="pr-10"
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground 
                     hover:text-muted-foreground hover:bg-transparent"
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
                  </Field>

                  {/* Confirm Password */}
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>

                    <div className="relative">
                      <Input
                        maxLength={12}
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="pr-10"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground 
                                   hover:text-muted-foreground hover:bg-transparent"
                      >
                        {showConfirmPassword ? (
                          <EyeClosed className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Field>
                </Field>
                <div>
                  {error ? (
                    <p className="text-center text-sm text-red-500">{error}</p>
                  ) : (
                    <FieldDescription>
                      Must be 8 - 12 characters long.
                    </FieldDescription>
                  )}
                </div>
              </Field>
              <Field>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Creating..." : "Create Account"}
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent
                    side="right"
                    align="center"
                    sideOffset={28}
                    className="w-fit max-w-60 px-3 py-2 text-xs leading-relaxed pointer-events-auto"
                  >
                    <span>By clicking Create Account, you agree to our </span>
                    <a
                      href="/terms"
                      className="underline underline-offset-4 hover:text-blue-800"
                    >
                      Terms of Service
                    </a>
                    <span> and </span>
                    <a
                      href="/privacy"
                      className="underline underline-offset-4 hover:text-blue-800"
                    >
                      Privacy Policy
                    </a>
                    <span>.</span>
                  </TooltipContent>
                </Tooltip>

                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <a href="/login" className="underline underline-offset-4">
                    Log in
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
