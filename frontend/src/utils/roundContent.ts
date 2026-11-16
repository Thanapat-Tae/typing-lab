export type ContentAction = "preserve" | "generate";
export type RoundMode = "normal" | "timer" | "passage";

export interface RoundContentUpdate<TPassage> {
  normalWords?: string[];
  timerWords?: string[];
  selectedPassage?: TPassage | null;
}

export interface RoundContentOptions<TPassage, TPassageLength extends string> {
  contentAction: ContentAction;
  mode: RoundMode;
  wordCount: number;
  timerBatchSize: number;
  passageLength: TPassageLength;
  generateWords: (count: number) => string[];
  selectPassage: (length: TPassageLength) => TPassage | null;
}

/**
 * Returns content changes for a new round. Retry leaves all content untouched,
 * including Timer Mode batches appended during the current round.
 */
export function getRoundContentUpdate<TPassage, TPassageLength extends string>(
  options: RoundContentOptions<TPassage, TPassageLength>,
): RoundContentUpdate<TPassage> | null {
  if (options.contentAction === "preserve") return null;

  switch (options.mode) {
    case "normal":
      return {
        normalWords: options.generateWords(options.wordCount),
        timerWords: [],
      };
    case "timer":
      return { timerWords: options.generateWords(options.timerBatchSize) };
    case "passage":
      return {
        timerWords: [],
        selectedPassage: options.selectPassage(options.passageLength),
      };
  }
}
