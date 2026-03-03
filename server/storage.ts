import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  users, savedRecipes, shoppingItems,
  type User, type InsertUser,
  type SavedRecipe, type InsertSavedRecipe,
  type ShoppingItem, type InsertShoppingItem,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getSavedRecipes(userId: string): Promise<SavedRecipe[]>;
  getSavedRecipe(userId: string, externalId: number, source: string): Promise<SavedRecipe | undefined>;
  saveRecipe(recipe: InsertSavedRecipe): Promise<SavedRecipe>;
  removeSavedRecipe(userId: string, recipeId: string): Promise<void>;

  getShoppingItems(userId: string): Promise<ShoppingItem[]>;
  addShoppingItems(items: InsertShoppingItem[]): Promise<ShoppingItem[]>;
  toggleShoppingItem(userId: string, itemId: string): Promise<ShoppingItem | undefined>;
  clearCheckedItems(userId: string): Promise<void>;
  clearAllItems(userId: string): Promise<void>;

  getDietaryPreferences(userId: string): Promise<string[]>;
  updateDietaryPreferences(userId: string, preferences: string[]): Promise<string[]>;
  getAllergens(userId: string): Promise<string[]>;
  updateAllergens(userId: string, allergens: string[]): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.authProvider, provider), eq(users.authProviderId, providerId)));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getSavedRecipes(userId: string): Promise<SavedRecipe[]> {
    return db.select().from(savedRecipes).where(eq(savedRecipes.userId, userId));
  }

  async getSavedRecipe(userId: string, externalId: number, source: string): Promise<SavedRecipe | undefined> {
    const [recipe] = await db.select().from(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.externalId, externalId), eq(savedRecipes.source, source)));
    return recipe;
  }

  async saveRecipe(recipe: InsertSavedRecipe): Promise<SavedRecipe> {
    const [saved] = await db.insert(savedRecipes).values(recipe).returning();
    return saved;
  }

  async removeSavedRecipe(userId: string, recipeId: string): Promise<void> {
    await db.delete(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.id, recipeId)));
  }

  async getShoppingItems(userId: string): Promise<ShoppingItem[]> {
    return db.select().from(shoppingItems).where(eq(shoppingItems.userId, userId));
  }

  async addShoppingItems(items: InsertShoppingItem[]): Promise<ShoppingItem[]> {
    if (items.length === 0) return [];
    return db.insert(shoppingItems).values(items).returning();
  }

  async toggleShoppingItem(userId: string, itemId: string): Promise<ShoppingItem | undefined> {
    const [item] = await db.select().from(shoppingItems)
      .where(and(eq(shoppingItems.userId, userId), eq(shoppingItems.id, itemId)));
    if (!item) return undefined;

    const [updated] = await db.update(shoppingItems)
      .set({ checked: !item.checked })
      .where(eq(shoppingItems.id, itemId))
      .returning();
    return updated;
  }

  async clearCheckedItems(userId: string): Promise<void> {
    await db.delete(shoppingItems)
      .where(and(eq(shoppingItems.userId, userId), eq(shoppingItems.checked, true)));
  }

  async clearAllItems(userId: string): Promise<void> {
    await db.delete(shoppingItems).where(eq(shoppingItems.userId, userId));
  }

  async getDietaryPreferences(userId: string): Promise<string[]> {
    const [user] = await db.select({ dietaryPreferences: users.dietaryPreferences }).from(users).where(eq(users.id, userId));
    return user?.dietaryPreferences ?? [];
  }

  async updateDietaryPreferences(userId: string, preferences: string[]): Promise<string[]> {
    const [updated] = await db.update(users)
      .set({ dietaryPreferences: preferences })
      .where(eq(users.id, userId))
      .returning({ dietaryPreferences: users.dietaryPreferences });
    return updated?.dietaryPreferences ?? [];
  }

  async getAllergens(userId: string): Promise<string[]> {
    const [user] = await db.select({ allergens: users.allergens }).from(users).where(eq(users.id, userId));
    return user?.allergens ?? [];
  }

  async updateAllergens(userId: string, allergens: string[]): Promise<string[]> {
    const [updated] = await db.update(users)
      .set({ allergens })
      .where(eq(users.id, userId))
      .returning({ allergens: users.allergens });
    return updated?.allergens ?? [];
  }
}

export const storage = new DatabaseStorage();
