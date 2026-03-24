import type { RecipeProvider, NormalizedRecipe } from "./types";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com";

interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  extendedIngredients: { original: string }[];
  analyzedInstructions: { steps: { step: string }[] }[];
  dishTypes: string[];
  diets: string[];
  cuisines: string[];
  pricePerServing?: number;
  nutrition?: {
    nutrients: SpoonacularNutrient[];
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

function formatTag(tag: string): string {
  return tag.split(/\s*\/\s*/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" / ");
}

function buildTags(recipe: SpoonacularRecipe): string[] {
  const tags: string[] = [];
  if (recipe.cuisines?.length) tags.push(...recipe.cuisines.slice(0, 2));
  if (recipe.dishTypes?.length) tags.push(...recipe.dishTypes.slice(0, 2));
  if (recipe.diets?.length) tags.push(...recipe.diets.slice(0, 2));
  return [...new Set(tags)].slice(0, 4).map(formatTag);
}

function findNutrient(nutrients: SpoonacularNutrient[], name: string): number | null {
  const n = nutrients.find(n => n.name.toLowerCase() === name.toLowerCase());
  return n ? Math.round(n.amount) : null;
}

function normalize(raw: SpoonacularRecipe): NormalizedRecipe {
  const nutrients = raw.nutrition?.nutrients ?? [];
  const calories = findNutrient(nutrients, "Calories");
  const protein = findNutrient(nutrients, "Protein");
  const carbs = findNutrient(nutrients, "Carbohydrates");
  const fat = findNutrient(nutrients, "Fat");
  const pricePerServing = raw.pricePerServing != null
    ? Math.round(raw.pricePerServing)
    : null;

  return {
    externalId: raw.id,
    source: "spoonacular",
    title: raw.title,
    image: raw.image || `https://spoonacular.com/recipeImages/${raw.id}-556x370.jpg`,
    readyInMinutes: raw.readyInMinutes || 30,
    servings: raw.servings || 4,
    summary: stripHtml(raw.summary || "").replace(/[^.]*spoonacular score.*$/i, "").trim(),
    ingredients: raw.extendedIngredients?.map(i => i.original) || [],
    instructions: raw.analyzedInstructions?.[0]?.steps?.map(s => s.step) || [],
    tags: buildTags(raw),
    calories,
    protein,
    carbs,
    fat,
    pricePerServing,
  };
}

export class SpoonacularProvider implements RecipeProvider {
  name = "spoonacular";

  isAvailable(): boolean {
    return !!API_KEY;
  }

  async getRandomRecipes(count: number): Promise<NormalizedRecipe[]> {
    if (!API_KEY) throw new Error("SPOONACULAR_API_KEY is not set");

    const url = `${BASE_URL}/recipes/random?number=${count}&includeNutrition=true&apiKey=${API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Spoonacular API error ${res.status}: ${text}`);
    }

    const data = await res.json() as { recipes: SpoonacularRecipe[] };
    return data.recipes.map(normalize);
  }

  async searchRecipes(query: string, count: number): Promise<NormalizedRecipe[]> {
    if (!API_KEY) throw new Error("SPOONACULAR_API_KEY is not set");

    const url = `${BASE_URL}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${count}&addRecipeInformation=true&addRecipeNutrition=true&fillIngredients=true&apiKey=${API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Spoonacular API error ${res.status}: ${text}`);
    }

    const data = await res.json() as { results: SpoonacularRecipe[] };
    return data.results.map(normalize);
  }
}
