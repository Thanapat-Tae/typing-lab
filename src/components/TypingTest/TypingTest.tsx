import { useEffect, useState } from "react";
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
    <section className="typing-test">
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
          const typedWord =
            wordIndex < currentWordIndex
              ? completedWords[wordIndex]
              : wordIndex === currentWordIndex
                ? currentInput
                : "";

          return (
            <span
              key={wordIndex}
              className={
                wordIndex === currentWordIndex
                  ? "typing-word active-word"
                  : "typing-word"
              }
            >
              {word.split("").map((character, charIndex) => {
                const typedCharacter = typedWord?.[charIndex];

                let className = "";

                if (typedCharacter !== undefined) {
                  className =
                    typedCharacter === character ? "correct" : "incorrect";
                }

                return (
                  <span key={charIndex} className={className}>
                    {character}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>

      <input
        type="text"
        value={currentInput}
        onChange={(event) => handleInput(event.target.value)}
        disabled={isFinished || isTimeUp}
        placeholder={isFinished ? "Test complete!" : ""}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </section>
  );
}

export default TypingTest;
