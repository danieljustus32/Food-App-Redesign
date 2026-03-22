import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePushNotifications, NotificationPermissionState } from "./use-push-notifications";

interface SavedRecipe {
  id: string;
  title: string;
  readyInMinutes: number;
}

interface NotificationsContextType {
  permission: NotificationPermissionState;
  enabled: boolean;
  isInIframe: boolean;
  showPrompt: boolean;
  toggleEnabled: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermissionState>;
  dismissPrompt: () => void;
  triggerPromptIfNeeded: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const notifs = usePushNotifications();
  const scheduledRef = useRef(false);

  const { data: recipes = [] } = useQuery<SavedRecipe[]>({
    queryKey: ["/api/cookbook"],
    queryFn: async () => {
      const res = await fetch("/api/cookbook", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (notifs.enabled && !scheduledRef.current) {
      scheduledRef.current = true;
      const cleanup = notifs.scheduleNotifications(recipes);
      return () => {
        scheduledRef.current = false;
        cleanup?.();
      };
    }
  }, [notifs.enabled, recipes]);

  return (
    <NotificationsContext.Provider value={notifs}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
