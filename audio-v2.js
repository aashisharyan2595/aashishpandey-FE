// Generative, royalty-free radio: every sound is synthesized live.
export const TRACKS = [
  { id: 'evening', name: 'Evening Improvisation', desc: 'ethera · gentle piano' },
  { id: 'flyaway', name: 'Fly Away', desc: 'fog settled · calm strings' },
  { id: 'celtic', name: 'Celtic Forest', desc: 'mystical · forest ambience' }
];

const MP3 = { evening: 'assets/evening-improvisation.mp3', flyaway: 'assets/fly-away.mp3', celtic: 'assets/celtic-forest.mp3' };
// Each track's silent/near-silent lead-in, so playback starts already audible instead of into dead air
const START_OFFSET = { evening: 8, flyaway: 6.5, celtic: 0 };

export class Radio {
  constructor() { this.ctx = null; this.cur = null; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(ctx.destination);
    this.rev = ctx.createConvolver(); this.rev.buffer = this.impulse(4.5, 2.4); this.rev.connect(this.master);
    this.uiBus = ctx.createGain(); this.uiBus.gain.value = 0.22; this.uiBus.connect(this.master);
    const len = ctx.sampleRate * 2; this.noise = ctx.createBuffer(1, len, ctx.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  impulse(sec, decay) { const ctx = this.ctx, r = ctx.sampleRate, len = r * sec, b = ctx.createBuffer(2, len, r); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; }
  bus(wetAmt = 0.8) { const ctx = this.ctx, g = ctx.createGain(), now = ctx.currentTime; g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 2.5);
    const dry = ctx.createGain(); dry.gain.value = 0.6; const wet = ctx.createGain(); wet.gain.value = wetAmt; g.connect(dry); dry.connect(this.master); g.connect(wet); wet.connect(this.rev); return g; }
  play(id) {
    this.init(); this.stop();
    if (MP3[id]) { this.playFile(MP3[id], START_OFFSET[id] || 0); return; }
    const s = { alive: true, nodes: [], bus: this.bus(id === 'lofi' ? 0.35 : 0.85) }; this.cur = s;
    const g = GENS[id] || GENS.forest; g(this, s);
  }
  playFile(url, offset = 0) {
    this.init(); this.stop();
    const el = new Audio(url); el.loop = false; el.crossOrigin = 'anonymous';
    const seekAndPlay = () => { try { el.currentTime = offset; } catch (e) {} el.play().catch(() => {}); };
    if (el.readyState >= 1) seekAndPlay(); else el.addEventListener('loadedmetadata', seekAndPlay, { once: true });
    el.addEventListener('ended', seekAndPlay);
    const s = { alive: true, nodes: [], bus: this.bus(0.15), el }; const src = this.ctx.createMediaElementSource(el); src.connect(s.bus); this.cur = s;
  }
  stop() { const s = this.cur; if (!s) return; s.alive = false; const t = this.ctx.currentTime; s.bus.gain.cancelScheduledValues(t); s.bus.gain.setValueAtTime(s.bus.gain.value, t); s.bus.gain.linearRampToValueAtTime(0, t + 1.2);
    setTimeout(() => { s.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); if (s.el) s.el.pause(); s.bus.disconnect(); }, 1400); this.cur = null; }
  brakeSfx() { if (!this.ctx || this.brakeMuted) return; const ctx = this.ctx, t = ctx.currentTime, n = ctx.createBufferSource(); n.buffer = this.noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(600, t + 0.25); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); n.connect(f); f.connect(g); g.connect(this.uiBus); n.start(t); n.stop(t + 0.32); }
  setBrakeMuted(v) { this.brakeMuted = !!v; }
  blip(f = 880, dur = 0.12) { if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.uiBus); o.start(t); o.stop(t + dur + 0.02); }
}

