import { words as defaultVocabulary } from "../data/words.ts";

export interface GenerateWordsOptions {
  existingSequence?: readonly string[];
  vocabulary?: readonly string[];
}

/**
 * Generates random lowercase words without adjacent repeats. If a vocabulary
 * cannot provide the requested count without a repeat, returns the words it can.
 */
export function generateWords(
  count: number,
  options: GenerateWordsOptions = {},
): string[] {
  if (!Number.isSafeInteger(count) || count < 0) return [];
  if (count === 0) return [];

  const vocabulary = [
    ...new Set(
      (options.vocabulary ?? defaultVocabulary).filter(
        (word) => typeof word === "string" && /^[a-z]+$/.test(word),
      ),
    ),
  ];
  if (vocabulary.length === 0) return [];

  const result: string[] = [];
  let previousWord = options.existingSequence?.at(-1);

  for (let index = 0; index < count; index += 1) {
    if (vocabulary.length === 1 && vocabulary[0] === previousWord) break;

    let wordIndex = Math.floor(Math.random() * vocabulary.length);
    if (vocabulary[wordIndex] === previousWord) {
      wordIndex = (wordIndex + 1) % vocabulary.length;
    }

    previousWord = vocabulary[wordIndex];
    result.push(previousWord);
  }

  return result;
}
