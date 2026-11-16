const passagePunctuationAliases = new Map<string, string>([
  ["“", '"'],
  ["”", '"'],
  ["‘", "'"],
  ["’", "'"],
  ["—", "-"],
  ["–", "-"],
]);

/** Return display-ready punctuation without changing the stored passage text. */
export function normalizePassagePunctuation(text: string): string {
  return Array.from(
    text,
    (character) => passagePunctuationAliases.get(character) ?? character,
  ).join("");
}

/** Compare one typed character with the expected character. */
export function isTypingCharacterCorrect(
  typedCharacter: string,
  expectedCharacter: string,
  allowPassagePunctuationAliases = false,
): boolean {
  if (typedCharacter === expectedCharacter) return true;
  if (!allowPassagePunctuationAliases) return false;

  return normalizePassagePunctuation(typedCharacter) ===
    normalizePassagePunctuation(expectedCharacter);
}

/** Compare text, optionally accepting keyboard punctuation aliases in Passage Mode. */
export function isTypingTextCorrect(
  typedText: string,
  expectedText: string,
  allowPassagePunctuationAliases = false,
): boolean {
  if (typedText === expectedText) return true;
  if (!allowPassagePunctuationAliases) return false;

  return normalizePassagePunctuation(typedText) ===
    normalizePassagePunctuation(expectedText);
}
