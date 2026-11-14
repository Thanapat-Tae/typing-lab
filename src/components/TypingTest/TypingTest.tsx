import { useEffect, useRef, useState } from "react";
import { calculateTimeLimit } from "../../utils/calculateTimeLimit";
import "./TypingTest.css";

const passage = "The quiet moon shines above the sleeping city.";

const words = passage.split(" ");

function TypingTest() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [completedWords, setCompletedWords] = useState<string[]>([]);

  const timeLimit = calculateTimeLimit(passage);

  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasStarted, setHasStarted] = useState(false);

  const isFinished = currentWordIndex >= words.length;
  const isTimeUp = timeLeft === 0;

  const inputRef = useRef<HTMLInputElement>(null);

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
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!hasStarted || isFinished || isTimeUp) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [hasStarted, isFinished, isTimeUp]);

  function handleInput(value: string) {
    if (isFinished || isTimeUp) return;

    if (!hasStarted && value.length > 0) {
      setHasStarted(true);
    }

    const expectedWord = words[currentWordIndex];
    const isLastWord = currentWordIndex === words.length - 1;

    // Finish immediately when the final word is correct.
    if (isLastWord && value === expectedWord) {
      setCompletedWords((previous) => [...previous, value]);
      setCurrentWordIndex(words.length);
      setCurrentInput("");
      return;
    }

    // Space submits a correctly typed word.
    if (value.endsWith(" ")) {
      if (currentInput !== expectedWord) return;

      setCompletedWords((previous) => [...previous, currentInput]);
      setCurrentWordIndex((previous) => previous + 1);
      setCurrentInput("");
      return;
    }

    setCurrentInput(value);
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

      <input
        ref={inputRef}
        className="typing-input"
        type="text"
        value={currentInput}
        onChange={(event) => handleInput(event.target.value)}
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
