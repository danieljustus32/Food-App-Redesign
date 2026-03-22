import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Users, ShoppingCart, Mic, DollarSign } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isSaltOrPepper, cleanIngredient } from "@/lib/ingredientFilters";
import { PieChart, Pie, Cell } from "recharts";

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
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  pricePerServing?: number | null;
}

const MACRO_COLORS = {
  Protein: "#3b82f6",
  Carbs: "#22c55e",
  Fat: "#f97316",
};

interface MacroChartProps {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  pricePerServing?: number | null;
}

function MacroChart({ calories, protein, carbs, fat, pricePerServing }: MacroChartProps) {
  const hasData = calories != null || protein != null || carbs != null || fat != null;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-4 mb-6" data-testid="macro-chart-unavailable">
        <p className="text-sm text-muted-foreground italic">Nutrition data unavailable for this recipe.</p>
      </div>
    );
  }

  const macros = [
    { name: "Protein", value: Math.round(protein ?? 0), color: MACRO_COLORS.Protein },
    { name: "Carbs", value: Math.round(carbs ?? 0), color: MACRO_COLORS.Carbs },
    { name: "Fat", value: Math.round(fat ?? 0), color: MACRO_COLORS.Fat },
  ].filter(m => m.value > 0);

  const totalGrams = macros.reduce((sum, m) => sum + m.value, 0);

  const chartSize = 180;
  const cx = chartSize / 2;
  const cy = chartSize / 2;

  return (
    <div className="mb-6" data-testid="macro-chart">
      <h2 className="text-lg font-serif font-bold text-foreground mb-3">Nutrition</h2>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: chartSize, height: chartSize }}>
          <PieChart width={chartSize} height={chartSize}>
            <Pie
              data={macros}
              cx={cx}
              cy={cy}
              innerRadius={52}
              outerRadius={80}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              animationBegin={0}
              animationDuration={900}
              strokeWidth={2}
              stroke="hsl(var(--card))"
            >
              {macros.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            data-testid="macro-chart-calories"
          >
            <span className="text-xl font-bold text-foreground leading-none">
              {calories != null ? Math.round(calories) : "—"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
              kcal
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {macros.map((macro) => {
            const pct = totalGrams > 0 ? Math.round((macro.value / totalGrams) * 100) : 0;
            return (
              <div key={macro.name} className="flex items-center gap-2" data-testid={`macro-${macro.name.toLowerCase()}`}>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: macro.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-foreground">{macro.name}</span>
                    <span className="text-xs text-muted-foreground">{macro.value}g</span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: macro.color }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground shrink-0 w-8 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}

          {pricePerServing != null && (
            <div
              className="flex items-center gap-2 mt-1 pt-2 border-t border-border"
              data-testid="macro-chart-price"
            >
              <DollarSign size={13} className="text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                ${(pricePerServing / 100).toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">/ serving</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
              onClick={() => addToListMutation.mutate(recipe.ingredients.filter(i => !isSaltOrPepper(i)))}
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

          <MacroChart
            calories={recipe.calories}
            protein={recipe.protein}
            carbs={recipe.carbs}
            fat={recipe.fat}
            pricePerServing={recipe.pricePerServing}
          />

          <section className="mb-6">
            <h2 className="text-lg font-serif font-bold text-foreground mb-3">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {cleanIngredient(item)}
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
                      ) : step.charAt(0).toUpperCase() + step.slice(1);
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
