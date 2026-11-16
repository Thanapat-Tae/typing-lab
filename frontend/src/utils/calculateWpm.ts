import {
  isTypingCharacterCorrect,
  isTypingTextCorrect,
} from "./typingTextComparison";

/** Counts correctly typed characters from completed words and the active word. */
export function countCorrectCharacters(
  expectedWords: string[],
  completedWords: string[],
  activeWord: string,
  allowPassagePunctuationAliases = false,
): number {
  let correctCharacters = 0;

  completedWords.forEach((word, wordIndex) => {
    const expectedWord = expectedWords[wordIndex] ?? "";

    for (let index = 0; index < Math.min(word.length, expectedWord.length); index += 1) {
      if (
        isTypingCharacterCorrect(
          word[index],
          expectedWord[index],
          allowPassagePunctuationAliases,
        )
      ) {
        correctCharacters += 1;
      }
    }

    if (
      isTypingTextCorrect(
        word,
        expectedWord,
        allowPassagePunctuationAliases,
      ) &&
      wordIndex < expectedWords.length - 1
    ) {
      correctCharacters += 1;
    }
  });

  const expectedActiveWord = expectedWords[completedWords.length] ?? "";
  for (
    let index = 0;
    index < Math.min(activeWord.length, expectedActiveWord.length);
    index += 1
  ) {
    if (
      isTypingCharacterCorrect(
        activeWord[index],
        expectedActiveWord[index],
        allowPassagePunctuationAliases,
      )
    ) {
      correctCharacters += 1;
    }
  }

  return correctCharacters;
}

/** Calculates gross WPM from correct characters and elapsed milliseconds. */
export function calculateWpm(
  correctCharacters: number,
  elapsedMilliseconds: number,
): number {
  if (
    !Number.isInteger(correctCharacters) ||
    correctCharacters < 0 ||
    !Number.isFinite(elapsedMilliseconds) ||
    elapsedMilliseconds <= 0
  ) {
    return 0;
  }

  const wpm = (correctCharacters / 5) / (elapsedMilliseconds / 60_000);
  return Number.isFinite(wpm) ? wpm : 0;
}
