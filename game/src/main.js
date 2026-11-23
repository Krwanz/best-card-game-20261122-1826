// Lantern Duel — game state, input and turn flow.
// Two lantern-keepers duel at a table. Each starts at 30 life and gains one
// more mana crystal every turn (up to 10). Creatures fight on the table;
// spells strike once. Win by snuffing out Rook's lantern.
import { SUITS, makeCard, cardDef } from './cards.js';
import { Deck } from './deck.js';
import { aiPickPlay, aiPickAttack, aiPlanLine } from './ai.js';
import { Sfx } from './audio.js';
import { drawGame, W, H } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = new Sfx();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function newKeeper() {
  return { life: 30, maxLife: 30, mana: 0, maxMana: 0, deck: new Deck(), hand: [], board: [] };
}

const S = {
  screen: 'title', // title | duel | win | loss
  phase: 'player', // player | ai
  turn: 1,
  turns: 0,
  cardsPlayed: 0,
  player: newKeeper(),
  ai: newKeeper(),
  selected: null,   // { kind: 'hand', index } or { kind: 'board', uid }
  targetMode: null, // { type: 'spell'|'attack', card?, uid? }
  log: ['Welcome to Lantern Duel.'],
  floaters: [],
  hoverHand: -1,
  hit: {},
  aiToken: 0,
};

function logLine(msg) {
  S.log.push(msg);
  if (S.log.length > 4) S.log.shift();
}

function floater(x, y, text, color) {
  S.floaters.push({ x, y, text, color, life: 50 });
}

function deckCount(k) { return k.deck.count; }

function drawCards(k, n) {
  const drawn = k.deck.draw(n);
  for (const c of drawn) {
    if (k.hand.length < 7) k.hand.push(c);
    else logLine('Hand full — a card burns away.');
  }
  return drawn;
}

function startDuel() {
  S.player = newKeeper();
  S.ai = newKeeper();
  S.turn = 1;
  S.turns = 0;
  S.cardsPlayed = 0;
  S.selected = null;
  S.targetMode = null;
  S.log = ['The duel begins. Your lantern against Rook’s.'];
  S.floaters = [];
  S.aiToken++;
  drawCards(S.player, 3);
  drawCards(S.ai, 3);
  S.screen = 'duel';
  startPlayerTurn();
  sfx.unlock();
}

function startPlayerTurn() {
  S.phase = 'player';
  S.turns = S.turn;
  const k = S.player;
  k.maxMana = Math.min(10, S.turn);
  k.mana = k.maxMana;
  const drawn = drawCards(k, 1);
  if (drawn.length === 0) {
    k.life = Math.max(0, k.life - 2);
    logLine('Your deck is empty — the lantern dims (−2 life).');
    floater(640, 600, '−2', '#e2483d');
  }
  for (const c of k.board) c.canAttack = true;
  logLine(`Turn ${S.turn}: you draw a card and gain ${k.maxMana} mana.`);
  sfx.turn();
  checkEnd();
}

function endPlayerTurn() {
  if (S.phase !== 'player' || S.screen !== 'duel') return;
  S.selected = null;
  S.targetMode = null;
  S.phase = 'ai';
  sfx.turn();
  runAiTurn(++S.aiToken);
}

