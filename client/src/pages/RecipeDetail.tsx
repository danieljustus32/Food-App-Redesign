import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Users, ShoppingCart, Mic } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function RecipeDetail() {
  const [, params] = useRoute("/recipe/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const recipeId = params?.id;

  const { data: recipes = [] } = useQuery<SavedRecipe[]>({
    queryKey: ["/api/cookbook"],
  });

  const recipe = recipes.find((r) => r.id === recipeId);

  const addToListMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
      const res = await apiRequest("POST", "/api/shopping-list", { ingredients });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
      if (data.added > 0) {
        toast({ title: "Added to Shopping List", description: `${data.added} ingredients added.` });
      } else {
        toast({ title: "Already in list", description: "All ingredients are already in your list." });
      }
    },
  });

  if (!recipe) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Recipe not found.</p>
      </div>
    );
  }

  const cleanSummary = recipe.summary.replace(/<[^>]*>/g, "").replace(/[^.]*spoonacular score.*$/i, "").trim();

  return (
    <div className="pb-24" data-testid="recipe-detail">
      <div className="relative">
        <div
          className="h-64 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${recipe.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => window.history.back()}
          className="absolute top-16 left-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
          data-testid="button-back"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-5 -mt-8 relative z-10">
        <div className="bg-card rounded-2xl shadow-lg p-5">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2 leading-tight" data-testid="text-recipe-title">
            {recipe.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><Clock size={14} /> {recipe.readyInMinutes} min</span>
            <span className="flex items-center gap-1"><Users size={14} /> {recipe.servings} servings</span>
          </div>

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => addToListMutation.mutate(recipe.ingredients)}
              className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground font-semibold py-3 rounded-full active:scale-[0.98] transition-transform"
              data-testid="button-add-to-list"
            >
              <ShoppingCart size={16} /> Add to List
            </button>
            <button
              onClick={() => setLocation(`/cook/${recipe.id}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-full active:scale-[0.98] transition-transform"
              data-testid="button-start-cooking"
            >
              <Mic size={16} /> Start Cooking
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6" data-testid="text-recipe-summary">
            {cleanSummary}
          </p>

          <section className="mb-6">
            <h2 className="text-lg font-serif font-bold text-foreground mb-3">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-serif font-bold text-foreground mb-3">Instructions</h2>
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed min-w-0 break-words">
                    {(() => {
                      const url = step.startsWith("Full instructions available at: ")
                        ? step.replace("Full instructions available at: ", "")
                        : step.startsWith("http://") || step.startsWith("https://")
                        ? step
                        : null;
                      return url ? (
                        <>
                          {step.startsWith("Full instructions available at: ") && <>Full instructions available at: <br /></>}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline break-all"
                            data-testid={`link-instructions-${i}`}
                          >
                            {url}
                          </a>
                        </>
                      ) : step;
                    })()}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
