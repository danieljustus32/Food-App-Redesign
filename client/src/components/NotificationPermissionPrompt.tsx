import { Bell, X } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications-context";

interface NotificationPermissionPromptProps {
  onDismiss: () => void;
}

export function NotificationPermissionPrompt({ onDismiss }: NotificationPermissionPromptProps) {
  const { requestPermission, dismissPrompt } = useNotifications();

  const handleAllow = async () => {
    await requestPermission();
    dismissPrompt();
    onDismiss();
  };

  const handleDeny = () => {
    dismissPrompt();
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm"
      data-testid="notification-permission-prompt"
    >
      <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl p-6 pb-8 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Bell size={24} />
          </div>
          <button
            onClick={handleDeny}
            className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            data-testid="button-dismiss-notification-prompt"
          >
            <X size={16} />
          </button>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">Stay inspired with Feastly</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Get recipe suggestions, cooking reminders, and personalized picks from your cookbook delivered right to you — even when the app is closed.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleAllow}
            className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all"
            data-testid="button-allow-notifications"
          >
            Allow Notifications
          </button>
          <button
            onClick={handleDeny}
            className="w-full py-3.5 text-muted-foreground font-medium rounded-2xl hover:bg-muted/60 transition-colors text-sm"
            data-testid="button-deny-notifications"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
