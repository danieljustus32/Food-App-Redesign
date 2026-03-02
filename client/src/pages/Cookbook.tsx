import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Clock, Trash2, Heart, ShoppingCart, Mic, Info, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SavedRecipe {
  id: string;
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

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "dessert", "snack", "appetizer", "salad", "soup", "side dish"];
const DIET_TYPES = ["vegetarian", "vegan", "gluten free", "dairy free", "healthy", "paleo", "keto", "whole30"];

type SortOption = "default" | "time-asc" | "time-desc" | "meal" | "ingredients-asc" | "ingredients-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "time-asc", label: "Time: Quick first" },
  { value: "time-desc", label: "Time: Longest first" },
  { value: "ingredients-asc", label: "Ingredients: Fewest" },
  { value: "ingredients-desc", label: "Ingredients: Most" },
  { value: "meal", label: "Meal type" },
];

function matchesTag(tags: string[], value: string) {
  return tags.some(t => t.toLowerCase() === value.toLowerCase());
}

function getMealOrder(tags: string[]) {
  const order = ["breakfast", "lunch", "snack", "appetizer", "salad", "soup", "side dish", "dinner", "dessert"];
  for (const tag of tags) {
    const idx = order.indexOf(tag.toLowerCase());
    if (idx !== -1) return idx;
  }
  return order.length;
}

export default function Cookbook() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [recipeToDelete, setRecipeToDelete] = useState<SavedRecipe | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [mealFilter, setMealFilter] = useState<string | null>(null);
  const [dietFilter, setDietFilter] = useState<string | null>(null);

  const { data: savedRecipes = [] } = useQuery<SavedRecipe[]>({
    queryKey: ["/api/cookbook"],
  });

  const filteredAndSorted = useMemo(() => {
    let recipes = [...savedRecipes];

    if (mealFilter) {
      recipes = recipes.filter(r => matchesTag(r.tags, mealFilter));
    }
    if (dietFilter) {
      recipes = recipes.filter(r => matchesTag(r.tags, dietFilter));
    }

    switch (sortBy) {
      case "time-asc":
        recipes.sort((a, b) => a.readyInMinutes - b.readyInMinutes);
        break;
      case "time-desc":
        recipes.sort((a, b) => b.readyInMinutes - a.readyInMinutes);
        break;
      case "ingredients-asc":
        recipes.sort((a, b) => a.ingredients.length - b.ingredients.length);
        break;
      case "ingredients-desc":
        recipes.sort((a, b) => b.ingredients.length - a.ingredients.length);
        break;
      case "meal":
        recipes.sort((a, b) => getMealOrder(a.tags) - getMealOrder(b.tags));
        break;
    }

    return recipes;
  }, [savedRecipes, sortBy, mealFilter, dietFilter]);

  const activeFilterCount = (mealFilter ? 1 : 0) + (dietFilter ? 1 : 0) + (sortBy !== "default" ? 1 : 0);

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

  const handleRemoveClick = (recipe: SavedRecipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipeToDelete(recipe);
  };

  const handleConfirmDelete = () => {
    if (recipeToDelete) {
      removeMutation.mutate(recipeToDelete.id);
      setRecipeToDelete(null);
    }
  };

  const handleAddToList = (recipe: SavedRecipe, e: React.MouseEvent) => {
    e.stopPropagation();
    addToListMutation.mutate(recipe.ingredients);
  };

  const clearAll = () => {
    setSortBy("default");
    setMealFilter(null);
    setDietFilter(null);
  };

  return (
    <div className="bg-background pt-20 pb-24 px-4">
      <div className="max-w-md md:max-w-3xl xl:max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-1">My Cookbook</h1>
            <p className="text-muted-foreground">Your curated collection of deliciousness.</p>
          </div>

          {savedRecipes.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="relative flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-border bg-card hover:bg-accent transition-colors mt-1"
                  data-testid="button-sort-filter"
                >
                  <SlidersHorizontal size={16} />
                  <span className="hidden sm:inline">Sort & Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold" data-testid="badge-filter-count">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0 rounded-2xl" data-testid="popover-sort-filter">
                <div className="p-4 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Sort & Filter</h3>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        data-testid="button-clear-filters"
                      >
                        <X size={12} /> Clear all
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
                      <ArrowUpDown size={12} /> Sort by
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSortBy(opt.value)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors text-left ${
                            sortBy === opt.value
                              ? "bg-primary text-primary-foreground font-medium"
                              : "bg-muted/50 hover:bg-muted text-foreground"
                          }`}
                          data-testid={`sort-${opt.value}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                      Meal type
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {MEAL_TYPES.map(meal => (
                        <button
                          key={meal}
                          onClick={() => setMealFilter(mealFilter === meal ? null : meal)}
                          className={`text-xs px-2.5 py-1.5 rounded-full transition-colors capitalize ${
                            mealFilter === meal
                              ? "bg-primary text-primary-foreground font-medium"
                              : "bg-muted/50 hover:bg-muted text-foreground"
                          }`}
                          data-testid={`filter-meal-${meal.replace(/\s+/g, "-")}`}
                        >
                          {meal}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                      Diet type
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DIET_TYPES.map(diet => (
                        <button
                          key={diet}
                          onClick={() => setDietFilter(dietFilter === diet ? null : diet)}
                          className={`text-xs px-2.5 py-1.5 rounded-full transition-colors capitalize ${
                            dietFilter === diet
                              ? "bg-primary text-primary-foreground font-medium"
                              : "bg-muted/50 hover:bg-muted text-foreground"
                          }`}
                          data-testid={`filter-diet-${diet.replace(/\s+/g, "-")}`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {mealFilter || dietFilter ? (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-muted-foreground">Filtering:</span>
            {mealFilter && (
              <button
                onClick={() => setMealFilter(null)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize"
                data-testid="chip-meal-filter"
              >
                {mealFilter} <X size={12} />
              </button>
            )}
            {dietFilter && (
              <button
                onClick={() => setDietFilter(null)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize"
                data-testid="chip-diet-filter"
              >
                {dietFilter} <X size={12} />
              </button>
            )}
          </div>
        ) : null}

        {savedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-12 border-2 border-dashed border-border rounded-3xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Heart size={24} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2" data-testid="text-empty-cookbook">No recipes yet</h2>
            <p className="text-muted-foreground">Swipe right on recipes in Discover to save them here.</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-8 border-2 border-dashed border-border rounded-3xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <SlidersHorizontal size={24} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-filter-results">No matching recipes</h2>
            <p className="text-muted-foreground text-sm mb-3">Try adjusting your filters.</p>
            <button
              onClick={clearAll}
              className="text-sm font-medium text-primary hover:underline"
              data-testid="button-clear-filters-empty"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredAndSorted.map((recipe) => (
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
                            setLocation(`/cook/${recipe.id}`);
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
                        onClick={(e) => handleRemoveClick(recipe, e)}
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

      <AlertDialog open={!!recipeToDelete} onOpenChange={(open) => !open && setRecipeToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[340px]" data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Remove Recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">{recipeToDelete?.title}</span> from your cookbook? This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" data-testid="button-cancel-delete">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
