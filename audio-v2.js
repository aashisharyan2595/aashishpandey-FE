// Generative, royalty-free radio: every sound is synthesized live.

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
    const s = { alive: true, nodes: [], bus: this.bus(id === 'lofi' ? 0.35 : 0.85) }; this.cur = s;
    const g = GENS[id] || GENS.forest; g(this, s);
  }
  stop() { const s = this.cur; if (!s) return; s.alive = false; const t = this.ctx.currentTime; s.bus.gain.cancelScheduledValues(t); s.bus.gain.setValueAtTime(s.bus.gain.value, t); s.bus.gain.linearRampToValueAtTime(0, t + 1.2);
    setTimeout(() => { s.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); if (s.el) s.el.pause(); s.bus.disconnect(); }, 1400); this.cur = null; }
  brakeSfx() { if (!this.ctx || this.brakeMuted) return; const ctx = this.ctx, t = ctx.currentTime, n = ctx.createBufferSource(); n.buffer = this.noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(600, t + 0.25); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); n.connect(f); f.connect(g); g.connect(this.uiBus); n.start(t); n.stop(t + 0.32); }
  setBrakeMuted(v) { this.brakeMuted = !!v; }
  blip(f = 880, dur = 0.12) { if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.uiBus); o.start(t); o.stop(t + dur + 0.02); }
  // Distinct call-whistle — a bright ascending ocarina-like trill, cuts clearly through the ambient score
  hornCall() { this.init(); const ctx = this.ctx, t = ctx.currentTime, g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.connect(this.rev); const dry = ctx.createGain(); dry.gain.value = 0.55; g.connect(dry); dry.connect(this.master);
    [[587.33, 0], [739.99, 0.13], [880, 0.26]].forEach(([f, when]) => { const t0 = t + when;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.97, t0); o.frequency.exponentialRampToValueAtTime(f, t0 + 0.05);
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 6.5; const lg = ctx.createGain(); lg.gain.value = f * 0.01; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t0); lfo.stop(t0 + 0.4);
      const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.9, t0 + 0.04); og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      o.connect(og); og.connect(g); o.start(t0); o.stop(t0 + 0.36); });
    g.gain.setValueAtTime(0.42, t); g.gain.setValueAtTime(0.42, t + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85); }
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
function scoreBed(r, s, keyState) {
  const base = [[130.81, 164.81, 196, 246.94], [146.83, 174.61, 220, 261.63], [164.81, 196, 246.94, 293.66], [174.61, 220, 261.63, 329.63], [196, 246.94, 293.66, 349.23], [110, 146.83, 174.61, 220]];
  const keySteps = [0, 3, -2, 5, -5, 2];
  const semi = n => Math.pow(2, n / 12);
  let ci = 0, cycle = 0;
  const playChord = () => { if (ci % base.length === 0 && ci !== 0) { cycle++; keyState.ratio = semi(keySteps[cycle % keySteps.length]); }
    const c = base[ci % base.length].map(f => f * keyState.ratio); ci++;
    c.forEach((f, i) => tone(r, s, f, { type: i === 0 ? 'sine' : 'triangle', dur: 9.5, gain: i === 0 ? 0.05 : 0.024, attack: 2, pan: (i - 1.5) * 0.16 }));
    tone(r, s, c[0] / 2, { type: 'sine', dur: 9.5, gain: 0.055, attack: 2.4, pan: 0 }); };
  const tick = () => { if (!s.alive) return; playChord(); setTimeout(tick, 9000); }; tick();
}
function fluteNote(r, s, f, dur, gain, pan) {
  const ctx = r.ctx, t = ctx.currentTime, g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan;
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, t);
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 5.1 + Math.random(); const lg = ctx.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.2);
  const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2.003; const g2 = ctx.createGain(); g2.gain.value = 0.16; o2.connect(g2); g2.connect(g);
  const n = ctx.createBufferSource(); n.buffer = r.noise; n.loop = true; const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = f * 1.4; nf.Q.value = 1.6; const ng = ctx.createGain(); ng.gain.value = 0.01; n.connect(nf); nf.connect(ng); ng.connect(g);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.2); g.gain.setValueAtTime(gain, t + dur - 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(p); p.connect(s.bus); o.start(t); o.stop(t + dur + 0.1); o2.start(t); o2.stop(t + dur + 0.1); n.start(t); n.stop(t + dur + 0.1);
  s.nodes.push(o, o2, n, lfo);
}
function fluteMelody(r, s, keyState) {
  const scale = [587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  const play = () => { if (!s.alive) return; const len = 3 + Math.floor(Math.random() * 4); let idx = 2 + Math.floor(Math.random() * 3), k = 0;
    const seq = () => { if (!s.alive) return; fluteNote(r, s, scale[idx] * keyState.ratio, 1.4 + Math.random() * 0.9, 0.042, (Math.random() - 0.5) * 1.3);
      idx = Math.max(0, Math.min(scale.length - 1, idx + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.75 ? 1 : 2))); k++;
      if (k < len) setTimeout(seq, 950 + Math.random() * 550); };
    seq(); setTimeout(play, 8500 + Math.random() * 7000); };
  setTimeout(play, 2500 + Math.random() * 2000);
}
function handpanNote(r, s, f, pan) {
  const ctx = r.ctx, t = ctx.currentTime, g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(s.bus);
  [1, 2.01, 3.01, 4.16].forEach((ratio, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * ratio; const og = ctx.createGain(); const amt = [0.065, 0.03, 0.017, 0.009][i];
    og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(amt, t + 0.006); og.gain.exponentialRampToValueAtTime(0.0001, t + (2.4 - i * 0.3));
    o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.5); s.nodes.push(o); });
}
function handpanLoop(r, s, keyState) {
  const notes = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392];
  loop(s, 4200, 9500, () => handpanNote(r, s, notes[Math.floor(Math.random() * notes.length)] * keyState.ratio, (Math.random() - 0.5) * 1.4));
}
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

