export interface NormalizedRecipe {
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

export interface RecipeProvider {
  name: string;
  isAvailable(): boolean;
  getRandomRecipes(count: number): Promise<NormalizedRecipe[]>;
  searchRecipes(query: string, count: number): Promise<NormalizedRecipe[]>;
}
