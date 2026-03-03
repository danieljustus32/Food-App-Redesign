# Tindish - Recipe Discovery App

## Overview
A Tinder-style recipe discovery app where users swipe through food photos to save recipes to their Cookbook. Features hands-free cooking mode with voice commands, a shopping list organized by grocery aisle, and user authentication.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui + Framer Motion
- **Backend**: Express.js with Passport.js authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Recipe Providers**: API-agnostic provider pattern with fallback (Spoonacular, FatSecret, Mock)
- **Routing**: wouter (frontend), Express (backend)
- **PWA**: Service worker, manifest.json, installable on iOS/Android/desktop

## Key Features
1. **Discover** - Swipeable recipe cards fetched from multiple recipe APIs with fallback. Swipe right to save, left to pass.
2. **Cookbook** - Persistent collection of saved recipes with cook mode and shopping list integration.
3. **Shopping List** - Organized by grocery store aisle with check-off functionality.
4. **Hands-free Cooking** - Voice-guided step-by-step cooking using browser Speech APIs.
5. **User Auth** - Registration/login with session-based authentication. Social login with Google and Apple OAuth.

## Recipe Provider System
The app uses an API-agnostic provider pattern (`server/recipe-providers/`):
- **RecipeProvider interface** (`types.ts`): Defines `getRandomRecipes()` and `searchRecipes()` methods
- **Spoonacular** (`spoonacular.ts`): Requires `SPOONACULAR_API_KEY`
- **FatSecret** (`fatsecret.ts`): Requires `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET`. Uses OAuth2 client_credentials flow.
- **Edamam** (`edamam.ts`): Requires `EDAMAM_APP_ID` and `EDAMAM_APP_KEY`. Uses Recipe Search API v2.
- **Mock** (`mock.ts`): Fallback provider with hardcoded recipes, always available
- **Provider Manager** (`index.ts`): Calls all available providers in parallel, shuffles combined results; falls back to mock if all fail
- In dev mode (`APP_ENV=dev`), only mock provider is used
- All providers normalize data to `NormalizedRecipe` shape: `{ externalId, source, title, image, readyInMinutes, servings, summary, ingredients, instructions, tags }`

## Data Model
- `users` - id, username, password (hashed, empty for social auth users), authProvider (google/apple/null), authProviderId, dietaryPreferences (jsonb array of strings), allergens (jsonb array of strings)
- `saved_recipes` - id, userId, externalId, source, title, image, readyInMinutes, servings, summary, ingredients (jsonb), instructions (jsonb), tags (jsonb)
- `shopping_items` - id, userId, name, section, checked

## API Routes
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/apple` - Initiate Apple OAuth
- `POST /api/auth/apple/callback` - Apple OAuth callback
- `GET /api/preferences` - Get user dietary preferences
- `PUT /api/preferences` - Update user dietary preferences
- `GET /api/recipes/random` - Random recipes from available providers (filtered by user dietary preferences)
- `GET /api/recipes/search?q=` - Search recipes across providers
- `GET /api/cookbook` - User's saved recipes
- `POST /api/cookbook` - Save a recipe
- `DELETE /api/cookbook/:id` - Remove saved recipe
- `GET /api/shopping-list` - User's shopping list
- `POST /api/shopping-list` - Add ingredients
- `PATCH /api/shopping-list/:id/toggle` - Toggle item checked
- `DELETE /api/shopping-list/checked` - Clear checked items

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set)
- `APP_ENV` - Set to "dev" for mock data mode
- `SPOONACULAR_API_KEY` - Spoonacular API key (optional, for Spoonacular provider)
- `FATSECRET_CLIENT_ID` - FatSecret OAuth2 client ID (optional, for FatSecret provider)
- `FATSECRET_CLIENT_SECRET` - FatSecret OAuth2 client secret (optional, for FatSecret provider)
- `EDAMAM_APP_ID` - Edamam application ID (optional, for Edamam provider)
- `EDAMAM_APP_KEY` - Edamam application key (optional, for Edamam provider)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional, for Google login)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional, for Google login)
- `APPLE_CLIENT_ID` - Apple Sign-In service ID (optional, for Apple login)
- `APPLE_TEAM_ID` - Apple Developer team ID (optional, for Apple login)
- `APPLE_KEY_ID` - Apple Sign-In key ID (optional, for Apple login)
- `APPLE_PRIVATE_KEY` - Apple Sign-In private key (optional, for Apple login)

## File Structure
- `shared/schema.ts` - Drizzle schema + Zod types
- `server/db.ts` - Database connection
- `server/auth.ts` - Passport authentication setup
- `server/storage.ts` - Database CRUD operations
- `server/recipe-providers/` - API-agnostic recipe provider system
  - `types.ts` - RecipeProvider interface and NormalizedRecipe type
  - `index.ts` - Provider manager with fallback logic
  - `spoonacular.ts` - Spoonacular API provider
  - `fatsecret.ts` - FatSecret API provider
  - `edamam.ts` - Edamam Recipe Search API provider
  - `mock.ts` - Mock data fallback provider
- `server/mockRecipes.ts` - Hardcoded mock recipe data
- `server/routes.ts` - Express API routes
- `client/src/hooks/use-auth.tsx` - Auth context/provider
- `client/src/pages/` - Page components (Auth, Discover, Cookbook, ShoppingList, CookingMode, Profile, PrivacyPolicy, TermsOfService)
- `client/src/components/RecipeCard.tsx` - Swipeable recipe card
