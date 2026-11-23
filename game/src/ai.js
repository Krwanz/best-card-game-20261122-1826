// Rook, the AI lantern-keeper. Its turns are readable on purpose: it says
// what it is about to do, it favours the strongest affordable play, it heals
// when it is hurting, and it only goes for the hero when the table is safe —
// so a player can read the plan and answer it.
export function aiPlanLine(me, foe) {
  if (me.life <= 10) return 'Rook guards its flame — it is hurting and plays safe.';
  if (foe.board.some((c) => c.atk >= 4)) return 'Rook eyes your big creature and answers it.';
  if (me.hand.length >= 6) return 'Rook has a full hand and spends it fast.';
  return 'Rook plays the strongest card it can afford.';
}

// Pick the next card for the AI to play, or null when it should stop.
// Returns { handIndex, target } where target is 'foe-hero', a foe creature
// uid, or null for cards that need no target.
export function aiPickPlay(me, foe) {
  const affordable = me.hand
    .map((card, handIndex) => ({ card, handIndex }))
    .filter(({ card }) => card.cost <= me.mana);
  if (affordable.length === 0) return null;

  const scored = affordable.map(({ card, handIndex }) => {
    let score = 0;
    let target = null;
    if (card.kind === 'creature') {
      // Value per mana, with a bonus for a full board slot when ahead.
      score = (card.atk + card.hp) / Math.max(1, card.cost);
      if (me.board.length >= 4) score -= 1.5;
      if (me.life <= 10 && card.hp >= 5) score += 1.2; // wall up when hurt
    } else if (card.effect === 'bolt3') {
      const lethal = foe.life <= 3;
      const bigThreat = foe.board.find((c) => c.atk >= 4);
      if (lethal) { score = 9; target = 'foe-hero'; }
      else if (bigThreat) { score = 6; target = bigThreat.uid; }
      else if (foe.life <= 12) { score = 4; target = 'foe-hero'; }
      else score = 1.2; // hold the bolt early
    } else if (card.effect === 'heal6') {
      score = me.life <= 16 ? 7 : 0.4;
    } else if (card.effect === 'draw2') {
      score = me.hand.length <= 3 ? 5 : 1.5;
    } else if (card.effect === 'quake2') {
      score = foe.board.length >= 2 ? 6 : 0.5;
    }
    return { card, handIndex, score, target };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  // The AI stops when nothing on offer is worth the mana.
  if (best.score < 1.6) return null;
  return { handIndex: best.handIndex, target: best.target };
}

// Pick attacks for one AI creature: a foe creature uid, or 'foe-hero'.
// It trades up (kills a bigger attacker) and otherwise goes for the hero,
// unless the player is about to win — then it clears the board instead.
export function aiPickAttack(attacker, me, foe) {
  const killable = foe.board
    .filter((c) => c.hp <= attacker.atk && c.atk >= attacker.atk)
    .sort((a, b) => b.atk - a.atk);
  if (killable.length > 0 && foe.life > 8) return killable[0].uid;
  const scary = foe.board.filter((c) => c.atk >= 5).sort((a, b) => b.atk - a.atk);
  if (scary.length > 0 && attacker.hp <= scary[0].atk) return scary[0].uid;
  return 'foe-hero';
}
