import { mockRecipes } from "./mockRecipes";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com";
const isDev = process.env.APP_ENV === "dev";

export interface SpoonacularRecipe {
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
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

function buildTags(recipe: SpoonacularRecipe): string[] {
  const tags: string[] = [];
  if (recipe.cuisines?.length) tags.push(...recipe.cuisines.slice(0, 2));
  if (recipe.dishTypes?.length) tags.push(...recipe.dishTypes.slice(0, 2));
  if (recipe.diets?.length) tags.push(...recipe.diets.slice(0, 2));
  return [...new Set(tags)].slice(0, 4);
}

export function normalizeRecipe(raw: SpoonacularRecipe) {
  const ingredients = raw.extendedIngredients?.map(i => i.original) || [];
  const instructions = raw.analyzedInstructions?.[0]?.steps?.map(s => s.step) || [];
  const tags = buildTags(raw);

  return {
    spoonacularId: raw.id,
    title: raw.title,
    image: raw.image || `https://spoonacular.com/recipeImages/${raw.id}-556x370.jpg`,
    readyInMinutes: raw.readyInMinutes || 30,
    servings: raw.servings || 4,
    summary: stripHtml(raw.summary || ""),
    ingredients,
    instructions,
    tags,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getRandomRecipes(count = 10): Promise<ReturnType<typeof normalizeRecipe>[]> {
  if (isDev) {
    return shuffleArray(mockRecipes).slice(0, count);
  }

  if (!API_KEY) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `${BASE_URL}/recipes/random?number=${count}&apiKey=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spoonacular API error ${res.status}: ${text}`);
  }

  const data = await res.json() as { recipes: SpoonacularRecipe[] };
  return data.recipes.map(normalizeRecipe);
}

export async function searchRecipes(query: string, count = 10): Promise<ReturnType<typeof normalizeRecipe>[]> {
  if (isDev) {
    const q = query.toLowerCase();
    const filtered = mockRecipes.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
    return filtered.length > 0 ? filtered.slice(0, count) : mockRecipes.slice(0, count);
  }

  if (!API_KEY) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `${BASE_URL}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${count}&addRecipeInformation=true&fillIngredients=true&apiKey=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spoonacular API error ${res.status}: ${text}`);
  }

  const data = await res.json() as { results: SpoonacularRecipe[] };
  return data.results.map(normalizeRecipe);
}
