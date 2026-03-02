import { useState, useCallback } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { X, Heart, UtensilsCrossed, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RecipeData {
  spoonacularId: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

export default function Discover() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: recipes = [], isLoading, refetch, isFetching } = useQuery<RecipeData[]>({
    queryKey: ["/api/recipes/random?count=10"],
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (recipe: RecipeData) => {
      await apiRequest("POST", "/api/cookbook", recipe);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cookbook"] });
    },
  });

  const handleSwipeLeft = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  const handleSwipeRight = useCallback(() => {
    const recipe = recipes[currentIndex];
    if (recipe) {
      saveMutation.mutate(recipe);
    }
    setCurrentIndex(prev => prev + 1);
  }, [recipes, currentIndex, saveMutation]);

  const handleRefresh = () => {
    setCurrentIndex(0);
    queryClient.removeQueries({ queryKey: ["/api/recipes/random?count=10"] });
    refetch();
  };

  const currentRecipes = recipes.slice(currentIndex, currentIndex + 2).reverse();

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center pt-16 pb-24">
        <Loader2 size={32} className="animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Finding delicious recipes...</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col pt-16 pb-24 overflow-hidden">
      <div className="flex-1 relative w-full max-w-md mx-auto px-4 perspective-1000 flex items-center justify-center">
        <AnimatePresence>
          {currentIndex >= recipes.length ? (
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
                disabled={isFetching}
                className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-primary/25 transition-shadow active:scale-95 disabled:opacity-60"
                data-testid="button-refresh"
              >
                {isFetching ? "Loading..." : "Discover More"}
              </button>
            </motion.div>
          ) : (
            <div className="relative w-full h-[65vh]">
              {currentRecipes.map((recipe, index) => {
                const isActive = index === currentRecipes.length - 1;
                return (
                  <RecipeCard
                    key={recipe.spoonacularId}
                    recipe={recipe}
                    active={isActive}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                  />
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {currentIndex < recipes.length && (
        <div className="flex items-center justify-center gap-6 mt-4 z-40">
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
        </div>
      )}
    </div>
  );
}
