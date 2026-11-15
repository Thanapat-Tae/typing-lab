# Typing Lab — Claude Code Guidelines

Project: React + TypeScript + Vite typing-test application. Follow these rules alongside existing global instructions. Current source code and `package.json` are the source of truth.

## 1. Think before coding
- Inspect the relevant code, `git status --short`, and existing changes before editing. Never overwrite uncommitted work.
- State important assumptions and flag conflicting requirements. Ask only when a decision is genuinely needed.
- Prefer the smallest change that satisfies the requested behavior.

## 2. Keep solutions simple
- Do not add features, abstractions, dependencies, or configuration that were not requested.
- Follow existing TypeScript, React, CSS, and file-organization patterns.
- Avoid refactoring working code as a side effect of another task.

## 3. Make surgical changes
- Edit only files directly relevant to the task. Do not reformat unrelated files or change unrelated UI/CSS.
- Preserve current typing behavior unless a change is explicitly requested, including input handling, word generation, accuracy, WPM, timing, and restart behavior.
- Remove only unused code introduced by your own changes. Mention unrelated issues separately.

## 4. Work toward verifiable outcomes
- For bugs, identify a reproducible case before changing code. Check both expected behavior and edge cases afterward.
- For typing logic, verify applicable cases: correct/incorrect characters, backspace, word boundaries, timer start/finish, and reset. Do not assume a scoring formula; verify the project's intended rules first.
- Run `npm run lint` and `npm run build` for relevant code changes. Report actual results and any failures.
- Do not assume a test runner is installed; check `package.json` before proposing or running tests. Do not install one without approval.

## 5. Protect the developer's work
- Do not commit, push, merge, rebase, reset, discard changes, or run destructive commands without explicit approval.
- Do not read or expose secrets or `.env` files. Do not publish private `DEVELOPMENT.md` notes in tracked documentation.
- End with: files changed, behavior achieved, checks run and outcomes, and any *required* outstanding issue. Keep optional suggestions separate and brief.
