import type { RecipeProvider, NormalizedRecipe } from "./types";
import { SpoonacularProvider } from "./spoonacular";
import { FatSecretProvider } from "./fatsecret";
import { MockProvider } from "./mock";

export type { NormalizedRecipe, RecipeProvider };

const isDev = process.env.APP_ENV === "dev";

function buildProviders(): RecipeProvider[] {
  if (isDev) {
    return [new MockProvider()];
  }

  const providers: RecipeProvider[] = [];

  const spoonacular = new SpoonacularProvider();
  if (spoonacular.isAvailable()) providers.push(spoonacular);

  const fatsecret = new FatSecretProvider();
  if (fatsecret.isAvailable()) providers.push(fatsecret);

  providers.push(new MockProvider());

  return providers;
}

const providers = buildProviders();

async function tryProviders(
  action: (provider: RecipeProvider) => Promise<NormalizedRecipe[]>
): Promise<NormalizedRecipe[]> {
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const results = await action(provider);
      if (results.length > 0) {
        return results;
      }
      errors.push(`${provider.name}: returned 0 results`);
    } catch (err: any) {
      errors.push(`${provider.name}: ${err.message}`);
      console.error(`[recipe-providers] ${provider.name} failed:`, err.message);
    }
  }

  if (errors.length > 0) {
    console.error(`[recipe-providers] All providers failed:`, errors.join("; "));
  }

  return [];
}

export async function getRandomRecipes(count = 10): Promise<NormalizedRecipe[]> {
  return tryProviders(p => p.getRandomRecipes(count));
}

export async function searchRecipes(query: string, count = 10): Promise<NormalizedRecipe[]> {
  return tryProviders(p => p.searchRecipes(query, count));
}
