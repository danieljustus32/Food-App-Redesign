import type { RecipeProvider, NormalizedRecipe } from "./types";
import { mockRecipes as rawMockRecipes } from "../mockRecipes";
import { formatTag } from "../tagUtils";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const mockData: NormalizedRecipe[] = rawMockRecipes.map(r => ({
  ...r,
  externalId: r.spoonacularId,
  source: "mock",
  tags: r.tags.map(formatTag),
}));

export class MockProvider implements RecipeProvider {
  name = "mock";

  isAvailable(): boolean {
    return true;
  }

  async getRandomRecipes(count: number): Promise<NormalizedRecipe[]> {
    return shuffleArray(mockData).slice(0, count);
  }

  async searchRecipes(query: string, count: number): Promise<NormalizedRecipe[]> {
    const q = query.toLowerCase();
    const filtered = mockData.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
    return filtered.length > 0 ? filtered.slice(0, count) : mockData.slice(0, count);
  }
}
