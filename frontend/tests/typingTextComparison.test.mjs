import assert from "node:assert/strict";
import test from "node:test";
import {
  isTypingCharacterCorrect,
  isTypingTextCorrect,
  normalizePassagePunctuation,
} from "../src/utils/typingTextComparison.ts";

test("Passage Mode accepts straight keyboard quote equivalents", () => {
  for (const expected of ["“", "”"]) {
    assert.equal(isTypingCharacterCorrect('"', expected, true), true);
  }
  for (const expected of ["‘", "’"]) {
    assert.equal(isTypingCharacterCorrect("'", expected, true), true);
  }
});

test("Passage Mode accepts a hyphen for en and em dashes", () => {
  assert.equal(isTypingCharacterCorrect("-", "—", true), true);
  assert.equal(isTypingCharacterCorrect("-", "–", true), true);
});

test("Passage Mode compares whole words using the same aliases", () => {
  assert.equal(isTypingTextCorrect('"well-known"', "“well–known”", true), true);
  assert.equal(isTypingTextCorrect("'tis", "’tis", true), true);
});

test("Passage Mode displays typographic punctuation as keyboard characters", () => {
  const storedText = "“‘Quoted’ words”—and ‘dashes’–here.";
  const displayedText = normalizePassagePunctuation(storedText);

  assert.equal(displayedText, "\"'Quoted' words\"-and 'dashes'-here.");
  assert.equal(storedText, "“‘Quoted’ words”—and ‘dashes’–here.");
  assert.equal(isTypingTextCorrect(displayedText, storedText, true), true);
});

test("genuinely incorrect characters remain incorrect", () => {
  assert.equal(isTypingCharacterCorrect("x", "—", true), false);
  assert.equal(isTypingCharacterCorrect("'", "“", true), false);
  assert.equal(isTypingCharacterCorrect("-", "–", false), false);
  assert.equal(isTypingTextCorrect('"word', "“word”", true), false);
});

test("Words and Timer exact matching remains unchanged", () => {
  for (const mode of [false]) {
    assert.equal(isTypingCharacterCorrect('"', "“", mode), false);
    assert.equal(isTypingCharacterCorrect("'", "’", mode), false);
    assert.equal(isTypingCharacterCorrect("-", "—", mode), false);
    assert.equal(isTypingTextCorrect('"word"', "“word”", mode), false);
  }
});
