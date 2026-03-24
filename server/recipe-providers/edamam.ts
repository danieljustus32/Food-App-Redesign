import type { RecipeProvider, NormalizedRecipe } from "./types";

const APP_ID = process.env.EDAMAM_APP_ID;
const APP_KEY = process.env.EDAMAM_APP_KEY;
const BASE_URL = "https://api.edamam.com/api/recipes/v2";

interface EdamamHit {
  recipe: {
    uri: string;
    label: string;
    image: string;
    source: string;
    url: string;
    yield: number;
    dietLabels: string[];
    healthLabels: string[];
    ingredientLines: string[];
    totalTime: number;
    cuisineType?: string[];
    mealType?: string[];
    dishType?: string[];
    instructionLines?: string[];
    url: string;
    source: string;
  };
}

interface EdamamResponse {
  from: number;
  to: number;
  count: number;
  hits: EdamamHit[];
}

function extractId(uri: string): number {
  const hash = uri.split("#recipe_")[1] || uri;
  let num = 0;
  for (let i = 0; i < hash.length; i++) {
    num = ((num << 5) - num + hash.charCodeAt(i)) | 0;
  }
  return Math.abs(num);
}

const HYPHENATED_TERMS: [RegExp, string][] = [
  [/\bdairy[\s-]free\b/gi, "Dairy-free"],
  [/\bgluten[\s-]free\b/gi, "Gluten-free"],
  [/\blacto[\s-]ovo[\s-]vegetarian\b/gi, "Lacto-ovo-vegetarian"],
];

function formatTag(tag: string): string {
  let normalized = tag;
  for (const [pattern, replacement] of HYPHENATED_TERMS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized.split(/\s*\/\s*/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" / ");
}

function buildTags(recipe: EdamamHit["recipe"]): string[] {
  const tags: string[] = [];
  if (recipe.mealType?.length) tags.push(...recipe.mealType);
  if (recipe.dishType?.length) tags.push(...recipe.dishType);
  if (recipe.cuisineType?.length) tags.push(...recipe.cuisineType);
  if (recipe.dietLabels?.length) tags.push(...recipe.dietLabels);
  return [...new Set(tags)].slice(0, 4).map(formatTag);
}

function buildSummary(recipe: EdamamHit["recipe"]): string {
  const parts: string[] = [];
  if (recipe.cuisineType?.length) parts.push(`${recipe.cuisineType.join(", ")} cuisine`);
  if (recipe.dietLabels?.length) parts.push(recipe.dietLabels.join(", "));
  if (recipe.healthLabels?.length) parts.push(recipe.healthLabels.slice(0, 3).join(", "));
  parts.push(`From ${recipe.source}`);
  const summary = parts.join(". ") + ".";
  return summary.charAt(0).toUpperCase() + summary.slice(1);
}

function normalizeRecipe(hit: EdamamHit): NormalizedRecipe {
  const r = hit.recipe;

  return {
    externalId: extractId(r.uri),
    source: "edamam",
    title: r.label,
    image: r.image || "",
    readyInMinutes: r.totalTime > 0 ? r.totalTime : 30,
    servings: Math.round(r.yield) || 4,
    summary: buildSummary(r),
    ingredients: r.ingredientLines || [],
    instructions: r.instructionLines?.length
      ? r.instructionLines
      : r.url
        ? [`Full instructions available at: ${r.url}`]
        : [],
    tags: buildTags(r),
  };
}

async function searchEdamam(params: Record<string, string>): Promise<EdamamResponse> {
  const url = new URL(BASE_URL);
  url.searchParams.set("type", "public");
  url.searchParams.set("app_id", APP_ID!);
  url.searchParams.set("app_key", APP_KEY!);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edamam API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<EdamamResponse>;
}

const RANDOM_TERMS = ["chicken", "pasta", "salad", "soup", "steak", "fish", "rice", "cake", "shrimp", "curry", "pizza", "tacos", "bread", "stew", "roast"];

export class EdamamProvider implements RecipeProvider {
  name = "edamam";

  isAvailable(): boolean {
    return !!(APP_ID && APP_KEY);
  }

  async getRandomRecipes(count: number): Promise<NormalizedRecipe[]> {
    const term = RANDOM_TERMS[Math.floor(Math.random() * RANDOM_TERMS.length)];
    const data = await searchEdamam({ q: term });

    if (!data.hits?.length) return [];

    const shuffled = [...data.hits].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    return selected.map(normalizeRecipe).filter(r => r.title && r.image);
  }

  async searchRecipes(query: string, count: number): Promise<NormalizedRecipe[]> {
    const data = await searchEdamam({ q: query });

    if (!data.hits?.length) return [];

    return data.hits.slice(0, count).map(normalizeRecipe).filter(r => r.title && r.image);
  }
}
