import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import Discover from "@/pages/Discover";
import Cookbook from "@/pages/Cookbook";
import ShoppingList from "@/pages/ShoppingList";
import Profile from "@/pages/Profile";
import CookingMode from "@/pages/CookingMode";

import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

function AppRouter() {
  const { user, isLoading } = useAuth();

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
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
      <Header />
      <Switch>
        <Route path="/" component={Discover} />
        <Route path="/cookbook" component={Cookbook} />
        <Route path="/list" component={ShoppingList} />
        <Route path="/profile" component={Profile} />
        <Route path="/cook/:id" component={CookingMode} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
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
