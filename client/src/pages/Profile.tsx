import { useState } from "react";
import { User, Settings, LogOut, Bell, Shield, CircleHelp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";

export default function Profile() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [dietary, setDietary] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-[100dvh] bg-background pt-20 pb-24 px-4 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Profile</h1>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
            <User size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold" data-testid="text-username">{user?.username || "User"}</h2>
            <p className="text-muted-foreground text-sm">Tindish Member</p>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Account</h3>
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card divide-y divide-border">
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Settings size={18} />
                  </div>
                  <span className="font-medium text-foreground">Preferences</span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Shield size={18} />
                  </div>
                  <span className="font-medium text-foreground">Privacy & Security</span>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">App Settings</h3>
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card divide-y divide-border">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Bell size={18} />
                  </div>
                  <span className="font-medium text-foreground">Push Notifications</span>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">Vegetarian Only</span>
                    <span className="text-xs text-muted-foreground">Filter out meat recipes</span>
                  </div>
                </div>
                <Switch checked={dietary} onCheckedChange={setDietary} />
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-500">
                    <CircleHelp size={18} />
                  </div>
                  <span className="font-medium text-foreground">Help & Support</span>
                </div>
              </div>
            </Card>
          </section>

          <button
            onClick={handleLogout}
            className="w-full py-4 mt-4 flex items-center justify-center gap-2 text-destructive font-semibold hover:bg-destructive/5 rounded-2xl transition-colors"
            data-testid="button-logout"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
