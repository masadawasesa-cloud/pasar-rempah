'use strict';
/* Pasar Rempah — the state machine.
   title -> intro -> play (bid -> reveal -> collect, 9 rounds) -> tally.
   Owns the traders, the lot, the market card, the tie rollover pile,
   particles and the staged scenes used for the entry screenshots. */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  PR.render.init(ctx); PR.panel.init(ctx); PR.input.attach(canvas);

  const S = {
    mode: 'title', phase: 'bid', time: 0, phaseT: 0,
    round: 1, lot: [], carriedCount: 0, market: 0,
    traders: [], playerBid: 0, winner: -1, tie: false,
    particles: [], frozen: false, hintDone: false, rng: PR.mulberry32(1),
  };
  PR.state = S;

  function newTraders() {
    return [
      { idx: 0, persona: null, coins: PR.START_COINS, rack: [], bid: 0, quip: '', quipT: 0 },
      { idx: 1, persona: 'karim', coins: PR.START_COINS, rack: [], bid: 0, quip: '', quipT: 0 },
      { idx: 2, persona: 'lie', coins: PR.START_COINS, rack: [], bid: 0, quip: '', quipT: 0 },
    ];
  }

  function startRound() {
    const carried = S.lot.length && S.tie ? S.lot : [];
    S.carriedCount = carried.length;
    let lot = carried.concat(PR.genLot(S.rng));
    if (lot.length > 7) lot = lot.slice(0, 7);
    S.lot = lot;
    S.market = Math.floor(S.rng() * 4);
    S.traders[1].bid = PR.aiBid(S.traders[1], lot, S.market, S.rng);
    S.traders[2].bid = PR.aiBid(S.traders[2], lot, S.market, S.rng);
    S.traders[0].bid = 0;
    S.playerBid = Math.min(S.traders[0].coins, PR.lotBaseValue(lot, S.market));
    S.winner = -1; S.tie = false; S.phase = 'bid'; S.phaseT = 0;
    if (S.round === 3 && S.rng() < 0.8) say(S.traders[1], 'idle');
    if (S.round === 5 && S.rng() < 0.8) say(S.traders[2], 'idle');
    PR.audio.bell();
  }

  function say(trader, kind) {
    trader.quip = PR.pickLine(trader.persona, kind, S.rng);
    trader.quipT = 3.2;
  }

  function newGame(seed) {
    S.rng = PR.mulberry32(seed || (Date.now() % 2147483647));
    S.traders = newTraders();
    S.round = 1; S.lot = []; S.tie = false; S.hintDone = false;
    S.mode = 'play';
    startRound();
  }

  function burst(x, y, col, n, size) {
    for (let i = 0; i < n; i++) {
      S.particles.push({
        x, y, vx: (Math.random() - 0.5) * 130, vy: -Math.random() * 130 - 20,
        life: 0.9, max: 0.9, col, size: size || 4,
      });
    }
  }

  function lockBids() {
    if (S.phase !== 'bid') return;
    S.traders[0].bid = S.playerBid;
    S.hintDone = true;
    const bids = S.traders.map(t => t.bid);
    const max = Math.max(bids[0], bids[1], bids[2]);
    const leaders = bids.filter(b => b === max).length;
    S.tie = max === 0 || leaders > 1;
    S.winner = S.tie ? -1 : bids.indexOf(max);
    S.phase = 'reveal'; S.phaseT = 0;
    PR.audio.flip();
    if (!S.tie) {
      const w = S.traders[S.winner];
      if (S.winner !== 0) say(w, 'win');
      for (const t of S.traders) if (t !== w && t.persona && t.bid > 0 && S.rng() < 0.6) say(t, 'lose');
    }
  }

  function settle() {
    if (!S.tie && S.winner >= 0) {
      const w = S.traders[S.winner];
      w.coins -= w.bid;
      for (const c of S.lot) if (c.t === S.market) c.x2 = true;
      w.rack.push(...S.lot);
      S.lot = [];
      PR.audio.gavel(); PR.audio.coin();
      if (S.winner === 0) burst(464, 420, PR.GOLD, 18, 5);
    } else {
      PR.audio.stamp(); /* the lot stays on the mat and rolls over */
    }
    S.phase = 'collect'; S.phaseT = 0;
  }

  function nextRound() {
    S.round++;
    if (S.round > PR.ROUNDS) {
      S.mode = 'tally';
      const standings = S.traders.map(t => PR.wealth(t));
      PR.audio.jingle(standings[0] === Math.max(...standings));
    } else startRound();
  }

  function hit(b, p) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }

  function handleClicks() {
    const B = PR.render.BTN;
    for (const p of PR.input.clicks.splice(0)) {
      if (S.mode === 'title') { if (hit(B.start, p)) { S.mode = 'intro'; PR.audio.flip(); } continue; }
      if (S.mode === 'intro') { if (hit({ x: B.start.x, y: B.start.y + 40, w: B.start.w, h: B.start.h }, p)) newGame(); continue; }
      if (S.mode === 'tally') { if (hit(B.again, p)) { S.mode = 'title'; } continue; }
      if (S.mode === 'play' && S.phase === 'bid') {
        const me = S.traders[0];
        if (hit(B.chip1, p)) S.playerBid = Math.min(me.coins, S.playerBid + 1);
        else if (hit(B.chip5, p)) S.playerBid = Math.min(me.coins, S.playerBid + 5);
        else if (hit(B.chip10, p)) S.playerBid = Math.min(me.coins, S.playerBid + 10);
        else if (hit(B.minus, p)) S.playerBid = Math.max(0, S.playerBid - 1);
        else if (hit(B.plus, p)) S.playerBid = Math.min(me.coins, S.playerBid + 1);
        else if (hit(B.bid, p)) lockBids();
        if (S.playerBid !== me.bid) PR.audio.flip();
      }
    }
  }

  function update(dt) {
    S.time += dt; S.phaseT += dt;
    for (const t of S.traders) if (t.quipT > 0) t.quipT -= dt;
    for (const p of S.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt; }
    S.particles = S.particles.filter(p => p.life > 0);
    handleClicks();
    if (PR.input.pressed('m') || PR.input.pressed('M')) PR.audio.toggleMute();
    if (S.mode === 'title' && (PR.input.pressed('Enter') || PR.input.pressed(' '))) S.mode = 'intro';
    else if (S.mode === 'intro' && PR.input.pressed('Enter')) newGame();
    else if (S.mode === 'tally' && PR.input.pressed('Enter')) S.mode = 'title';
    if (S.mode === 'play') {
      if (S.phase === 'bid') {
        if (PR.input.pressed('ArrowUp')) S.playerBid = Math.min(S.traders[0].coins, S.playerBid + 1);
        if (PR.input.pressed('ArrowDown')) S.playerBid = Math.max(0, S.playerBid - 1);
        if (PR.input.pressed('Enter')) lockBids();
      } else if (S.phase === 'reveal' && S.phaseT > 1.9) settle();
      else if (S.phase === 'collect' && S.phaseT > 1.0) nextRound();
    }
  }

  function frame() { PR.render.draw(S); PR.panel.draw(S); }

  /* ---- dev hooks: deterministic time + state as text (playtest rig) ---- */
  let acc = 0, last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.25) dt = 0.25;
    if (!S.frozen) { acc += dt; while (acc >= PR.STEP) { update(PR.STEP); acc -= PR.STEP; } }
    frame();
    requestAnimationFrame(loop);
  }
  window.advanceTime = function (ms) {
    const steps = Math.round(ms / (PR.STEP * 1000));
    for (let i = 0; i < steps; i++) update(PR.STEP);
    frame();
  };
  window.render_game_to_text = function () {
    return JSON.stringify({
      mode: S.mode, phase: S.phase, round: S.round, market: PR.SPICES[S.market].name,
      lot: S.lot.map(c => PR.SPICES[c.t].id + (c.x2 ? 'x2' : '')), carried: S.carriedCount,
      playerBid: S.playerBid, winner: S.winner, tie: S.tie,
      traders: S.traders.map(t => ({ who: t.persona || 'kamu', coins: t.coins, rack: t.rack.length, wealth: PR.wealth(t), bid: t.bid })),
    });
  };
  PR.newGame = newGame; PR.lockBids = lockBids; PR.startRound = startRound;

  /* ---- staged scenes for the entry screenshots ---- */
  function stagedTrader(persona, coins, rackSpec) {
    return {
      idx: persona === 'karim' ? 1 : persona === 'lie' ? 2 : 0, persona,
      coins, bid: 0, quip: '', quipT: 0,
      rack: rackSpec.map(([t, x2]) => ({ t, x2: !!x2 })),
    };
  }
  function stageFromQuery() {
    const q = new URLSearchParams(location.search);
    const shot = q.get('shot');
    if (!shot) return false;
    S.frozen = true;
    if (shot === 'title') { S.mode = 'title'; return true; }
    if (shot === 'bid') {
      S.mode = 'play'; S.round = 3; S.phase = 'bid'; S.market = 1;
      S.traders = [
        stagedTrader(null, 24, [[0, 1], [1, 0], [3, 0]]),
        stagedTrader('karim', 21, [[1, 0], [2, 0]]),
        stagedTrader('lie', 27, [[0, 0], [3, 0], [2, 0]]),
      ];
      S.traders[0].idx = 0; S.traders[1].idx = 1; S.traders[2].idx = 2;
      S.lot = [{ t: 1, x2: false }, { t: 1, x2: false }, { t: 0, x2: false }, { t: 2, x2: false }];
      S.carriedCount = 0; S.playerBid = 13;
      S.traders[2].quip = 'Cengkeh ×2? Aku ikut.'; S.traders[2].quipT = 99;
      return true;
    }
    if (shot === 'cover') { /* the reveal moment from the design mock */
      S.mode = 'play'; S.round = 6; S.phase = 'reveal'; S.phaseT = 1.2; S.market = 0;
      S.traders = [
        stagedTrader(null, 26, [[0, 1], [1, 0], [0, 0], [3, 0], [2, 0], [1, 0]]),
        stagedTrader('karim', 23, [[1, 0], [2, 0], [3, 0]]),
        stagedTrader('lie', 31, [[0, 0], [3, 0], [2, 0]]),
      ];
      S.traders[0].idx = 0; S.traders[1].idx = 1; S.traders[2].idx = 2;
      S.traders[0].bid = 14; S.traders[1].bid = 11; S.traders[2].bid = 19;
      S.winner = 2; S.tie = false;
      S.lot = [{ t: 0, x2: false }, { t: 0, x2: false }, { t: 1, x2: false }, { t: 2, x2: false }, { t: 3, x2: false }];
      S.carriedCount = 2; S.playerBid = 14;
      S.traders[1].quip = 'Lot pala? Itu milikku.'; S.traders[1].quipT = 99;
      for (let i = 0; i < 12; i++) S.particles.push({ x: 600 + (i * 37) % 150, y: 520 + (i * 13) % 40, vx: 0, vy: 0, life: 99, max: 99, col: PR.GOLD, size: 4 });
      return true;
    }
    if (shot === 'tally') {
      S.mode = 'tally';
      S.traders = [
        stagedTrader(null, 18, [[0, 1], [0, 1], [1, 0], [1, 0], [2, 0], [2, 0], [3, 0], [3, 0], [0, 0], [1, 0]]),
        stagedTrader('karim', 9, [[1, 0], [1, 0], [2, 0], [3, 0], [0, 0], [2, 0]]),
        stagedTrader('lie', 14, [[0, 1], [3, 0], [3, 0], [2, 0], [1, 0], [0, 0], [2, 0]]),
      ];
      S.traders[0].idx = 0; S.traders[1].idx = 1; S.traders[2].idx = 2;
      return true;
    }
    return false;
  }

  S.traders = newTraders();
  const staged = stageFromQuery();
  if (new URLSearchParams(location.search).get('test') === '1') PR.runSelfTest(S, { newGame, lockBids, update });
  if (staged || new URLSearchParams(location.search).get('test') === '1') {
    frame();
    window.__shotReady = true;
  }
  requestAnimationFrame(loop);
})();
