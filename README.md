# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Krwanz/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Krwanz/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Lantern Duel — an original 1v1 card battler. Two lantern-keepers duel at a table: each starts at 30 life, gains one more mana crystal every turn, and plays creatures and spells from four suits — Flame, Tide, Leaf and Stone, told apart by colour and shape. Creatures fight on the table, spells strike once, and the keeper whose lantern is snuffed out first loses. Rook, the AI rival, plays readable, counterable turns and says what it is about to do.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Or serve `game/` with any static server and open `game/index.html`.

## How to play

- Click a card in your hand to play it (or press 1–7). Spells that deal damage ask you to click a target; creatures ask for a target when they attack.
- Click one of your ready creatures, then click a foe creature or Rook's lantern to attack. Creatures cannot attack the turn they are played.
- Press Space (or click END TURN) to end your turn. Esc returns to the title screen.
- Win by bringing Rook's life to 0; lose if your own lantern hits 0.

## Screenshots

The cover (`1-table.jpg`) shows a mid-duel table with both hands, readable cards and both life totals. The others show the title screen, the win screen and the loss screen.

---

<sub>Entered on [make.fun](https://make.fun/?ref=a15ed58m&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