// helpers
function loop(s, min, max, fn) { const tick = () => { if (!s.alive) return; fn(); setTimeout(tick, min + Math.random() * (max - min)); }; setTimeout(tick, 200); }
function pad(r, s, freqs, type = 'sawtooth', cutoff = 700, gain = 0.035) {
  const ctx = r.ctx, f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.6;
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = cutoff * 0.35; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); s.nodes.push(lfo);
  const g = ctx.createGain(); g.gain.value = gain; f.connect(g); g.connect(s.bus);
  freqs.forEach(fr => [-6, 6].forEach(dt => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = dt + Math.random() * 3; o.connect(f); o.start(); s.nodes.push(o); }));
  return g;
}
function tone(r, s, f, { type = 'sine', dur = 2, gain = 0.06, attack = 0.005, pan = 0, when = 0, dest } = {}) {
  const ctx = r.ctx, t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
  o.type = type; o.frequency.value = f; p.pan.value = pan; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(p); p.connect(dest || s.bus); o.start(t); o.stop(t + dur + 0.05); return o;
}
function bell(r, s, f, gain = 0.05, pan = 0) { tone(r, s, f, { dur: 3.2, gain, pan }); tone(r, s, f * 2.76, { dur: 1.2, gain: gain * 0.3, pan }); tone(r, s, f * 5.4, { dur: 0.5, gain: gain * 0.12, pan }); }
function noise(r, s, type, freq, gain) { const ctx = r.ctx, n = ctx.createBufferSource(); n.buffer = r.noise; n.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = ctx.createGain(); g.gain.value = gain; n.connect(f); f.connect(g); g.connect(s.bus); n.start(); s.nodes.push(n); return g; }
function chirp(r, s) { const ctx = r.ctx, pan = Math.random() * 1.6 - 0.8, base = 2200 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 4);
  for (let k = 0; k < n; k++) { const t = ctx.currentTime + k * 0.11, o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t + 0.07); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.018, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(g); g.connect(p); p.connect(s.bus); o.start(t); o.stop(t + 0.12); } }
function kick(r, s, when = 0, gain = 0.35) { const ctx = r.ctx, t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.25); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(r.master); o.start(t); o.stop(t + 0.45); }
function tick(r, s, when = 0, gain = 0.02, freq = 7000, dur = 0.04) { const ctx = r.ctx, t = ctx.currentTime + when, n = ctx.createBufferSource(); n.buffer = r.noise; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq; const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(f); f.connect(g); g.connect(s.bus); n.start(t, Math.random()); n.stop(t + dur + 0.02); }

const GENS = {
  forest(r, s) { pad(r, s, [146.8, 220, 277.2, 329.6], 'triangle', 650, 0.03); loop(s, 1500, 5200, () => chirp(r, s)); noise(r, s, 'bandpass', 900, 0.01); },
  lake(r, s) { pad(r, s, [164.8, 246.9, 329.6], 'triangle', 900, 0.04); const sc = [659.3, 740, 830.6, 987.8, 1108.7, 1318.5]; loop(s, 900, 2600, () => bell(r, s, sc[Math.floor(Math.random() * sc.length)] / (Math.random() < 0.4 ? 2 : 1), 0.045, Math.random() * 1.2 - 0.6)); },
  ride(r, s) { pad(r, s, [174.6, 220, 261.6, 329.6], 'triangle', 700, 0.032); const ar = [261.6, 329.6, 392, 440]; let i = 0; loop(s, 1900, 2800, () => bell(r, s, ar[(i++) % ar.length], 0.032, Math.sin(i) * 0.5)); },
  rain(r, s) { noise(r, s, 'lowpass', 1100, 0.11); noise(r, s, 'highpass', 5000, 0.018); pad(r, s, [130.8, 196, 261.6], 'sine', 800, 0.035); loop(s, 50, 260, () => tone(r, s, 1500 + Math.random() * 2600, { dur: 0.06, gain: 0.008, pan: Math.random() * 2 - 1 })); },
  lofi(r, s) { const ch = [[174.6, 220, 261.6, 329.6], [164.8, 196, 246.9, 293.7], [146.8, 174.6, 220, 261.6], [130.8, 164.8, 196, 246.9]]; let i = 0; const f = r.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200; f.connect(s.bus);
    loop(s, 2600, 2600, () => { const c = ch[(i++) % 4]; c.forEach((n, k) => { tone(r, s, n, { dur: 2.6, gain: 0.032, attack: 0.02, when: k * 0.02, dest: f }); tone(r, s, n * 2, { type: 'triangle', dur: 1, gain: 0.006, when: k * 0.02, dest: f }); }); tone(r, s, c[0] / 2, { type: 'sine', dur: 2.4, gain: 0.05, dest: f }); });
    loop(s, 400, 900, () => tick(r, s, 0, 0.008 * Math.random(), 3200, 0.01)); },
  drone(r, s) { pad(r, s, [55, 82.4, 110, 164.8], 'sine', 600, 0.07); pad(r, s, [220, 329.6], 'triangle', 500, 0.012); const sh = [1318.5, 1760, 1975.5, 2637]; loop(s, 2500, 5500, () => tone(r, s, sh[Math.floor(Math.random() * 4)], { dur: 6, gain: 0.012, attack: 2, pan: Math.random() * 1.6 - 0.8 })); }
};