// Adaptive score v3 — calm, serene, a little magical. Everything is synthesized live.
// Harmony: D major / lydian colour. Slow chords breathe under a dark hall reverb; celesta sparkles
// drift through a ping-pong delay; a breathy flute sings now and then; glassy harmonics bloom in the forest.
const cl = (v, x, y) => Math.max(x, Math.min(y, v)), ss = (e0, e1, v) => { const x = cl((v - e0) / (e1 - e0), 0, 1); return x * x * (3 - 2 * x); };
const CHORDS = [
  [146.83, 220, 369.99, 554.37, 659.25],  // Dmaj9
  [123.47, 185, 293.66, 329.63, 440],     // Bm11
  [98, 146.83, 246.94, 369.99, 554.37],   // Gmaj7#11
  [110, 164.81, 246.94, 293.66, 329.63],  // Asus
  [82.41, 123.47, 196, 293.66, 369.99],   // Em9
  [98, 146.83, 246.94, 369.99, 493.88]];  // Gmaj9
const PENTA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98, 1760];
const MID = [440, 493.88, 587.33, 659.25, 739.99, 880];
const LOW = [293.66, 329.63, 369.99, 440, 493.88, 587.33];
function darkImpulse(ctx, sec, decay) { const r = ctx.sampleRate, len = Math.floor(r * sec), b = ctx.createBuffer(2, len, r);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let y = 0; for (let i = 0; i < len; i++) { const k = i / len, a = 0.2 + 0.72 * k; y = y * a + (Math.random() * 2 - 1) * (1 - a); d[i] = y * Math.pow(1 - k, decay) * (i < r * 0.03 ? i / (r * 0.03) : 1); } } return b; }
function padVoice(r, o, f, { dur = 18, attack = 5, release = 7, gain = 0.02, pan = 0, pure = false } = {}) {
  const ctx = r.ctx, t = ctx.currentTime, g = ctx.createGain(), p = ctx.createStereoPanner(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = Math.min(3800, f * 3); lp.Q.value = 0.2; p.pan.value = pan;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.setValueAtTime(gain, t + dur - release); g.gain.linearRampToValueAtTime(0, t + dur);
  const a = ctx.createOscillator(); a.type = 'sine'; a.frequency.value = f;
  const b = ctx.createOscillator(); b.type = pure ? 'sine' : 'triangle'; b.frequency.value = f * (pure ? 2 : 1); b.detune.value = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 5);
  const bg = ctx.createGain(); bg.gain.value = pure ? 0.12 : 0.4;
  const vib = ctx.createOscillator(); vib.frequency.value = 0.12 + Math.random() * 0.2; const vg = ctx.createGain(); vg.gain.value = 4; vib.connect(vg); vg.connect(a.detune); vg.connect(b.detune);
  a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(p); p.connect(o.bus);
  [a, b, vib].forEach(n => { n.start(t); n.stop(t + dur + 0.1); });
}
function celesta(r, o, f, gain = 0.03, pan = 0, send = null, when = 0) {
  const ctx = r.ctx, t = ctx.currentTime + when, p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(o.bus); if (send) { const sg = ctx.createGain(); sg.gain.value = 0.7; p.connect(sg); sg.connect(send); }
  [[1, 1, 3.8], [2, 0.26, 1.6], [3.01, 0.07, 0.7], [4.2, 0.035, 0.35]].forEach(([m, a, d]) => { const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = f * m; const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * a, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d); os.connect(g); g.connect(p); os.start(t); os.stop(t + d + 0.05); });
}
function softFlute(r, o, f, dur, gain, pan) {
  const ctx = r.ctx, t = ctx.currentTime, g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan;
  const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(f * 0.992, t); os.frequency.exponentialRampToValueAtTime(f, t + 0.25);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 4.6 + Math.random() * 0.6; const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.005, t + dur * 0.6); lfo.connect(lg); lg.connect(os.frequency);
  const n = ctx.createBufferSource(); n.buffer = r.noise; n.loop = true; const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = f * 1.5; nf.Q.value = 2; const ng = ctx.createGain(); ng.gain.value = 0.012; n.connect(nf); nf.connect(ng); ng.connect(g);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.45); g.gain.setValueAtTime(gain, t + dur - 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  os.connect(g); g.connect(p); p.connect(o.bus); [os, lfo, n].forEach(x => { x.start(t); x.stop(t + dur + 0.1); });
}
function kalimba(r, o, f, pan, send) {
  const ctx = r.ctx, t = ctx.currentTime, g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(o.bus); if (send) p.connect(send);
  [[1, 0.06, 2.6], [2.01, 0.02, 1.4], [5.4, 0.006, 0.3]].forEach(([m, a, d]) => { const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = f * m; const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(a, t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + d); os.connect(og); og.connect(g); os.start(t); os.stop(t + d + 0.05); });
}
function chirpS(r, o) { const ctx = r.ctx, pan = Math.random() * 1.6 - 0.8, base = 2400 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 3);
  for (let k = 0; k < n; k++) { const t = ctx.currentTime + k * 0.12, os = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan; os.frequency.setValueAtTime(base, t); os.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t + 0.08); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); os.connect(g); g.connect(p); p.connect(o.bus); os.start(t); os.stop(t + 0.13); } }

