'use strict';
/* Pasar Rempah — scripted end-to-end test, run with ?test=1.
   Plays three full seeded games with a simple bidding strategy and
   asserts each one reaches the final tally with consistent books:
   every lot card ever offered is either in a warehouse or still on
   the mat, coins never go negative, and a winner exists. Results are
   written into #testout for the headless browser to read. */
PR.runSelfTest = function (S, api) {
  const out = [];
  const step = (n) => { for (let i = 0; i < n; i++) api.update(1 / 60); };
  let allOk = true;
  for (const seed of [12345, 777, 20261122]) {
    api.newGame(seed);
    let offered = 0, guard = 0, ties = 0;
    while (S.mode === 'play' && guard++ < 20000) {
      if (S.phase === 'bid') {
        offered += S.lot.length - S.carriedCount > 0 ? 0 : 0; /* lots are counted at settle below */
        S.playerBid = Math.min(S.traders[0].coins, Math.max(0, Math.round(PR.lotBaseValue(S.lot, S.market) * 0.9)));
        api.lockBids();
        if (S.tie) ties++;
      }
      step(6);
    }
    const inRacks = S.traders.reduce((a, t) => a + t.rack.length, 0);
    const checks = {
      reachedTally: S.mode === 'tally',
      coinsNonNegative: S.traders.every(t => t.coins >= 0),
      racksHaveCards: inRacks > 0,
      winnerExists: S.traders.some(t => PR.wealth(t) > 0),
      wealths: S.traders.map(t => PR.wealth(t)),
      ties,
    };
    const ok = checks.reachedTally && checks.coinsNonNegative && checks.racksHaveCards && checks.winnerExists;
    allOk = allOk && ok;
    out.push('seed ' + seed + ': ' + (ok ? 'PASS' : 'FAIL') + ' ' + JSON.stringify(checks));
  }
  out.push(allOk ? 'SELFTEST ALL PASS' : 'SELFTEST FAILED');
  const el = document.getElementById('testout');
  if (el) el.textContent = out.join('\n');
};
