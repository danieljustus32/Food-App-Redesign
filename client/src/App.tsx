import { useRef, useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { NotificationsProvider, useNotifications } from "@/hooks/use-notifications-context";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { MicrophonePermissionModal } from "@/components/MicrophonePermissionModal";
import { useMicPermission } from "@/hooks/use-mic-permission";
import { isInIframe } from "@/lib/iframeCheck";

import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import Discover from "@/pages/Discover";
import Cookbook from "@/pages/Cookbook";
import ShoppingList from "@/pages/ShoppingList";
import Profile from "@/pages/Profile";
import CookingMode from "@/pages/CookingMode";
import RecipeDetail from "@/pages/RecipeDetail";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";

import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

const MIC_DISMISS_KEY = "feastly-mic-prompt-dismissed-until";
const MIC_DISMISS_DAYS = 14;

function AppRouterInner() {
  const { user, isLoading } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { showPrompt, dismissPrompt, triggerPromptIfNeeded } = useNotifications();
  const promptTriggeredRef = useRef(false);
  const { status: micStatus, checked: micChecked } = useMicPermission();
  const [micModalDismissed, setMicModalDismissed] = useState(() => {
    try {
      const until = localStorage.getItem(MIC_DISMISS_KEY);
      return until ? Date.now() < parseInt(until, 10) : false;
    } catch {
      return false;
    }
  });

  const showMicModal =
    !!user &&
    micChecked &&
    !micModalDismissed &&
    (micStatus === "prompt" || micStatus === "denied");

  const handleDismissMicModal = () => {
    if (micStatus === "prompt") {
      try {
        const until = Date.now() + MIC_DISMISS_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(MIC_DISMISS_KEY, String(until));
      } catch {}
    }
    setMicModalDismissed(true);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    if (user && !promptTriggeredRef.current) {
      promptTriggeredRef.current = true;
      triggerPromptIfNeeded();
    }
  }, [user, triggerPromptIfNeeded]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
          <div className="w-24 h-3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-background">
      <Header />
      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-14">
        <Switch>
          <Route path="/" component={Discover} />
          <Route path="/cookbook" component={Cookbook} />
          <Route path="/list" component={ShoppingList} />
          <Route path="/profile" component={Profile} />
          <Route path="/cook/:id" component={CookingMode} />
          <Route path="/recipe/:id" component={RecipeDetail} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
      {showPrompt && <NotificationPermissionPrompt onDismiss={dismissPrompt} />}
      {showMicModal && <MicrophonePermissionModal onDismiss={handleDismissMicModal} inIframe={isInIframe()} />}
    </div>
  );
}

function AppRouter() {
  return (
    <NotificationsProvider>
      <AppRouterInner />
    </NotificationsProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
