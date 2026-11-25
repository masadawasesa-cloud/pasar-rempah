'use strict';
/* Pasar Rempah — spice cards, seeded lots and warehouse maths.
   A card is { t: spiceIndex, x2: boolean }. The x2 stamp is earned when a
   card is won in a round whose market card names its spice. */

PR.SPICES = [
  { id: 'pala',    name: 'PALA',       val: 5, col: '#d9a441' },
  { id: 'cengkeh', name: 'CENGKEH',    val: 4, col: '#c0392b' },
  { id: 'lada',    name: 'LADA',       val: 3, col: '#55555f' },
  { id: 'kayu',    name: 'KAYU MANIS', val: 2, col: '#d97b2f' },
];

/* Deterministic RNG so staged scenes and the self-test never drift. */
PR.mulberry32 = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* A fresh lot: 2-4 cards, rarer spices drawn less often. */
PR.genLot = function (rng) {
  const n = 2 + Math.floor(rng() * 3);
  const bag = [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3];
  const lot = [];
  for (let i = 0; i < n; i++) lot.push({ t: bag[Math.floor(rng() * bag.length)], x2: false });
  return lot;
};

/* Face value of one card for a given market spice (market doubles it). */
PR.cardValue = function (card, market) {
  return PR.SPICES[card.t].val * (card.t === market ? 2 : 1);
};

/* What a lot is worth to a trader right now, before set premiums. */
PR.lotBaseValue = function (lot, market) {
  let v = 0;
  for (const c of lot) v += PR.cardValue(c, market);
  return v;
};

/* Complete sets of all four spices in a warehouse rack. */
PR.completeSets = function (rack) {
  const counts = [0, 0, 0, 0];
  for (const c of rack) counts[c.t]++;
  return Math.min(counts[0], counts[1], counts[2], counts[3]);
};

/* Permanent value of a rack: stamped values plus set bonuses. */
PR.goodsValue = function (rack) {
  let v = 0;
  for (const c of rack) v += PR.SPICES[c.t].val * (c.x2 ? 2 : 1);
  return v + PR.SET_BONUS * PR.completeSets(rack);
};

PR.wealth = function (trader) { return trader.coins + PR.goodsValue(trader.rack); };
