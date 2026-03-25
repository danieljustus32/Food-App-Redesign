import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { getRandomRecipes, searchRecipes } from "./recipe-providers";
import { formatTag } from "./tagUtils";
import type { User } from "@shared/schema";

function getSection(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  if (lower.match(/beef|pork|chicken|meat|bacon|sausage|turkey|lamb/)) return "Meat";
  if (lower.match(/salmon|shrimp|fish|tuna|crab|lobster/)) return "Seafood";
  if (lower.match(/milk|cheese|butter|cream|egg|yogurt|sour cream/)) return "Dairy & Eggs";
  if (lower.match(/bread|bun|tortilla|pita|roll/)) return "Bakery";
  if (lower.match(/tomato|onion|garlic|mushroom|parsley|lettuce|cucumber|mint|lemon|pepper|carrot|celery|potato|spinach|basil|cilantro|avocado|broccoli|zucchini|corn|bean sprout/)) return "Produce";
  if (lower.match(/pasta|noodle|flour|sugar|rice|quinoa|oat|cereal|lentil|bean/)) return "Pantry";
  if (lower.match(/oil|vinegar|sauce|miso|ketchup|mayo|mayonnaise|mustard|relish|dressing|soy sauce|hot sauce|sriracha/)) return "Condiments";
  if (lower.match(/cumin|paprika|oregano|thyme|rosemary|cinnamon|nutmeg|turmeric|chili|cayenne|salt|pepper|spice|seasoning/)) return "Spices";
  if (lower.match(/chocolate|vanilla|cocoa|honey|maple|jam|jelly/)) return "Baking";
  return "Other";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/preferences", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    const [dietaryPreferences, allergens] = await Promise.all([
      storage.getDietaryPreferences(user.id),
      storage.getAllergens(user.id),
    ]);
    res.json({ dietaryPreferences, allergens });
  });

  const VALID_DIETARY_PREFERENCES = ["vegetarian", "vegan", "gluten free", "dairy free", "ketogenic", "pescetarian"];
  const VALID_ALLERGENS = ["milk", "eggs", "fish", "shellfish", "tree nuts", "peanuts", "wheat", "soybeans", "sesame"];

  app.put("/api/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { dietaryPreferences, allergens } = req.body;

      const results: { dietaryPreferences?: string[]; allergens?: string[] } = {};

      if (Array.isArray(dietaryPreferences)) {
        const valid = dietaryPreferences.filter(p => VALID_DIETARY_PREFERENCES.includes(p));
        results.dietaryPreferences = await storage.updateDietaryPreferences(user.id, valid);
      }

      if (Array.isArray(allergens)) {
        const valid = allergens.filter(a => VALID_ALLERGENS.includes(a));
        results.allergens = await storage.updateAllergens(user.id, valid);
      }

      const [currentDietary, currentAllergens] = await Promise.all([
        storage.getDietaryPreferences(user.id),
        storage.getAllergens(user.id),
      ]);

      res.json({ dietaryPreferences: currentDietary, allergens: currentAllergens });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  const ALLERGEN_KEYWORDS: Record<string, RegExp> = {
    "milk": /milk|cream|cheese|butter|yogurt|whey|casein|lactose|ghee/i,
    "eggs": /\begg\b|eggs|meringue|mayonnaise|aioli/i,
    "fish": /\bfish\b|salmon|tuna|cod\b|tilapia|trout|anchov|sardine|mahi|halibut|bass\b|mackerel/i,
    "shellfish": /shrimp|crab|lobster|clam|mussel|oyster|scallop|crawfish|crayfish|prawn|shellfish/i,
    "tree nuts": /almond|walnut|cashew|pecan|pistachio|macadamia|hazelnut|brazil nut|chestnut|pine nut/i,
    "peanuts": /peanut/i,
    "wheat": /\bwheat\b|flour(?!.*rice)(?!.*almond)(?!.*coconut)|bread\b|pasta\b|noodle|couscous|cracker|breadcrumb|tortilla|pita\b/i,
    "soybeans": /\bsoy\b|soybean|tofu|tempeh|edamame|miso(?!.*paste)|soy sauce/i,
    "sesame": /sesame|tahini/i,
  };

  app.get("/api/recipes/random", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const count = parseInt(req.query.count as string) || 10;
      const [dietaryPreferences, allergens] = await Promise.all([
        storage.getDietaryPreferences(user.id),
        storage.getAllergens(user.id),
      ]);
      const hasFilters = dietaryPreferences.length > 0 || allergens.length > 0;
      const fetchCount = hasFilters ? Math.min(count * 3, 60) : count;
      let recipes = await getRandomRecipes(Math.min(fetchCount, 60));

      if (dietaryPreferences.length > 0) {
        const normalize = (s: string) => s.toLowerCase().replace(/[-_]/g, " ").trim();
        const normalizedPrefs = dietaryPreferences.map(normalize);
        recipes = recipes.filter(recipe => {
          const recipeTags = recipe.tags.map(normalize);
          return normalizedPrefs.every(pref => recipeTags.includes(pref));
        });
      }

      if (allergens.length > 0) {
        const allergenPatterns = allergens
          .map(a => ALLERGEN_KEYWORDS[a])
          .filter(Boolean);
        recipes = recipes.filter(recipe => {
          const ingredientText = recipe.ingredients.join(" ");
          return !allergenPatterns.some(pattern => pattern.test(ingredientText));
        });
      }

      recipes = recipes.slice(0, count);
      res.json(recipes);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/recipes/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ message: "Query parameter 'q' is required" });
      const count = parseInt(req.query.count as string) || 10;
      const recipes = await searchRecipes(query, Math.min(count, 20));
      res.json(recipes);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/cookbook", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    const recipes = await storage.getSavedRecipes(user.id);
    const formatted = recipes.map(r => ({ ...r, tags: r.tags.map(formatTag) }));
    res.json(formatted);
  });

  app.post("/api/cookbook", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { externalId, source, title, image, readyInMinutes, servings, summary, ingredients, instructions, tags, calories, protein, carbs, fat, pricePerServing } = req.body;

      const existing = await storage.getSavedRecipe(user.id, externalId, source || "spoonacular");
      if (existing) {
        return res.json(existing);
      }

      const saved = await storage.saveRecipe({
        userId: user.id,
        externalId,
        source: source || "spoonacular",
        title,
        image,
        readyInMinutes,
        servings,
        summary,
        ingredients,
        instructions,
        tags,
        calories: calories ?? null,
        protein: protein ?? null,
        carbs: carbs ?? null,
        fat: fat ?? null,
        pricePerServing: pricePerServing ?? null,
      });
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/cookbook/:id", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    await storage.removeSavedRecipe(user.id, req.params.id);
    res.json({ message: "Removed" });
  });

  app.get("/api/shopping-list", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    const items = await storage.getShoppingItems(user.id);
    res.json(items);
  });

  app.post("/api/shopping-list", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { ingredients } = req.body as { ingredients: string[] };

      if (!ingredients?.length) {
        return res.status(400).json({ message: "Ingredients array is required" });
      }

      const cleanName = (name: string) => {
        let cleaned = name.split(",")[0].trim();
        cleaned = cleaned.replace(/^(pinch of|dash of)\s+/i, "").trim();
        cleaned = cleaned.replace(/\s+to taste$/i, "").trim();
        cleaned = cleaned.replace(/\s+for\s+.*$/i, "").trim();
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      };

      const existing = await storage.getShoppingItems(user.id);
      const existingNames = new Set(existing.map(i => cleanName(i.name)));

      const newItems = ingredients
        .map(cleanName)
        .filter(name => name.length > 0 && !existingNames.has(name))
        .map(name => ({
          userId: user.id,
          name,
          section: getSection(name),
          checked: false,
        }));

      const added = await storage.addShoppingItems(newItems);
      res.status(201).json({ added: added.length, items: added });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/shopping-list/:id/toggle", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    const item = await storage.toggleShoppingItem(user.id, req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  });

  app.delete("/api/shopping-list/checked", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    await storage.clearCheckedItems(user.id);
    res.json({ message: "Cleared checked items" });
  });

  app.delete("/api/shopping-list", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    await storage.clearAllItems(user.id);
    res.json({ message: "Cleared all items" });
  });

  return httpServer;
}
