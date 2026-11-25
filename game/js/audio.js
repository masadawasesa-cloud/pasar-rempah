'use strict';
/* Pasar Rempah — tiny WebAudio synth: market bell, card flips, coin
   clinks, the auctioneer's gavel and short win/lose jingles. No files. */
PR.audio = (function () {
  let ac = null, muted = false;
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, t0, dur, type, vol, slide) {
    const a = ctx(); if (!a || muted) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, a.currentTime + t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.currentTime + t0 + dur);
    g.gain.setValueAtTime(0.0001, a.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, a.currentTime + t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
    o.connect(g); g.connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, freq) {
    const a = ctx(); if (!a || muted) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 2400;
    const g = a.createGain(); g.gain.value = vol || 0.1;
    src.connect(f); f.connect(g); g.connect(a.destination); src.start(a.currentTime + t0);
  }
  return {
    unlock() { ctx(); },
    toggleMute() { muted = !muted; return muted; },
    bell() { tone(1318, 0, 0.5, 'sine', 0.1); tone(1975, 0.01, 0.4, 'sine', 0.05); },
    flip() { noise(0, 0.09, 0.14, 1800); },
    coin() { tone(2093, 0, 0.09, 'square', 0.05); tone(2637, 0.05, 0.14, 'square', 0.05); noise(0, 0.05, 0.05, 4000); },
    gavel() { noise(0, 0.07, 0.22, 700); tone(160, 0, 0.1, 'sine', 0.16, 70); },
    stamp() { noise(0, 0.06, 0.16, 900); tone(880, 0.02, 0.12, 'triangle', 0.08); },
    jingle(win) {
      const seq = win ? [523, 659, 784, 1046] : [392, 330, 262, 196];
      seq.forEach((f, i) => tone(f, i * 0.13, 0.24, 'triangle', 0.1));
    },
  };
})();
