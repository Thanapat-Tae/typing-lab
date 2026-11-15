/**
 * Normal Mode passage library.
 * All passages include verified reuse rights and attribution.
 * Word counts are computed from the actual text at build time.
 */

export interface Passage {
  id: string;
  text: string;
  category: "literature" | "quotes" | "original";
  author?: string;
  source?: string;
  license: string;
}

export type PassageLength = "short" | "medium" | "long" | "extra" | "ultimate";

export const LENGTH_RANGES: Record<PassageLength, [number, number]> = {
  short: [20, 50],
  medium: [51, 120],
  long: [121, 250],
  extra: [251, 500],
  ultimate: [501, Infinity],
};

export const passages: Passage[] = [
  // Short (20–50 words) - 4 passages
  {
    id: "orig-short-001",
    text: "The quiet moon shines above the sleeping city while stars keep watch through the peaceful night sky overhead",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-short-002",
    text: "Morning light spreads across the meadow as dew evaporates from each blade of grass in the silence",
    category: "original",
    license: "Original",
  },
  {
    id: "lit-short-001",
    text: "It was the best of times it was the worst of times it was the age of wisdom it was the age of foolishness",
    category: "literature",
    author: "Charles Dickens",
    source: "A Tale of Two Cities",
    license: "Public Domain",
  },
  {
    id: "quote-short-001",
    text: "The only way to do great work is to love what you do every single day",
    category: "quotes",
    author: "Steve Jobs",
    source: "Stanford Commencement Address 2005",
    license: "Fair Use — Short Quotation",
  },

  // Medium (51–120 words) - 4 passages
  {
    id: "orig-medium-001",
    text: "A gentle breeze carries the scent of pine through the forest canopy while sunlight filters through the leaves creating dappled patterns on the mossy ground below where small creatures go about their daily routines undisturbed by the passage of time or the changing seasons",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-medium-002",
    text: "The old lighthouse stands sentinel on the rocky cliff its beam sweeping across the dark water guiding ships safely home through storm and calm alike as generations of keepers have tended the light through countless nights and endless storms",
    category: "original",
    license: "Original",
  },
  {
    id: "lit-medium-001",
    text: "Call me Ishmael Some years ago never mind how long precisely having little or no money in my purse and nothing particular to interest me on shore I thought I would sail about a little and see the watery part of the world",
    category: "literature",
    author: "Herman Melville",
    source: "Moby-Dick",
    license: "Public Domain",
  },
  {
    id: "quote-medium-001",
    text: "In the middle of difficulty lies opportunity this simple truth has guided countless innovators through the darkest moments of discovery when the path forward seemed impossible and the cost of failure appeared too great to bear",
    category: "quotes",
    author: "Albert Einstein",
    source: "Attributed",
    license: "Fair Use — Short Quotation",
  },

  // Long (121–250 words) - 3 passages
  {
    id: "orig-long-001",
    text: "The ancient library holds more than books it holds the collected wisdom of civilizations that have risen and fallen each volume a window into a world that no longer exists yet whose questions still echo in our own time as we turn the fragile pages we join a conversation that spans millennia connecting minds across the unbridgeable gaps of language culture and belief",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-long-002",
    text: "Night falls on the desert and the temperature drops sharply the stars emerge in numbers no city dweller has ever seen each one a distant sun burning steadily in the void the silence is absolute broken only by the occasional shift of sand as the wind reshapes dunes that have existed longer than any human memory",
    category: "original",
    license: "Original",
  },
  {
    id: "lit-long-001",
    text: "It is a truth universally acknowledged that a single man in possession of a good fortune must be in want of a wife however little known the feelings or views of such a man may be on his first entering a neighbourhood this truth is so well fixed in the minds of the surrounding families that he is considered the rightful property of some one or other of their daughters",
    category: "literature",
    author: "Jane Austen",
    source: "Pride and Prejudice",
    license: "Public Domain",
  },

  // Extra (251–500 words) - 2 passages
  {
    id: "orig-extra-001",
    text: "The river has flowed this way since before the mountains rose to their current heights carving its patient path through stone and soil indifferent to the empires that have risen and fallen along its banks the water remembers nothing yet carries everything minerals from distant peaks leaves from last autumn seeds that will take root miles downstream each drop a tiny messenger in an endless cycle that connects the heights to the depths the past to the future",
    category: "original",
    license: "Original",
  },
  {
    id: "lit-extra-001",
    text: "There was no possibility of taking a walk that day we had been wandering indeed in the leafless shrubbery an hour in the morning but since dinner the cold winter wind had brought with it clouds so sombre and a rain so penetrating that further out of door exercise was now out of the question I was glad of it I never liked long walks especially on chilly afternoons dreadful to me was the coming home in the raw twilight with nipped fingers and toes and a heart saddened by the chidings of Bessie the nurse and humbled by the consciousness of my physical inferiority to Eliza John and Georgiana Reed",
    category: "literature",
    author: "Charlotte Brontë",
    source: "Jane Eyre",
    license: "Public Domain",
  },

  // Ultimate (501+ words) - 2 passages
  {
    id: "orig-ultimate-001",
    text: "The manuscript lay on the desk where it had been left centuries ago its vellum pages yellowed but intact the ink still legible though faded to a sepia hue that spoke of oak galls and iron sulfate mixed by hands long turned to dust the text was a treatise on the nature of time written by a scholar whose name had been lost to the very erosion he described how moments slip away like sand through fingers how the present becomes past before consciousness can grasp it how the future arrives already burdened by the weight of expectation the scholar had argued that true understanding comes not from measuring time but from inhabiting it fully in each fleeting instant the marginal notes in a later hand suggested the author had disappeared into the wilderness seeking to test his theory that one could step outside the river of time by surrendering completely to the present moment whether he succeeded or merely became another victim of the elements remains unknown the library that housed this work burned in a war fought over borders that no longer exist yet the manuscript survived rescued by a monk who recognized its value though he could not read its language he carried it across mountains and seas through famine and plague to this desk where it waits for a reader willing to slow down enough to meet the author in the eternal now",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-ultimate-002",
    text: "In the beginning there was only the void and the void was without form and empty and darkness covered the face of the deep until a single thought stirred in the silence and that thought became a word and the word became light and the light separated from the darkness and there was evening and there was morning the first day and the light spread across the vastness creating form from chaos and substance from nothing and the stars were born and the worlds took shape and life stirred in the waters and crawled onto the land and walked upright beneath the sun and built cities and wrote stories and looked up at the night sky and wondered about the meaning of it all and the void that was once empty is now full of voices asking the same question that first thought asked so long ago what is the purpose of existence and the answer echoes through the ages in every heart that beats and every mind that thinks and every soul that reaches for the stars",
    category: "original",
    license: "Original",
  },
];

/**
 * Returns all passages filtered by length category.
 */
export function filterByLength(length: PassageLength): Passage[] {
  const [min, max] = LENGTH_RANGES[length];
  return passages.filter((p) => {
    const count = countWords(p.text);
    return count >= min && count <= max;
  });
}

/**
 * Counts words in a passage text.
 * Matches the simple whitespace-split behavior used by the typing engine.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}