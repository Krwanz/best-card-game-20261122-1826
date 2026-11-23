// All drawing for Lantern Duel: one canvas, flat warm colours, big readable
// cards. Layout is computed here and the clickable rectangles are written
// onto state.hit so main.js can answer mouse clicks.
import { SUITS } from './cards.js';

export const W = 1280;
export const H = 720;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// Draw one suit's shape: triangle (Flame), wave circle (Tide),
// diamond (Leaf), square (Stone). Colour AND shape carry the suit.
export function drawGlyph(ctx, suitKey, cx, cy, size, color) {
  const s = SUITS[suitKey];
  ctx.fillStyle = color || s.color;
  ctx.beginPath();
  if (s.glyph === 'triangle') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.9, cy + size * 0.7);
    ctx.lineTo(cx - size * 0.9, cy + size * 0.7);
  } else if (s.glyph === 'wave') {
    ctx.arc(cx, cy, size * 0.85, 0, Math.PI * 2);
  } else if (s.glyph === 'diamond') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.8, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.8, cy);
  } else {
    ctx.rect(cx - size * 0.8, cy - size * 0.8, size * 1.6, size * 1.6);
  }
  ctx.fill();
  if (s.glyph === 'wave') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.55, cy);
    ctx.quadraticCurveTo(cx - size * 0.25, cy - size * 0.4, cx, cy);
    ctx.quadraticCurveTo(cx + size * 0.25, cy + size * 0.4, cx + size * 0.55, cy);
    ctx.stroke();
  }
}

function drawCardBack(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#2c1e4d';
  ctx.fill();
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawGlyph(ctx, 'flame', x + w / 2, y + h / 2, 16, '#f2c14e');
}

