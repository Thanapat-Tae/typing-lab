import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { calculateWpm, countCorrectCharacters } from "../../utils/calculateWpm";
import { calculateAccuracy } from "../../utils/calculateAccuracy";
import { generateWords } from "../../utils/generateWords";
import "./TypingTest.css";

const initialTimerBatchSize = 50;
const timerRefillThreshold = 10;
const maxExtraCharacters = 5;
const timerPresets = [15, 30, 60, 120, 150] as const;
const wordCountPresets = [10, 25, 50, 100, 250] as const;
const defaultWordCount = 50;
const maxCustomWordCount = 800;

interface TestStatistics {
  wpm: number;
  accuracy: number;
  words: number;
  characters: number;
  elapsedSeconds: number;
}

type TypingMode = "normal" | "timer";
type TimerDurationOption = (typeof timerPresets)[number] | "custom";
type PresetWordCount = (typeof wordCountPresets)[number];
type WordCountOption = PresetWordCount | "custom";

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

function parseWordCount(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const wordCount = Number(value);
  return Number.isSafeInteger(wordCount) &&
    wordCount >= 1 &&
    wordCount <= maxCustomWordCount
    ? wordCount
    : null;
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
  const [normalWords, setNormalWords] = useState<string[]>(() =>
    generateWords(defaultWordCount),
  );
  const [wordCountOption, setWordCountOption] = useState<WordCountOption>(
    defaultWordCount,
  );
  const [selectedWordCount, setSelectedWordCount] = useState(defaultWordCount);
  const [customWordCountInput, setCustomWordCountInput] = useState(
    String(defaultWordCount),
  );

  const customDuration = isPositiveSafeIntegerSeconds(customDurationInput);
  const isCustomDurationValid = customDuration !== null;
  const selectedDuration =
    durationOption === "custom" ? customDuration ?? 0 : durationOption;
  const isDurationValid =
    durationOption !== "custom" || isCustomDurationValid;
  const parsedCustomWordCount = parseWordCount(customWordCountInput);
  const isWordCountValid =
    wordCountOption !== "custom" || parsedCustomWordCount !== null;

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
  const animatedCaretRef = useRef<HTMLDivElement>(null);
  const rollingViewportMeasureRef = useRef<(() => void) | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const stoppedAtRef = useRef<number | null>(null);
  const inputValueRef = useRef("");
  const isComposingRef = useRef(false);
  const compositionStartValueRef = useRef("");
  const accuracyCountsRef = useRef({ correct: 0, total: 0 });
  const restartCooldownRef = useRef<number | null>(null);
  const appliedCustomWordCountRef = useRef(String(defaultWordCount));
  const restartAnimationRef = useRef<Animation | null>(null);
  const caretPositionRef = useRef<{ x: number; y: number } | null>(null);
  const caretTransitionDisabledRef = useRef(false);

  const resetSession = useCallback(
    (
      nextMode: TypingMode = mode,
      nextDuration = selectedDuration,
      focusTyping = true,
      nextWordCount = selectedWordCount,
    ) => {
      const passage = passageRef.current;
      restartAnimationRef.current?.cancel();
      restartAnimationRef.current = null;
      if (
        passage &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const animation = passage.animate(
          [
            { opacity: 0, transform: "translateY(4px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 150, easing: "ease-out" },
        );
        restartAnimationRef.current = animation;
        animation.onfinish = () => {
          if (restartAnimationRef.current === animation) {
            restartAnimationRef.current = null;
          }
        };
      }

      setCurrentWordIndex(0);
      if (passageRef.current) passageRef.current.scrollTop = 0;
      // Disable caret transition for instant reposition on restart/mode change
      caretTransitionDisabledRef.current = true;
      // Reset caret position tracking
      caretPositionRef.current = null;
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

      // When entering Words mode (or retrying in Words), generate the selected count.
      if (nextMode === "normal") {
        setNormalWords(generateWords(nextWordCount));
        setSelectedWordCount(nextWordCount);
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
    [mode, selectedDuration, selectedWordCount],
  );

  const restartSession = useCallback(() => {
    const now = performance.now();
    if (restartCooldownRef.current !== null && now < restartCooldownRef.current) {
      return;
    }
    if (mode === "normal" && !isWordCountValid) return;

    resetSession();
    restartCooldownRef.current = now + 350;
  }, [isWordCountValid, mode, resetSession]);

  function handleModeChange(nextMode: TypingMode) {
    if (nextMode === mode) return;
    if (nextMode === "normal" && !isWordCountValid) return;
    // Switching to Words regenerates the selected word count.
    const nextDuration = nextMode === "timer" ? selectedDuration : 0;
    resetSession(nextMode, nextDuration, true, selectedWordCount);
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

  function handleWordCountChange(nextCount: PresetWordCount) {
    if (mode !== "normal") return;
    setWordCountOption(nextCount);
    resetSession("normal", 0, true, nextCount);
  }

  function applyCustomWordCount(force = false, focusTyping = false) {
    const wordCount = parseWordCount(customWordCountInput);
    if (wordCount === null) return;
    if (!force && appliedCustomWordCountRef.current === customWordCountInput) {
      return;
    }

    appliedCustomWordCountRef.current = customWordCountInput;
    setWordCountOption("custom");
    resetSession("normal", 0, focusTyping, wordCount);
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
      if (!event.repeat) restartSession();
    }

    window.addEventListener("keydown", handleRetryShortcut);
    return () => window.removeEventListener("keydown", handleRetryShortcut);
  }, [isFinished, isTimeUp, restartSession]);

  useEffect(() => {
    if (resetVersion > 0) inputRef.current?.focus();
  }, [resetVersion]);

  // Cancel passage animation and respect reduced-motion preference changes.
  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionPreferenceChange = () => {
      if (motionPreference.matches) {
        restartAnimationRef.current?.cancel();
        restartAnimationRef.current = null;
      }
    };

    motionPreference.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      motionPreference.removeEventListener("change", handleMotionPreferenceChange);
      restartAnimationRef.current?.cancel();
      restartAnimationRef.current = null;
    };
  }, []);

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
    const animatedCaret = animatedCaretRef.current;
    if (!viewport || !animatedCaret) return;

    const measureRollingViewport = () => {
      if (!activeWord) {
        animatedCaret.style.visibility = "hidden";
        caretPositionRef.current = null;
        return;
      }

      const caretMarker = activeWord.querySelector<HTMLElement>(
        ".caret-before, .caret-after",
      );
      if (!caretMarker) {
        animatedCaret.style.visibility = "hidden";
        caretPositionRef.current = null;
        return;
      }

      const isCaretAfter = caretMarker.classList.contains("caret-after");
      // An empty caret-after marker has no text box. Anchor it to the end of
      // the preceding character while retaining the after-character edge.
      const caretElement =
        isCaretAfter &&
        !caretMarker.textContent &&
        caretMarker.previousElementSibling instanceof HTMLElement
          ? caretMarker.previousElementSibling
          : caretMarker;
      const viewportRect = viewport.getBoundingClientRect();
      const wordRect = activeWord.getBoundingClientRect();
      const caretRect = caretElement.getBoundingClientRect();
      const viewportContentLeft = viewportRect.left + viewport.clientLeft;
      const viewportContentTop = viewportRect.top + viewport.clientTop;
      const caretViewportLeft =
        (isCaretAfter ? caretRect.right : caretRect.left) - viewportContentLeft;
      let caretViewportTop = caretRect.top - viewportContentTop;
      const wordTop = wordRect.top - viewportContentTop;
      const styles = window.getComputedStyle(viewport);
      const lineHeight = Number.parseFloat(styles.lineHeight);
      const fontSize = Number.parseFloat(styles.fontSize);
      const rowGap = Number.parseFloat(styles.rowGap);

      if (
        !Number.isFinite(lineHeight) ||
        lineHeight <= 0 ||
        !Number.isFinite(fontSize) ||
        fontSize <= 0 ||
        !Number.isFinite(rowGap) ||
        rowGap < 0
      ) {
        return;
      }

      // Match the original caret's 0.1em inset within the active character span.
      const caretInset = fontSize * 0.1;
      const caretHeight = Math.max(0, caretRect.height - caretInset * 2);

      // Keep the caret visible if responsive reflow moves it above the viewport.
      if (caretViewportTop < 0) {
        const previousScrollTop = viewport.scrollTop;
        viewport.scrollTop = Math.max(0, previousScrollTop + caretViewportTop);
        caretViewportTop -= viewport.scrollTop - previousScrollTop;
      }

      // Advance once the caret enters the third visual line. Wrapped lines
      // inside the active word have no flex row gap; following rows do.
      const thirdLineThreshold = 2 * lineHeight;
      if (caretViewportTop >= thirdLineThreshold) {
        const wrapsInsideActiveWord = caretViewportTop - wordTop > lineHeight / 2;
        const lineAdvance = wrapsInsideActiveWord
          ? lineHeight
          : lineHeight + rowGap;

        while (caretViewportTop >= thirdLineThreshold) {
          const previousScrollTop = viewport.scrollTop;
          viewport.scrollTop += lineAdvance;
          const actualAdvance = viewport.scrollTop - previousScrollTop;
          if (actualAdvance <= 0) break;
          caretViewportTop -= actualAdvance;
        }
      }

      const caretViewportY = caretViewportTop;
      const caretContentLeft = caretViewportLeft + viewport.scrollLeft - 1;
      const caretContentTop = caretViewportY + viewport.scrollTop + caretInset;
      const nextCaretHeight = `${caretHeight}px`;
      if (animatedCaret.style.height !== nextCaretHeight) {
        animatedCaret.style.height = nextCaretHeight;
      }
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const isInstantReposition = caretTransitionDisabledRef.current;
      const previousPosition = caretPositionRef.current;
      const isLineWrap =
        previousPosition !== null &&
        Math.abs(caretViewportY - previousPosition.y) > lineHeight / 2;

      if (isInstantReposition || isLineWrap || prefersReducedMotion) {
        animatedCaret.style.transition = "none";
        animatedCaret.style.transform =
          `translate(${caretContentLeft}px, ${caretContentTop}px)`;
        // Apply the instant position before restoring the normal transition.
        void animatedCaret.offsetHeight;
        animatedCaret.style.transition = "";
      } else {
        animatedCaret.style.transition =
          "transform 80ms cubic-bezier(0.2, 0, 0, 1)";
        animatedCaret.style.transform =
          `translate(${caretContentLeft}px, ${caretContentTop}px)`;
      }

      caretPositionRef.current = { x: caretViewportLeft, y: caretViewportY };
      animatedCaret.style.visibility = "visible";
      if (caretTransitionDisabledRef.current) {
        caretTransitionDisabledRef.current = false;
      }
    };

    rollingViewportMeasureRef.current = measureRollingViewport;
    measureRollingViewport();

    return () => {
      if (rollingViewportMeasureRef.current === measureRollingViewport) {
        rollingViewportMeasureRef.current = null;
      }
    };
  }, [activeWords, mode, currentWordIndex, currentInput, timerWords.length]);

  useEffect(() => {
    const viewport = passageRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      rollingViewportMeasureRef.current?.();
    });
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  function handleInput(value: string) {
    if (
      isFinished ||
      isTimeUp ||
      !isDurationValid ||
      (mode === "normal" && !isWordCountValid)
    ) {
      return;
    }

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
          Words
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
                      !isCustomDurationValid ? "typing-control-error" : undefined
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
          <div className="typing-control-row typing-normal-controls">
            <div
              className="typing-word-count-selector"
              role="group"
              aria-label="Word count"
            >
              {wordCountPresets.map((count) => (
                <button
                  key={count}
                  className="typing-word-count-option"
                  type="button"
                  aria-label={`${count} words`}
                  aria-pressed={wordCountOption === count}
                  onClick={() => handleWordCountChange(count)}
                >
                  {count}
                </button>
              ))}
              <button
                className="typing-word-count-option"
                type="button"
                aria-pressed={wordCountOption === "custom"}
                onClick={() => {
                  if (wordCountOption === "custom") {
                    applyCustomWordCount(true);
                    return;
                  }

                  setWordCountOption("custom");
                  const wordCount = parseWordCount(customWordCountInput);
                  if (wordCount !== null) {
                    appliedCustomWordCountRef.current = customWordCountInput;
                    resetSession("normal", 0, false, wordCount);
                  }
                }}
              >
                Custom
              </button>
              {wordCountOption === "custom" && (
                <label className="typing-custom-duration typing-custom-word-count">
                  <span className="visually-hidden">
                    Custom word count from 1 to 800
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={maxCustomWordCount}
                    step={1}
                    inputMode="numeric"
                    value={customWordCountInput}
                    aria-invalid={!isWordCountValid}
                    aria-describedby={
                      !isWordCountValid ? "typing-control-error" : undefined
                    }
                    onChange={(event) =>
                      setCustomWordCountInput(event.target.value)
                    }
                    onBlur={() => applyCustomWordCount()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyCustomWordCount(true, true);
                      }
                    }}
                  />
                  <span aria-hidden="true">words</span>
                </label>
              )}
            </div>
            <div className="timer-container typing-timer-placeholder" aria-hidden="true">
              <p className="typing-timer">
                <span>&#9719;</span>
                <span>{selectedDuration}s</span>
              </p>
            </div>
          </div>
        )}

        <p
          id="typing-control-error"
          className="typing-duration-error"
          role="status"
          aria-live="polite"
          aria-hidden={
            mode === "timer"
              ? isDurationValid
              : wordCountOption !== "custom" || isWordCountValid
          }
        >
          {mode === "timer" && !isDurationValid &&
            "Enter a positive whole number of seconds."}
          {mode === "normal" && wordCountOption === "custom" &&
            !isWordCountValid && "Enter a whole number from 1 to 800."}
        </p>
      </div>

      <div
        ref={passageRef}
        className="typing-passage typing-passage-rolling"
      >
        <div
          ref={animatedCaretRef}
          className={`typing-animated-caret ${
            hasStarted ? "typing-animated-caret-started" : ""
          }`}
          aria-hidden="true"
        />
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
          onClick={restartSession}
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
            onClick={restartSession}
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
          isFinished ||
          isTimeUp ||
          (mode === "timer" && !isDurationValid) ||
          (mode === "normal" && !isWordCountValid)
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
