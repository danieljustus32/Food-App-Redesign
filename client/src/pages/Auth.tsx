import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
  { label: "One special character (!@#$...)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function Auth() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const ruleResults = useMemo(() => passwordRules.map(r => r.test(password)), [password]);
  const allRulesPassed = ruleResults.every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const showRules = !isLogin && password.length > 0;
  const showConfirmError = !isLogin && confirmPassword.length > 0 && !passwordsMatch;
  const isEmailValid = emailRegex.test(email);
  const showEmailError = !isLogin && emailTouched && email.length > 0 && !isEmailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin) {
      if (!isEmailValid) {
        setError("Please enter a valid email address");
        return;
      }
      if (!allRulesPassed) {
        setError("Please meet all password requirements");
        return;
      }
      if (!passwordsMatch) {
        setError("Passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: any) {
      let serverMessage = "";
      try {
        const jsonPart = err.message?.replace(/^\d+:\s*/, "");
        serverMessage = JSON.parse(jsonPart)?.message || "";
      } catch {}

      if (serverMessage === "Email not found") {
        setError("Email not found");
      } else if (serverMessage === "Incorrect password") {
        setError("Incorrect password. Please try again.");
      } else if (err.message?.includes("409") || serverMessage.includes("already exists")) {
        setError("An account with this email already exists");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: "google" | "apple") => {
    window.location.href = `/api/auth/${provider}`;
  };

  const switchTab = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setEmailTouched(false);
  };

  const signupDisabled = !isLogin && (!isEmailValid || !allRulesPassed || !passwordsMatch || !confirmPassword);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center px-6 pt-2 pb-8 overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col">
        <div className="flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt="Feastly"
            className="w-60 h-60 object-contain -mb-6"
            style={{ filter: "drop-shadow(0 2px 4px rgba(178,34,34,0.35))" }}
          />
          <h1 className="text-3xl font-serif font-bold text-primary">Feastly</h1>
          <p className="text-muted-foreground text-sm mt-1">Swipe. Save. Cook.</p>
        </div>

        <Card className="rounded-3xl border-0 shadow-lg p-5 bg-card transition-all duration-300 mb-8" data-testid="auth-card">
          <div className="flex bg-muted rounded-full p-1 mb-6">
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all cursor-pointer ${isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-login"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all cursor-pointer ${!isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-register"
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={() => handleSocialAuth("google")}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-full hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
              data-testid="button-google-auth"
            >
              <GoogleIcon />
              <span>{isLogin ? "Continue with Google" : "Sign up with Google"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialAuth("apple")}
              className="w-full flex items-center justify-center gap-3 bg-black text-white font-medium py-3 rounded-full hover:bg-gray-900 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
              data-testid="button-apple-auth"
            >
              <AppleIcon />
              <span>{isLogin ? "Continue with Apple" : "Sign up with Apple"}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                className={`w-full bg-muted/50 border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                  showEmailError ? "border-destructive focus:border-destructive focus:ring-destructive/30" : "border-border focus:border-primary"
                }`}
                placeholder={isLogin ? "Enter your email" : "you@example.com"}
                required
                data-testid="input-email"
              />
              {showEmailError && (
                <p className="text-xs text-destructive mt-1.5 ml-1" data-testid="text-email-error">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                  required
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {showRules && (
              <div className="bg-muted/30 rounded-xl px-4 py-3 space-y-1.5" data-testid="password-rules">
                {passwordRules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {ruleResults[i] ? (
                      <Check size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <X size={14} className="text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={ruleResults[i] ? "text-green-600" : "text-muted-foreground"}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-muted/50 border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all pr-12 ${
                      showConfirmError ? "border-destructive focus:border-destructive focus:ring-destructive/30" : "border-border focus:border-primary"
                    }`}
                    placeholder="Re-enter your password"
                    required
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {showConfirmError && (
                  <p className="text-xs text-destructive mt-1.5 ml-1" data-testid="text-confirm-error">
                    Passwords do not match
                  </p>
                )}
                {!isLogin && confirmPassword.length > 0 && passwordsMatch && (
                  <p className="text-xs text-green-600 mt-1.5 ml-1 flex items-center gap-1">
                    <Check size={12} /> Passwords match
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5" data-testid="text-error">
                {error === "Email not found" ? (
                  <>
                    Email not found.{" "}
                    <button
                      type="button"
                      onClick={() => switchTab(false)}
                      className="underline font-semibold cursor-pointer"
                      data-testid="link-signup-from-error"
                    >
                      Sign up
                    </button>{" "}
                    instead?
                  </>
                ) : error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && signupDisabled)}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-full shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              data-testid="button-submit"
            >
              {loading ? "Please wait..." : isLogin ? "Log In" : "Create Account"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
