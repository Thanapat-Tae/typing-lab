import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { calculateWpm, countCorrectCharacters } from "../../utils/calculateWpm";
import { calculateAccuracy } from "../../utils/calculateAccuracy";
import { generateWords } from "../../utils/generateWords";
import type { Passage, PassageLength } from "../../data/passages";
import { selectRandomPassage, getPassageCountsByLength } from "../../utils/passageUtils";
import "./TypingTest.css";

const initialTimerBatchSize = 50;
const timerRefillThreshold = 10;
const maxExtraCharacters = 5;
const timerPresets = [15, 30, 60, 120, 150] as const;

interface TestStatistics {
  wpm: number;
  accuracy: number;
  words: number;
  characters: number;
  elapsedSeconds: number;
}

type TypingMode = "normal" | "timer";
type TimerDurationOption = (typeof timerPresets)[number] | "custom";

const lengthOptions: PassageLength[] = ["short", "medium", "long", "extra", "ultimate"];
const defaultLength: PassageLength = "medium";

const lengthLabels: Record<PassageLength, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
  extra: "Extra",
  ultimate: "Ultimate",
};

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

function isPositiveSafeIntegerSeconds(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
}

function timerHasExpired(
  startedAt: number,
  durationSeconds: number,
  now = performance.now(),
): boolean {
  return (now - startedAt) / 1000 >= durationSeconds;
}

function getRemainingSeconds(
  startedAt: number,
  durationSeconds: number,
  now = performance.now(),
): number {
  const elapsedSeconds = Math.max(0, now - startedAt) / 1000;
  return Math.ceil(Math.max(0, durationSeconds - elapsedSeconds));
}

function getCappedElapsedMilliseconds(
  startedAt: number,
  durationSeconds: number,
  now = performance.now(),
): number {
  const elapsedSeconds = Math.max(0, now - startedAt) / 1000;
  return Math.min(elapsedSeconds, durationSeconds) * 1000;
}

