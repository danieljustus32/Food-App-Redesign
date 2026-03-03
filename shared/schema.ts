import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull().default(""),
  authProvider: text("auth_provider"),
  authProviderId: text("auth_provider_id"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  dietaryPreferences: jsonb("dietary_preferences").notNull().default([]).$type<string[]>(),
  allergens: jsonb("allergens").notNull().default([]).$type<string[]>(),
});

export const savedRecipes = pgTable("saved_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  externalId: integer("external_id").notNull(),
  source: text("source").notNull().default("spoonacular"),
  title: text("title").notNull(),
  image: text("image").notNull(),
  readyInMinutes: integer("ready_in_minutes").notNull(),
  servings: integer("servings").notNull(),
  summary: text("summary").notNull(),
  ingredients: jsonb("ingredients").notNull().$type<string[]>(),
  instructions: jsonb("instructions").notNull().$type<string[]>(),
  tags: jsonb("tags").notNull().$type<string[]>(),
});

export const shoppingItems = pgTable("shopping_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  section: text("section").notNull(),
  checked: boolean("checked").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  authProvider: true,
  authProviderId: true,
});

export const insertSavedRecipeSchema = createInsertSchema(savedRecipes).omit({
  id: true,
});

export const insertShoppingItemSchema = createInsertSchema(shoppingItems).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SavedRecipe = typeof savedRecipes.$inferSelect;
export type InsertSavedRecipe = z.infer<typeof insertSavedRecipeSchema>;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = z.infer<typeof insertShoppingItemSchema>;
