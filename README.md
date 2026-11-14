# Typing Lab

Typing Lab is a focused typing practice space guided by the Flow Lab vision: **A quiet place to grow, one keystroke at a time.** Its calm Silver Moon interface keeps attention on the passage and the feel of each keystroke.

## Core experience

Type the displayed passage at your own pace. Correct and incorrect characters are shown inline, and a word advances only when typed correctly and followed by a space. The countdown begins with your first accepted input. At the end, review WPM, accuracy, completed words, correct characters, and elapsed time, then start again when you are ready.

## Technology

React 19, TypeScript, Vite, and CSS.

## Setup

Requires Node.js and npm. From the project directory, install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run lint` and `npm run build` to check the project and create a production build.

## Usage

- Type the active word; Backspace edits your current input.
- Press Space after an exactly correct word to continue. The final correct word completes the test.
- After completion or timeout, choose **Retry** or press **Ctrl + Enter** to begin again. On macOS, **Cmd + Enter** also works.
