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
  createUser(user: InsertUser): Promise<User>;

  getSavedRecipes(userId: string): Promise<SavedRecipe[]>;
  getSavedRecipe(userId: string, spoonacularId: number): Promise<SavedRecipe | undefined>;
  saveRecipe(recipe: InsertSavedRecipe): Promise<SavedRecipe>;
  removeSavedRecipe(userId: string, recipeId: string): Promise<void>;

  getShoppingItems(userId: string): Promise<ShoppingItem[]>;
  addShoppingItems(items: InsertShoppingItem[]): Promise<ShoppingItem[]>;
  toggleShoppingItem(userId: string, itemId: string): Promise<ShoppingItem | undefined>;
  clearCheckedItems(userId: string): Promise<void>;
  clearAllItems(userId: string): Promise<void>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getSavedRecipes(userId: string): Promise<SavedRecipe[]> {
    return db.select().from(savedRecipes).where(eq(savedRecipes.userId, userId));
  }

  async getSavedRecipe(userId: string, spoonacularId: number): Promise<SavedRecipe | undefined> {
    const [recipe] = await db.select().from(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.spoonacularId, spoonacularId)));
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
}

export const storage = new DatabaseStorage();
