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
  workTitle?: string;
  source?: string;
  sourceUrl?: string;
  license?: string;
  publicationYear?: number;
}

export type PassageLength = "short" | "medium" | "long" | "extra" | "ultimate";

export const LENGTH_RANGES: Record<PassageLength, [number, number]> = {
  short: [12, 24],
  medium: [25, 48],
  long: [49, 96],
  extra: [97, 192],
  ultimate: [193, 384],
};

export const passages: Passage[] = [
  // Short-ID records (8); length assignment uses actual text word counts.
  {
    id: "orig-short-001",
    text: "The quiet moon shines above the sleeping city, while stars keep watch through the peaceful night sky overhead in silence.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-short-002",
    text: "Morning light spreads across the meadow as dew evaporates from each blade of grass in the silence of dawn.",
    category: "original",
    license: "Original",
  },
  {
    id: "lit-short-001",
    text: "It was the year of Our Lord one thousand seven hundred and seventy-five.",
    category: "literature",
    author: "Charles Dickens",
    workTitle: "A Tale of Two Cities",
    license: "Public Domain",
    sourceUrl: "https://www.gutenberg.org/files/98/98-h/98-h.htm",
  },
  {
    id: "orig-short-003",
    text: "A gentle river flows through the valley, carrying stories from distant mountains to the waiting sea.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-short-004",
    text: "Children laugh as they chase fireflies through the summer dusk, their small hands reaching for glowing dreams.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-short-005",
    text: "The old carpenter measures twice before cutting once, knowing patience builds what haste destroys.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-short-006",
    text: "Snow falls silently on the pine forest, blanketing the world in white peace until spring returns.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-short-007",
    text: "A lighthouse beam sweeps the dark water, guiding ships home through storms and calm alike.",
    category: "original",
    license: "Original",
  },

  // Medium-ID records (8); length assignment uses actual text word counts.
  {
    id: "orig-medium-001",
    text: "A gentle breeze carries the scent of pine through the forest canopy, while sunlight filters through the leaves, creating dappled patterns on the mossy ground below, where small creatures go about their daily routines, undisturbed by the passage of time or the changing seasons.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-medium-002",
    text: "The old lighthouse stands sentinel on the rocky cliff, its beam sweeping across the dark water, guiding ships safely home through storm and calm alike, as generations of keepers have tended the light through countless nights and endless storms.",
    category: "original",
    license: "Original",
  },
  {
    id: "lit-medium-001",
    text: "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
    category: "literature",
    author: "Herman Melville",
    workTitle: "Moby-Dick",
    license: "Public Domain",
    sourceUrl: "https://www.gutenberg.org/files/2701/2701-h/2701-h.htm",
  },
  {
    id: "orig-medium-003",
    text: "The garden awakens at dawn as roses unfold their petals to greet the warming sun, while bees move from flower to flower, collecting nectar for the hive, and butterflies dance on currents of air above the lavender beds.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-medium-004",
    text: "A train crosses the prairie at sunset, its whistle echoing across miles of golden grass, while passengers watch the landscape transform from day to night and the stars emerge one by one in the darkening sky.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-medium-005",
    text: "The library holds centuries of knowledge in its leather-bound volumes, each page a doorway to another time and place where minds long silent still speak to those who take the time to listen and learn.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-medium-006",
    text: "Mountains rise against the horizon, their peaks catching the last light of day, while valleys fall into shadow and the wind carries the scent of pine and stone through ancient passes carved by glaciers long gone.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-medium-007",
    text: "An old fisherman mends his nets at dawn, remembering decades of storms weathered and calm seas enjoyed, knowing each repaired knot holds the promise of another day upon the water he loves.",
    category: "original",
    license: "Original",
  },

  // Long-ID records (6); length assignment uses actual text word counts.
  {
    id: "orig-long-001",
    text: "The ancient library holds more than books: it holds the collected wisdom of civilizations that have risen and fallen, each volume a window into a world that no longer exists, yet whose questions still echo in our own time. As we turn the fragile pages, we join a conversation that spans millennia, connecting minds across the unbridgeable gaps of language, culture, and belief.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-long-002",
    text: "Night falls on the desert, and the temperature drops sharply. The stars emerge in numbers no city dweller has ever seen, each one a distant sun burning steadily in the void. The silence is absolute, broken only by the occasional shift of sand as the wind reshapes dunes that have existed longer than any human memory.",
    category: "original",
    license: "Original",
  },
  {
    id: "lit-long-001",
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.",
    category: "literature",
    author: "Jane Austen",
    workTitle: "Pride and Prejudice",
    license: "Public Domain",
    sourceUrl: "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
  },
  {
    id: "orig-long-003",
    text: "The ocean stretches to the horizon, a vast expanse of blue and green where waves rise and fall in endless rhythm, driven by winds that have circled the globe since before humanity walked upright. Each crest carries stories of distant shores and storms survived.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-long-004",
    text: "A cathedral stands at the heart of the ancient city, its spires reaching toward heaven, built by hands that turned dust into art, stone into prayer. Generations of worshippers have knelt beneath its vaulted arches, seeking comfort in the permanence of beauty that outlasts empires.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-long-005",
    text: "The northern lights dance across the arctic sky: curtains of green and purple and red, moving to music no ear can hear, a celestial ballet performed for the polar bears and the silent ice and the few humans brave enough to witness the sky burning with color.",
    category: "original",
    license: "Original",
  },

  // Extra-ID records (4); length assignment uses actual text word counts.
  {
    id: "orig-extra-001",
    text: "The river has flowed this way since before the mountains rose to their current heights, carving its patient path through stone and soil, indifferent to the empires that have risen and fallen along its banks. The water remembers nothing, yet carries everything: minerals from distant peaks, leaves from last autumn, seeds that will take root miles downstream. Each drop is a tiny messenger in an endless cycle that connects the heights to the depths, the past to the future.",
    category: "original",
    license: "Original",
  },
  {
    id: "lit-extra-001",
    text: "There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner (Mrs. Reed, when there was no company, dined early) the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further outdoor exercise was now out of the question. I was glad of it: I never liked long walks, especially on chilly afternoons: dreadful to me was the coming home in the raw twilight, with nipped fingers and toes, and a heart saddened by the chidings of Bessie, the nurse, and humbled by the consciousness of my physical inferiority to Eliza, John, and Georgiana Reed.",
    category: "literature",
    author: "Charlotte Brontë",
    workTitle: "Jane Eyre",
    license: "Public Domain",
    publicationYear: 1847,
    sourceUrl: "https://www.gutenberg.org/files/1260/1260-h/1260-h.htm",
  },
  {
    id: "orig-extra-002",
    text: "The manuscript lay on the desk where it had been left centuries ago, its vellum pages yellowed but intact, the ink still legible though faded to a sepia hue that spoke of oak galls and iron sulfate mixed by hands long turned to dust. The text was a treatise on the nature of time, written by a scholar whose name had been lost to the very erosion he described: how moments slip away like sand through fingers, how the present becomes past before consciousness can grasp it, how the future arrives already burdened by the weight of expectation. The scholar had argued that true understanding comes not from measuring time, but from inhabiting it fully in each fleeting instant. The marginal notes in a later hand suggested the author had disappeared into the wilderness, seeking to test his theory that one could step outside the river of time by surrendering completely to the present moment. Whether he succeeded or merely became another victim of the elements remains unknown. The library that housed this work burned in a war fought over borders that no longer exist, yet the manuscript survived, rescued by a monk who recognized its value, though he could not read its language. He carried it across mountains and seas, through famine and plague, to this desk, where it waits for a reader willing to slow down enough to meet the author in the eternal now.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-extra-003",
    text: "In the beginning there was only the void and the void was without form and empty and darkness covered the face of the deep until a single thought stirred in the silence and that thought became a word and the word became light and the light separated from the darkness and there was evening and there was morning the first day and the light spread across the vastness creating form from chaos and substance from nothing and the stars were born and the worlds took shape and life stirred in the waters and crawled onto the land and walked upright beneath the sun and built cities and wrote stories and looked up at the night sky and wondered about the meaning of it all and the void that was once empty is now full of voices asking the same question that first thought asked so long ago what is the purpose of existence and the answer echoes through the ages in every heart that beats and every mind that thinks and every soul that reaches for the stars",
    category: "original",
    license: "Original",
  },

  // Ultimate-ID records (3); length assignment uses actual text word counts.
  {
    id: "orig-ultimate-001",
    text: "The ancient forest has stood for ten thousand years, its roots drinking from the same aquifer that fed the dinosaurs, its canopy filtering sunlight that has traveled ninety three million miles to reach these leaves. Each tree is a universe unto itself, hosting mosses and fungi and insects and birds and mammals in a web of life so intricate that no single mind can grasp its full complexity. Yet the forest persists through fire and flood and disease and the axes of men who see only timber where the forest sees community.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-ultimate-002",
    text: "A child opens a book for the first time and discovers that the marks on the page are not random scratches but doors: each word a threshold, each sentence a path, each chapter a new world waiting to be explored. The story unfolds, and the child learns that dragons can be outwitted, that kindness is stronger than cruelty, that the smallest person can change the course of history. When the final page turns, the child closes the book, but the doors remain open in the mind forever.",
    category: "original",
    license: "Original",
  },
  {
    id: "orig-ultimate-003",
    text: "The old observatory sits atop the mountain, where the air is thin and the stars burn with a clarity unknown in the valleys below. Generations of astronomers have climbed these slopes, carrying instruments and notebooks and questions about the nature of the universe. They have measured the parallax of nearby stars, the redshift of distant galaxies, and the temperature of the cosmic microwave background, each observation a small step toward understanding the vastness that surrounds us. And yet, the more they learn, the more questions arise, and the mountain remains silent beneath the wheeling heavens.",
    category: "original",
    license: "Original",
  },

  // Researched literature candidates; length groups derive from actual text counts.
  {
    id: "carroll-alice-rabbit-hole-short",
    text: "In another moment down went Alice after it, never once considering how in the world she was to get out again.",
    category: "literature",
    author: "Lewis Carroll",
    workTitle: "Alice’s Adventures in Wonderland",
    publicationYear: 1865,
    sourceUrl: "https://www.gutenberg.org/files/11/11-h/11-h.htm",
  },
  {
    id: "austen-pride-netherfield-short",
    text: "“My dear Mr. Bennet,” said his lady to him one day, “have you heard that Netherfield Park is let at last?”",
    category: "literature",
    author: "Jane Austen",
    workTitle: "Pride and Prejudice",
    publicationYear: 1813,
    sourceUrl: "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
  },
  {
    id: "doyle-scandal-irene-short",
    text: "In his eyes she eclipses and predominates the whole of her sex.",
    category: "literature",
    author: "Arthur Conan Doyle",
    workTitle: "The Adventures of Sherlock Holmes — ‘A Scandal in Bohemia’",
    publicationYear: 1892,
    sourceUrl: "https://www.gutenberg.org/files/1661/1661-h/1661-h.htm",
  },
  {
    id: "stevenson-treasure-cove-short",
    text: "“This is a handy cove,” says he at length; “and a pleasant sittyated grog-shop. Much company, mate?”",
    category: "literature",
    author: "Robert Louis Stevenson",
    workTitle: "Treasure Island",
    publicationYear: 1883,
    sourceUrl: "https://www.gutenberg.org/files/120/120-h/120-h.htm",
  },
  {
    id: "carroll-alice-rabbit-hole-medium",
    text: "The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.",
    category: "literature",
    author: "Lewis Carroll",
    workTitle: "Alice’s Adventures in Wonderland",
    publicationYear: 1865,
    sourceUrl: "https://www.gutenberg.org/files/11/11-h/11-h.htm",
  },
  {
    id: "dickens-christmas-marley-medium",
    text: "The mention of Marley’s funeral brings me back to the point I started from. There is no doubt that Marley was dead. This must be distinctly understood, or nothing wonderful can come of the story I am going to relate.",
    category: "literature",
    author: "Charles Dickens",
    workTitle: "A Christmas Carol",
    publicationYear: 1843,
    sourceUrl: "https://www.gutenberg.org/files/46/46-h/46-h.htm",
  },
  {
    id: "shelley-frankenstein-pole-medium",
    text: "I try in vain to be persuaded that the pole is the seat of frost and desolation; it ever presents itself to my imagination as the region of beauty and delight.",
    category: "literature",
    author: "Mary Wollstonecraft Shelley",
    workTitle: "Frankenstein; or, the Modern Prometheus",
    publicationYear: 1818,
    sourceUrl: "https://www.gutenberg.org/files/84/84-h/84-h.htm",
  },
  {
    id: "austen-sense-and-sensibility-estate-medium",
    text: "The late owner of this estate was a single man, who lived to a very advanced age, and who for many years of his life, had a constant companion and housekeeper in his sister.",
    category: "literature",
    author: "Jane Austen",
    workTitle: "Sense and Sensibility",
    publicationYear: 1811,
    sourceUrl: "https://github.com/standardebooks/jane-austen_sense-and-sensibility/blob/master/src/epub/text/chapter-1.xhtml",
  },
  {
    id: "carroll-alice-well-long",
    text: "Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs.",
    category: "literature",
    author: "Lewis Carroll",
    workTitle: "Alice’s Adventures in Wonderland",
    publicationYear: 1865,
    sourceUrl: "https://www.gutenberg.org/files/11/11-h/11-h.htm",
  },
  {
    id: "dickens-christmas-scrooge-description-long",
    text: "Oh! But he was a tight-fisted hand at the grindstone, Scrooge! a squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner! Hard and sharp as flint, from which no steel had ever struck out generous fire; secret, and self-contained, and solitary as an oyster. The cold within him froze his old features, nipped his pointed nose, shrivelled his cheek, stiffened his gait; made his eyes red, his thin lips blue; and spoke out shrewdly in his grating voice.",
    category: "literature",
    author: "Charles Dickens",
    workTitle: "A Christmas Carol",
    publicationYear: 1843,
    sourceUrl: "https://www.gutenberg.org/files/46/46-h/46-h.htm",
  },
  {
    id: "shelley-frankenstein-northern-breeze-long",
    text: "I am already far north of London, and as I walk in the streets of Petersburgh, I feel a cold northern breeze play upon my cheeks, which braces my nerves and fills me with delight. Do you understand this feeling? This breeze, which has travelled from the regions towards which I am advancing, gives me a foretaste of those icy climes. Inspirited by this wind of promise, my daydreams become more fervent and vivid.",
    category: "literature",
    author: "Mary Wollstonecraft Shelley",
    workTitle: "Frankenstein; or, the Modern Prometheus",
    publicationYear: 1818,
    sourceUrl: "https://www.gutenberg.org/files/84/84-h/84-h.htm",
  },
  {
    id: "stevenson-treasure-island-opening-long",
    text: "Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted, I take up my pen in the year of grace 17—, and go back to the time when my father kept the Admiral Benbow inn and the brown old seaman with the sabre cut first took up his lodging under our roof.",
    category: "literature",
    author: "Robert Louis Stevenson",
    workTitle: "Treasure Island",
    publicationYear: 1883,
    sourceUrl: "https://www.gutenberg.org/files/120/120-h/120-h.htm",
  },
  {
    id: "carroll-alice-puzzle-extra",
    text: "Alice took up the fan and gloves, and, as the hall was very hot, she kept fanning herself all the time she went on talking: “Dear, dear! How queer everything is to-day! And yesterday things went on just as usual. I wonder if I’ve been changed in the night? Let me think: was I the same when I got up this morning? I almost think I can remember feeling a little different. But if I’m not the same, the next question is, Who in the world am I? Ah, that’s the great puzzle!” And she began thinking over all the children she knew that were of the same age as herself, to see if she could have been changed for any of them.",
    category: "literature",
    author: "Lewis Carroll",
    workTitle: "Alice’s Adventures in Wonderland",
    publicationYear: 1865,
    sourceUrl: "https://www.gutenberg.org/files/11/11-h/11-h.htm",
  },
  {
    id: "dickens-christmas-weather-extra",
    text: "External heat and cold had little influence on Scrooge. No warmth could warm, no wintry weather chill him. No wind that blew was bitterer than he, no falling snow was more intent upon its purpose, no pelting rain less open to entreaty. Foul weather didn’t know where to have him. The heaviest rain, and snow, and hail, and sleet, could boast of the advantage over him in only one respect. They often “came down” handsomely, and Scrooge never did. Nobody ever stopped him in the street to say, with gladsome looks, “My dear Scrooge, how are you? When will you come to see me?” No beggars implored him to bestow a trifle, no children asked him what it was o’clock, no man or woman ever once in all his life inquired the way to such and such a place, of Scrooge.",
    category: "literature",
    author: "Charles Dickens",
    workTitle: "A Christmas Carol",
    publicationYear: 1843,
    sourceUrl: "https://www.gutenberg.org/files/46/46-h/46-h.htm",
  },
  {
    id: "doyle-scandal-watson-extra",
    text: "My own complete happiness, and the home-centred interests which rise up around the man who first finds himself master of his own establishment, were sufficient to absorb all my attention, while Holmes, who loathed every form of society with his whole Bohemian soul, remained in our lodgings in Baker Street, buried among his old books, and alternating from week to week between cocaine and ambition, the drowsiness of the drug, and the fierce energy of his own keen nature. He was still, as ever, deeply attracted by the study of crime, and occupied his immense faculties and extraordinary powers of observation in following out those clues, and clearing up those mysteries which had been abandoned as hopeless by the official police. From time to time I heard some vague account of his doings: of his summons to Odessa in the case of the Trepoff murder, of his clearing up of the singular tragedy of the Atkinson brothers at Trincomalee, and finally of the mission which he had accomplished so delicately and successfully for the reigning family of Holland.",
    category: "literature",
    author: "Arthur Conan Doyle",
    workTitle: "The Adventures of Sherlock Holmes — ‘A Scandal in Bohemia’",
    publicationYear: 1892,
    sourceUrl: "https://www.gutenberg.org/files/1661/1661-h/1661-h.htm",
  },
  {
    id: "grahame-wind-in-the-willows-mole-extra",
    text: "The Mole had been working very hard all the morning, spring-cleaning his little home. First with brooms, then with dusters; then on ladders and steps and chairs, with a brush and a pail of whitewash; till he had dust in his throat and eyes, and splashes of white-wash all over his black fur, and an aching back and weary arms. Spring was moving in the air above and in the earth below and around him, penetrating even his dark and lowly little house with its spirit of divine discontent and longing. It was small wonder, then, that he suddenly flung down his brush on the floor, said 'Bother!' and 'O blow!' and also 'Hang spring-cleaning?' and bolted out of the house without even waiting to put on his coat. Something up above was calling him imperiously, and he made for the steep little tunnel which answered in his case to the gravelled carriage-drive owned by animals whose residences are nearer to the sun and air.",
    category: "literature",
    author: "Kenneth Grahame",
    workTitle: "The Wind in the Willows",
    publicationYear: 1908,
    sourceUrl: "https://en.wikisource.org/wiki/The_Wind_in_the_Willows_(1908)/Chapter_1",
  },
  {
    id: "shelley-frankenstein-letter-ultimate",
    text: "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking. I am already far north of London, and as I walk in the streets of Petersburgh, I feel a cold northern breeze play upon my cheeks, which braces my nerves and fills me with delight. Do you understand this feeling? This breeze, which has travelled from the regions towards which I am advancing, gives me a foretaste of those icy climes. Inspirited by this wind of promise, my daydreams become more fervent and vivid. I try in vain to be persuaded that the pole is the seat of frost and desolation; it ever presents itself to my imagination as the region of beauty and delight. There, Margaret, the sun is for ever visible, its broad disk just skirting the horizon and diffusing a perpetual splendour. There—for with your leave, my sister, I will put some trust in preceding navigators—there snow and frost are banished; and, sailing over a calm sea, we may be wafted to a land surpassing in wonders and in beauty every region hitherto discovered on the habitable globe. Its productions and features may be without example, as the phenomena of the heavenly bodies undoubtedly are in those undiscovered solitudes. What may not be expected in a country of eternal light? I may there discover the wondrous power which attracts the needle and may regulate a thousand celestial observations that require only this voyage to render their seeming eccentricities consistent for ever. I shall satiate my ardent curiosity with the sight of a part of the world never before visited, and may tread a land never before imprinted by the foot of man. These are my enticements, and they are sufficient to conquer all fear of danger or death and to induce me to commence this laborious voyage with the joy a child feels when he embarks in a little boat, with his holiday mates, on an expedition of discovery up his native river.",
    category: "literature",
    author: "Mary Wollstonecraft Shelley",
    workTitle: "Frankenstein; or, the Modern Prometheus",
    publicationYear: 1818,
    sourceUrl: "https://www.gutenberg.org/files/84/84-h/84-h.htm",
  },
  {
    id: "dickens-christmas-nephew-ultimate",
    text: "“What else can I be,” returned the uncle, “when I live in such a world of fools as this? Merry Christmas! Out upon merry Christmas! What’s Christmas time to you but a time for paying bills without money; a time for finding yourself a year older, but not an hour richer; a time for balancing your books and having every item in ’em through a round dozen of months presented dead against you? If I could work my will,” said Scrooge indignantly, “every idiot who goes about with ‘Merry Christmas’ on his lips, should be boiled with his own pudding, and buried with a stake of holly through his heart. He should!” “Uncle!” pleaded the nephew. “Nephew!” returned the uncle sternly, “keep Christmas in your own way, and let me keep it in mine.” “Keep it!” repeated Scrooge’s nephew. “But you don’t keep it.” “Let me leave it alone, then,” said Scrooge. “Much good may it do you! Much good it has ever done you!” “There are many things from which I might have derived good, by which I have not profited, I dare say,” returned the nephew. “Christmas among the rest. But I am sure I have always thought of Christmas time, when it has come round—apart from the veneration due to its sacred name and origin, if anything belonging to it can be apart from that—as a good time; a kind, forgiving, charitable, pleasant time; the only time I know of, in the long calendar of the year, when men and women seem by one consent to open their shut-up hearts freely, and to think of people below them as if they really were fellow-passengers to the grave, and not another race of creatures bound on other journeys. And therefore, uncle, though it has never put a scrap of gold or silver in my pocket, I believe that it has done me good, and will do me good; and I say, God bless it!”",
    category: "literature",
    author: "Charles Dickens",
    workTitle: "A Christmas Carol",
    publicationYear: 1843,
    sourceUrl: "https://www.gutenberg.org/files/46/46-h/46-h.htm",
  },
  {
    id: "doyle-scandal-watson-ultimate",
    text: "My own complete happiness, and the home-centred interests which rise up around the man who first finds himself master of his own establishment, were sufficient to absorb all my attention, while Holmes, who loathed every form of society with his whole Bohemian soul, remained in our lodgings in Baker Street, buried among his old books, and alternating from week to week between cocaine and ambition, the drowsiness of the drug, and the fierce energy of his own keen nature. He was still, as ever, deeply attracted by the study of crime, and occupied his immense faculties and extraordinary powers of observation in following out those clues, and clearing up those mysteries which had been abandoned as hopeless by the official police. From time to time I heard some vague account of his doings: of his summons to Odessa in the case of the Trepoff murder, of his clearing up of the singular tragedy of the Atkinson brothers at Trincomalee, and finally of the mission which he had accomplished so delicately and successfully for the reigning family of Holland. Beyond these signs of his activity, however, which I merely shared with all the readers of the daily press, I knew little of my former friend and companion. One night—it was on the twentieth of March, 1888—I was returning from a journey to a patient (for I had now returned to civil practice), when my way led me through Baker Street. As I passed the well-remembered door, which must always be associated in my mind with my wooing, and with the dark incidents of the Study in Scarlet, I was seized with a keen desire to see Holmes again, and to know how he was employing his extraordinary powers.",
    category: "literature",
    author: "Arthur Conan Doyle",
    workTitle: "The Adventures of Sherlock Holmes — ‘A Scandal in Bohemia’",
    publicationYear: 1892,
    sourceUrl: "https://www.gutenberg.org/files/1661/1661-h/1661-h.htm",
  },
  {
    id: "austen-pride-jane-elizabeth-ultimate",
    text: "“To oblige you, I would try to believe almost anything, but no one else could be benefited by such a belief as this; for were I persuaded that Charlotte had any regard for him, I should only think worse of her understanding than I now do of her heart. My dear Jane, Mr. Collins is a conceited, pompous, narrow-minded, silly man: you know he is, as well as I do; and you must feel, as well as I do, that the woman who marries him cannot have a proper way of thinking. You shall not defend her, though it is Charlotte Lucas. You shall not, for the sake of one individual, change the meaning of principle and integrity, nor endeavour to persuade yourself or me, that selfishness is prudence, and insensibility of danger security for happiness.” “I must think your language too strong in speaking of both,” replied Jane; “and I hope you will be convinced of it, by seeing them happy together. But enough of this. You alluded to something else. You mentioned two instances. I cannot misunderstand you, but I entreat you, dear Lizzy, not to pain me by thinking that person to blame, and saying your opinion of him is sunk. We must not be so ready to fancy ourselves intentionally injured. We must not expect a lively young man to be always so guarded and circumspect. It is very often nothing but our own vanity that deceives us. Women fancy admiration means more than it does.”",
    category: "literature",
    author: "Jane Austen",
    workTitle: "Pride and Prejudice",
    publicationYear: 1813,
    sourceUrl: "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
  },

  // Passages flagged for copyright approval — NOT INCLUDED IN ACTIVE LIBRARY
  // These are kept here for reference but excluded from the active passages array
  // TODO: Obtain legal clearance or replace with original content
  /*
  {
    id: "quote-short-001",
    text: "The only way to do great work is to love what you do every single day",
    category: "quotes",
    author: "Steve Jobs",
    source: "Stanford Commencement Address 2005",
    license: "Fair Use — Short Quotation — REQUIRES APPROVAL",
  },
  {
    id: "quote-medium-001",
    text: "In the middle of difficulty lies opportunity this simple truth has guided countless innovators through the darkest moments of discovery when the path forward seemed impossible and the cost of failure appeared too great to bear",
    category: "quotes",
    author: "Albert Einstein",
    source: "Attributed",
    license: "Fair Use — Short Quotation — REQUIRES APPROVAL",
  },
  */
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