function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const s = SUITS[card.suit];
  const lift = opts.lift || 0;
  const yy = y - lift;
  if (opts.glow) {
    ctx.save();
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 22;
    rr(ctx, x, yy, w, h, 10);
    ctx.fill();
    ctx.restore();
  }
  rr(ctx, x, yy, w, h, 10);
  ctx.fillStyle = opts.dim ? '#4a4260' : '#f7f1de';
  ctx.fill();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Suit band with glyph + name.
  ctx.fillStyle = s.color;
  ctx.fillRect(x + 3, yy + 3, w - 6, 26);
  drawGlyph(ctx, card.suit, x + 16, yy + 16, 9, '#ffffff');
  // Narrow board cards need a smaller suit label so STONE never clips
  // against the cost gem.
  text(ctx, s.name.toUpperCase(), x + 30, yy + 17, w < 100 ? 10 : 12, '#ffffff', 'left');
  // Cost gem.
  ctx.beginPath();
  ctx.arc(x + w - 18, yy + 16, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#2f7fe0';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, String(card.cost), x + w - 18, yy + 17, 15, '#ffffff');
  // Name and rules text.
  const small = h < 145; // board cards are shorter: keep text clear of the glyph
  text(ctx, card.name, x + w / 2, yy + 48, small ? 12 : 14, '#241a33');
  ctx.fillStyle = '#5a4a72';
  ctx.font = (small ? 11 : 12) + 'px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, card.text, x + w / 2, yy + (small ? 66 : 72), w - 16, 14);
  // Big suit glyph in the middle of the card — hand cards only, so it never
  // collides with the rules text on the shorter board cards.
  if (!small) drawGlyph(ctx, card.suit, x + w / 2, yy + h - 52, 18, s.color);
  if (card.kind === 'creature') {
    // Attack (left) and health (right) pips.
    ctx.beginPath();
    ctx.arc(x + 20, yy + h - 18, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#e8862e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, String(card.atk), x + 20, yy + h - 17, 15, '#ffffff');
    ctx.beginPath();
    ctx.arc(x + w - 20, yy + h - 18, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#c22e2e';
    ctx.fill();
    ctx.stroke();
    text(ctx, String(card.hp), x + w - 20, yy + h - 17, 15, '#ffffff');
  } else {
    text(ctx, 'SPELL', x + w / 2, yy + h - 18, 11, s.dark);
  }
  if (opts.targetable) {
    rr(ctx, x - 3, yy - 3, w + 6, h + 6, 12);
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function wrapText(ctx, str, cx, y, maxW, lineH) {
  const words = String(str).split(' ');
  const lines = [''];
  for (const word of words) {
    const test = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && lines[lines.length - 1]) lines.push(word);
    else lines[lines.length - 1] = test;
  }
  lines.forEach((line, i) => ctx.fillText(line, cx, y + i * lineH));
}

function drawPortrait(ctx, x, y, r, name, life, maxLife, mana, maxMana, active, isAi) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = isAi ? '#3a2a5e' : '#5e3a1a';
  ctx.fill();
  ctx.strokeStyle = active ? '#ffe066' : '#8a7aa8';
  ctx.lineWidth = active ? 4 : 2;
  ctx.stroke();
  // Lantern glyph: a little glowing lamp.
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(x, y - 6, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(x, y - 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(x - 9, y + 8, 18, 4);
  text(ctx, name, x, y + r + 16, 15, '#f2ead8');
  // Life bar.
  const bw = 150;
  const bx = x - bw / 2;
  const by = y + r + 32;
  ctx.fillStyle = '#241a33';
  rr(ctx, bx, by, bw, 18, 9);
  ctx.fill();
  ctx.fillStyle = life <= 10 ? '#e2483d' : '#4caf6d';
  const frac = Math.max(0, life / maxLife);
  if (frac > 0) { rr(ctx, bx + 2, by + 2, (bw - 4) * frac, 14, 7); ctx.fill(); }
  text(ctx, `LIFE ${life} / ${maxLife}`, x, by + 9, 12, '#ffffff');
  // Mana crystals.
  const my = by + 30;
  for (let i = 0; i < maxMana; i++) {
    const cx = x - ((maxMana - 1) * 13) + i * 26;
    ctx.beginPath();
    ctx.arc(cx, my, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? '#4db2ff' : '#3a3350';
    ctx.fill();
    ctx.strokeStyle = '#cfe8ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  text(ctx, `Mana ${mana}/${maxMana}`, x, my + 20, 11, '#9d8fc9');
}

function drawButton(ctx, x, y, w, h, label, enabled) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = enabled ? '#f2c14e' : '#4a4260';
  ctx.fill();
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 16, enabled ? '#241a33' : '#9d8fc9');
}

function drawTable(ctx, S) {
  // Felt table with a warm centre glow.
  const g = ctx.createRadialGradient(640, 360, 60, 640, 360, 700);
  g.addColorStop(0, '#2c2148');
  g.addColorStop(1, '#17102e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#3d2f63';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(640, 360, 560, 250, 0, 0, Math.PI * 2);
  ctx.stroke();

  const hit = (S.hit = { hand: [], board: [], aiBoard: [] });

  // AI portrait (top left) and player portrait (bottom left).
  drawPortrait(ctx, 90, 62, 34, 'ROOK (AI)', S.ai.life, S.ai.maxLife, S.ai.mana, S.ai.maxMana, S.phase === 'ai', true);
  drawPortrait(ctx, 90, 655, 34, 'YOU', S.player.life, S.player.maxLife, S.player.mana, S.player.maxMana, S.phase === 'player', false);
  hit.aiPortrait = { x: 56, y: 28, w: 68, h: 68 };
  hit.playerPortrait = { x: 56, y: 621, w: 68, h: 68 };

  // AI hand: face-down backs, top right.
  for (let i = 0; i < S.ai.hand.length; i++) {
    drawCardBack(ctx, 1080 + i * 26 - S.ai.hand.length * 13, 22, 52, 72);
  }
  text(ctx, `Rook's hand: ${S.ai.hand.length} cards · deck ${S.ai.deckCount}`, 1060, 118, 12, '#9d8fc9', 'right');
  text(ctx, `Your deck: ${S.player.deckCount} cards`, 220, 700, 12, '#9d8fc9', 'left');

  // Boards: AI row then player row, centred.
  const bw = 96, bh = 132;
  const rowX = (n) => 640 - (n * (bw + 12) - 12) / 2;
  S.ai.board.forEach((c, i) => {
    const x = rowX(S.ai.board.length) + i * (bw + 12);
    const y = 150;
    const lunge = c.lunge || 0;
    drawCard(ctx, c, x, y + lunge, bw, bh, { targetable: S.targetMode && S.phase === 'player' });
    hit.aiBoard.push({ x, y, w: bw, h: bh, uid: c.uid });
  });
  S.player.board.forEach((c, i) => {
    const x = rowX(S.player.board.length) + i * (bw + 12);
    const y = 372;
    const lunge = c.lunge || 0;
    const selected = S.selected && S.selected.kind === 'board' && S.selected.uid === c.uid;
    drawCard(ctx, c, x, y - lunge, bw, bh, {
      glow: selected ? '#ffe066' : (c.canAttack && S.phase === 'player' ? '#4caf6d' : null),
    });
    hit.board.push({ x, y, w: bw, h: bh, uid: c.uid });
  });
  text(ctx, 'ROOK’S TABLE', 640, 140, 12, '#9d8fc9');
  text(ctx, 'YOUR TABLE', 640, 362, 12, '#9d8fc9');

  // Middle band: turn banner + log line.
  const banner = S.phase === 'player' ? 'YOUR TURN — play cards, then attack' : 'ROOK’S TURN — watch its plan…';
  text(ctx, banner, 640, 320, 17, S.phase === 'player' ? '#ffe066' : '#c9b8ff');
  const lastLog = S.log[S.log.length - 1] || '';
  text(ctx, lastLog, 640, 344, 13, '#cfc4ea');

  // Player hand, fanned along the bottom.
  const hw = 112, hh = 152;
  const n = S.player.hand.length;
  const startX = 640 - (n * (hw + 10) - 10) / 2;
  S.player.hand.forEach((card, i) => {
    const x = startX + i * (hw + 10);
    const y = 540;
    const selected = S.selected && S.selected.kind === 'hand' && S.selected.index === i;
    const affordable = card.cost <= S.player.mana && S.phase === 'player';
    drawCard(ctx, card, x, y, hw, hh, {
      lift: selected ? 18 : (i === S.hoverHand ? 10 : 0),
      dim: !affordable,
      glow: selected ? '#ffe066' : null,
      targetable: false,
    });
    hit.hand.push({ x, y: y - (selected ? 18 : 0), w: hw, h: hh, index: i });
    text(ctx, String(i + 1), x + hw / 2, y + hh + 14, 11, '#9d8fc9');
  });

  // End Turn button, bottom right.
  drawButton(ctx, 1100, 620, 150, 52, S.phase === 'player' ? 'END TURN ⏎' : 'ROOK…', S.phase === 'player');
  hit.endTurn = { x: 1100, y: 620, w: 150, h: 52 };

  // Targeting hint.
  if (S.targetMode) {
    text(ctx, 'Choose a target: click a foe creature or Rook’s lantern', 640, 300, 14, '#ffe066');
  }

  // Floating damage numbers.
  for (const f of S.floaters) {
    const a = Math.max(0, Math.min(1, f.life / 40));
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y, 20, f.color);
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, S) {
  const g = ctx.createRadialGradient(640, 300, 40, 640, 360, 700);
  g.addColorStop(0, '#3a2a5e');
  g.addColorStop(1, '#120c24');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Lantern glow.
  ctx.save();
  ctx.shadowColor = '#f2c14e';
  ctx.shadowBlur = 60;
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(640, 190, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(640, 190, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(622, 238, 36, 8);

  text(ctx, 'LANTERN DUEL', 640, 320, 64, '#f2ead8');
  text(ctx, 'A duel of lantern-keepers — outwit Rook, the rival keeper, card by card.', 640, 372, 18, '#cfc4ea');
  text(ctx, 'Both keepers start at 30 life. Spend mana, play creatures and spells,', 640, 404, 15, '#9d8fc9');
  text(ctx, 'attack with your creatures, and snuff out Rook’s lantern first.', 640, 426, 15, '#9d8fc9');

  // Suit legend: colour AND shape.
  const suits = ['flame', 'tide', 'leaf', 'stone'];
  suits.forEach((key, i) => {
    const x = 640 - 270 + i * 180;
    drawGlyph(ctx, key, x, 480, 16, SUITS[key].color);
    text(ctx, SUITS[key].name, x, 512, 14, '#f2ead8');
  });
  text(ctx, 'Suits are told apart by colour and shape — never by text alone.', 640, 542, 13, '#9d8fc9');

  drawButton(ctx, 540, 580, 200, 56, '▶  PLAY', true);
  S.hit = { start: { x: 540, y: 580, w: 200, h: 56 } };
  text(ctx, 'Mouse: click cards · Keys: 1–7 play · Space ends turn · Esc title', 640, 668, 13, '#9d8fc9');
}

function drawEnd(ctx, S, won) {
  const g = ctx.createRadialGradient(640, 360, 40, 640, 360, 700);
  g.addColorStop(0, won ? '#4d3a10' : '#2a1030');
  g.addColorStop(1, '#120c24');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Lanterns: bright row on a win, dim row on a loss.
  for (let i = 0; i < 7; i++) {
    const x = 340 + i * 100;
    ctx.save();
    if (won) { ctx.shadowColor = '#f2c14e'; ctx.shadowBlur = 30; }
    ctx.globalAlpha = won ? 1 : 0.35;
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(x, 180, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  text(ctx, won ? 'VICTORY!' : 'DEFEAT', 640, 300, 64, won ? '#ffe066' : '#c9a0c9');
  text(ctx, won ? 'Your lantern burns brightest — Rook’s flame is out.' : 'Your lantern goes dark — Rook keeps the light.', 640, 356, 18, '#cfc4ea');
  text(ctx, `Duel lasted ${S.turns} turns · you played ${S.cardsPlayed} cards · final life ${S.player.life} – ${S.ai.life}`, 640, 396, 15, '#9d8fc9');
  drawButton(ctx, 540, 460, 200, 56, '↻  PLAY AGAIN', true);
  S.hit = { start: { x: 540, y: 460, w: 200, h: 56 } };
  text(ctx, 'Press Enter or click to play again · Esc returns to the title', 640, 560, 13, '#9d8fc9');
}

export function drawGame(ctx, S) {
  ctx.clearRect(0, 0, W, H);
  if (S.screen === 'title') drawTitle(ctx, S);
  else if (S.screen === 'win') drawEnd(ctx, S, true);
  else if (S.screen === 'loss') drawEnd(ctx, S, false);
  else drawTable(ctx, S);
}
