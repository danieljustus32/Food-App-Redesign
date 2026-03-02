import { useState, useEffect } from "react";
import { getSavedRecipes, removeRecipe, Recipe } from "@/data/recipes";
import { Card } from "@/components/ui/card";
import { Clock, Trash2, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Cookbook() {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  // Load saved recipes on mount
  useEffect(() => {
    setSavedRecipes(getSavedRecipes());
  }, []);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecipe(id);
    setSavedRecipes(getSavedRecipes());
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
                      <div className="flex items-center text-xs text-muted-foreground gap-3">
                        <span className="flex items-center gap-1"><Clock size={12} /> {recipe.readyInMinutes}m</span>
                        <span className="text-primary font-medium">{recipe.tags[0]}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleRemove(recipe.id, e)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
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
