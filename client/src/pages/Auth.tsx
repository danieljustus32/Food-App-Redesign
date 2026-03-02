import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ChefHat, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Auth() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        if (password.length < 4) {
          setError("Password must be at least 4 characters");
          setLoading(false);
          return;
        }
        await register(username, password);
      }
    } catch (err: any) {
      setError(err.message?.includes("409") ? "Username already taken" : err.message?.includes("401") ? "Invalid username or password" : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ChefHat size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Tindish</h1>
          <p className="text-muted-foreground mt-1">Swipe. Save. Cook.</p>
        </div>

        <Card className="rounded-3xl border-0 shadow-lg p-6 bg-card" data-testid="auth-card">
          <div className="flex bg-muted rounded-full p-1 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-login"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${!isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-register"
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Enter your username"
                required
                data-testid="input-username"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                  placeholder="Enter your password"
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

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5" data-testid="text-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-full shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-60"
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
