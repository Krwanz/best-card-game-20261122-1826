// Card definitions for Lantern Duel: every card belongs to one of four suits.
// A suit is told apart by BOTH a colour and a drawn shape, never by text alone:
//   Flame = ember red + triangle, Tide = deep blue + wave circle,
//   Leaf  = moss green + diamond, Stone = warm grey + square.
export const SUITS = {
  flame: { name: 'Flame', color: '#e2483d', dark: '#8f1d16', light: '#ffb199', glyph: 'triangle' },
  tide:  { name: 'Tide',  color: '#2f7fe0', dark: '#144a8f', light: '#a8d2ff', glyph: 'wave' },
  leaf:  { name: 'Leaf',  color: '#3fae5a', dark: '#1d6b33', light: '#b5ecc4', glyph: 'diamond' },
  stone: { name: 'Stone', color: '#9a8f7a', dark: '#5c5344', light: '#e3dccb', glyph: 'square' },
};

// kind: 'creature' (stays on the table, attacks) or 'spell' (one-shot effect).
// effect (creatures): 'draw1' draws a card when played. (spells): 'bolt3',
// 'heal6', 'draw2', 'quake2' — see applySpell in main.js.
export const CARD_DEFS = [
  { id: 'ember-imp',      name: 'Ember Imp',      suit: 'flame', kind: 'creature', cost: 1, atk: 2, hp: 1, text: 'Quick spark.' },
  { id: 'cinder-wolf',    name: 'Cinder Wolf',    suit: 'flame', kind: 'creature', cost: 2, atk: 3, hp: 2, text: 'Runs hot.' },
  { id: 'flame-drake',    name: 'Flame Drake',    suit: 'flame', kind: 'creature', cost: 4, atk: 5, hp: 4, text: 'Breathes dawn.' },
  { id: 'tide-minnow',    name: 'Tide Minnow',    suit: 'tide',  kind: 'creature', cost: 1, atk: 1, hp: 2, text: 'Small, slippery.' },
  { id: 'deep-turtle',    name: 'Deep Turtle',    suit: 'tide',  kind: 'creature', cost: 2, atk: 1, hp: 5, text: 'A living wall.' },
  { id: 'tide-serpent',   name: 'Tide Serpent',   suit: 'tide',  kind: 'creature', cost: 3, atk: 4, hp: 3, text: 'Coils and bites.' },
  { id: 'leaf-sprite',    name: 'Leaf Sprite',    suit: 'leaf',  kind: 'creature', cost: 1, atk: 1, hp: 1, text: 'Draw a card.', effect: 'draw1' },
  { id: 'thorn-bramble',  name: 'Thorn Bramble',  suit: 'leaf',  kind: 'creature', cost: 2, atk: 2, hp: 3, text: 'Prickly guard.' },
  { id: 'grove-guardian', name: 'Grove Guardian', suit: 'leaf',  kind: 'creature', cost: 4, atk: 3, hp: 6, text: 'Roots hold fast.' },
  { id: 'pebble-pup',     name: 'Pebble Pup',     suit: 'stone', kind: 'creature', cost: 1, atk: 2, hp: 2, text: 'Loyal rubble.' },
  { id: 'stone-golem',    name: 'Stone Golem',    suit: 'stone', kind: 'creature', cost: 3, atk: 2, hp: 6, text: 'Patient stone.' },
  { id: 'granite-colossus', name: 'Granite Colossus', suit: 'stone', kind: 'creature', cost: 5, atk: 6, hp: 6, text: 'The mountain walks.' },
  { id: 'ember-bolt',     name: 'Ember Bolt',     suit: 'flame', kind: 'spell', cost: 2, text: 'Deal 3 damage.', effect: 'bolt3' },
  { id: 'tide-mend',      name: 'Tide Mend',      suit: 'tide',  kind: 'spell', cost: 2, text: 'Restore 6 life.', effect: 'heal6' },
  { id: 'lantern-light',  name: 'Lantern Light',  suit: 'leaf',  kind: 'spell', cost: 2, text: 'Draw 2 cards.', effect: 'draw2' },
  { id: 'quake-slam',     name: 'Quake Slam',     suit: 'stone', kind: 'spell', cost: 3, text: 'Deal 2 to all foes.', effect: 'quake2' },
];

export function cardDef(id) {
  return CARD_DEFS.find((d) => d.id === id);
}

// A fresh 30-card deck: two copies of every definition, minus one cheap
// creature of each of two suits so the count lands exactly on 30.
export function buildDeck() {
  const ids = [];
  for (const d of CARD_DEFS) { ids.push(d.id, d.id); }
  ids.splice(ids.indexOf('ember-imp'), 1);
  ids.splice(ids.indexOf('pebble-pup'), 1);
  return ids;
}

// A live card on the table or in a hand: an instance of a definition.
let nextUid = 1;
export function makeCard(defId) {
  const d = cardDef(defId);
  return {
    uid: nextUid++,
    defId: d.id, name: d.name, suit: d.suit, kind: d.kind,
    cost: d.cost, atk: d.atk || 0, hp: d.hp || 0, maxHp: d.hp || 0,
    text: d.text, effect: d.effect || null,
    canAttack: false, // creatures cannot attack the turn they are played
    x: 0, y: 0, // animated position, set by the renderer
  };
}
