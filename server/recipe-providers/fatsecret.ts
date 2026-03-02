import type { RecipeProvider, NormalizedRecipe } from "./types";

const CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;
const TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const API_URL = "https://platform.fatsecret.com/rest/server.api";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("FATSECRET_CLIENT_ID or FATSECRET_CLIENT_SECRET is not set");
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=basic",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FatSecret token error ${res.status}: ${text}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

async function apiCall(params: Record<string, string>): Promise<any> {
  const token = await getAccessToken();
  const body = new URLSearchParams({ ...params, format: "json" });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FatSecret API error ${res.status}: ${text}`);
  }

  return res.json();
}

interface FatSecretSearchRecipe {
  recipe_id: string;
  recipe_name: string;
  recipe_description: string;
  recipe_image?: string;
  recipe_ingredients?: { ingredient: string | string[] };
  recipe_types?: { recipe_type: string | string[] };
  recipe_nutrition?: {
    calories: string;
    carbohydrate: string;
    fat: string;
    protein: string;
  };
}

interface FatSecretDetailRecipe {
  recipe_id: string;
  recipe_name: string;
  recipe_description: string;
  recipe_images?: { recipe_image: { image_url: string } | { image_url: string }[] };
  recipe_url: string;
  number_of_servings: string;
  preparation_time_min?: string;
  cooking_time_min?: string;
  ingredients?: { ingredient: { ingredient_description: string }[] | { ingredient_description: string } };
  directions?: { direction: { direction_description: string; direction_number: string }[] | { direction_description: string; direction_number: string } };
  recipe_types?: { recipe_type: string | string[] };
  recipe_categories?: { recipe_category: { recipe_category_name: string }[] | { recipe_category_name: string } };
}

function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function normalizeSearchResult(raw: FatSecretSearchRecipe): NormalizedRecipe {
  const ingredientList = raw.recipe_ingredients?.ingredient
    ? ensureArray(raw.recipe_ingredients.ingredient)
    : [];

  const types = raw.recipe_types?.recipe_type
    ? ensureArray(raw.recipe_types.recipe_type)
    : [];

  return {
    externalId: parseInt(raw.recipe_id),
    source: "fatsecret",
    title: raw.recipe_name,
    image: raw.recipe_image || "",
    readyInMinutes: 30,
    servings: 4,
    summary: raw.recipe_description || "",
    ingredients: ingredientList,
    instructions: [],
    tags: types.slice(0, 4),
  };
}

function normalizeDetailResult(raw: FatSecretDetailRecipe): NormalizedRecipe {
  const images = raw.recipe_images?.recipe_image
    ? ensureArray(raw.recipe_images.recipe_image)
    : [];
  const image = images[0]?.image_url || "";

  const ingredientItems = raw.ingredients?.ingredient
    ? ensureArray(raw.ingredients.ingredient)
    : [];
  const ingredients = ingredientItems.map(i => i.ingredient_description);

  const directionItems = raw.directions?.direction
    ? ensureArray(raw.directions.direction)
    : [];
  const instructions = directionItems
    .sort((a, b) => parseInt(a.direction_number) - parseInt(b.direction_number))
    .map(d => d.direction_description);

  const types = raw.recipe_types?.recipe_type
    ? ensureArray(raw.recipe_types.recipe_type)
    : [];
  const categories = raw.recipe_categories?.recipe_category
    ? ensureArray(raw.recipe_categories.recipe_category).map(c => c.recipe_category_name)
    : [];
  const tags = [...new Set([...types, ...categories])].slice(0, 4);

  const prepTime = parseInt(raw.preparation_time_min || "0") || 0;
  const cookTime = parseInt(raw.cooking_time_min || "0") || 0;
  const totalTime = prepTime + cookTime || 30;

  return {
    externalId: parseInt(raw.recipe_id),
    source: "fatsecret",
    title: raw.recipe_name,
    image,
    readyInMinutes: totalTime,
    servings: parseInt(raw.number_of_servings) || 4,
    summary: raw.recipe_description || "",
    ingredients,
    instructions,
    tags,
  };
}

export class FatSecretProvider implements RecipeProvider {
  name = "fatsecret";

  isAvailable(): boolean {
    return !!(CLIENT_ID && CLIENT_SECRET);
  }

  async getRandomRecipes(count: number): Promise<NormalizedRecipe[]> {
    const randomTerms = ["chicken", "pasta", "salad", "soup", "steak", "fish", "rice", "vegetable", "cake", "shrimp", "curry", "pizza", "sandwich", "tacos", "stir fry"];
    const term = randomTerms[Math.floor(Math.random() * randomTerms.length)];
    const randomPage = Math.floor(Math.random() * 5);

    const data = await apiCall({
      method: "recipes.search.v2",
      search_expression: term,
      max_results: String(count),
      page_number: String(randomPage),
    });

    const recipes = data?.recipes?.recipe;
    if (!recipes) return [];

    const recipeList: FatSecretSearchRecipe[] = ensureArray(recipes);
    const searchResults = recipeList.map(normalizeSearchResult);

    const detailed = await Promise.allSettled(
      searchResults.slice(0, count).map(async (r) => {
        try {
          const detailData = await apiCall({
            method: "recipe.get.v2",
            recipe_id: String(r.externalId),
          });
          if (detailData?.recipe) {
            return normalizeDetailResult(detailData.recipe);
          }
          return r;
        } catch {
          return r;
        }
      })
    );

    return detailed
      .filter((r): r is PromiseFulfilledResult<NormalizedRecipe> => r.status === "fulfilled")
      .map(r => r.value)
      .filter(r => r.title && r.image);
  }

  async searchRecipes(query: string, count: number): Promise<NormalizedRecipe[]> {
    const data = await apiCall({
      method: "recipes.search.v2",
      search_expression: query,
      max_results: String(count),
    });

    const recipes = data?.recipes?.recipe;
    if (!recipes) return [];

    const recipeList: FatSecretSearchRecipe[] = ensureArray(recipes);
    const searchResults = recipeList.map(normalizeSearchResult);

    const detailed = await Promise.allSettled(
      searchResults.slice(0, count).map(async (r) => {
        try {
          const detailData = await apiCall({
            method: "recipe.get.v2",
            recipe_id: String(r.externalId),
          });
          if (detailData?.recipe) {
            return normalizeDetailResult(detailData.recipe);
          }
          return r;
        } catch {
          return r;
        }
      })
    );

    return detailed
      .filter((r): r is PromiseFulfilledResult<NormalizedRecipe> => r.status === "fulfilled")
      .map(r => r.value)
      .filter(r => r.title && r.image);
  }
}