// Adaptive score: layers crossfade with story progress, plus engine / gravel / fire foley
const cl = (v, x, y) => Math.max(x, Math.min(y, v)), ss = (e0, e1, v) => { const x = cl((v - e0) / (e1 - e0), 0, 1); return x * x * (3 - 2 * x); };
export class Score {
  constructor(radio) { this.r = radio; this.on = false; this.mute = { nature: 1, fire: 1 }; }
  setMute(cat, on) { this.mute[cat] = on ? 1 : 0; if (this.on) this.update(this.last || { t: 0, speed: 0, trail: 0 }); }
  start() {
    const r = this.r; r.init(); if (this.on) return; this.on = true; const ctx = r.ctx;
    const s = this.s = { alive: true, nodes: [], bus: r.bus(0.7) }; const L = this.L = {};
    const sub = name => { const g = ctx.createGain(); g.gain.value = 0; g.connect(s.bus); L[name] = g; const o = Object.create(s); o.bus = g; return o; };
    pad(r, sub('hwyPad'), [146.8, 220, 277.2, 329.6], 'triangle', 550, 0.028);
    GENS.ride(r, sub('hwyPulse'));
    pad(r, sub('thin'), [110, 164.8], 'sine', 500, 0.05);
    GENS.forest(r, sub('forest'));
    { const o = sub('insects'); const g = noise(r, o, 'bandpass', 4300, 0.02); const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 17; lg.gain.value = 0.018; lfo.connect(lg); lg.connect(g.gain); lfo.start(); s.nodes.push(lfo); }
    GENS.lake(r, sub('lake'));
    { const o = sub('fire'); noise(r, o, 'lowpass', 500, 0.05); loop(o, 30, 190, () => tick(r, o, 0, 0.05 * Math.random(), 900 + Math.random() * 2500, 0.012)); }
    { const o = sub('ambientWind'); noise(r, o, 'highpass', 2400, 0.035); }
    this.update(this.last || { t: 0, speed: 0, trail: 0 });
  }
  update(p) {
    this.last = p; if (!this.on) return; const { t, speed, trail, water } = p, now = this.r.ctx.currentTime, sp = cl(speed / 20, 0, 1), L = this.L;
    const bump = (a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
    const gust = 1 + 0.25 * Math.sin(now * 0.4) + 0.12 * Math.sin(now * 1.3), ambGust = 0.5 + 0.35 * Math.sin(now * 0.17) + 0.2 * Math.sin(now * 0.41 + 1);
    const nm = this.mute.nature, fm = this.mute.fire;
    const w = { hwyPad: 0, hwyPulse: 0, thin: bump(0.43, 0.48, 0.53, 0.58) * nm, forest: Math.max(bump(0.53, 0.6, 0.84, 0.9), trail * 0.5) * nm, insects: Math.max(bump(0.56, 0.66, 0.93, 0.98) * 0.8, trail * 0.35) * nm, lake: Math.max(bump(0.82, 0.86, 0.9, 0.94), (water || 0) * 0.9) * nm, fire: ss(0.92, 0.985, t) * fm,
      ambientWind: cl(ambGust, 0.15, 1) * 0.7 * nm };
    for (const k in w) L[k].gain.setTargetAtTime(w[k], now, 0.6);
  }
  stop() { if (!this.on) return; this.on = false; const s = this.s, t = this.r.ctx.currentTime; s.alive = false; s.bus.gain.cancelScheduledValues(t); s.bus.gain.setValueAtTime(s.bus.gain.value, t); s.bus.gain.linearRampToValueAtTime(0, t + 1.2); setTimeout(() => { s.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); s.bus.disconnect(); }, 1400); }
}
