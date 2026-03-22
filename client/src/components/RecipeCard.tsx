import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Info, X, Heart, Clock, Users, ChefHat } from "lucide-react";
import { useDrag } from "@use-gesture/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface RecipeData {
  externalId: number;
  source: string;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

interface RecipeCardProps {
  recipe: RecipeData;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  active: boolean;
}

export function RecipeCard({ recipe, onSwipeLeft, onSwipeRight, active }: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);

  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const bind = useDrag(({ active: isDragging, movement: [mx], direction: [dx], velocity: [vx] }) => {
    if (!active) return;

    if (isDragging) {
      x.set(mx);
    } else {
      const swipeThreshold = 100;
      const swipeVelocityThreshold = 0.5;

      if (mx > swipeThreshold || (dx > 0 && vx > swipeVelocityThreshold)) {
        onSwipeRight();
      } else if (mx < -swipeThreshold || (dx < 0 && vx > swipeVelocityThreshold)) {
        onSwipeLeft();
      } else {
        x.set(0);
      }
    }
  }, { filterTaps: true });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !showDetails) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atTop = scrollTop <= 0 && deltaY > 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && deltaY < 0;
      if (atTop || atBottom) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [showDetails]);

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <motion.div
      className="absolute top-0 left-0 w-full h-[65vh] will-change-transform"
      style={{ x, rotate, opacity }}
      {...(active && !showDetails ? bind() : {})}
      animate={{ x: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="w-full h-full overflow-hidden rounded-3xl shadow-xl relative border-0 touch-none">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${recipe.image})` }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 right-8 border-4 border-green-500 text-green-500 rounded-xl px-4 py-2 text-4xl font-bold uppercase tracking-wider rotate-12 z-10"
        >
          SAVE
        </motion.div>

        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 left-8 border-4 border-red-500 text-red-500 rounded-xl px-4 py-2 text-4xl font-bold uppercase tracking-wider -rotate-12 z-10"
        >
          PASS
        </motion.div>

        <button
          onClick={handleInfoClick}
          className="absolute right-4 bottom-32 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 hover:bg-white/40 transition-colors"
          data-testid="button-info"
        >
          {showDetails ? <X size={20} /> : <Info size={20} />}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white pb-10 z-10 pointer-events-none">
          <div className="flex gap-2 mb-3 flex-wrap">
            {recipe.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0 rounded-full px-3">
                {tag}
              </Badge>
            ))}
          </div>
          <h2 className="text-3xl font-serif font-bold mb-2 leading-tight">{recipe.title}</h2>
          <div className="flex items-center gap-4 text-sm font-medium text-white/90">
            <span className="flex items-center gap-1"><Clock size={16} /> {recipe.readyInMinutes} min</span>
            <span className="flex items-center gap-1"><Users size={16} /> {recipe.servings} servings</span>
          </div>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              ref={scrollRef}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-white dark:bg-zinc-900 z-30 overflow-y-auto"
              style={{ overscrollBehavior: "none" }}
            >
              <div
                className="h-64 w-full bg-cover bg-center relative"
                style={{ backgroundImage: `url(${recipe.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 pb-20">
                <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">{recipe.title}</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">{recipe.summary.replace(/[^.]*spoonacular score.*$/i, "").trim()}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-primary/5 rounded-2xl p-4 flex flex-col items-center justify-center text-primary">
                    <Clock size={24} className="mb-2" />
                    <span className="font-bold">{recipe.readyInMinutes}m</span>
                    <span className="text-xs uppercase tracking-wider opacity-80">Prep Time</span>
                  </div>
                  <div className="bg-accent/5 rounded-2xl p-4 flex flex-col items-center justify-center text-accent">
                    <Users size={24} className="mb-2" />
                    <span className="font-bold">{recipe.servings}</span>
                    <span className="text-xs uppercase tracking-wider opacity-80">Servings</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground">
                    <Heart className="text-primary fill-primary/20" size={20} /> Ingredients
                  </h3>
                  <ul className="space-y-3">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <span className="text-muted-foreground">{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground">
                    <ChefHat className="text-secondary" size={20} /> Instructions
                  </h3>
                  <ol className="space-y-4">
                    {recipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="font-serif font-bold text-xl text-muted-foreground/40">{i + 1}</span>
                        <span className="text-foreground/80 mt-1 min-w-0 break-words">
                          {(() => {
                            const url = step.startsWith("Full instructions available at: ")
                              ? step.replace("Full instructions available at: ", "")
                              : step.startsWith("http://") || step.startsWith("https://")
                              ? step
                              : null;
                            return url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline break-all"
                              >
                                {url}
                              </a>
                            ) : step;
                          })()}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
