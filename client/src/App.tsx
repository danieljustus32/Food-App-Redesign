import { useRef, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { NotificationsProvider, useNotifications } from "@/hooks/use-notifications-context";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";

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

function AppRouterInner() {
  const { user, isLoading } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { showPrompt, dismissPrompt, triggerPromptIfNeeded } = useNotifications();
  const promptTriggeredRef = useRef(false);

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
