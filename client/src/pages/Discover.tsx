import { useState, useCallback, useEffect, useRef } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { AdCard } from "@/components/AdCard";
import { X, Heart, UtensilsCrossed, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface RecipeData {
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

const BATCH_SIZE = 10;
const PREFETCH_THRESHOLD = 3;
const AD_EVERY_N_SWIPES = 10;

export default function Discover() {
  const { user } = useAuth();
  const showBanner = user && !user.emailVerified;
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdCard, setShowAdCard] = useState(false);
  const isFetchingRef = useRef(false);
  const seenIds = useRef(new Set<string>());
  const swipeCountRef = useRef(0);

  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch(`/api/recipes/random?count=${BATCH_SIZE}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data: RecipeData[] = await res.json();

      const newRecipes = data.filter(r => {
        const key = `${r.source}-${r.externalId}`;
        if (seenIds.current.has(key)) return false;
        seenIds.current.add(key);
        return true;
      });

      if (newRecipes.length > 0) {
        setRecipes(prev => [...prev, ...newRecipes]);
      }
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMore();
  }, [fetchMore]);

  useEffect(() => {
    const remaining = recipes.length - currentIndex;
    if (remaining <= PREFETCH_THRESHOLD && remaining > 0) {
      fetchMore();
    }
  }, [currentIndex, recipes.length, fetchMore]);

  const saveMutation = useMutation({
    mutationFn: async (recipe: RecipeData) => {
      await apiRequest("POST", "/api/cookbook", recipe);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cookbook"] });
    },
  });

  const incrementSwipeCounter = useCallback(() => {
    swipeCountRef.current += 1;
    if (swipeCountRef.current >= AD_EVERY_N_SWIPES) {
      swipeCountRef.current = 0;
      setShowAdCard(true);
    }
  }, []);

  const handleSwipeLeft = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
    incrementSwipeCounter();
  }, [incrementSwipeCounter]);

  const handleSwipeRight = useCallback(() => {
    const recipe = recipes[currentIndex];
    if (recipe) {
      saveMutation.mutate(recipe);
    }
    setCurrentIndex(prev => prev + 1);
    incrementSwipeCounter();
  }, [recipes, currentIndex, saveMutation, incrementSwipeCounter]);

  const handleAdDismiss = useCallback(() => {
    setShowAdCard(false);
  }, []);

  const handleRefresh = () => {
    fetchMore();
  };

  const currentRecipes = recipes.slice(currentIndex, currentIndex + 2).reverse();
  const allSwiped = currentIndex >= recipes.length && !isLoading;

  if (isLoading && recipes.length === 0) {
    return (
      <div className={`h-full bg-background flex flex-col items-center justify-center ${showBanner ? "pt-2" : "pt-16"} pb-24`}>
        <Loader2 size={32} className="animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Finding delicious recipes...</p>
      </div>
    );
  }

  return (
    <div className={`h-full bg-background flex flex-col ${showBanner ? "pt-2" : "pt-16"} pb-24 overflow-hidden`}>
      <div className="flex-1 relative w-full max-w-md mx-auto px-4 perspective-1000 flex items-center justify-center">
        <AnimatePresence>
          {allSwiped && !showAdCard ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center p-8 h-full"
            >
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <UtensilsCrossed size={40} className="text-muted-foreground opacity-50" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2">You're all caught up!</h2>
              <p className="text-muted-foreground mb-8">We're finding more delicious recipes for you.</p>
              <button
                onClick={handleRefresh}
                disabled={isFetchingRef.current}
                className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-primary/25 transition-shadow active:scale-95 disabled:opacity-60"
                data-testid="button-refresh"
              >
                Discover More
              </button>
            </motion.div>
          ) : (
            <div className="relative w-full h-[65vh]">
              {showAdCard ? (
                <>
                  {recipes[currentIndex] && (
                    <RecipeCard
                      key={`${recipes[currentIndex].source}-${recipes[currentIndex].externalId}-behind`}
                      recipe={recipes[currentIndex]}
                      active={false}
                      onSwipeLeft={handleSwipeLeft}
                      onSwipeRight={handleSwipeRight}
                    />
                  )}
                  <AdCard active={true} onDismiss={handleAdDismiss} />
                </>
              ) : (
                currentRecipes.map((recipe, index) => {
                  const isActive = index === currentRecipes.length - 1;
                  return (
                    <RecipeCard
                      key={`${recipe.source}-${recipe.externalId}`}
                      recipe={recipe}
                      active={isActive}
                      onSwipeLeft={handleSwipeLeft}
                      onSwipeRight={handleSwipeRight}
                    />
                  );
                })
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {(currentIndex < recipes.length || showAdCard) && (
        <div className="flex items-center justify-center gap-6 mt-4 z-40">
          {showAdCard ? (
            <button
              onClick={handleAdDismiss}
              className="w-16 h-16 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-muted-foreground active:scale-90 transition-transform hover:bg-muted/50"
              data-testid="button-ad-dismiss-bottom"
            >
              <X size={28} strokeWidth={2} />
            </button>
          ) : (
            <>
              <button
                onClick={handleSwipeLeft}
                className="w-16 h-16 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-red-500 active:scale-90 transition-transform hover:bg-red-50"
                data-testid="button-dislike"
              >
                <X size={32} strokeWidth={2.5} />
              </button>

              <button
                onClick={handleSwipeRight}
                className="w-16 h-16 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center text-green-500 active:scale-90 transition-transform hover:bg-green-50"
                data-testid="button-like"
              >
                <Heart size={32} strokeWidth={2.5} className="fill-green-500" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
