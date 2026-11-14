import { useCallback, useEffect, useRef, useState } from "react";
import { calculateTimeLimit } from "../../utils/calculateTimeLimit";
import { calculateWpm, countCorrectCharacters } from "../../utils/calculateWpm";
import { calculateAccuracy } from "../../utils/calculateAccuracy";
import "./TypingTest.css";

const passage = "The quiet moon shines above the sleeping city.";

const words = passage.split(" ");

interface TestStatistics {
  wpm: number;
  accuracy: number;
  words: number;
  characters: number;
  elapsedSeconds: number;
}

function commonPrefixLength(left: string, right: string): number {
  let length = 0;
  while (
    length < left.length &&
    length < right.length &&
    left[length] === right[length]
  ) {
    length += 1;
  }
  return length;
}

function commonSuffixLength(left: string, right: string): number {
  let length = 0;
  while (
    length < left.length &&
    length < right.length &&
    left[left.length - 1 - length] === right[right.length - 1 - length]
  ) {
    length += 1;
  }
  return length;
}

function TypingTest() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [completedWords, setCompletedWords] = useState<string[]>([]);

  const timeLimit = calculateTimeLimit(passage);

  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasStarted, setHasStarted] = useState(false);
  const [statistics, setStatistics] = useState<TestStatistics | null>(null);
  const [resetVersion, setResetVersion] = useState(0);

  const isFinished = currentWordIndex >= words.length;
  const isTimeUp = timeLeft === 0;

  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const stoppedAtRef = useRef<number | null>(null);
  const inputValueRef = useRef("");
  const isComposingRef = useRef(false);
  const compositionStartValueRef = useRef("");
  const accuracyCountsRef = useRef({ correct: 0, total: 0 });

  const resetSession = useCallback(() => {
    setCurrentWordIndex(0);
    setCurrentInput("");
    setCompletedWords([]);
    setTimeLeft(timeLimit);
    setHasStarted(false);
    setStatistics(null);

    startedAtRef.current = null;
    stoppedAtRef.current = null;
    inputValueRef.current = "";
    isComposingRef.current = false;
    compositionStartValueRef.current = "";
    accuracyCountsRef.current = { correct: 0, total: 0 };
    setResetVersion((previous) => previous + 1);
  }, [timeLimit]);

  useEffect(() => {
    inputRef.current?.focus();

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
        return;
      }

      if (event.key.length !== 1 && event.key !== "Backspace") {
        return;
      }

      const target = event.target as HTMLElement | null;

      if (target === inputRef.current || target?.isContentEditable) {
        return;
      }

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    function handleRetryShortcut(event: KeyboardEvent) {
      const isRetryShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key === "Enter" &&
        !event.isComposing;

      if (!isRetryShortcut || (!isFinished && !isTimeUp)) return;

      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) resetSession();
    }

    window.addEventListener("keydown", handleRetryShortcut);
    return () => window.removeEventListener("keydown", handleRetryShortcut);
  }, [isFinished, isTimeUp, resetSession]);

  useEffect(() => {
    if (resetVersion > 0) inputRef.current?.focus();
  }, [resetVersion]);

  useEffect(() => {
    if (!hasStarted || isFinished || isTimeUp) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [hasStarted, isFinished, isTimeUp]);

  useEffect(() => {
    if (!isFinished && !isTimeUp) return;
    if (stoppedAtRef.current !== null) return;

    if (startedAtRef.current === null) return;

    const stoppedAt = performance.now();
    stoppedAtRef.current = stoppedAt;
    const elapsedMilliseconds = Math.max(0, stoppedAt - startedAtRef.current);
    const correctCharacters = countCorrectCharacters(
      words,
      completedWords,
      currentInput,
    );
    const { correct, total } = accuracyCountsRef.current;
    setStatistics({
      wpm: calculateWpm(correctCharacters, elapsedMilliseconds),
      accuracy: calculateAccuracy(correct, total),
      words: completedWords.length,
      characters: correctCharacters,
      elapsedSeconds: elapsedMilliseconds / 1000,
    });
  }, [isFinished, isTimeUp, completedWords, currentInput]);

  function handleInput(value: string) {
    if (isFinished || isTimeUp) return;

    const previousInput = inputValueRef.current;
    const expectedWord = words[currentWordIndex];
    const isLastWord = currentWordIndex === words.length - 1;

    // Finish immediately when the final word is correct.
    if (isLastWord && value === expectedWord) {
      recordCharacterAttempts(previousInput, value, expectedWord, false);
      inputValueRef.current = "";
      startTimerIfNeeded();
      setCompletedWords((previous) => [...previous, value]);
      setCurrentWordIndex(words.length);
      setCurrentInput("");
      return;
    }

    // Only a single separator after an exactly correct word is accepted.
    if (value.endsWith(" ")) {
      if (
        previousInput !== expectedWord ||
        value !== `${expectedWord} `
      ) {
        setCurrentInput(previousInput);
        return;
      }

      recordCharacterAttempts(previousInput, value, expectedWord, true);
      inputValueRef.current = "";
      startTimerIfNeeded();
      setCompletedWords((previous) => [...previous, previousInput]);
      setCurrentWordIndex((previous) => previous + 1);
      setCurrentInput("");
      return;
    }

    if (value !== previousInput) {
      recordCharacterAttempts(previousInput, value, expectedWord, false);
      inputValueRef.current = value;
      startTimerIfNeeded();
      setCurrentInput(value);
    }
  }

  function recordCharacterAttempts(
    previousInput: string,
    nextInput: string,
    expectedWord: string,
    acceptedSeparator: boolean,
  ) {
    // Score only the net inserted delta: deletion and unchanged text never add
    // attempts, while replacement characters are scored at their new position.
    const prefixLength = commonPrefixLength(previousInput, nextInput);
    const suffixLength = commonSuffixLength(
      previousInput.slice(prefixLength),
      nextInput.slice(prefixLength),
    );
    const insertedText = nextInput.slice(
      prefixLength,
      nextInput.length - suffixLength,
    );

    for (let index = 0; index < insertedText.length; index += 1) {
      const characterIndex = prefixLength + index;
      const expectedCharacter =
        characterIndex < expectedWord.length
          ? expectedWord[characterIndex]
          : acceptedSeparator &&
              characterIndex === expectedWord.length &&
              currentWordIndex < words.length - 1
            ? " "
            : undefined;

      accuracyCountsRef.current.total += 1;
      if (insertedText[index] === expectedCharacter) {
        accuracyCountsRef.current.correct += 1;
      }
    }
  }

  function handleCompositionStart() {
    isComposingRef.current = true;
    compositionStartValueRef.current = inputValueRef.current;
  }

  function handleCompositionEnd(value: string) {
    isComposingRef.current = false;
    // Count only the committed composition text, never intermediate IME updates.
    inputValueRef.current = compositionStartValueRef.current;
    setCurrentInput(compositionStartValueRef.current);
    handleInput(value);
  }

  function startTimerIfNeeded() {
    if (startedAtRef.current !== null) return;

    startedAtRef.current = performance.now();
    setHasStarted(true);
  }

  return (
    <section
      className="typing-test"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="timer-container">
        <p
          className={`typing-timer ${
            timeLeft <= 10 ? "timer-warning" : ""
          } ${!hasStarted ? "timer-hidden" : ""}`}
        >
          <span aria-hidden="true">◷</span>
          <span>{timeLeft}s</span>
        </p>
      </div>

      <div className="typing-passage">
        {words.map((word, wordIndex) => {
          const isCurrentWord = wordIndex === currentWordIndex;
          const showCaret = isCurrentWord && !isFinished && !isTimeUp;

          const typedWord =
            wordIndex < currentWordIndex
              ? completedWords[wordIndex]
              : isCurrentWord
                ? currentInput
                : "";

          const expectedCharacters = word.split("");
          const extraCharacters = (typedWord ?? "")
            .slice(expectedCharacters.length)
            .split("");
          const caretIndex = (typedWord ?? "").length;

          return (
            <span
              key={wordIndex}
              className={
                isCurrentWord ? "typing-word active-word" : "typing-word"
              }
            >
              {expectedCharacters.map((character, charIndex) => {
                const typedCharacter = typedWord?.[charIndex];

                let className = "";

                if (typedCharacter !== undefined) {
                  className =
                    typedCharacter === character ? "correct" : "incorrect";
                }

                if (showCaret) {
                  if (caretIndex === charIndex) {
                    className = `${className} caret-before`.trim();
                  } else if (
                    caretIndex === expectedCharacters.length &&
                    extraCharacters.length === 0 &&
                    charIndex === expectedCharacters.length - 1
                  ) {
                    className = `${className} caret-after`.trim();
                  }
                }

                return (
                  <span key={charIndex} className={className}>
                    {character}
                  </span>
                );
              })}

              {extraCharacters.map((character, extraIndex) => {
                let className = "incorrect";

                if (showCaret) {
                  if (caretIndex === expectedCharacters.length + extraIndex) {
                    className = `${className} caret-before`;
                  } else if (
                    caretIndex ===
                      expectedCharacters.length + extraCharacters.length &&
                    extraIndex === extraCharacters.length - 1
                  ) {
                    className = `${className} caret-after`;
                  }
                }

                return (
                  <span key={`extra-${extraIndex}`} className={className}>
                    {character}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>

      {statistics !== null && (
        <div className="typing-session-summary">
          <p className="typing-result">
            <span>{statistics.wpm.toFixed(1)} WPM</span>
            <span>{statistics.accuracy.toFixed(1)}% accuracy</span>
            <span>{statistics.words} words</span>
            <span>{statistics.characters} chars</span>
            <span>{statistics.elapsedSeconds.toFixed(1)}s</span>
          </p>
          <button
            className="typing-retry"
            type="button"
            onClick={resetSession}
          >
            Retry
          </button>
          <span className="typing-retry-shortcut">Ctrl + Enter</span>
        </div>
      )}

      <input
        ref={inputRef}
        className="typing-input"
        type="text"
        value={currentInput}
        onChange={(event) => {
          if (
            isComposingRef.current ||
            (event.nativeEvent as InputEvent).isComposing
          ) {
            // IME updates are provisional; compositionend scores the commit once.
            setCurrentInput(event.target.value);
            return;
          }
          handleInput(event.target.value);
        }}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={(event) =>
          handleCompositionEnd(event.currentTarget.value)
        }
        disabled={isFinished || isTimeUp}
        placeholder={isFinished ? "Test complete!" : ""}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Typing input"
      />
    </section>
  );
}

export default TypingTest;
