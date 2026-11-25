'use strict';
/* Pasar Rempah — the two rival merchants.
   Each values a lot for themselves (market doubling plus a premium for
   spices that move them toward a complete set), then bids a persona-
   flavoured share of that value. Their habits are learnable on purpose:
   Karim overbids and bluffs cheap lots; Lie stays cheap until a lot
   completes her set or carries the market spice. */

PR.PERSONAS = {
  karim: {
    name: 'HAJI KARIM', tag: 'Agresif — penggertak', initial: 'H', col: '#31456e',
    win: ['Sudah kubilang, ini milikku.', 'Haha! Pasar ini keras, kawan.', 'Tawar lebih tinggi lain kali.'],
    lose: ['Ambillah. Ronde berikut milikku.', 'Kau berani juga.', 'Hmm. Aku catat itu.'],
    idle: ['Lot pala? Itu milikku.', 'Jangan ragu-ragu, Nak.', 'Aku sudah mencium untung.'],
  },
  lie: {
    name: 'NYONYA LIE', tag: 'Sabar — pemburu set', initial: 'N', col: '#5a2e4e',
    win: ['Pas. Seperti yang kurencanakan.', 'Set-ku makin lengkap.', 'Terima kasih, pasar.'],
    lose: ['Silakan. Aku menunggu yang lebih baik.', 'Mahal sekali untukmu.', 'Belum rezekiku.'],
    idle: ['Aku hanya membeli yang kubutuhkan.', 'Sabar itu modal juga.', 'Lihat gudangku, hampir lengkap.'],
  },
};

/* How much a lot is worth to this trader, set premium included. */
PR.aiValuation = function (trader, lot, market) {
  let v = PR.lotBaseValue(lot, market);
  const owned = [0, 0, 0, 0];
  for (const c of trader.rack) owned[c.t]++;
  const inLot = [0, 0, 0, 0];
  for (const c of lot) inLot[c.t]++;
  let newTypes = 0;
  for (let t = 0; t < 4; t++) if (owned[t] === 0 && inLot[t] > 0) newTypes++;
  /* Each missing spice the lot supplies moves them toward a +12 set. */
  v += Math.min(6, newTypes * 3);
  /* A lot that completes the set outright is worth chasing hard. */
  if (newTypes > 0 && [0, 1, 2, 3].every(t => owned[t] + inLot[t] > 0)) v += 5;
  return v;
};

PR.aiBid = function (trader, lot, market, rng) {
  const val = PR.aiValuation(trader, lot, market);
  let bid;
  if (trader.persona === 'karim') {
    bid = val * (0.95 + rng() * 0.3);
    if (val <= 8 && rng() < 0.22) bid = 9 + rng() * 6; /* the bluff */
  } else {
    bid = val * (0.78 + rng() * 0.22);
    const owned = [0, 0, 0, 0];
    for (const c of trader.rack) owned[c.t]++;
    const completes = [0, 1, 2, 3].every(t => owned[t] > 0 || lot.some(c => c.t === t));
    const hasMarket = lot.some(c => c.t === market);
    if (completes || hasMarket) bid *= 1.18;
  }
  bid = Math.round(bid);
  if (bid < 0) bid = 0;
  if (bid > trader.coins) bid = trader.coins;
  return bid;
};

PR.pickLine = function (persona, kind, rng) {
  const lines = PR.PERSONAS[persona][kind];
  return lines[Math.floor(rng() * lines.length)];
};
