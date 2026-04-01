import { useState } from "react";
import { useLocation } from "wouter";
import { User, Settings, LogOut, Bell, Shield, CircleHelp, ChevronLeft, Leaf, Wheat, MilkOff, EggOff, Fish, AlertTriangle, Ban, FileText, ScrollText, Mail, CheckCircle2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useNotifications } from "@/hooks/use-notifications-context";

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", description: "No meat or fish", icon: Leaf, iconClass: "bg-canopy/10 text-canopy" },
  { id: "vegan", label: "Vegan", description: "No animal products", icon: Leaf, iconClass: "bg-canopy/10 text-canopy" },
  { id: "gluten free", label: "Gluten-Free", description: "No gluten-containing grains", icon: Wheat, iconClass: "bg-harvest/20 text-harvest" },
  { id: "dairy free", label: "Dairy-Free", description: "No milk or dairy products", icon: MilkOff, iconClass: "bg-canopy/10 text-canopy" },
  { id: "ketogenic", label: "Keto", description: "Low carb, high fat", icon: EggOff, iconClass: "bg-deep-dive/10 text-deep-dive" },
  { id: "pescetarian", label: "Pescetarian", description: "Fish but no meat", icon: Fish, iconClass: "bg-secondary/10 text-secondary" },
];

const ALLERGEN_OPTIONS = [
  { id: "milk", label: "Milk" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish" },
  { id: "shellfish", label: "Shellfish" },
  { id: "tree nuts", label: "Tree Nuts" },
  { id: "peanuts", label: "Peanuts" },
  { id: "wheat", label: "Wheat" },
  { id: "soybeans", label: "Soybeans" },
  { id: "sesame", label: "Sesame" },
];

interface PreferencesData {
  dietaryPreferences: string[];
  allergens: string[];
}

export default function Profile() {
  const { user, logout, resendVerification } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { permission, enabled, isInIframe, toggleEnabled } = useNotifications();
  const [view, setView] = useState<"main" | "preferences" | "privacy">("main");
  const [resending, setResending] = useState(false);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast({ title: "Verification email sent", description: "Check your inbox for a new verification link." });
    } catch {
      toast({ title: "Failed to send", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const { data: preferences } = useQuery<PreferencesData>({
    queryKey: ["/api/preferences"],
    queryFn: async () => {
      const res = await fetch("/api/preferences", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch preferences");
      return res.json();
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (update: Partial<PreferencesData>) => {
      const res = await apiRequest("PUT", "/api/preferences", update);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
    },
  });

  const dietaryPreferences = preferences?.dietaryPreferences ?? [];
  const allergens = preferences?.allergens ?? [];

  const togglePreference = (id: string) => {
    const updated = dietaryPreferences.includes(id)
      ? dietaryPreferences.filter(p => p !== id)
      : [...dietaryPreferences, id];
    updatePreferences.mutate({ dietaryPreferences: updated });
  };

  const toggleAllergen = (id: string) => {
    const updated = allergens.includes(id)
      ? allergens.filter(a => a !== id)
      : [...allergens, id];
    updatePreferences.mutate({ allergens: updated });
  };

  const handleLogout = async () => {
    await logout();
  };

  const totalFilters = dietaryPreferences.length + allergens.length;

  if (view === "privacy") {
    return (
      <div className="bg-background pt-20 pb-24 px-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setView("main")}
            className="flex items-center gap-1 text-primary font-medium mb-6 hover:opacity-80 transition-opacity cursor-pointer"
            data-testid="button-back-profile"
          >
            <ChevronLeft size={20} />
            Profile
          </button>

          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Privacy & Security</h1>
          <p className="text-muted-foreground mb-8">Review our legal policies and how we handle your data.</p>

          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card divide-y divide-border">
            <div
              className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate("/privacy-policy")}
              data-testid="link-privacy-policy"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Privacy Policy</span>
                  <span className="text-xs text-muted-foreground">How we collect and use your data</span>
                </div>
              </div>
            </div>
            <div
              className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate("/terms-of-service")}
              data-testid="link-terms-of-service"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-deep-dive/10 flex items-center justify-center text-deep-dive">
                  <ScrollText size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Terms of Service</span>
                  <span className="text-xs text-muted-foreground">Rules and conditions for using Feastly</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (view === "preferences") {
    return (
      <div className="bg-background pt-20 pb-24 px-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setView("main")}
            className="flex items-center gap-1 text-primary font-medium mb-6 hover:opacity-80 transition-opacity cursor-pointer"
            data-testid="button-back-profile"
          >
            <ChevronLeft size={20} />
            Profile
          </button>

          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Preferences</h1>
          <p className="text-muted-foreground mb-8">Select your dietary preferences and allergens. We'll filter recipes to match.</p>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Dietary Preferences</h3>
              <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card divide-y divide-border">
                {DIETARY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = dietaryPreferences.includes(option.id);
                  return (
                    <div key={option.id} className="p-4 flex items-center justify-between" data-testid={`preference-${option.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${option.iconClass}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => togglePreference(option.id)}
                        data-testid={`toggle-${option.id}`}
                      />
                    </div>
                  );
                })}
              </Card>
            </section>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Food Allergies</h3>
              <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card divide-y divide-border">
                {ALLERGEN_OPTIONS.map((option) => {
                  const isActive = allergens.includes(option.id);
                  return (
                    <div key={option.id} className="p-4 flex items-center justify-between" data-testid={`allergen-${option.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                          <Ban size={18} />
                        </div>
                        <span className="font-medium text-foreground">{option.label}</span>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleAllergen(option.id)}
                        data-testid={`toggle-allergen-${option.id}`}
                      />
                    </div>
                  );
                })}
              </Card>
            </section>

            <div className="flex gap-3 p-4 rounded-2xl bg-harvest/10 border border-harvest/30" data-testid="allergen-disclaimer">
              <AlertTriangle size={20} className="text-harvest shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Allergy filtering is based on ingredient keyword matching and may not catch every allergen. Always verify recipe ingredients yourself to ensure they are safe for your dietary needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background pt-20 pb-24 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Profile</h1>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
            <User size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold" data-testid="text-email">{user?.email || "User"}</h2>
            <p className="text-muted-foreground text-sm">Feastly Member</p>
          </div>
        </div>

        <div className="space-y-6">
          {user && !user.emailVerified && (
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-harvest/10 border border-harvest/30 p-4" data-testid="card-email-verification">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-harvest/20 flex items-center justify-center text-foreground shrink-0">
                  <Mail size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm" data-testid="text-verify-prompt">Email not verified</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                    Please verify your email address to secure your account. Check your inbox or request a new link.
                  </p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-sm font-semibold text-foreground bg-harvest/20 hover:bg-harvest/30 px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                    data-testid="button-profile-resend-verification"
                  >
                    {resending ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {user && user.emailVerified && (
            <div className="flex items-center gap-2 px-1 text-sm text-canopy" data-testid="text-email-verified">
              <CheckCircle2 size={16} />
              <span>Email verified</span>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Account</h3>
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card divide-y divide-border">
              <div
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setView("preferences")}
                data-testid="button-preferences"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Settings size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">Preferences</span>
                    {totalFilters > 0 && (
                      <span className="text-xs text-muted-foreground">{totalFilters} filter{totalFilters !== 1 ? "s" : ""} active</span>
                    )}
                  </div>
                </div>
              </div>
              <div
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setView("privacy")}
                data-testid="button-privacy-security"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-deep-dive/10 flex items-center justify-center text-deep-dive">
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
              <div
                className="p-4 flex items-center justify-between"
                data-testid="section-push-notifications"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <Bell size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground">Push Notifications</span>
                    {isInIframe && (
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 hover:underline mt-0.5"
                        data-testid="link-open-in-new-tab"
                      >
                        Open app in new tab to enable
                        <ExternalLink size={11} />
                      </a>
                    )}
                    {!isInIframe && permission === "denied" && (
                      <span className="text-xs text-muted-foreground">Enable in your browser settings</span>
                    )}
                    {!isInIframe && permission === "unsupported" && (
                      <span className="text-xs text-muted-foreground">Not supported by your browser</span>
                    )}
                  </div>
                </div>
                {isInIframe || permission === "denied" || permission === "unsupported" ? (
                  <Switch checked={false} disabled data-testid="toggle-push-notifications" />
                ) : (
                  <Switch
                    checked={enabled}
                    onCheckedChange={toggleEnabled}
                    data-testid="toggle-push-notifications"
                  />
                )}
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
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
