import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Discover from "@/pages/Discover";
import Cookbook from "@/pages/Cookbook";
import ShoppingList from "@/pages/ShoppingList";
import Profile from "@/pages/Profile";
import CookingMode from "@/pages/CookingMode";

import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Discover} />
      <Route path="/cookbook" component={Cookbook} />
      <Route path="/list" component={ShoppingList} />
      <Route path="/profile" component={Profile} />
      <Route path="/cook/:id" component={CookingMode} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
          <Header />
          <Router />
          <BottomNav />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
