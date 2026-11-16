import assert from "node:assert/strict";
import test from "node:test";
import { words } from "../src/data/words.ts";
import { generateWords } from "../src/utils/generateWords.ts";

test("practice vocabulary contains exactly 1,000 unique entries", () => {
  assert.equal(words.length, 1_000);
  assert.equal(new Set(words).size, 1_000);
});

test("practice vocabulary contains only lowercase alphabetic English forms", () => {
  assert.ok(words.every((word) => /^[a-z]+$/.test(word)));
  assert.ok(!words.includes("bloody"));
  assert.ok(!words.includes("hell"));
  assert.ok(words.includes("yeah"));
  assert.ok(words.includes("conversation"));
});

test("word generation uses the vocabulary and returns the requested count", () => {
  const vocabulary = new Set(words);
  const generated = generateWords(1_000);

  assert.equal(generated.length, 1_000);
  assert.ok(generated.every((word) => vocabulary.has(word)));
  assert.ok(
    generated.every((word, index) => index === 0 || word !== generated[index - 1]),
  );
});
