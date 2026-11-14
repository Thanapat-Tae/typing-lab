
import { useState } from 'react'
import './TypingTest.css'

const passage =
  'The quiet moon shines above the sleeping city.'

const words = passage.split(' ')

  function TypingTest() {
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [currentInput, setCurrentInput] = useState('')
    const [completedWords, setCompletedWords] = useState<string[]>([])

    const isFinished = currentWordIndex >= words.length

 
  function handleInput(value: string) {
    if (isFinished) return

    const expectedWord = words[currentWordIndex]
    const isLastWord = currentWordIndex === words.length - 1

    // Finish immediately when the final word is correct.
    if (isLastWord && value === expectedWord) {
      setCompletedWords((previous) => [...previous, value])
      setCurrentWordIndex(words.length)
      setCurrentInput('')
      return
    }

    // Space submits a correctly typed word.
    if (value.endsWith(' ')) {
      if (currentInput !== expectedWord) return

      setCompletedWords((previous) => [...previous, currentInput])
      setCurrentWordIndex((previous) => previous + 1)
      setCurrentInput('')
      return
    }

    setCurrentInput(value)
  }

  return (
    <section className="typing-test">
      <h2>Typing Test</h2>

      <div className="typing-passage">
        {words.map((word, wordIndex) => {
          const typedWord =
            wordIndex < currentWordIndex
              ? completedWords[wordIndex]
              : wordIndex === currentWordIndex
                ? currentInput
                : ''

          return (
            <span
              key={wordIndex}
              className={
                wordIndex === currentWordIndex
                  ? 'typing-word active-word'
                  : 'typing-word'
              }
            >
              {word.split('').map((character, charIndex) => {
                const typedCharacter = typedWord?.[charIndex]

                let className = ''

                if (typedCharacter !== undefined) {
                  className =
                    typedCharacter === character
                      ? 'correct'
                      : 'incorrect'
                }

                return (
                  <span key={charIndex} className={className}>
                    {character}
                  </span>
                )
              })}
            </span>
          )
        })}
      </div>

      <input
        type="text"
        value={currentInput}
        onChange={(event) => handleInput(event.target.value)}
        disabled={isFinished}
        placeholder={
          isFinished ? 'Test complete!' : 'Type the current word...'
        }
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <p>
        Word {Math.min(currentWordIndex + 1, words.length)}
        {' / '}
        {words.length}
      </p>
    </section>
  )
}

export default TypingTest