function TypingTest() {
  const [mode, setMode] = useState<TypingMode>("normal");
  const [timerWords, setTimerWords] = useState<string[]>([]);
  const [durationOption, setDurationOption] = useState<TimerDurationOption>(30);
  const [customDurationInput, setCustomDurationInput] = useState("30");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [normalPassage, setNormalPassage] = useState<Passage | null>(() => {
    try {
      return selectRandomPassage(defaultLength);
    } catch {
      return null;
    }
  });
  const [selectedLength, setSelectedLength] = useState<PassageLength>(defaultLength);

  const customDuration = isPositiveSafeIntegerSeconds(customDurationInput);
  const isCustomDurationValid = customDuration !== null;
  const selectedDuration =
    durationOption === "custom" ? customDuration ?? 0 : durationOption;
  const isDurationValid =
    durationOption !== "custom" || isCustomDurationValid;

  const normalWords = normalPassage ? normalPassage.text.split(" ") : [];
  const activeWords = mode === "normal" ? normalWords : timerWords;

  const [timeLeft, setTimeLeft] = useState(30);
  const [hasStarted, setHasStarted] = useState(false);
  const [statistics, setStatistics] = useState<TestStatistics | null>(null);
  const [resetVersion, setResetVersion] = useState(0);

  const isFinished =
    mode === "normal" && currentWordIndex >= normalWords.length;
  const isTimeUp = mode === "timer" && hasStarted && timeLeft === 0;

  const inputRef = useRef<HTMLInputElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const stoppedAtRef = useRef<number | null>(null);
  const inputValueRef = useRef("");
  const isComposingRef = useRef(false);
  const compositionStartValueRef = useRef("");
  const accuracyCountsRef = useRef({ correct: 0, total: 0 });

  const passageCounts = getPassageCountsByLength();

  const selectPassageForLength = useCallback((length: PassageLength) => {
    try {
      const passage = selectRandomPassage(length);
      setNormalPassage(passage);
      setSelectedLength(length);
    } catch {
      // If no passages for this length, clear the passage
      setNormalPassage(null);
      setSelectedLength(length);
    }
  }, []);

  const resetSession = useCallback(
    (
      nextMode: TypingMode = mode,
      nextDuration = selectedDuration,
      focusTyping = true,
      nextLength = selectedLength,
    ) => {
      setCurrentWordIndex(0);
      if (passageRef.current) passageRef.current.scrollTop = 0;
      setCurrentInput("");
      setCompletedWords([]);
      setTimeLeft(
        nextMode === "timer" && Number.isFinite(nextDuration)
          ? nextDuration
          : 0,
      );
      setHasStarted(false);
      setStatistics(null);
      setTimerWords(
        nextMode === "timer" ? generateWords(initialTimerBatchSize) : [],
      );

      // When entering Normal mode (or retrying in Normal), select a new passage
      if (nextMode === "normal") {
        selectPassageForLength(nextLength);
      }

      startedAtRef.current = null;
      stoppedAtRef.current = null;
      inputValueRef.current = "";
      isComposingRef.current = false;
      compositionStartValueRef.current = "";
      accuracyCountsRef.current = { correct: 0, total: 0 };
      if (focusTyping) {
        setResetVersion((previous) => previous + 1);
      }
    },
    [mode, selectedDuration, selectedLength, selectPassageForLength],
  );

  function handleModeChange(nextMode: TypingMode) {
    if (nextMode === mode) return;
    // When switching to Normal, pick a passage for the current length
    const nextDuration = nextMode === "timer" ? selectedDuration : 0;
    resetSession(nextMode, nextDuration);
    setMode(nextMode);
  }

  function handleDurationChange(nextOption: TimerDurationOption) {
    if (nextOption === durationOption) return;
    const nextDuration =
      nextOption === "custom" ? customDuration ?? Number.NaN : nextOption;
    setDurationOption(nextOption);
    resetSession("timer", nextDuration);
  }

  function handleCustomDurationInput(value: string) {
    setCustomDurationInput(value);
    const nextDuration = isPositiveSafeIntegerSeconds(value);
    resetSession("timer", nextDuration ?? Number.NaN, false);
  }

  function handleLengthChange(nextLength: PassageLength) {
    if (mode !== "normal" || passageCounts[nextLength] === 0) return;
    resetSession("normal", 0, true, nextLength);
  }

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

      if (!isRetryShortcut) return;

      if (
        event.target instanceof HTMLInputElement &&
        event.target !== inputRef.current
      ) {
        return;
      }

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
    if (
      mode !== "timer" ||
      !hasStarted ||
      !isDurationValid ||
      isFinished ||
      isTimeUp
    ) {
      return;
    }

    const updateCountdown = () => {
      const startedAt = startedAtRef.current;
      if (startedAt === null) return;

      setTimeLeft(getRemainingSeconds(startedAt, selectedDuration));
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 100);

    return () => window.clearInterval(intervalId);
  }, [mode, hasStarted, isDurationValid, selectedDuration, isFinished, isTimeUp]);

  useEffect(() => {
    if (!isFinished && !isTimeUp) return;
    if (stoppedAtRef.current !== null) return;

    if (startedAtRef.current === null) return;

    const now = performance.now();
    const startedAt = startedAtRef.current;
    if (startedAt === null) return;
    const elapsedMilliseconds = Math.max(0, now - startedAt);
    const cappedElapsedMilliseconds =
      mode === "timer"
        ? getCappedElapsedMilliseconds(startedAt, selectedDuration, now)
        : elapsedMilliseconds;
    stoppedAtRef.current = now;
    const correctCharacters = countCorrectCharacters(
      activeWords,
      completedWords,
      currentInput,
    );
    const { correct, total } = accuracyCountsRef.current;
    setStatistics({
      wpm: calculateWpm(correctCharacters, cappedElapsedMilliseconds),
      accuracy: calculateAccuracy(correct, total),
      words: completedWords.length,
      characters: correctCharacters,
      elapsedSeconds: cappedElapsedMilliseconds / 1000,
    });
  }, [
    activeWords,
    completedWords,
    currentInput,
    isFinished,
    isTimeUp,
    mode,
    selectedDuration,
  ]);

  useLayoutEffect(() => {
    const viewport = passageRef.current;
    const activeWord = viewport?.querySelector<HTMLElement>(".active-word");
    if (!viewport || !activeWord) return;

    const viewportRect = viewport.getBoundingClientRect();
    const words = Array.from(viewport.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    const contentTop = (word: HTMLElement) =>
      word.getBoundingClientRect().top -
      viewportRect.top -
      viewport.clientTop +
      viewport.scrollTop;
    const getCharacterElements = (word: HTMLElement) =>
      Array.from(word.children).flatMap((element) => {
        if (!(element instanceof HTMLElement)) return [];
        if (element.classList.contains("typing-word-extra")) {
          return Array.from(element.children).filter(
            (character): character is HTMLElement => character instanceof HTMLElement,
          );
        }
        return [element];
      });
    const firstCharacters = words.flatMap((word) => {
      const firstElement = word.firstElementChild;
      if (!(firstElement instanceof HTMLElement)) return [];
      if (firstElement.classList.contains("typing-word-extra")) {
        const firstExtra = firstElement.firstElementChild;
        return firstExtra instanceof HTMLElement ? [firstExtra] : [];
      }
      return [firstElement];
    });
    const activeCharacterElements = getCharacterElements(activeWord);
    const rowTops = [
      ...new Set(
        [
          ...firstCharacters.map((character) => contentTop(character)),
          ...activeCharacterElements.map((character) => contentTop(character)),
        ].map(Math.round),
      ),
    ].sort((left, right) => left - right);
    if (rowTops.length < 3) return;

    const lineAdvance = rowTops[1] - rowTops[0];
    const activeCaret = activeWord.querySelector<HTMLElement>(
      ".caret-before, .caret-after",
    );
    const activeTop = Math.round(contentTop(activeCaret ?? activeWord));
    const activeRow = rowTops.findIndex((rowTop) => rowTop === activeTop);
    if (lineAdvance <= 0 || activeRow < 0) return;

    const firstVisibleRow = rowTops.reduce((nearestIndex, rowTop, index) =>
      Math.abs(rowTop - viewport.scrollTop) <
      Math.abs(rowTops[nearestIndex] - viewport.scrollTop)
        ? index
        : nearestIndex,
    0);

    if (activeRow < firstVisibleRow + 2) return;
    const rowsToAdvance = activeRow - firstVisibleRow - 1;
    viewport.scrollTop += rowsToAdvance * lineAdvance;
  }, [mode, currentWordIndex, currentInput, timerWords.length]);

  function handleInput(value: string) {
    if (isFinished || isTimeUp || !isDurationValid) return;

    const startedAt = startedAtRef.current;
    if (
      mode === "timer" &&
      startedAt !== null &&
      timerHasExpired(startedAt, selectedDuration)
    ) {
      setTimeLeft(0);
      return;
    }

    const previousInput = inputValueRef.current;
    const expectedWord = activeWords[currentWordIndex];
    const isLastNormalWord =
      mode === "normal" && currentWordIndex === normalWords.length - 1;

    // Finish immediately when the final word is correct.
    if (isLastNormalWord && value === expectedWord) {
      recordCharacterAttempts(previousInput, value, expectedWord, false);
      inputValueRef.current = "";
      startTimerIfNeeded();
      setCompletedWords((previous) => [...previous, value]);
      setCurrentWordIndex(normalWords.length);
      setCurrentInput("");
      return;
    }

    // Accept one separator after any non-empty word. Empty submissions and
    // repeated spaces are rejected so they cannot skip words accidentally.
    if (value.endsWith(" ")) {
      if (previousInput.length === 0 || value !== `${previousInput} `) {
        setCurrentInput(previousInput);
        return;
      }

      const hasExpectedSeparator =
        mode === "timer" || currentWordIndex < activeWords.length - 1;
      recordCharacterAttempts(
        previousInput,
        hasExpectedSeparator ? value : previousInput,
        expectedWord,
        hasExpectedSeparator,
      );
      inputValueRef.current = "";
      startTimerIfNeeded();
      setCompletedWords((previous) => [...previous, previousInput]);
      const nextWordIndex = currentWordIndex + 1;
      if (
        mode === "timer" &&
        timerWords.length - nextWordIndex <= timerRefillThreshold
      ) {
        setTimerWords((previous) =>
          previous.length - nextWordIndex > timerRefillThreshold
            ? previous
            : [
                ...previous,
                ...generateWords(initialTimerBatchSize, {
                  existingSequence: previous,
                }),
              ],
        );
      }
      setCurrentWordIndex(nextWordIndex);
      setCurrentInput("");
      return;
    }

    if (
      value.length > expectedWord.length + maxExtraCharacters &&
      value.length > previousInput.length
    ) {
      setCurrentInput(previousInput);
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
              (mode === "timer" || currentWordIndex < activeWords.length - 1)
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
      onClick={(event) => {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          target.closest("button, input, select, textarea, a")
        ) {
          return;
        }
        inputRef.current?.focus();
      }}
    >
      <div className="typing-mode-selector" role="group" aria-label="Typing mode">
        <button
          className="typing-mode-option"
          type="button"
          aria-pressed={mode === "normal"}
          onClick={() => handleModeChange("normal")}
        >
          Normal
        </button>
        <button
          className="typing-mode-option"
          type="button"
          aria-pressed={mode === "timer"}
          onClick={() => handleModeChange("timer")}
        >
          Timer
        </button>
      </div>

      <div className="typing-controls">
        {mode === "timer" ? (
          <div className="typing-control-row typing-timer-controls">
            <div
              className="typing-duration-selector"
              role="group"
              aria-label="Timer duration"
            >
              {timerPresets.map((duration) => (
                <button
                  key={duration}
                  className="typing-duration-option"
                  type="button"
                  aria-pressed={durationOption === duration}
                  onClick={() =>
                    durationOption === duration
                      ? resetSession("timer", duration)
                      : handleDurationChange(duration)
                  }
                >
                  {duration}s
                </button>
              ))}
              <button
                className="typing-duration-option"
                type="button"
                aria-pressed={durationOption === "custom"}
                onClick={() =>
                  durationOption === "custom"
                    ? resetSession("timer", customDuration ?? Number.NaN)
                    : handleDurationChange("custom")
                }
              >
                Custom
              </button>
              {durationOption === "custom" && (
                <label className="typing-custom-duration">
                  <span className="visually-hidden">
                    Custom duration in positive whole seconds
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={customDurationInput}
                    aria-invalid={!isCustomDurationValid}
                    aria-describedby={
                      !isCustomDurationValid ? "custom-duration-error" : undefined
                    }
                    onChange={(event) =>
                      handleCustomDurationInput(event.target.value)
                    }
                  />
                  <span aria-hidden="true">s</span>
                </label>
              )}
            </div>

            <div className="timer-container">
              <p
                className={`typing-timer ${
                  hasStarted && timeLeft <= 10 ? "timer-warning" : ""
                }`}
              >
                <span aria-hidden="true">&#9719;</span>
                <span>{timeLeft}s</span>
              </p>
            </div>
          </div>
        ) : (
          <div
            className="typing-control-row typing-normal-controls"
          >
            <div
              className="typing-length-selector"
              role="group"
              aria-label="Passage length"
            >
              {lengthOptions.map((length) => (
                <button
                  key={length}
                  className="typing-length-option"
                  type="button"
                  aria-pressed={selectedLength === length}
                  disabled={passageCounts[length] === 0}
                  onClick={() => handleLengthChange(length)}
                >
                  {lengthLabels[length]}
                </button>
              ))}
            </div>
            <div
              className="timer-container typing-timer-placeholder"
              aria-hidden="true"
              >
              <p className="typing-timer">
                <span>&#9719;</span>
                <span>{selectedDuration}s</span>
              </p>
            </div>
          </div>
        )}

        <p
          id="custom-duration-error"
          className="typing-duration-error"
          role="status"
          aria-live="polite"
          aria-hidden={mode === "normal"}
        >
          {mode === "timer" && !isDurationValid &&
            "Enter a positive whole number of seconds."}
        </p>
      </div>

      <div
        ref={passageRef}
        className="typing-passage typing-passage-rolling"
      >
        {activeWords.map((word, wordIndex) => {
          const isCurrentWord = wordIndex === currentWordIndex;
          const isCompletedWord = wordIndex < currentWordIndex;
          const isIncorrectCompletedWord =
            isCompletedWord && completedWords[wordIndex] !== word;
          const showCaret = isCurrentWord && !isFinished && !isTimeUp;

          const expectedCharacters = word.split("");
          const typedWord = isCurrentWord
            ? currentInput
            : isCompletedWord
              ? completedWords[wordIndex] ?? ""
              : "";
          const typedCharacters = typedWord.split("");
          const extraCharacters = typedCharacters.slice(expectedCharacters.length);
          const caretIndex = typedWord.length;

          return (
            <span
              key={wordIndex}
              className={`typing-word ${isCurrentWord ? "active-word" : ""} ${
                isCompletedWord ? "typing-word-completed" : ""
              } ${isIncorrectCompletedWord ? "typing-word-completed-incorrect" : ""}`}
            >
              {expectedCharacters.map((character, charIndex) => {
                let className = "";
                const typedCharacter = typedCharacters[charIndex];
                if (typedCharacter !== undefined) {
                  className =
                    typedCharacter === character ? "correct" : "incorrect";
                } else if (isCompletedWord) {
                  className = "typing-character-missing";
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
              {extraCharacters.length > 0 && (
                <>
                <span className="typing-word-extra">
                  {extraCharacters.map((character, extraIndex) => {
                    let className = "incorrect";
                    if (showCaret) {
                      if (caretIndex === expectedCharacters.length + extraIndex) {
                        className = `${className} caret-before`;
                      } else if (extraIndex === extraCharacters.length - 1) {
                        className = `${className} caret-after`;
                      }
                    }
                    return (
                      <span
                        key={`extra-${extraIndex}`}
                        className={className}
                      >
                        {character}
                      </span>
                    );
                  })}
                </span>

                </>
              )}
            </span>
          );
        })}
      </div>
      <div className="typing-restart-row">
        <button
          className="typing-rewind"
          type="button"
          aria-label="Restart typing test"
          onClick={() => resetSession()}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4v6h6" />
            <path d="M4.5 14a8 8 0 1 0 2-7L3 10" />
          </svg>
        </button>
        <span className="typing-retry-shortcut">Restart · Ctrl + Enter</span>
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
            onClick={() => resetSession()}
          >
            Retry
          </button>
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
        disabled={
          isFinished || isTimeUp || (mode === "timer" && !isDurationValid)
        }
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
