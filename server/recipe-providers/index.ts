import type { RecipeProvider, NormalizedRecipe } from "./types";
import { SpoonacularProvider } from "./spoonacular";
import { FatSecretProvider } from "./fatsecret";
import { EdamamProvider } from "./edamam";
import { MockProvider } from "./mock";

export type { NormalizedRecipe, RecipeProvider };

const isDev = process.env.APP_ENV === "dev";

function buildProviders(): { real: RecipeProvider[]; mock: RecipeProvider } {
  const mock = new MockProvider();
  const real: RecipeProvider[] = [];

  const spoonacular = new SpoonacularProvider();
  if (spoonacular.isAvailable()) {
    real.push(spoonacular);
    console.log("[recipe-providers] Spoonacular provider: available");
  } else {
    console.log("[recipe-providers] Spoonacular provider: not available (missing SPOONACULAR_API_KEY)");
  }

  const fatsecret = new FatSecretProvider();
  if (fatsecret.isAvailable()) {
    real.push(fatsecret);
    console.log("[recipe-providers] FatSecret provider: available");
  } else {
    console.log("[recipe-providers] FatSecret provider: not available (missing FATSECRET_CONSUMER_KEY / FATSECRET_CONSUMER_SECRET)");
  }

  const edamam = new EdamamProvider();
  if (edamam.isAvailable()) {
    real.push(edamam);
    console.log("[recipe-providers] Edamam provider: available");
  } else {
    console.log("[recipe-providers] Edamam provider: not available (missing EDAMAM_APP_ID / EDAMAM_APP_KEY)");
  }

  if (real.length === 0 && isDev) {
    console.log("[recipe-providers] No real providers available, using mock provider (APP_ENV=dev)");
  } else if (real.length === 0) {
    console.log("[recipe-providers] No real providers available, will fall back to mock");
  } else {
    console.log(`[recipe-providers] ${real.length} real provider(s) active: ${real.map(p => p.name).join(", ")}`);
  }

  return { real, mock };
}

const { real: realProviders, mock: mockProvider } = buildProviders();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function gatherFromAll(
  action: (provider: RecipeProvider, count: number) => Promise<NormalizedRecipe[]>,
  totalCount: number
): Promise<NormalizedRecipe[]> {
  if (realProviders.length === 0) {
    console.log("[recipe-providers] No real providers, using mock");
    return action(mockProvider, totalCount);
  }

  const perProvider = Math.max(1, Math.ceil(totalCount / realProviders.length));
  console.log(`[recipe-providers] Fetching ${perProvider} recipes from each of ${realProviders.length} provider(s)`);

  const results = await Promise.allSettled(
    realProviders.map(provider =>
      action(provider, perProvider)
        .then(recipes => ({ provider: provider.name, recipes }))
    )
  );

  const allRecipes: NormalizedRecipe[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log(`[recipe-providers] ${result.value.provider}: returned ${result.value.recipes.length} recipe(s)`);
      allRecipes.push(...result.value.recipes);
    } else {
      const reason = result.reason?.message || String(result.reason);
      console.error(`[recipe-providers] Provider failed:`, reason);
    }
  }

  if (allRecipes.length === 0) {
    console.warn(`[recipe-providers] All real providers failed, falling back to mock`);
    return action(mockProvider, totalCount);
  }

  console.log(`[recipe-providers] Total: ${allRecipes.length} recipes from real providers`);
  return shuffle(allRecipes).slice(0, totalCount);
}

export async function getRandomRecipes(count = 10): Promise<NormalizedRecipe[]> {
  return gatherFromAll((p, c) => p.getRandomRecipes(c), count);
}

export async function searchRecipes(query: string, count = 10): Promise<NormalizedRecipe[]> {
  return gatherFromAll((p, c) => p.searchRecipes(query, c), count);
}
