const SALT_RE =
  /^(?:[\d\s\/¼½¾⅓⅔⅛⅜⅝⅞.,]+\s*)?(?:(?:tsp|tbsp|teaspoons?|tablespoons?|pinch(?:es)?|dashes?|cups?|oz|g|grams?|ml)\s+)?(?:(?:kosher|sea|table|fine|coarse|flaky|iodized|rock)\s+)?salt(?:\s*(?:and|&)\s*(?:(?:fresh(?:ly)?(?:\s+ground)?|black|white|ground|cracked)\s+)?pepper(?:corns?)?)?(?:\s*,?\s*(?:to\s+taste|as\s+needed|as\s+desired))?$/i;

const PEPPER_RE =
  /^(?:[\d\s\/¼½¾⅓⅔⅛⅜⅝⅞.,]+\s*)?(?:(?:tsp|tbsp|teaspoons?|tablespoons?|pinch(?:es)?|dashes?|cups?|oz|g|grams?|ml)\s+)?(?:(?:fresh(?:ly)?(?:\s+ground)?|black|white|ground|cracked)\s+)?pepper(?:corns?)?(?:\s*,?\s*(?:to\s+taste|as\s+needed|as\s+desired))?$/i;

export function cleanIngredient(ingredient: string): string {
  const cleaned = ingredient.replace(/\s*\([^)]*\)/g, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function isSaltOrPepper(ingredient: string): boolean {
  const trimmed = ingredient.trim();
  return SALT_RE.test(trimmed) || PEPPER_RE.test(trimmed);
}
