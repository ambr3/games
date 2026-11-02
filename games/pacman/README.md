# Seclusa Munch

Eat the maze. Keep clear of the four.

One maze, and the ghosts behave the way the 1980 arcade board did: the same
rhythm of drifting and chasing, the same way they pick a direction, the same
release order from the house. What's mine is everything you can see: the name,
the colours, the four ghosts' names, the icon, and the fact that it's set in the
app's own typeface rather than an arcade pixel font.

Every sprite is drawn by the app itself, and the walls are read out of the maze's
own layout when the game starts. There are no picture files to load.

## Features

- Eat the dots, avoid the four, clear the maze
- Keys and swipes both work. There are no on-screen buttons to get in the way
- The four behave like the originals: Rook and Bram chase hard, Pip looks ahead
  four squares, Nix aims from the wrong square the same way the arcade did
- Rook speeds up twice as the maze empties out, then again after a death
- Fruit appears at the same points on every level
- Energizers, and the ghosts turn blue and slow for a while after you eat one
- Your score is remembered on your device

## Usage

Open it and press start.

| What you press | What happens |
|---|---|
| Any key, or a tap | Start |
| Arrow keys | Move |
| Swipe | Move, on a touch screen |
| End, or the pause button | Pause |

There's no on-screen pad. A swipe is one movement instead of a reach, it can turn
twice without lifting a finger, and it gives back the bottom of the screen.

### The four

| Ghost | Colour | |
|---|---|---|
| **Rook** | red | A spiked crown and a scowl |
| **Pip** | blue | Smooth, square-footed, scowling |
| **Nix** | purple | Wearing somebody's flat cap, and bored |
| **Bram** | green | Round, and grinning |

Only their eyes move with the direction they're going. The bodies stay upright,
which is what keeps a turn readable as a turn.

### Small differences from the arcade

Five, all deliberate:

- The energizers don't blink. At this size the blink reads as a flicker rather
  than a pulse.
- You're checked against a ghost slightly more often than the original, so you
  can never swap places with one without meeting it.
- When you stop, your mouth is shut. The arcade could freeze the chomp on its
  widest frame, which at arcade size still looked fine. Here it does not, so a
  player looking at a wall sees a face rather than half a chomp.
- Only the parts of a character that face somewhere turn. Munch's head turns as
  he moves; his cap, eyes and legs do not.
- No menu. One game is one game. Press start.

## License

GPL-3.0, as the project it grew out of was. See [LICENSE](LICENSE). Pac-Man is
a trademark of Bandai Namco Entertainment. This is an unaffiliated homage and
uses no original artwork.