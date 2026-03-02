import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ChefHat, Eye, EyeOff, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";

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

export default function Auth() {
  const { login, register } = useAuth();
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
      setError(
        err.message?.includes("409") ? "An account with this email already exists" :
        err.message?.includes("401") ? "Invalid email or password" :
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-[100dvh] bg-background flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-sm flex flex-col flex-1">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ChefHat size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Tindish</h1>
          <p className="text-muted-foreground mt-1">Swipe. Save. Cook.</p>
        </div>

        <Card className="rounded-3xl border-0 shadow-lg p-6 bg-card min-h-[520px] transition-all duration-300" data-testid="auth-card">
          <div className="flex bg-muted rounded-full p-1 mb-6">
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-login"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${!isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-register"
            >
              Sign Up
            </button>
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
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && signupDisabled)}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-full shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
