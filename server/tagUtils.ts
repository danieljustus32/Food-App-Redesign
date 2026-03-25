const HYPHENATED_TERMS: [RegExp, string][] = [
  [/\bdairy[\s-]free\b/gi, "Dairy-free"],
  [/\bgluten[\s-]free\b/gi, "Gluten-free"],
  [/\blacto[\s-]ovo[\s-]vegetarian\b/gi, "Lacto-ovo-vegetarian"],
];

export function formatTag(tag: string): string {
  let normalized = tag;
  for (const [pattern, replacement] of HYPHENATED_TERMS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized
    .split(/\s*\/\s*/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" / ");
}
