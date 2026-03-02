# Tindish - Recipe Discovery App

## Overview
A Tinder-style recipe discovery app where users swipe through food photos to save recipes to their Cookbook. Features hands-free cooking mode with voice commands, a shopping list organized by grocery aisle, and user authentication.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui + Framer Motion
- **Backend**: Express.js with Passport.js authentication
- **Database**: PostgreSQL with Drizzle ORM
- **API**: Spoonacular for recipe data
- **Routing**: wouter (frontend), Express (backend)
- **PWA**: Service worker, manifest.json, installable on iOS/Android/desktop

## Key Features
1. **Discover** - Swipeable recipe cards fetched from Spoonacular API. Swipe right to save, left to pass.
2. **Cookbook** - Persistent collection of saved recipes with cook mode and shopping list integration.
3. **Shopping List** - Organized by grocery store aisle with check-off functionality.
4. **Hands-free Cooking** - Voice-guided step-by-step cooking using browser Speech APIs.
5. **User Auth** - Registration/login with session-based authentication.

## Data Model
- `users` - id, username, password (hashed)
- `saved_recipes` - id, userId, spoonacularId, title, image, readyInMinutes, servings, summary, ingredients (jsonb), instructions (jsonb), tags (jsonb)
- `shopping_items` - id, userId, name, section, checked

## API Routes
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `GET /api/recipes/random` - Random recipes from Spoonacular
- `GET /api/recipes/search?q=` - Search recipes
- `GET /api/cookbook` - User's saved recipes
- `POST /api/cookbook` - Save a recipe
- `DELETE /api/cookbook/:id` - Remove saved recipe
- `GET /api/shopping-list` - User's shopping list
- `POST /api/shopping-list` - Add ingredients
- `PATCH /api/shopping-list/:id/toggle` - Toggle item checked
- `DELETE /api/shopping-list/checked` - Clear checked items

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set)
- `SPOONACULAR_API_KEY` - Spoonacular API key (secret)

## File Structure
- `shared/schema.ts` - Drizzle schema + Zod types
- `server/db.ts` - Database connection
- `server/auth.ts` - Passport authentication setup
- `server/storage.ts` - Database CRUD operations
- `server/spoonacular.ts` - Spoonacular API client
- `server/routes.ts` - Express API routes
- `client/src/hooks/use-auth.tsx` - Auth context/provider
- `client/src/pages/` - Page components (Auth, Discover, Cookbook, ShoppingList, CookingMode, Profile)
- `client/src/components/RecipeCard.tsx` - Swipeable recipe card
