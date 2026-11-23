// Tiny synthesized sounds: WebAudio oscillator bleeps, no audio files.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  unlock() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // One short tone: frequency in Hz, length in seconds, wave shape, gain.
  tone(freq, dur, type = 'sine', vol = 0.08) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  click() { this.tone(660, 0.06, 'triangle', 0.05); }
  playCard() { this.tone(392, 0.09, 'triangle', 0.09); this.tone(523, 0.12, 'triangle', 0.07); }
  attack() { this.tone(180, 0.14, 'sawtooth', 0.08); }
  hurt() { this.tone(110, 0.2, 'sawtooth', 0.09); }
  heal() { this.tone(523, 0.15, 'sine', 0.07); this.tone(784, 0.2, 'sine', 0.06); }
  draw() { this.tone(880, 0.05, 'sine', 0.04); }
  turn() { this.tone(440, 0.08, 'triangle', 0.06); }
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.09), i * 110)); }
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'sine', 0.08), i * 130)); }
}
