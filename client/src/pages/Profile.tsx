import { useState } from "react";
import { useLocation } from "wouter";
import { User, Settings, LogOut, Bell, Shield, CircleHelp, ChevronLeft, Leaf, Wheat, MilkOff, EggOff, Fish, AlertTriangle, Ban, FileText, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", description: "No meat or fish", icon: Leaf, color: "green" },
  { id: "vegan", label: "Vegan", description: "No animal products", icon: Leaf, color: "emerald" },
  { id: "gluten free", label: "Gluten-Free", description: "No gluten-containing grains", icon: Wheat, color: "amber" },
  { id: "dairy free", label: "Dairy-Free", description: "No milk or dairy products", icon: MilkOff, color: "blue" },
  { id: "ketogenic", label: "Keto", description: "Low carb, high fat", icon: EggOff, color: "purple" },
  { id: "pescetarian", label: "Pescetarian", description: "Fish but no meat", icon: Fish, color: "cyan" },
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
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [notifications, setNotifications] = useState(true);
  const [view, setView] = useState<"main" | "preferences" | "privacy">("main");

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
            className="flex items-center gap-1 text-primary font-medium mb-6 hover:opacity-80 transition-opacity"
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
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
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
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <ScrollText size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Terms of Service</span>
                  <span className="text-xs text-muted-foreground">Rules and conditions for using Tindish</span>
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
            className="flex items-center gap-1 text-primary font-medium mb-6 hover:opacity-80 transition-opacity"
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
                        <div className={`w-8 h-8 rounded-full bg-${option.color}-500/10 flex items-center justify-center text-${option.color}-500`}>
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
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
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

            <div className="flex gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20" data-testid="allergen-disclaimer">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
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
            <p className="text-muted-foreground text-sm">Tindish Member</p>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Account</h3>
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card divide-y divide-border">
              <div
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setView("preferences")}
                data-testid="button-preferences"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
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
