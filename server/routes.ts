import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { getRandomRecipes, searchRecipes } from "./recipe-providers";
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
    const preferences = await storage.getDietaryPreferences(user.id);
    res.json({ dietaryPreferences: preferences });
  });

  const VALID_DIETARY_PREFERENCES = ["vegetarian", "vegan", "gluten free", "dairy free", "ketogenic", "pescetarian"];

  app.put("/api/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { dietaryPreferences } = req.body;
      if (!Array.isArray(dietaryPreferences)) {
        return res.status(400).json({ message: "dietaryPreferences must be an array" });
      }
      const valid = dietaryPreferences.filter(p => VALID_DIETARY_PREFERENCES.includes(p));
      const updated = await storage.updateDietaryPreferences(user.id, valid);
      res.json({ dietaryPreferences: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/recipes/random", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const count = parseInt(req.query.count as string) || 10;
      const dietaryPreferences = await storage.getDietaryPreferences(user.id);
      const fetchCount = dietaryPreferences.length > 0 ? Math.min(count * 3, 60) : count;
      let recipes = await getRandomRecipes(Math.min(fetchCount, 60));

      if (dietaryPreferences.length > 0) {
        const normalize = (s: string) => s.toLowerCase().replace(/[-_]/g, " ").trim();
        const normalizedPrefs = dietaryPreferences.map(normalize);
        recipes = recipes.filter(recipe => {
          const recipeTags = recipe.tags.map(normalize);
          return normalizedPrefs.every(pref => recipeTags.includes(pref));
        });
        recipes = recipes.slice(0, count);
      }

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
    res.json(recipes);
  });

  app.post("/api/cookbook", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { externalId, source, title, image, readyInMinutes, servings, summary, ingredients, instructions, tags } = req.body;

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

      const existing = await storage.getShoppingItems(user.id);
      const existingNames = new Set(existing.map(i => i.name));

      const newItems = ingredients
        .filter(name => !existingNames.has(name))
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
