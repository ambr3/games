# Word Puzzle

Find hidden words by dragging your finger or mouse across adjacent letters.

Longer words score more. There are four ways to play, from calm to timed. Nothing
about your game is sent anywhere.

## Features

- Words are made by moving between neighbouring letters, including diagonally.
  Each letter is used once per word
- Four modes: Classic, Rush, Zen and Challenge
- Choose how big the grid is, from a 4×4 up to a 6×6, using a 1–100 difficulty
  setting
- A dictionary is built in, with a much larger optional one you can switch on
- Track your progress, keep your best scores, and clear everything from one
  button

### About the dictionary

The large word list is deliberately cleaned. It ships without slurs, profanity
or explicit sexual words, because Zen mode lets you browse the whole list and the
file is published.

The filter that does this is `scripts/filter-words.py` in the app folder. It is
not a simple "remove anything containing this" pass: English builds words in
pieces, so a naive filter would also take out ordinary words like *cocoon* and
*auspicious*. Each rule says whether it matches a whole word, only the start of
one, or not at all. The script prints what every rule costs before it changes
anything:

```bash
python3 scripts/filter-words.py --dry-run --extras   # just report
python3 scripts/filter-words.py                     # rewrite the word list
```

The known cost is two words, *niggle* and *twattle*. Everything else it removes
is profanity or a slur.

## Usage

Open it and pick a mode. Drag across the letters to trace a word, then let go.

To play it from the files on your own machine:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`. The folder can be put on any ordinary web
hosting.

## License

GPL-3.0. See [LICENSE](LICENSE).

Made with ❤️ 🇬🇧