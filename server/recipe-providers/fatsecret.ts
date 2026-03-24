import type { RecipeProvider, NormalizedRecipe } from "./types";
import crypto from "crypto";

const CONSUMER_KEY = process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET;
const API_URL = "https://platform.fatsecret.com/rest/server.api";

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function buildOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join("&");

  const signingKey = `${percentEncode(CONSUMER_SECRET!)}&&`;
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  return signature;
}

async function apiCall(apiParams: Record<string, string>): Promise<any> {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error("FATSECRET_CONSUMER_KEY or FATSECRET_CONSUMER_SECRET is not set");
  }

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: "1.0",
  };

  const allParams: Record<string, string> = {
    ...apiParams,
    ...oauthParams,
    format: "json",
  };

  const signature = buildOAuthSignature("POST", API_URL, allParams);
  allParams.oauth_signature = signature;

  const body = new URLSearchParams(allParams);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FatSecret API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (data?.error) {
    throw new Error(`FatSecret API error ${data.error.code}: ${data.error.message}`);
  }

  return data;
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

async function hydrateWithDetails(searchResult: NormalizedRecipe): Promise<NormalizedRecipe> {
  try {
    const detailData = await apiCall({
      method: "recipe.get.v2",
      recipe_id: String(searchResult.externalId),
    });

    const rawRecipe = detailData?.recipe || detailData;
    if (!rawRecipe || !rawRecipe.recipe_id) {
      console.warn(`[fatsecret] No recipe in detail response for ${searchResult.externalId}:`, JSON.stringify(detailData).slice(0, 300));
      return searchResult;
    }

    console.log(`[fatsecret] Detail for ${searchResult.externalId}: has directions=${!!rawRecipe.directions}, keys=${Object.keys(rawRecipe).join(",")}`);

    const detailed = normalizeDetailResult(rawRecipe);

    if (detailed.instructions.length === 0 && rawRecipe.directions) {
      console.warn(`[fatsecret] Recipe ${searchResult.externalId} directions present but parsed 0 steps. Raw:`, JSON.stringify(rawRecipe.directions).slice(0, 500));
    }

    return detailed;
  } catch (err: any) {
    console.error(`[fatsecret] Detail fetch failed for ${searchResult.externalId}:`, err.message);
    return searchResult;
  }
}

export class FatSecretProvider implements RecipeProvider {
  name = "fatsecret";

  isAvailable(): boolean {
    return !!(CONSUMER_KEY && CONSUMER_SECRET);
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
      searchResults.slice(0, count).map(r => hydrateWithDetails(r))
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
      searchResults.slice(0, count).map(r => hydrateWithDetails(r))
    );

    return detailed
      .filter((r): r is PromiseFulfilledResult<NormalizedRecipe> => r.status === "fulfilled")
      .map(r => r.value)
      .filter(r => r.title && r.image);
  }
}
