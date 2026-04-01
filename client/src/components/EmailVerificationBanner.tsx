import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Mail, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function EmailVerificationBanner() {
  const { user, resendVerification } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      toast({ title: "Email sent", description: "Check your inbox for a new verification link." });
    } catch {
      toast({ title: "Failed to send", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  return (
    <div className="bg-accent/15 border-b border-accent/30 px-4 py-3" data-testid="banner-email-verification">
      <div className="flex items-start gap-3 max-w-lg mx-auto">
        <Mail size={18} className="text-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium" data-testid="text-verification-message">
            Please verify your email address
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Check your inbox for a verification link. 
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="underline hover:text-foreground ml-1 disabled:opacity-50"
              data-testid="button-resend-verification"
            >
              {sending ? "Sending..." : "Resend email"}
            </button>
            <span className="mx-1">·</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="underline hover:text-foreground inline-flex items-center gap-1"
              data-testid="button-refresh-verification"
            >
              Already verified? Refresh
            </button>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground shrink-0"
          data-testid="button-dismiss-verification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
