import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { calculateWpm, countCorrectCharacters } from "../../utils/calculateWpm";
import { calculateAccuracy, calculateErrors } from "../../utils/calculateAccuracy";
import {
  isTypingCharacterCorrect,
  isTypingTextCorrect,
  normalizePassagePunctuation,
} from "../../utils/typingTextComparison";
import { generateWords } from "../../utils/generateWords";
import type { Passage, PassageLength } from "../../data/passages";
import {
  passageLengthLabels,
  passageLengthOptions,
} from "../../data/passageCategories";
import { selectRandomPassageForPassageMode } from "../../utils/passageUtils";
import {
  getRoundContentUpdate,
  type ContentAction,
  type RoundMode,
} from "../../utils/roundContent";
import {
  loadPersonalRecords,
  savePersonalRecords,
  shouldRecordCompletedAttempt,
  updatePersonalRecord,
  type PersonalRecordConfiguration,
} from "../../utils/personalRecords";
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
  errors: number;
}

type TypingMode = RoundMode;
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

function readMonotonicTime(): number {
  return performance.now();
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
  const [strictMode, setStrictMode] = useState(false);
  const [passageLength, setPassageLength] = useState<PassageLength>("medium");
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [timerWords, setTimerWords] = useState<string[]>([]);
  const [durationOption, setDurationOption] = useState<TimerDurationOption>(30);
  const [customDurationInput, setCustomDurationInput] = useState("30");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [strictSpaceBlocked, setStrictSpaceBlocked] = useState(false);
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

  const passageTypingText = selectedPassage
    ? normalizePassagePunctuation(selectedPassage.text.trim())
    : "";
  const passageWords = passageTypingText ? passageTypingText.split(/\s+/) : [];
  const isPassageUnavailable =
    mode === "passage" && (!selectedPassage || passageWords.length === 0);
  const activeWords =
    mode === "normal"
      ? normalWords
      : mode === "timer"
        ? timerWords
        : passageWords;

  const [timeLeft, setTimeLeft] = useState(30);
  const [hasStarted, setHasStarted] = useState(false);
  const [statistics, setStatistics] = useState<TestStatistics | null>(null);
  const [isCurrentAttemptPersonalBest, setIsCurrentAttemptPersonalBest] =
    useState(false);
  const [resetVersion, setResetVersion] = useState(0);

  const isFinished =
    (mode === "normal" && currentWordIndex >= normalWords.length) ||
    (mode === "passage" &&
      !isPassageUnavailable &&
      currentWordIndex >= passageWords.length);
  const isTimeUp = mode === "timer" && hasStarted && timeLeft === 0;
  const isStrictToggleLocked = hasStarted && !isFinished && !isTimeUp;
  const hasDurationError = mode === "timer" && !isDurationValid;
  const hasWordCountError =
    mode === "normal" && wordCountOption === "custom" && !isWordCountValid;
  const showStrictSpaceFeedback =
    strictMode && strictSpaceBlocked && !isFinished && !isTimeUp;
  const controlMessage = hasDurationError
    ? "Enter a positive whole number of seconds."
    : hasWordCountError
      ? "Enter a whole number from 1 to 800."
      : "";

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
  const attemptIdRef = useRef(0);
  const lastRecordedAttemptIdRef = useRef<number | null>(null);
  const attemptRecordConfigurationRef =
    useRef<PersonalRecordConfiguration | null>(null);
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
      nextPassageLength = passageLength,
      contentAction: ContentAction = "generate",
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
      setStrictSpaceBlocked(false);
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
      setIsCurrentAttemptPersonalBest(false);
      const contentUpdate = getRoundContentUpdate({
        contentAction,
        mode: nextMode,
        wordCount: nextWordCount,
        timerBatchSize: initialTimerBatchSize,
        passageLength: nextPassageLength,
        generateWords,
        selectPassage: selectRandomPassageForPassageMode,
      });
      if (contentUpdate?.timerWords !== undefined) {
        setTimerWords(contentUpdate.timerWords);
      }

      if (nextMode === "passage") {
        setPassageLength(nextPassageLength);
        if (contentUpdate && "selectedPassage" in contentUpdate) {
          setSelectedPassage(contentUpdate.selectedPassage ?? null);
        }
      }

      if (nextMode === "normal") {
        if (contentUpdate?.normalWords !== undefined) {
          setNormalWords(contentUpdate.normalWords);
        }
        setSelectedWordCount(nextWordCount);
      }

      startedAtRef.current = null;
      stoppedAtRef.current = null;
      attemptIdRef.current += 1;
      attemptRecordConfigurationRef.current = null;
      inputValueRef.current = "";
      isComposingRef.current = false;
      compositionStartValueRef.current = "";
      accuracyCountsRef.current = { correct: 0, total: 0 };
      if (focusTyping) {
        setResetVersion((previous) => previous + 1);
      }

    },
    [mode, passageLength, selectedDuration, selectedWordCount],
  );

  const performRoundAction = useCallback((contentAction: ContentAction) => {
    const now = performance.now();
    if (restartCooldownRef.current !== null && now < restartCooldownRef.current) {
      return;
    }
    if (mode === "normal" && !isWordCountValid) return;
    if (mode === "timer" && !isDurationValid) return;
    if (mode === "passage" && isPassageUnavailable) return;

    resetSession(
      mode,
      selectedDuration,
      true,
      selectedWordCount,
      passageLength,
      contentAction,
    );
    restartCooldownRef.current = now + 350;
  }, [
    isDurationValid,
    isPassageUnavailable,
    isWordCountValid,
    mode,
    passageLength,
    resetSession,
    selectedDuration,
    selectedWordCount,
  ]);

  const retryCurrentRound = useCallback(
    () => performRoundAction("preserve"),
    [performRoundAction],
  );
  const startNewRound = useCallback(
    () => performRoundAction("generate"),
    [performRoundAction],
  );

  function handleModeChange(nextMode: TypingMode) {
    if (nextMode === mode) return;
    if (nextMode === "normal" && !isWordCountValid) return;
    // Switching to Words regenerates the selected word count.
    const nextDuration = nextMode === "timer" ? selectedDuration : 0;
    resetSession(
      nextMode,
      nextDuration,
      true,
      selectedWordCount,
      passageLength,
    );
    setMode(nextMode);
  }

  function handleDurationChange(nextOption: TimerDurationOption) {
    if (nextOption === durationOption) return;
    if (nextOption === "custom" && customDuration === null) {
      setDurationOption("custom");
      return;
    }
    const nextDuration =
      nextOption === "custom" ? customDuration ?? Number.NaN : nextOption;
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) return;
    setDurationOption(nextOption);
    resetSession("timer", nextDuration);
  }

  function handleCustomDurationInput(value: string) {
    setCustomDurationInput(value);
    const nextDuration = isPositiveSafeIntegerSeconds(value);
    if (nextDuration !== null) resetSession("timer", nextDuration, false);
  }

  function handleWordCountChange(nextCount: PresetWordCount) {
    if (mode !== "normal") return;
    setWordCountOption(nextCount);
    resetSession("normal", 0, true, nextCount);
  }

  function handlePassageLengthChange(nextLength: PassageLength) {
    resetSession("passage", 0, true, selectedWordCount, nextLength);
  }

  function handleStrictModeToggle() {
    if (isStrictToggleLocked) return false;
    setStrictMode((previous) => !previous);
    setStrictSpaceBlocked(false);
    return true;
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
      const isRestartShortcut =
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.key === "Enter" &&
        !event.isComposing;
      const isRetryShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key === "Enter" &&
        !event.isComposing &&
        statistics !== null;

      if (!isRestartShortcut && !isRetryShortcut) return;

      if (
        (event.target instanceof HTMLInputElement &&
          event.target !== inputRef.current) ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;
      if (isRestartShortcut) startNewRound();
      else retryCurrentRound();
    }

    window.addEventListener("keydown", handleRetryShortcut);
    return () => window.removeEventListener("keydown", handleRetryShortcut);
  }, [isFinished, isTimeUp, retryCurrentRound, startNewRound, statistics]);

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
    const attemptId = attemptIdRef.current;
    if (
      !shouldRecordCompletedAttempt(
        isFinished || isTimeUp,
        attemptId,
        lastRecordedAttemptIdRef.current,
      )
    ) {
      return;
    }
    lastRecordedAttemptIdRef.current = attemptId;

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
      mode === "passage",
    );
    const { correct, total } = accuracyCountsRef.current;
    const completedStatistics: TestStatistics = {
      wpm: calculateWpm(correctCharacters, cappedElapsedMilliseconds),
      accuracy: calculateAccuracy(correct, total),
      words: completedWords.length,
      characters: correctCharacters,
      elapsedSeconds: cappedElapsedMilliseconds / 1000,
      errors: calculateErrors(correct, total),
    };
    setStatistics(completedStatistics);

    const configuration = attemptRecordConfigurationRef.current;
    if (configuration !== null) {
      const update = updatePersonalRecord(
        loadPersonalRecords(),
        configuration,
        { ...completedStatistics, completedAt: new Date().toISOString() },
      );
      setIsCurrentAttemptPersonalBest(update.isNewPersonalBest);
      if (update.changed) savePersonalRecords(update.records);
    }
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
      if (
        expectedCharacter !== undefined &&
        isTypingCharacterCorrect(
          insertedText[index],
          expectedCharacter,
          mode === "passage",
        )
      ) {
        accuracyCountsRef.current.correct += 1;
      }
    }
  }

  function handleInput(value: string) {
    if (
      isFinished ||
      isTimeUp ||
      !isDurationValid ||
      (mode === "normal" && !isWordCountValid) ||
      (mode === "passage" && isPassageUnavailable)
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
    const isLastFiniteWord =
      (mode === "normal" && currentWordIndex === normalWords.length - 1) ||
      (mode === "passage" && currentWordIndex === passageWords.length - 1);

    // Finish immediately when the final word is correct.
    if (
      isLastFiniteWord &&
      isTypingTextCorrect(value, expectedWord, mode === "passage")
    ) {
      setStrictSpaceBlocked(false);
      recordCharacterAttempts(previousInput, value, expectedWord, false);
      inputValueRef.current = "";
      startTimerIfNeeded();
      setCompletedWords((previous) => [...previous, value]);
      setCurrentWordIndex(activeWords.length);
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

      if (
        strictMode &&
        !isTypingTextCorrect(previousInput, expectedWord, mode === "passage")
      ) {
        setCurrentInput(previousInput);
        if (!strictSpaceBlocked) setStrictSpaceBlocked(true);
        return;
      }

      const hasExpectedSeparator =
        mode === "timer" || currentWordIndex < activeWords.length - 1;
      setStrictSpaceBlocked(false);
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
      setStrictSpaceBlocked(false);
      recordCharacterAttempts(previousInput, value, expectedWord, false);
      inputValueRef.current = value;
      startTimerIfNeeded();
      setCurrentInput(value);
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

    attemptRecordConfigurationRef.current =
      getCurrentPersonalRecordConfiguration();
    startedAtRef.current = readMonotonicTime();
    setHasStarted(true);
  }

  function getCurrentPersonalRecordConfiguration():
    | PersonalRecordConfiguration
    | null {
    if (mode === "normal") {
      return {
        mode: "words",
        wordCount: selectedWordCount,
        strict: strictMode,
      };
    }

    if (mode === "timer") {
      return {
        mode: "timer",
        durationSeconds: selectedDuration,
        strict: strictMode,
      };
    }

    if (!selectedPassage) return null;
    const passageLabel =
      [selectedPassage.author, selectedPassage.workTitle]
        .filter((part): part is string => Boolean(part))
        .join(" · ") || "Original passage";
    return {
      mode: "passage",
      passageId: selectedPassage.id,
      passageLength,
      passageLabel,
      strict: strictMode,
    };
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
      <div className="typing-mode-bar">
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
          <button
            className="typing-mode-option"
            type="button"
            aria-pressed={mode === "passage"}
            onClick={() => handleModeChange("passage")}
          >
            Passage
          </button>
        </div>
        <button
          className="typing-strict-toggle"
          type="button"
          aria-label={
            isStrictToggleLocked
              ? "Strict mode, locked during test"
              : "Strict mode"
          }
          aria-pressed={strictMode}
          aria-disabled={isStrictToggleLocked}
          aria-describedby="typing-strict-tooltip"
          onClick={(event) => {
            if (
              handleStrictModeToggle() &&
              event.detail > 0
            ) {
              inputRef.current?.focus();
            }
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>Strict</span>
          <span
            className="typing-strict-tooltip"
            id="typing-strict-tooltip"
            role="tooltip"
          >
            Type each word correctly to continue.
          </span>
        </button>
      </div>

      <div
        className="typing-round-content"
        hidden={statistics !== null}
      >
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
                    ? customDuration !== null &&
                      resetSession("timer", customDuration)
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
        ) : mode === "passage" ? (
          <div className="typing-control-row typing-normal-controls">
            <div
              className="typing-word-count-selector typing-length-selector"
              role="group"
              aria-label="Passage length"
            >
              {passageLengthOptions.map((length) => (
                <button
                  key={length}
                  className="typing-word-count-option"
                  type="button"
                  aria-pressed={passageLength === length}
                  onClick={() => handlePassageLengthChange(length)}
                >
                  {passageLengthLabels[length]}
                </button>
              ))}
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
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.ctrlKey &&
                        !event.metaKey &&
                        !event.altKey
                      ) {
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
          aria-atomic="true"
          aria-hidden={!controlMessage}
        >
          {controlMessage}
        </p>
        <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {showStrictSpaceFeedback ? "Correct this word to continue." : ""}
        </p>
      </div>

      {isPassageUnavailable && (
        <p className="typing-passage-unavailable" role="status">
          No passages are available for this length.
        </p>
      )}
      <div
        ref={passageRef}
        className={`typing-passage typing-passage-rolling ${
          mode === "passage" ? "typing-passage-mode" : ""
        }`}
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
            isCompletedWord &&
            !isTypingTextCorrect(
              completedWords[wordIndex] ?? "",
              word,
              mode === "passage",
            );
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
                    isTypingCharacterCorrect(
                      typedCharacter,
                      character,
                      mode === "passage",
                    )
                      ? "correct"
                      : "incorrect";
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
      {mode === "passage" &&
        selectedPassage &&
        (selectedPassage.author ||
          selectedPassage.workTitle ||
          selectedPassage.sourceUrl ||
          (selectedPassage.category === "original" &&
            !selectedPassage.author &&
            !selectedPassage.workTitle)) && (
          <p className="typing-passage-attribution">
            {selectedPassage.category === "original" &&
              !selectedPassage.author &&
              !selectedPassage.workTitle && <span>Original passage</span>}
            {selectedPassage.author && <span>{selectedPassage.author}</span>}
            {selectedPassage.author && selectedPassage.workTitle && (
              <span aria-hidden="true">·</span>
            )}
            {selectedPassage.workTitle && (
              <cite>{selectedPassage.workTitle}</cite>
            )}
            {selectedPassage.sourceUrl &&
              selectedPassage.category !== "original" && (
                <>
                  {(selectedPassage.author || selectedPassage.workTitle) && (
                    <span aria-hidden="true">·</span>
                  )}
                  <a
                    href={selectedPassage.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View source for ${
                      selectedPassage.workTitle ??
                      selectedPassage.author ??
                      "passage"
                    } (opens in a new tab)`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ verticalAlign: "-0.1em" }}
                    >
                      <path d="M9 3h4v4" />
                      <path d="m13 3-6 6" />
                      <path d="M11 9v3H4V5h3" />
                    </svg>{" "}
                    View source
                  </a>
                </>
              )}
          </p>
        )}
      <div className="typing-restart-row">
        <button
          className="typing-rewind"
          type="button"
          aria-label="Restart with new content"
          onClick={startNewRound}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4v6h6" />
            <path d="M4.5 14a8 8 0 1 0 2-7L3 10" />
          </svg>
        </button>
        <span className="typing-retry-shortcut">Restart · Shift + Enter</span>
      </div>
      </div>
      {statistics !== null && (
        <section className="typing-results" aria-labelledby="typing-results-title">
          <h2 id="typing-results-title">Round complete</h2>
          {isCurrentAttemptPersonalBest && (
            <p
              className="typing-personal-best-indicator"
              role="status"
              aria-live="polite"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <path d="m10 2 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.7 5.2-.8L10 2Z" />
              </svg>
              New Personal Best
            </p>
          )}
          <div className="typing-results-primary">
            <div className="typing-result-metric typing-result-metric-wpm">
              <span className="typing-result-label">WPM</span>
              <strong>{statistics.wpm.toFixed(1)}</strong>
            </div>
            <div className="typing-result-metric typing-result-metric-accuracy">
              <span className="typing-result-label">Accuracy</span>
              <strong>{statistics.accuracy.toFixed(1)}%</strong>
            </div>
          </div>
          <div className="typing-results-secondary">
            <div className="typing-result-metric">
              <span className="typing-result-label">Words</span>
              <strong>{statistics.words}</strong>
            </div>
            <div className="typing-result-metric">
              <span className="typing-result-label">Characters</span>
              <strong>{statistics.characters}</strong>
            </div>
            <div className="typing-result-metric">
              <span className="typing-result-label">Time</span>
              <strong>{statistics.elapsedSeconds.toFixed(1)}s</strong>
            </div>
            <div className="typing-result-metric">
              <span className="typing-result-label">Errors</span>
              <strong>{statistics.errors}</strong>
            </div>
          </div>
          <div className="typing-results-actions">
            <button
              className="typing-results-action"
              type="button"
              onClick={retryCurrentRound}
            >
              <span className="typing-results-action-title">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4v6h6" />
                  <path d="M4.5 14a8 8 0 1 0 2-7L3 10" />
                </svg>
                Retry
              </span>
              <span className="typing-results-shortcut">Ctrl / Cmd + Enter</span>
            </button>
            <button
              className="typing-results-action"
              type="button"
              onClick={startNewRound}
            >
              <span className="typing-results-action-title">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
                  <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
                </svg>
                Restart
              </span>
              <span className="typing-results-shortcut">Shift + Enter</span>
            </button>
          </div>
        </section>
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
            setStrictSpaceBlocked(false);
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
          isPassageUnavailable ||
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
