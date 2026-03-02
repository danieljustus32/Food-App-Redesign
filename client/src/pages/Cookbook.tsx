import { useState, useEffect } from "react";
import { getSavedRecipes, removeRecipe, Recipe } from "@/data/recipes";
import { addIngredientsToList } from "@/data/shoppingList";
import { Card } from "@/components/ui/card";
import { Clock, Trash2, Heart, ShoppingCart, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Cookbook() {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Load saved recipes on mount
  useEffect(() => {
    setSavedRecipes(getSavedRecipes());
  }, []);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecipe(id);
    setSavedRecipes(getSavedRecipes());
  };

  const handleAddToList = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    const addedCount = addIngredientsToList(recipe.ingredients);
    
    if (addedCount > 0) {
      toast({
        title: "Added to Shopping List",
        description: `${addedCount} ingredients added from ${recipe.title}.`,
      });
    } else {
      toast({
        title: "Already in list",
        description: `All ingredients from ${recipe.title} are already in your list.`,
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pt-20 pb-24 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-1">My Cookbook</h1>
        <p className="text-muted-foreground mb-8">Your curated collection of deliciousness.</p>

        {savedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-12 border-2 border-dashed border-border rounded-3xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Heart size={24} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No recipes yet</h2>
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
                  <Card className="overflow-hidden rounded-2xl border-0 shadow-sm bg-card hover:shadow-md transition-shadow relative group">
                    <div 
                      className="h-32 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${recipe.image})` }}
                    />
                    <div className="p-4">
                      <h3 className="font-serif font-bold text-lg mb-1 leading-tight line-clamp-1">{recipe.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-xs text-muted-foreground gap-3">
                          <span className="flex items-center gap-1"><Clock size={12} /> {recipe.readyInMinutes}m</span>
                          <span className="text-primary font-medium">{recipe.tags[0]}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/cook/${recipe.id}`);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full active:scale-95 transition-transform"
                        >
                          <Mic size={12} /> Cook
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleAddToList(recipe, e)}
                      className="absolute top-2 right-12 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 shadow-sm hover:bg-black/60 transition-colors"
                    >
                      <ShoppingCart size={14} />
                    </button>

                    <button 
                      onClick={(e) => handleRemove(recipe.id, e)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 shadow-sm hover:bg-black/60 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
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
