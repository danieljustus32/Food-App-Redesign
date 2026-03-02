import { Card } from "@/components/ui/card";
import { Clock, Trash2, Heart, ShoppingCart, Mic, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SavedRecipe {
  id: string;
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

export default function Cookbook() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: savedRecipes = [] } = useQuery<SavedRecipe[]>({
    queryKey: ["/api/cookbook"],
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cookbook/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cookbook"] });
    },
  });

  const addToListMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
      const res = await apiRequest("POST", "/api/shopping-list", { ingredients });
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
      if (data.added > 0) {
        toast({ title: "Added to Shopping List", description: `${data.added} ingredients added.` });
      } else {
        toast({ title: "Already in list", description: "All ingredients are already in your list." });
      }
    },
  });

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeMutation.mutate(id);
  };

  const handleAddToList = (recipe: SavedRecipe, e: React.MouseEvent) => {
    e.stopPropagation();
    addToListMutation.mutate(recipe.ingredients);
  };

  return (
    <div className="bg-background pt-20 pb-24 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-1">My Cookbook</h1>
        <p className="text-muted-foreground mb-8">Your curated collection of deliciousness.</p>

        {savedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-12 border-2 border-dashed border-border rounded-3xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Heart size={24} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2" data-testid="text-empty-cookbook">No recipes yet</h2>
            <p className="text-muted-foreground">Swipe right on recipes in Discover to save them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {savedRecipes.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <Card className="overflow-hidden rounded-2xl border-0 shadow-sm bg-card hover:shadow-md transition-shadow relative group" data-testid={`card-recipe-${recipe.id}`}>
                    <div
                      className="h-32 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${recipe.image})` }}
                    />
                    <div className="p-4">
                      <h3 className="font-serif font-bold text-lg mb-1 leading-tight line-clamp-1">{recipe.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-xs text-muted-foreground gap-3">
                          <span className="flex items-center gap-1"><Clock size={12} /> {recipe.readyInMinutes}m</span>
                          {recipe.tags[0] && <span className="text-primary font-medium">{recipe.tags[0]}</span>}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/cook/${recipe.spoonacularId}`);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full active:scale-95 transition-transform"
                          data-testid={`button-cook-${recipe.id}`}
                        >
                          <Mic size={12} /> Cook
                        </button>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/recipe/${recipe.id}`);
                        }}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 shadow-sm hover:bg-black/60 transition-colors"
                        data-testid={`button-info-${recipe.id}`}
                      >
                        <Info size={14} />
                      </button>
                      <button
                        onClick={(e) => handleAddToList(recipe, e)}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 shadow-sm hover:bg-black/60 transition-colors"
                        data-testid={`button-add-to-list-${recipe.id}`}
                      >
                        <ShoppingCart size={14} />
                      </button>
                      <button
                        onClick={(e) => handleRemove(recipe.id, e)}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 shadow-sm hover:bg-black/60 transition-colors"
                        data-testid={`button-remove-${recipe.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
