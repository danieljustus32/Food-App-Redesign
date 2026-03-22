import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";

const GENERIC_MESSAGES = [
  { title: "What's cooking tonight?", body: "Open Feastly and get inspired by something delicious." },
  { title: "Your next favorite meal awaits", body: "Just a swipe away — discover a new recipe today." },
  { title: "Hungry? We've got you covered.", body: "Feastly has the perfect recipe waiting for you right now." },
  { title: "Time to discover something delicious", body: "Tap to find your next great meal on Feastly." },
  { title: "Your cookbook is calling", body: "Check your saved recipes — dinner inspiration is already waiting." },
  { title: "Fresh inspiration awaits!", body: "See what's new on Feastly and plan your next meal." },
  { title: "Craving something amazing?", body: "Let Feastly guide you to your next great dish." },
  { title: "Your taste buds deserve an adventure", body: "Open Feastly and discover a recipe you'll love." },
  { title: "Meal planning made easy", body: "Open Feastly and find tonight's perfect dinner in seconds." },
  { title: "The perfect recipe is waiting", body: "Tap to find your next culinary masterpiece on Feastly." },
];

const RECIPE_MESSAGE_TEMPLATES = [
  (name: string) => ({ title: `Tonight's pick: ${name}`, body: "This recipe from your cookbook is calling your name. Tap to get started!" }),
  (name: string) => ({ title: `Cook something amazing tonight`, body: `${name} is waiting in your cookbook. Ready when you are!` }),
  (name: string) => ({ title: `How about ${name}?`, body: "One of your saved recipes is perfect for tonight. Tap to view it!" }),
];

const STORAGE_KEY_ASKED = "feastly-notifications-asked";
const STORAGE_KEY_ENABLED = "feastly-notifications-enabled";
const STORAGE_KEY_LAST_SENT = "feastly-notifications-last-sent";
const NOTIFICATION_INTERVAL_MS = 4 * 60 * 60 * 1000;

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

function detectInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function usePushNotifications() {
  const [, navigate] = useLocation();
  const [permission, setPermission] = useState<NotificationPermissionState>("unsupported");
  const [enabled, setEnabled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const inIframe = detectInIframe();
    setIsInIframe(inIframe);

    if (!("Notification" in window) || inIframe) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as NotificationPermissionState);
    const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
    setEnabled(Notification.permission === "granted" && stored !== "false");
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE" && event.data?.url) {
        navigate(event.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", handleMessage);
  }, [navigate]);

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (!("Notification" in window)) return "unsupported";
    localStorage.setItem(STORAGE_KEY_ASKED, "true");
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);
      if (result === "granted") {
        setEnabled(true);
        localStorage.setItem(STORAGE_KEY_ENABLED, "true");
      }
      return result as NotificationPermissionState;
    } catch {
      return "denied";
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string, url: string = "/") => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (localStorage.getItem(STORAGE_KEY_ENABLED) === "false") return;

    const showDirect = () => {
      const n = new Notification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "feastly-notification",
        data: { url },
      });
      n.onclick = () => {
        window.focus();
        navigate(url);
        n.close();
      };
    };

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "feastly-notification",
          data: { url },
        }).catch(showDirect);
      }).catch(showDirect);
    } else {
      showDirect();
    }

    localStorage.setItem(STORAGE_KEY_LAST_SENT, Date.now().toString());
  }, [navigate]);

  const sendGenericNotification = useCallback(() => {
    const msg = GENERIC_MESSAGES[Math.floor(Math.random() * GENERIC_MESSAGES.length)];
    sendNotification(msg.title, msg.body, "/");
  }, [sendNotification]);

  const sendRecipeNotification = useCallback((recipes: { id: string; title: string; readyInMinutes: number }[]) => {
    if (!recipes.length) {
      sendGenericNotification();
      return;
    }
    const recipe = recipes[Math.floor(Math.random() * recipes.length)];
    const template = RECIPE_MESSAGE_TEMPLATES[Math.floor(Math.random() * RECIPE_MESSAGE_TEMPLATES.length)];
    const msg = template(recipe.title);
    sendNotification(msg.title, msg.body, `/recipe/${recipe.id}`);
  }, [sendNotification, sendGenericNotification]);

  const scheduleNotifications = useCallback((recipes: { id: string; title: string; readyInMinutes: number }[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const lastSent = parseInt(localStorage.getItem(STORAGE_KEY_LAST_SENT) || "0", 10);
    const now = Date.now();
    const timeSinceLast = now - lastSent;
    const delay = timeSinceLast >= NOTIFICATION_INTERVAL_MS
      ? 15000
      : NOTIFICATION_INTERVAL_MS - timeSinceLast;

    const fire = () => {
      const useRecipe = recipes.length > 0 && Math.random() > 0.4;
      if (useRecipe) {
        sendRecipeNotification(recipes);
      } else {
        sendGenericNotification();
      }
      timerRef.current = setTimeout(fire, NOTIFICATION_INTERVAL_MS);
    };

    timerRef.current = setTimeout(fire, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sendGenericNotification, sendRecipeNotification]);

  const toggleEnabled = useCallback(async () => {
    if (!("Notification" in window)) return;

    if (permission === "denied") {
      return;
    }

    if (permission === "default") {
      await requestPermission();
      return;
    }

    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY_ENABLED, next ? "true" : "false");
  }, [permission, enabled, requestPermission]);

  const hasBeenAsked = () => localStorage.getItem(STORAGE_KEY_ASKED) === "true";

  const shouldShowPrompt = useCallback(() => {
    if (!("Notification" in window)) return false;
    if (Notification.permission !== "default") return false;
    return !hasBeenAsked();
  }, []);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_ASKED, "true");
    setShowPrompt(false);
  }, []);

  const triggerPromptIfNeeded = useCallback(() => {
    if (shouldShowPrompt()) {
      setTimeout(() => setShowPrompt(true), 1500);
    }
  }, [shouldShowPrompt]);

  return {
    permission,
    enabled,
    isInIframe,
    showPrompt,
    requestPermission,
    toggleEnabled,
    scheduleNotifications,
    sendGenericNotification,
    sendRecipeNotification,
    dismissPrompt,
    triggerPromptIfNeeded,
  };
}