async function runAiTurn(token) {
  await sleep(650);
  if (token !== S.aiToken || S.screen !== 'duel') return;
  const me = S.ai;
  const foe = S.player;
  me.maxMana = Math.min(10, S.turn);
  me.mana = me.maxMana;
  drawCards(me, 1);
  for (const c of me.board) c.canAttack = true;
  logLine(aiPlanLine(me, foe));
  await sleep(750);
  if (token !== S.aiToken || S.screen !== 'duel') return;

  // Play cards, one at a time so the player can follow.
  for (let guard = 0; guard < 10; guard++) {
    const pick = aiPickPlay(me, foe);
    if (!pick) break;
    const card = me.hand[pick.handIndex];
    me.hand.splice(pick.handIndex, 1);
    me.mana -= card.cost;
    S.cardsPlayed += 0; // only the player's count is shown
    if (card.kind === 'creature') {
      if (me.board.length < 5) {
        me.board.push(card);
        if (card.effect === 'draw1') drawCards(me, 1);
        logLine(`Rook plays ${card.name} (${card.atk}/${card.hp}).`);
        floater(640, 220, card.name, SUITS[card.suit].color);
        sfx.playCard();
      } else { me.hand.push(card); me.mana += card.cost; break; }
    } else {
      resolveSpell(card, me, foe, pick.target);
    }
    await sleep(650);
    if (token !== S.aiToken || S.screen !== 'duel') return;
    if (checkEnd()) return;
  }

  // Attack with every ready creature.
  for (const c of [...me.board]) {
    if (token !== S.aiToken || S.screen !== 'duel') return;
    if (!c.canAttack) continue;
    const target = aiPickAttack(c, me, foe);
    await sleep(420);
    if (token !== S.aiToken || S.screen !== 'duel') return;
    doAttack(c, me, foe, target);
    if (checkEnd()) return;
  }

  await sleep(500);
  if (token !== S.aiToken || S.screen !== 'duel') return;
  S.turn++;
  startPlayerTurn();
}

function resolveSpell(card, caster, foe, target) {
  if (card.effect === 'bolt3') {
    if (target === 'foe-hero') {
      foe.life = Math.max(0, foe.life - 3);
      floater(90, 120, '−3', '#e2483d');
      logLine(`${caster === S.ai ? 'Rook' : 'You'} hurl ${card.name} for 3 damage.`);
    } else {
      const victim = foe.board.find((c) => c.uid === target);
      if (victim) {
        victim.hp -= 3;
        floater(640, 200, '−3', '#e2483d');
        logLine(`${card.name} burns ${victim.name} for 3.`);
        removeDead(foe);
      }
    }
    sfx.hurt();
  } else if (card.effect === 'heal6') {
    caster.life = Math.min(caster.maxLife, caster.life + 6);
    floater(90, 120, '+6', '#4caf6d');
    logLine(`${caster === S.ai ? 'Rook' : 'You'} mend the lantern (+6 life).`);
    sfx.heal();
  } else if (card.effect === 'draw2') {
    drawCards(caster, 2);
    logLine(`${caster === S.ai ? 'Rook' : 'You'} draw 2 cards.`);
    sfx.draw();
  } else if (card.effect === 'quake2') {
    for (const c of foe.board) c.hp -= 2;
    floater(640, 200, '−2 all', '#e2483d');
    logLine(`${card.name} shakes the whole table (−2 to every foe).`);
    removeDead(foe);
    sfx.hurt();
  }
}

function removeDead(k) {
  const before = k.board.length;
  k.board = k.board.filter((c) => c.hp > 0);
  if (k.board.length < before) logLine('A creature crumbles to embers.');
}

function doAttack(attacker, atkKeeper, defKeeper, target) {
  attacker.canAttack = false;
  attacker.lunge = 16;
  sfx.attack();
  if (target === 'foe-hero') {
    defKeeper.life = Math.max(0, defKeeper.life - attacker.atk);
    floater(90, defKeeper === S.ai ? 120 : 600, `−${attacker.atk}`, '#e2483d');
    logLine(`${attacker.name} strikes the lantern for ${attacker.atk}.`);
  } else {
    const victim = defKeeper.board.find((c) => c.uid === target);
    if (!victim) return;
    victim.hp -= attacker.atk;
    attacker.hp -= victim.atk;
    floater(640, 200, `−${attacker.atk}`, '#e2483d');
    logLine(`${attacker.name} hits ${victim.name} (${attacker.atk} vs ${victim.atk}).`);
    removeDead(defKeeper);
    removeDead(atkKeeper);
  }
  checkEnd();
}

