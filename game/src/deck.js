// Deck: a shuffled pile of card ids with draw and count helpers.
import { buildDeck, makeCard } from './cards.js';

export class Deck {
  constructor() {
    this.pile = buildDeck();
    // Fisher-Yates shuffle.
    for (let i = this.pile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.pile[i], this.pile[j]] = [this.pile[j], this.pile[i]];
    }
  }

  // Draw up to n live cards; returns fewer when the pile runs out.
  draw(n) {
    const out = [];
    for (let i = 0; i < n && this.pile.length > 0; i++) {
      out.push(makeCard(this.pile.pop()));
    }
    return out;
  }

  get count() { return this.pile.length; }
}
