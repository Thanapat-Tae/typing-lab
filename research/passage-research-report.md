# Typing Lab Passage Candidates — Research Report

**Research date:** 2026-11-16
**Scope:** 20 candidate excerpts, four in each requested whitespace-token range. This work adds research artifacts only; it does not alter the application or the existing passage library.

## Result

The candidate set is in [`passage-candidates.json`](./passage-candidates.json). It contains 20 unique IDs and 20 distinct excerpts, with four entries in each category:

| Category | Inclusive range | Candidates | Observed count range |
|---|---:|---:|---:|
| Short | 12–24 | 4 | 12–21 |
| Medium | 25–48 | 4 | 31–40 |
| Long | 49–96 | 4 | 74–90 |
| Extra | 97–192 | 4 | 123–178 |
| Ultimate | 193–384 | 4 | 215–365 |

Word counts use `text.trim().split(/\s+/).length`; punctuation remains attached to its word. IDs, category counts, ranges, word counts, and required metadata were validated programmatically. No passage text was rewritten to fit a range.

## Sources and verification

Passage wording was checked against the linked full-text source pages. The JSON records the author, work, original publication year, source edition, URL, and a chapter/paragraph or rendered-line locator for every excerpt. Where the source page splits prose across HTML lines or paragraphs, those boundaries are represented by one space; the words, capitalization, and punctuation are otherwise preserved. No ASCII punctuation normalization was needed.

Sources represented in the candidate file:

| Work | Author | Original publication | Primary text source |
|---|---|---:|---|
| *Alice’s Adventures in Wonderland* | Lewis Carroll (d. 1898) | 1865 | [Project Gutenberg eBook 11](https://www.gutenberg.org/files/11/11-h/11-h.htm) |
| *Pride and Prejudice* | Jane Austen (d. 1817) | 1813 | [Project Gutenberg eBook 1342](https://www.gutenberg.org/files/1342/1342-h/1342-h.htm) |
| *Sense and Sensibility* | Jane Austen (d. 1817) | 1811 | [Standard Ebooks Chapter I source XHTML](https://github.com/standardebooks/jane-austen_sense-and-sensibility/blob/master/src/epub/text/chapter-1.xhtml) |
| *The Adventures of Sherlock Holmes* | Arthur Conan Doyle (d. 1930) | 1892 | [Project Gutenberg eBook 1661](https://www.gutenberg.org/files/1661/1661-h/1661-h.htm) |
| *Treasure Island* | Robert Louis Stevenson (d. 1894) | 1883 | [Project Gutenberg eBook 120](https://www.gutenberg.org/files/120/120-h/120-h.htm) |
| *A Christmas Carol* | Charles Dickens (d. 1870) | 1843 | [Project Gutenberg eBook 46](https://www.gutenberg.org/files/46/46-h/46-h.htm) |
| *Frankenstein; or, the Modern Prometheus* | Mary Wollstonecraft Shelley (d. 1851) | 1818 | [Project Gutenberg eBook 84](https://www.gutenberg.org/files/84/84-h/84-h.htm) |
| *The Wind in the Willows* | Kenneth Grahame (d. 1932) | 1908 | [Wikisource, Chapter I](https://en.wikisource.org/wiki/The_Wind_in_the_Willows_%281908%29/Chapter_1) |

For *Frankenstein*, the source transcription reflects the 1831 revised edition; the recorded publication year is the novel’s original 1818 publication year. The wording is copied from the identified 1831 source text, not silently presented as the 1818 edition.

Project Gutenberg advises readers outside the United States to check their own local law; its distribution terms do not themselves establish a work’s status in every country ([terms of use](https://www.gutenberg.org/policy/terms_of_use), [license](https://www.gutenberg.org/policy/license)). Standard Ebooks was used for one passage: the *Sense and Sensibility* sentence was checked against the edition’s source XHTML, and its book page identifies the 1811 work and describes the source text and territorial copyright caveat ([edition page](https://standardebooks.org/ebooks/jane-austen/sense-and-sensibility), [Chapter I source XHTML](https://github.com/standardebooks/jane-austen_sense-and-sensibility/blob/master/src/epub/text/chapter-1.xhtml)). Standard Ebooks says its own contributions are dedicated to the public domain through CC0; its collection policy describes selection of works believed to be public domain in the United States ([about](https://standardebooks.org/about), [collections policy](https://standardebooks.org/contribute/collections-policy)). The remaining excerpts are tied directly to the Project Gutenberg or Wikisource text pages listed above.

## Reuse eligibility review

This is a conservative screening of the underlying literary works, not legal advice or a guarantee about every scan, transcription, introduction, illustration, or edition element.

- **United States:** The U.S. Copyright Office states that works published in the United States before January 1, 1931 are in the public domain as of 2026 ([Copyright Office overview](https://www.copyright.gov/what-is-copyright/), [Circular 15A](https://www.copyright.gov/circs/circ15a.pdf)). Each selected underlying work was first published between 1813 and 1908, well before that cutoff.
- **Thailand:** Section 19 of Thailand’s Copyright Act sets the ordinary term for an authored work at the author’s life plus 50 years, subject to the Act’s special cases ([Department of Intellectual Property, English Act PDF](https://www.ipthailand.go.th/images/26669/2566/laws/COPYRIGHT%20ACT%20B.E.%202537%20%281994%29.pdf)). Each selected author died by 1932, so the ordinary term has expired under this screen.
- **Wikisource transcription:** The underlying *Wind in the Willows* work is public domain on the dates above. Wikisource states that user contributions are made available under CC BY-SA 4.0 and GFDL unless otherwise noted ([Wikisource copyright policy](https://en.wikisource.org/wiki/Wikisource%3ACOPY)). If reuse relies on the Wikisource transcription contribution rather than independently transcribing the public-domain work, retain attribution and follow the applicable license terms.
- **Standard Ebooks / Project Gutenberg editions:** Their own editorial contributions and distribution terms are distinct from the underlying works. This candidate set does not copy modern introductions, notes, illustrations, or other third-party matter.

### Historical forms retained

Source forms such as “sittyated,” “to-day,” “home-centred,” “Petersburgh,” “for ever,” and the source’s curly quotation marks are retained where they occur. These are not spelling or punctuation edits. The only formatting normalization is joining source line/paragraph boundaries with spaces for a continuous typing passage.

## Validation summary

- JSON parses successfully.
- 20 passages total; exactly 4 per category.
- 20 unique IDs; no duplicate passage text.
- Every stored `wordCount` matches the whitespace-token recount.
- All 20 passages fall within their inclusive category ranges.
- Required author, title, year, source URL, rights notes, and source evidence are present.
- No application files, existing passage records, or unfinished work were changed.

## Limitations for review

The legal review uses the ordinary terms for the underlying authored works and excludes separately protected material. Before shipping passages, retain these source attributions and review the Wikisource transcription license condition if using its contributed transcription. The initial curation is intentionally a small candidate set, not a complete library or editorial endorsement of every excerpt’s suitability for practice.
