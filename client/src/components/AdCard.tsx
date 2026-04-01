import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { Card } from "@/components/ui/card";
import { X, ShoppingBag } from "lucide-react";

interface AdCardProps {
  onDismiss: () => void;
  active: boolean;
}

export function AdCard({ onDismiss, active }: AdCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptInjectedRef = useRef(false);
  const siteId = import.meta.env.VITE_CHICORY_SITE_ID;

  useEffect(() => {
    if (!siteId || scriptInjectedRef.current) return;
    scriptInjectedRef.current = true;

    const script = document.createElement("script");
    script.src = "https://pub.chicory.co/ad-tag.js";
    script.async = true;
    script.setAttribute("data-site-id", siteId);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      scriptInjectedRef.current = false;
    };
  }, [siteId]);

  const bind = useDrag(
    ({ active: isDragging, movement: [mx], direction: [dx], velocity: [vx] }) => {
      if (!active) return;
      if (isDragging) {
        x.set(mx);
      } else {
        const swipedLeft = mx < -100 || (dx < 0 && vx > 0.5);
        if (swipedLeft) {
          onDismiss();
        } else {
          x.set(0);
        }
      }
    },
    { filterTaps: true }
  );

  return (
    <motion.div
      className="absolute top-0 left-0 w-full h-[65vh] will-change-transform"
      style={{ x, rotate, opacity }}
      animate={{ x: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...(active ? bind() : {})}
      data-testid="card-ad"
    >
      <Card className="w-full h-full overflow-hidden rounded-3xl shadow-xl relative border-0 touch-none flex flex-col bg-card">
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-black/50 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md tracking-wide">
            Sponsored
          </span>
        </div>

        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors"
          data-testid="button-ad-dismiss"
          aria-label="Dismiss ad"
        >
          <X size={18} />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {siteId ? (
            <div
              ref={adContainerRef}
              id="chicory-ad-slot"
              data-site-id={siteId}
              className="w-full h-full flex items-center justify-center"
              data-testid="ad-chicory-slot"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center bg-muted rounded-2xl p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
                <ShoppingBag size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-foreground mb-3 leading-tight">
                Discover Amazing Food Brands
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-xs">
                Hand-picked ingredients and products from top food brands, matched to the recipes you love.
              </p>
              <button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-full text-sm transition-all shadow-md shadow-primary/20 active:scale-95"
                data-testid="button-ad-cta"
              >
                Shop Ingredients
              </button>
            </div>
          )}
        </div>

        <div className="pb-5 text-center">
          <p className="text-xs text-muted-foreground">Swipe or tap × to continue</p>
        </div>
      </Card>
    </motion.div>
  );
}
