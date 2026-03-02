import type { RecipeProvider, NormalizedRecipe } from "./types";
import { SpoonacularProvider } from "./spoonacular";
import { FatSecretProvider } from "./fatsecret";
import { MockProvider } from "./mock";

export type { NormalizedRecipe, RecipeProvider };

const isDev = process.env.APP_ENV === "dev";

function buildProviders(): { real: RecipeProvider[]; mock: RecipeProvider } {
  const mock = new MockProvider();

  if (isDev) {
    return { real: [], mock };
  }

  const real: RecipeProvider[] = [];

  const spoonacular = new SpoonacularProvider();
  if (spoonacular.isAvailable()) real.push(spoonacular);

  const fatsecret = new FatSecretProvider();
  if (fatsecret.isAvailable()) real.push(fatsecret);

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
  if (isDev || realProviders.length === 0) {
    return action(mockProvider, totalCount);
  }

  const perProvider = Math.max(1, Math.ceil(totalCount / realProviders.length));

  const results = await Promise.allSettled(
    realProviders.map(provider =>
      action(provider, perProvider)
        .then(recipes => ({ provider: provider.name, recipes }))
    )
  );

  const allRecipes: NormalizedRecipe[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
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

  return shuffle(allRecipes).slice(0, totalCount);
}

export async function getRandomRecipes(count = 10): Promise<NormalizedRecipe[]> {
  return gatherFromAll((p, c) => p.getRandomRecipes(c), count);
}

export async function searchRecipes(query: string, count = 10): Promise<NormalizedRecipe[]> {
  return gatherFromAll((p, c) => p.searchRecipes(query, c), count);
}