function checkEnd() {
  if (S.screen !== 'duel') return false;
  if (S.ai.life <= 0) {
    S.screen = 'win';
    S.aiToken++;
    sfx.win();
    logLine('Rook’s lantern is out — you win!');
    return true;
  }
  if (S.player.life <= 0) {
    S.screen = 'loss';
    S.aiToken++;
    sfx.lose();
    logLine('Your lantern goes dark — Rook wins.');
    return true;
  }
  return false;
}

// ---- Player actions ----

function playHandCard(index) {
  if (S.phase !== 'player' || S.screen !== 'duel') return;
  const card = S.player.hand[index];
  if (!card) return;
  if (card.cost > S.player.mana) {
    logLine(`Not enough mana for ${card.name}.`);
    return;
  }
  if (card.kind === 'spell' && card.effect === 'bolt3') {
    S.selected = { kind: 'hand', index };
    S.targetMode = { type: 'spell', card };
    logLine(`${card.name}: choose a target.`);
    sfx.click();
    return;
  }
  S.player.hand.splice(index, 1);
  S.player.mana -= card.cost;
  S.cardsPlayed++;
  S.selected = null;
  S.targetMode = null;
  if (card.kind === 'creature') {
    if (S.player.board.length >= 5) {
      S.player.hand.splice(index, 0, card);
      S.player.mana += card.cost;
      S.cardsPlayed--;
      logLine('Your table is full — five creatures at most.');
      return;
    }
    S.player.board.push(card);
    if (card.effect === 'draw1') drawCards(S.player, 1);
    logLine(`You play ${card.name} (${card.atk}/${card.hp}).`);
    floater(640, 430, card.name, SUITS[card.suit].color);
  } else {
    resolveSpell(card, S.player, S.ai, null);
  }
  sfx.playCard();
  checkEnd();
}

function resolveTarget(target) {
  // target: 'ai-hero' | creature uid
  const tm = S.targetMode;
  if (!tm) return;
  if (tm.type === 'spell') {
    const card = tm.card;
    const idx = S.player.hand.indexOf(card);
    if (idx < 0) { S.targetMode = null; return; }
    S.player.hand.splice(idx, 1);
    S.player.mana -= card.cost;
    S.cardsPlayed++;
    S.selected = null;
    S.targetMode = null;
    resolveSpell(card, S.player, S.ai, target === 'ai-hero' ? 'foe-hero' : target);
    sfx.playCard();
  } else if (tm.type === 'attack') {
    const attacker = S.player.board.find((c) => c.uid === tm.uid);
    S.selected = null;
    S.targetMode = null;
    if (attacker && attacker.canAttack) {
      doAttack(attacker, S.player, S.ai, target === 'ai-hero' ? 'foe-hero' : target);
    }
  }
  checkEnd();
}

function onBoardClick(uid) {
  if (S.phase !== 'player' || S.screen !== 'duel') return;
  const c = S.player.board.find((x) => x.uid === uid);
  if (!c) return;
  if (S.targetMode) return; // must pick a target first
  if (!c.canAttack) {
    logLine(`${c.name} is still warming up — it attacks next turn.`);
    return;
  }
  S.selected = { kind: 'board', uid };
  S.targetMode = { type: 'attack', uid };
  logLine(`${c.name} is ready — click a foe creature or Rook’s lantern.`);
  sfx.click();
}

// ---- Input ----

