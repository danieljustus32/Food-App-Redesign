type Listener = () => void;
let listeners: Listener[] = [];

export interface ShoppingItem {
  id: string;
  name: string;
  section: string;
  checked: boolean;
}

let shoppingList: ShoppingItem[] = [];

function getSection(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  if (lower.match(/beef|pork|chicken|meat/)) return "Meat";
  if (lower.match(/milk|cheese|butter|cream|egg/)) return "Dairy & Eggs";
  if (lower.match(/tomato|onion|garlic|mushroom|parsley|lettuce|cucumber|mint|lemon|vegetable|olive/)) return "Produce";
  if (lower.match(/pasta|noodle|flour|sugar|quinoa/)) return "Pantry";
  if (lower.match(/oil|vinegar|sauce|miso|ketchup|mayo|relish|mayonnaise/)) return "Condiments";
  return "Other";
}

const notify = () => listeners.forEach(l => l());

export const subscribeShoppingList = (listener: Listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const getShoppingList = () => [...shoppingList];

export const addIngredientsToList = (ingredients: string[]) => {
  let added = 0;
  ingredients.forEach(ing => {
    if (!shoppingList.some(item => item.name === ing)) {
      shoppingList.push({
        id: Math.random().toString(36).substr(2, 9),
        name: ing,
        section: getSection(ing),
        checked: false
      });
      added++;
    }
  });
  if (added > 0) notify();
  return added;
};

export const toggleShoppingItem = (id: string) => {
  const item = shoppingList.find(i => i.id === id);
  if (item) {
    item.checked = !item.checked;
    notify();
  }
};

export const clearCheckedItems = () => {
  shoppingList = shoppingList.filter(i => !i.checked);
  notify();
};

export const clearAllItems = () => {
  shoppingList = [];
  notify();
};
