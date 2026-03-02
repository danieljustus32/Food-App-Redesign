export interface Recipe {
  id: string;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

export const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Truffle Mushroom Pasta",
    image: "/images/food-pasta.jpg",
    readyInMinutes: 30,
    servings: 2,
    summary: "A creamy, indulgent pasta dish infused with the earthy aroma of white truffles and mixed wild mushrooms. Perfect for a cozy date night.",
    ingredients: [
      "8 oz fettuccine",
      "2 cups mixed mushrooms (cremini, shiitake)",
      "2 cloves garlic, minced",
      "1 cup heavy cream",
      "1 tbsp white truffle oil",
      "1/2 cup parmesan cheese",
      "Fresh parsley for garnish"
    ],
    instructions: [
      "Boil pasta in salted water until al dente.",
      "Sauté mushrooms in butter until golden brown.",
      "Add garlic and cook for 1 minute.",
      "Pour in heavy cream and simmer until slightly thickened.",
      "Stir in truffle oil and parmesan cheese.",
      "Toss pasta in sauce and garnish with parsley."
    ],
    tags: ["Vegetarian", "Pasta", "Italian", "Date Night"]
  },
  {
    id: "2",
    title: "Spicy Miso Ramen",
    image: "/images/food-ramen.jpg",
    readyInMinutes: 45,
    servings: 2,
    summary: "Rich, complex, and deeply savory ramen bowl with a spicy kick. Topped with a perfectly soft-boiled egg and tender pork belly.",
    ingredients: [
      "2 portions fresh ramen noodles",
      "4 cups pork or chicken broth",
      "3 tbsp spicy miso paste",
      "2 soft-boiled eggs",
      "4 slices chashu (braised pork belly)",
      "Green onions, sliced",
      "Nori seaweed sheets"
    ],
    instructions: [
      "Heat broth and whisk in spicy miso paste until dissolved.",
      "Cook ramen noodles according to package directions.",
      "Divide noodles between two large bowls.",
      "Pour hot broth over the noodles.",
      "Top with chashu, halved soft-boiled eggs, green onions, and nori."
    ],
    tags: ["Japanese", "Soup", "Spicy", "Comfort Food"]
  },
  {
    id: "3",
    title: "Gourmet Smash Burger",
    image: "/images/food-burger.jpg",
    readyInMinutes: 20,
    servings: 4,
    summary: "The ultimate crispy-edged smash burger with double beef patties, melted American cheese, caramelized onions, and secret sauce on a brioche bun.",
    ingredients: [
      "1 lb ground beef (80/20 blend)",
      "4 brioche buns",
      "8 slices American cheese",
      "1 large onion, thinly sliced",
      "1/4 cup mayonnaise",
      "2 tbsp ketchup",
      "1 tbsp sweet relish",
      "Lettuce and tomato"
    ],
    instructions: [
      "Mix mayo, ketchup, and relish to make the secret sauce.",
      "Caramelize onions in a skillet with a little oil.",
      "Form beef into 2oz balls.",
      "Smash beef balls onto a screaming hot cast iron skillet.",
      "Cook for 2 minutes, flip, add cheese, and cook 1 more minute.",
      "Toast buns and assemble burgers with sauce, lettuce, tomato, patties, and onions."
    ],
    tags: ["American", "Burger", "Quick", "Indulgent"]
  },
  {
    id: "4",
    title: "Summer Quinoa Salad",
    image: "/images/food-salad.jpg",
    readyInMinutes: 25,
    servings: 4,
    summary: "A vibrant, refreshing salad packed with protein-rich quinoa, fresh summer vegetables, feta cheese, and a zesty lemon vinaigrette.",
    ingredients: [
      "1 cup quinoa, rinsed",
      "2 cups cherry tomatoes, halved",
      "1 cucumber, diced",
      "1/2 red onion, diced",
      "1/2 cup kalamata olives",
      "1/4 cup fresh mint, chopped",
      "3 tbsp olive oil",
      "2 tbsp lemon juice"
    ],
    instructions: [
      "Cook quinoa in 2 cups of water until fluffy, then let cool.",
      "Whisk together olive oil, lemon juice, salt, and pepper.",
      "In a large bowl, combine cooled quinoa, tomatoes, cucumber, onion, and olives.",
      "Pour dressing over salad and toss to combine.",
      "Top with fresh mint before serving."
    ],
    tags: ["Healthy", "Vegetarian", "Salad", "Gluten-Free"]
  },
  {
    id: "5",
    title: "Decadent Chocolate Lava Cake",
    image: "/images/food-dessert.jpg",
    readyInMinutes: 35,
    servings: 2,
    summary: "Rich, dark chocolate cake with a molten, gooey center. A show-stopping dessert that's surprisingly easy to make at home.",
    ingredients: [
      "4 oz high-quality dark chocolate",
      "1/2 cup butter",
      "1 cup powdered sugar",
      "2 whole eggs + 2 egg yolks",
      "6 tbsp all-purpose flour",
      "Vanilla ice cream (for serving)"
    ],
    instructions: [
      "Preheat oven to 425°F (220°C). Butter and flour two ramekins.",
      "Melt chocolate and butter together in a microwave-safe bowl.",
      "Whisk in powdered sugar until smooth.",
      "Whisk in whole eggs and egg yolks.",
      "Gently fold in flour until just combined.",
      "Divide batter between ramekins and bake for 12-14 minutes.",
      "Invert onto plates and serve immediately with ice cream."
    ],
    tags: ["Dessert", "Chocolate", "Baking", "Sweet"]
  }
];

// Simple in-memory store for mocked auth and saved recipes
let currentUser = { id: 'user_1', name: 'Foodie' };
let savedRecipeIds = new Set<string>();

export const getSavedRecipes = () => {
  return mockRecipes.filter(r => savedRecipeIds.has(r.id));
};

export const saveRecipe = (id: string) => {
  savedRecipeIds.add(id);
};

export const removeRecipe = (id: string) => {
  savedRecipeIds.delete(id);
};

export const isRecipeSaved = (id: string) => {
  return savedRecipeIds.has(id);
};