export class Score {
  constructor(radio) { this.r = radio; this.on = false; this.mute = { nature: 1, fire: 1 }; this.dens = 0.4; }
  setMute(cat, on) { this.mute[cat] = on ? 1 : 0; if (this.on) this.update(this.last || { t: 0, speed: 0, trail: 0 }); }
  start() {
    const r = this.r; r.init(); if (this.on) return; this.on = true; const ctx = r.ctx, now = ctx.currentTime;
    const out = ctx.createGain(); out.gain.setValueAtTime(0, now); out.gain.linearRampToValueAtTime(1, now + 5);
    const rev = ctx.createConvolver(); rev.buffer = darkImpulse(ctx, 8, 2.1); const revLP = ctx.createBiquadFilter(); revLP.type = 'lowpass'; revLP.frequency.value = 4000;
    const wet = ctx.createGain(); wet.gain.value = 1.0; const dry = ctx.createGain(); dry.gain.value = 0.5; const final = ctx.createGain(); final.gain.value = 0.9;
    out.connect(dry); dry.connect(final); out.connect(wet); wet.connect(rev); rev.connect(revLP); revLP.connect(final); final.connect(r.master);
    const dIn = ctx.createGain(), dA = ctx.createDelay(2), dB = ctx.createDelay(2), fb = ctx.createGain(), dLP = ctx.createBiquadFilter(), pA = ctx.createStereoPanner(), pB = ctx.createStereoPanner(), dOut = ctx.createGain();
    dA.delayTime.value = 0.46; dB.delayTime.value = 0.69; fb.gain.value = 0.4; dLP.type = 'lowpass'; dLP.frequency.value = 2400; pA.pan.value = -0.75; pB.pan.value = 0.75; dOut.gain.value = 0.55;
    dIn.connect(dA); dA.connect(pA); pA.connect(dOut); dA.connect(dB); dB.connect(pB); pB.connect(dOut); dB.connect(dLP); dLP.connect(fb); fb.connect(dA); dOut.connect(out);
    const s = this.s = { alive: true, nodes: [], bus: out, final }; const L = this.L = {}; this.send = dIn;
    const sub = name => { const g = ctx.createGain(); g.gain.value = 0; g.connect(out); L[name] = g; const o = Object.create(s); o.bus = g; return o; };
    const loopS = (min, max, fn, first = 400) => { const tick = () => { if (!s.alive) return; fn(); setTimeout(tick, min + Math.random() * (max - min)); }; setTimeout(tick, first); };
    // chords + shimmer
    { const po = sub('pad'), sh = sub('shimmer'); let ci = 0;
      const chord = () => { if (!s.alive) return; const c = CHORDS[ci++ % CHORDS.length];
        c.forEach((f, k) => padVoice(r, po, f, { gain: k === 0 ? 0.03 : 0.017, pan: (k - 2) * 0.22, attack: 4.5 + Math.random() * 1.5 }));
        c.slice(-2).forEach((f, k) => padVoice(r, sh, f * 2, { gain: 0.006, pan: k ? 0.5 : -0.5, attack: 7, release: 8, pure: true }));
        setTimeout(chord, 14000); };
      chord(); }
    // low drone that breathes
    { const o = sub('drone'); [73.42, 110].forEach((f, k) => { const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = f; const g = ctx.createGain(); g.gain.value = k ? 0.012 : 0.028;
        const l = ctx.createOscillator(); l.frequency.value = 0.05 + k * 0.03; const lg = ctx.createGain(); lg.gain.value = g.gain.value * 0.5; l.connect(lg); lg.connect(g.gain); os.connect(g); g.connect(o.bus); os.start(); l.start(); s.nodes.push(os, l); }); }
    // celesta sparkles
    { const o = sub('twinkle'); loopS(1800, 5200, () => { if (Math.random() > this.dens) return; const n = Math.random() < 0.3 ? 3 : Math.random() < 0.5 ? 2 : 1; let idx = Math.floor(Math.random() * (PENTA.length - 2));
        for (let k = 0; k < n; k++) { celesta(r, o, PENTA[Math.min(PENTA.length - 1, idx)], 0.022, (Math.random() - 0.5) * 1.4, dIn, k * (0.18 + Math.random() * 0.12)); idx += 1 + Math.floor(Math.random() * 2); } }, 3000); }
    // breathy flute phrases
    { const o = sub('flute'); const phrase = () => { if (!s.alive) return; const len = 2 + Math.floor(Math.random() * 3); let idx = 1 + Math.floor(Math.random() * 3), k = 0;
        const seq = () => { if (!s.alive) return; const d = 2 + Math.random() * 1.6; softFlute(r, o, MID[idx], d, 0.026, (Math.random() - 0.5) * 0.8); idx = cl(idx + (Math.random() < 0.5 ? -1 : 1), 0, MID.length - 1); if (++k < len) setTimeout(seq, d * 780); };
        seq(); setTimeout(phrase, 16000 + Math.random() * 12000); };
      setTimeout(phrase, 9000); }
    // kalimba, closer and warmer near the end of the road
    { const o = sub('kalimba'); loopS(3200, 7800, () => kalimba(r, o, LOW[Math.floor(Math.random() * LOW.length)], (Math.random() - 0.5) * 1.2, dIn), 5000); }
    // glass harmonics: the forest's bioluminescence
    { const o = sub('glass'); loopS(4000, 8000, () => { const f = PENTA[3 + Math.floor(Math.random() * 6)]; padVoice(r, o, f, { dur: 11, attack: 4, release: 6, gain: 0.0045, pan: (Math.random() - 0.5) * 1.6, pure: true }); }, 2000); }
    // nature
    pad(r, sub('thin'), [110, 164.8], 'sine', 500, 0.04);
    { const o = sub('forest'); loopS(1800, 5600, () => chirpS(r, o)); noise(r, o, 'bandpass', 900, 0.006); }
    { const o = sub('insects'); noise(r, o, 'bandpass', 4300, 0.004);
      const cricket = () => { if (!o.alive) return; const t = ctx.currentTime, n = ctx.createBufferSource(); n.buffer = r.noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3800 + Math.random() * 1400; f.Q.value = 8; const g = ctx.createGain(); const pulses = 3 + Math.floor(Math.random() * 3);
        for (let k = 0; k < pulses; k++) { const t0 = t + k * 0.09; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.022, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05); }
        n.connect(f); f.connect(g); g.connect(o.bus); n.start(t); n.stop(t + pulses * 0.09 + 0.1); };
      loop(o, 900, 2800, cricket); }
    { const o = sub('lake'); noise(r, o, 'lowpass', 420, 0.02); loopS(1400, 3800, () => celesta(r, o, PENTA[Math.floor(Math.random() * 5)] / 2, 0.018, (Math.random() - 0.5) * 1.2, null)); }
    this.lakePan = ctx.createStereoPanner(); L.lake.disconnect(); L.lake.connect(this.lakePan); this.lakePan.connect(out);
    { const o = sub('fire'); noise(r, o, 'lowpass', 500, 0.04); loopS(220, 900, () => tick(r, o, 0, 0.03 * Math.random(), 1400 + Math.random() * 2200, 0.02)); }
    this.firePan = ctx.createStereoPanner(); L.fire.disconnect(); L.fire.connect(this.firePan); this.firePan.connect(out);
    this.atStop = null;
    this.update(this.last || { t: 0, speed: 0, trail: 0 });
  }
  arrive(i) { if (!this.on) return; const o = Object.create(this.s); o.bus = this.s.bus; const base = [0, 2, 4, 5, 7];
    base.forEach((k, j) => celesta(this.r, o, PENTA[Math.min(PENTA.length - 1, k + (i % 2))], 0.03 * (1 - j * 0.1), -0.6 + j * 0.3, this.send, j * 0.13)); }
  update(p) {
    this.last = p; if (!this.on) return; const { t, speed, trail, water, lakePan, lakeDist, firePan, fireDist } = p, now = this.r.ctx.currentTime, sp = cl(speed / 20, 0, 1), L = this.L;
    const bump = (a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
    const nm = this.mute.nature, fm = this.mute.fire, night = ss(0.45, 0.8, t), forestZ = bump(0.53, 0.6, 0.86, 0.92), end = ss(0.84, 0.96, t);
    const lakeProx = lakeDist != null ? cl(1 - lakeDist / 70, 0, 1) : 0, fireProx = fireDist != null ? cl(1 - fireDist / 45, 0, 1) : 0;
    if (this.lakePan) this.lakePan.pan.setTargetAtTime(lakePan || 0, now, 0.5);
    if (this.firePan) this.firePan.pan.setTargetAtTime(firePan || 0, now, 0.5);
    this.dens = 0.35 + 0.5 * night - 0.2 * sp;
    const w = { pad: 0.95 - 0.2 * end, shimmer: 0.5 + 0.5 * night + 0.25 * sp, drone: 0.7 - 0.3 * end, twinkle: 0.55 + 0.45 * night, flute: 0.8 - 0.35 * forestZ - 0.3 * end, kalimba: 0.2 + 0.7 * end, glass: Math.max(forestZ, trail * 0.5) * 0.9 + night * 0.2,
      thin: bump(0.43, 0.48, 0.53, 0.58) * nm * 0.8, forest: Math.max(bump(0.53, 0.6, 0.84, 0.9), trail * 0.5, 0.3) * nm, insects: Math.max(bump(0.56, 0.66, 0.93, 0.98) * 0.7, trail * 0.3, 0.2) * nm * night,
      lake: Math.max(bump(0.82, 0.86, 0.9, 0.94), (water || 0) * 0.9, lakeProx * 0.9) * nm, fire: Math.max(ss(0.92, 0.985, t), fireProx * 0.85) * fm };
    for (const k in w) L[k].gain.setTargetAtTime(w[k], now, 1.2);
    const sf = t * 8, si = Math.round(sf);
    if (Math.abs(sf - si) < 0.025) { if (si !== this.atStop) { if (si > 0 && this.atStop !== undefined) this.arrive(si); this.atStop = si; } } else if (Math.abs(sf - si) > 0.12) this.atStop = -1;
  }
  stop() { if (!this.on) return; this.on = false; const s = this.s, t = this.r.ctx.currentTime; s.alive = false; s.bus.gain.cancelScheduledValues(t); s.bus.gain.setValueAtTime(s.bus.gain.value, t); s.bus.gain.linearRampToValueAtTime(0, t + 1.6); setTimeout(() => { s.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); s.bus.disconnect(); s.final.disconnect(); }, 1800); }
}
