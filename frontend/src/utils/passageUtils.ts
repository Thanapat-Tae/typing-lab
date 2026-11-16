import type { Passage, PassageLength } from "../data/passages";
import {
  countWords,
  filterByLength,
  LENGTH_RANGES,
  passages,
} from "../data/passages";
import { passageLengthOptions } from "../data/passageCategories";

/**
 * Internal state for repeat avoidance.
 * Keyed by length category to track last-selected passage per category.
 */
const lastSelectedIdByLength: Partial<Record<PassageLength, string>> = {};

function chooseRandomPassage(
  length: PassageLength,
  candidates: Passage[],
): Passage | null {
  if (candidates.length === 0) return null;

  const lastId = lastSelectedIdByLength[length];
  const pool =
    candidates.length > 1 && lastId
      ? candidates.filter((passage) => passage.id !== lastId)
      : candidates;

  const selected = pool[Math.floor(Math.random() * pool.length)];
  lastSelectedIdByLength[length] = selected.id;
  return selected;
}

/**
 * Selects a random passage from the given length category.
 * Avoids immediate repeats when at least two passages exist for that length.
 * Falls back to any passage if only one is available.
 */
export function selectRandomPassage(length: PassageLength): Passage {
  const candidates = filterByLength(length);

  const selected = chooseRandomPassage(length, candidates);
  if (selected === null) {
    throw new Error(`No passages available for length category: ${length}`);
  }

  return selected;
}

/**
 * Selects an original or literary passage for Passage Mode.
 * Returns null when the requested length has no eligible passages.
 */
export function selectRandomPassageForPassageMode(
  length: PassageLength,
): Passage | null {
  const candidates = filterByLength(length).filter(
    (passage) =>
      passage.category === "original" || passage.category === "literature",
  );

  return chooseRandomPassage(length, candidates);
}

/**
 * Resets the repeat-avoidance state for a specific length or all lengths.
 * Useful for testing or when the user explicitly requests a fresh start.
 */
export function resetRepeatState(length?: PassageLength): void {
  if (length) {
    delete lastSelectedIdByLength[length];
  } else {
    Object.keys(lastSelectedIdByLength).forEach(
      (key) => delete lastSelectedIdByLength[key as PassageLength]
    );
  }
}

/**
 * Returns the count of available passages for each length category.
 * Useful for UI to disable unavailable lengths.
 */
export function getPassageCountsByLength(): Record<PassageLength, number> {
  const lengths = passageLengthOptions;
  const counts: Record<PassageLength, number> = {} as Record<
    PassageLength,
    number
  >;

  for (const length of lengths) {
    counts[length] = filterByLength(length).length;
  }

  return counts;
}

/**
 * Validates that all passages in the library fall within their declared length ranges.
 * Returns an array of validation errors (empty if all valid).
 */
export function validatePassageLengths(): string[] {
  const errors: string[] = [];

  for (const passage of passages) {
    const wordCount = countWords(passage.text);
    const matched = passageLengthOptions.some((length) => {
      const [min, max] = LENGTH_RANGES[length];
      return wordCount >= min && wordCount <= max;
    });

    if (!matched) {
      errors.push(
        `Passage "${passage.id}" has ${wordCount} words but matches no length category`
      );
    }
  }

  return errors;
}