function inRect(px, py, r) {
  return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

canvas.addEventListener('click', (ev) => {
  sfx.unlock();
  const rect = canvas.getBoundingClientRect();
  const px = (ev.clientX - rect.left) * (W / rect.width);
  const py = (ev.clientY - rect.top) * (H / rect.height);
  const hit = S.hit;
  if (S.screen === 'title' || S.screen === 'win' || S.screen === 'loss') {
    if (inRect(px, py, hit.start)) { sfx.click(); startDuel(); }
    return;
  }
  if (S.phase !== 'player') return;
  if (inRect(px, py, hit.endTurn)) { endPlayerTurn(); return; }
  // Targets first: AI board creatures, then Rook's portrait.
  if (S.targetMode) {
    for (const r of hit.aiBoard || []) {
      if (inRect(px, py, r)) { resolveTarget(r.uid); return; }
    }
    if (inRect(px, py, hit.aiPortrait)) { resolveTarget('ai-hero'); return; }
    S.targetMode = null;
    S.selected = null;
    return;
  }
  for (const r of hit.hand || []) {
    if (inRect(px, py, r)) { playHandCard(r.index); return; }
  }
  for (const r of hit.board || []) {
    if (inRect(px, py, r)) { onBoardClick(r.uid); return; }
  }
  S.selected = null;
});

canvas.addEventListener('mousemove', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const px = (ev.clientX - rect.left) * (W / rect.width);
  const py = (ev.clientY - rect.top) * (H / rect.height);
  S.hoverHand = -1;
  for (const r of S.hit.hand || []) {
    if (inRect(px, py, r)) { S.hoverHand = r.index; break; }
  }
});

document.addEventListener('keydown', (ev) => {
  sfx.unlock();
  if (ev.key === 'Escape') {
    S.aiToken++;
    S.screen = 'title';
    S.selected = null;
    S.targetMode = null;
    return;
  }
  if (S.screen === 'title' || S.screen === 'win' || S.screen === 'loss') {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); startDuel(); }
    return;
  }
  if (S.screen !== 'duel') return;
  if (ev.key >= '1' && ev.key <= '7') playHandCard(Number(ev.key) - 1);
  else if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); endPlayerTurn(); }
});

// ---- Screenshot staging (?shot=title|table|win|loss) ----
// Still real renders of the game's own code: the query only pre-plays it.
function stageShot(kind) {
  if (kind === 'title') { S.screen = 'title'; return; }
  if (kind === 'win' || kind === 'loss') {
    startDuel();
    S.turns = 7;
    S.cardsPlayed = 14;
    if (kind === 'win') { S.ai.life = 0; S.player.life = 9; S.screen = 'win'; }
    else { S.player.life = 0; S.ai.life = 12; S.screen = 'loss'; }
    S.aiToken++;
    return;
  }
  if (kind === 'table') {
    startDuel();
    S.aiToken++;
    // A mid-duel table: both keepers bloodied, both boards busy.
    S.turn = 5;
    S.player.life = 22; S.ai.life = 18;
    S.player.mana = 6; S.player.maxMana = 7;
    S.ai.mana = 5; S.ai.maxMana = 6;
    S.player.hand = ['ember-bolt', 'cinder-wolf', 'tide-mend', 'grove-guardian', 'leaf-sprite'].map(makeCard);
    S.ai.hand = [makeCard('tide-minnow'), makeCard('stone-golem'), makeCard('ember-imp'), makeCard('lantern-light')];
    S.player.board = [makeCard('flame-drake'), makeCard('stone-golem')];
    S.player.board[0].canAttack = true; S.player.board[1].canAttack = false;
    S.ai.board = [makeCard('tide-serpent'), makeCard('thorn-bramble')];
    S.ai.board[0].canAttack = true;
    S.log = ['Turn 5: Rook just played Tide Serpent. Your move — the table is yours.'];
    S.phase = 'player';
  }
}

(function init() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) stageShot(shot);
  requestAnimationFrame(loop);
})();

function loop() {
  // Keep the deck counts the renderer prints in sync with the live piles.
  S.player.deckCount = S.player.deck.count;
  S.ai.deckCount = S.ai.deck.count;
  for (const f of S.floaters) { f.y -= 0.6; f.life--; }
  S.floaters = S.floaters.filter((f) => f.life > 0);
  for (const k of [S.player, S.ai]) {
    for (const c of k.board) {
      if (c.lunge) c.lunge = Math.max(0, c.lunge - 1);
    }
  }
  drawGame(ctx, S);
  requestAnimationFrame(loop);
}

// Exposed for automated play-testing in the browser.
window.__lantern = { state: S, startDuel, endPlayerTurn, playHandCard };
