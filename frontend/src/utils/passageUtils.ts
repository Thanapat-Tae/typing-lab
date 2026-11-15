import type { Passage, PassageLength } from "../data/passages";
import { passages, filterByLength } from "../data/passages";

/**
 * Internal state for repeat avoidance.
 * Keyed by length category to track last-selected passage per category.
 */
const lastSelectedIdByLength: Partial<Record<PassageLength, string>> = {};

/**
 * Selects a random passage from the given length category.
 * Avoids immediate repeats when at least two passages exist for that length.
 * Falls back to any passage if only one is available.
 */
export function selectRandomPassage(length: PassageLength): Passage {
  const candidates = filterByLength(length);

  if (candidates.length === 0) {
    throw new Error(`No passages available for length category: ${length}`);
  }

  const lastId = lastSelectedIdByLength[length];
  const pool =
    candidates.length > 1 && lastId
      ? candidates.filter((p) => p.id !== lastId)
      : candidates;

  const selected = pool[Math.floor(Math.random() * pool.length)];
  lastSelectedIdByLength[length] = selected.id;
  return selected;
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
  const lengths: PassageLength[] = [
    "short",
    "medium",
    "long",
    "extra",
    "ultimate",
  ];
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
    const wordCount = passage.text.trim().split(/\s+/).filter(Boolean).length;
    let matched = false;

    for (const [, [min, max]] of Object.entries(
      { short: [20, 50], medium: [51, 120], long: [121, 250], extra: [251, 500], ultimate: [501, Infinity] } as Record<PassageLength, [number, number]>
    )) {
      if (wordCount >= min && wordCount <= max) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      errors.push(
        `Passage "${passage.id}" has ${wordCount} words but matches no length category`
      );
    }
  }

  return errors;
}