'use strict';
/* Pasar Rempah — all drawing. The scene is one market table seen from
   above: woven mat and the lot in the middle, the market board above it,
   the two rival merchants across the table, your own stall below, and a
   labelled panel on the right. Screens (title, how-to, final tally) are
   drawn here too; game.js owns the state they read. */
PR.render = (function () {
  let ctx = null;
  const FW = PR.FIELD_W, TOP = PR.TOP;

  /* Button rectangles in absolute canvas coordinates, shared with game.js. */
  const BTN = {
    chip1: { x: 647, y: 669, w: 34, h: 34 }, chip5: { x: 689, y: 669, w: 34, h: 34 }, chip10: { x: 731, y: 669, w: 34, h: 34 },
    minus: { x: 770, y: 664, w: 36, h: 44 }, plus: { x: 864, y: 664, w: 36, h: 44 },
    bid: { x: 770, y: 718, w: 130, h: 40 },
    start: { x: 515, y: 596, w: 250, h: 56 },
    again: { x: 515, y: 706, w: 250, h: 50 },
  };

  function rr(x, y, w, h, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }
  function txt(s, x, y, font, color, align) { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.fillText(s, x, y); }
  function circle(x, y, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }

  /* ---- spice art: drawn icons, no words inside the art ---- */
  function spiceIcon(type, x, y, s) {
    if (type === 0) { /* pala: halved nutmeg, red mace over a brown seed */
      ctx.fillStyle = '#e8cf9a'; ctx.beginPath(); ctx.ellipse(x, y, 13 * s, 16 * s, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#7a4d21'; ctx.beginPath(); ctx.ellipse(x, y, 8 * s, 11 * s, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#d33f2e'; ctx.lineWidth = 1.6 * s;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 4 * s, y - 9 * s); ctx.quadraticCurveTo(x + i * 6 * s, y, x + i * 4 * s, y + 9 * s); ctx.stroke(); }
    } else if (type === 1) { /* cengkeh: clove buds on stems */
      ctx.strokeStyle = '#7a4d21'; ctx.lineWidth = 2.4 * s;
      for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(x, y + 13 * s); ctx.lineTo(x + dx * s, y - 4 * s); ctx.stroke(); circle(x + dx * s, y - 8 * s, 5.4 * s, '#b03a2a', '#7e2418', 1.4); }
      circle(x, y - 12 * s, 5.4 * s, '#c0392b', '#7e2418', 1.4);
    } else if (type === 2) { /* lada: a cluster of peppercorns */
      ctx.strokeStyle = '#4a5a3a'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, y - 14 * s); ctx.lineTo(x, y + 2 * s); ctx.stroke();
      for (const [dx, dy] of [[-7, -6], [6, -8], [-4, 2], [5, 0], [-8, 6], [2, 8], [8, 7]]) circle(x + dx * s, y + dy * s, 4.6 * s, '#33333f', '#17171f', 1.2);
    } else { /* kayu manis: rolled cinnamon sticks */
      rr(x - 13 * s, y - 5 * s, 26 * s, 7 * s, 3 * s, '#d97b2f', '#9a5316', 1.2);
      rr(x - 11 * s, y + 3 * s, 24 * s, 7 * s, 3 * s, '#e08a3d', '#9a5316', 1.2);
      ctx.strokeStyle = '#9a5316'; ctx.beginPath(); ctx.arc(x + 11 * s, y - 1.5 * s, 3 * s, 0, 6.29); ctx.stroke();
    }
  }

  function card(x, y, c, market, stampScale) {
    const cw = 92, ch = 128, sp = PR.SPICES[c.t];
    rr(x, y, cw, ch, 9, PR.PAPER, '#8a6f35', 2);
    ctx.fillStyle = sp.col; ctx.fillRect(x + 6, y + 6, cw - 12, 44);
    spiceIcon(c.t, x + cw / 2, y + 28, 1.05);
    txt(sp.name, x + cw / 2, y + 72, '800 12.5px system-ui', PR.INK, 'center');
    txt('nilai ' + sp.val, x + cw / 2, y + 92, '600 11px system-ui', '#6a5a3a', 'center');
    if (c.t === market) txt('PASAR ×2', x + cw / 2, y + 112, '800 10.5px system-ui', '#9a7a10', 'center');
    if (c.x2 && stampScale > 0) {
      ctx.save(); ctx.translate(x + cw - 16, y + 16); ctx.rotate(0.5); ctx.scale(stampScale, stampScale);
      rr(-15, -11, 30, 22, 5, PR.GOLD, '#9a7a10', 1.5);
      txt('×2', 0, 5, '900 14px system-ui', '#5a4300', 'center'); ctx.restore();
    }
  }
  function miniCard(x, y, c) {
    rr(x, y, 30, 42, 4, PR.PAPER, '#8a6f35', 1.2);
    ctx.fillStyle = PR.SPICES[c.t].col; ctx.fillRect(x + 3, y + 3, 24, 14);
    spiceIcon(c.t, x + 15, y + 10, 0.42);
    if (c.x2) { circle(x + 24, y + 6, 6, PR.GOLD); txt('2', x + 24, y + 9, '900 8px system-ui', '#5a4300', 'center'); }
  }

  /* ---- the table ---- */
  function table() {
    ctx.fillStyle = '#6b4a2f'; ctx.fillRect(0, TOP, FW, PR.H - TOP);
    for (let y = TOP; y < PR.H; y += 54) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, y, FW, 3);
      for (let i = 0; i < 26; i++) {
        const gx = (i * 173 + y * 37) % FW;
        ctx.strokeStyle = 'rgba(46,29,15,0.25)'; ctx.beginPath();
        ctx.moveTo(gx, y + 12 + ((i * 29) % 30)); ctx.lineTo(gx + 34, y + 14 + ((i * 29) % 30)); ctx.stroke();
      }
    }
    for (const lx of [70, FW - 70]) { /* hanging lanterns */
      const g = ctx.createRadialGradient(lx, TOP + 26, 4, lx, TOP + 26, 120);
      g.addColorStop(0, 'rgba(255,190,80,0.35)'); g.addColorStop(1, 'rgba(255,190,80,0)');
      ctx.fillStyle = g; ctx.fillRect(lx - 120, TOP, 240, 150);
      ctx.fillStyle = '#2c1e10'; ctx.fillRect(lx - 13, TOP, 26, 16);
      circle(lx, TOP + 26, 11, '#ffca6a', '#7a4d16', 2);
    }
  }
  function sack(x, y, color) {
    rr(x - 24, y - 6, 48, 44, 10, '#7d6742');
    rr(x - 24, y - 6, 48, 14, 7, '#8f774c');
    ctx.fillStyle = '#5d4a2c'; ctx.beginPath(); ctx.ellipse(x, y - 4, 21, 8, 0, 0, 6.29); ctx.fill();
    for (let i = 0; i < 8; i++) circle(x - 13 + ((i * 37) % 26), y - 6 + ((i * 13) % 5), 2.8, color);
    ctx.strokeStyle = '#4a3820'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 18, y + 10); ctx.lineTo(x + 18, y + 10); ctx.stroke();
  }
  function scale() { /* the brass balance, left of the mat */
    const x = 120, yTop = TOP + 300;
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yTop + 92); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 44, yTop + 18); ctx.lineTo(x + 44, yTop + 18); ctx.stroke();
    for (const px of [x - 44, x + 44]) {
      ctx.beginPath(); ctx.moveTo(px, yTop + 18); ctx.lineTo(px - 14, yTop + 42);
      ctx.moveTo(px, yTop + 18); ctx.lineTo(px + 14, yTop + 42); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(px, yTop + 46, 20, 6, 0, 0, 3.15); ctx.stroke();
    }
    circle(x, yTop + 6, 6, PR.GOLD);
    txt('TIMBANGAN', x, yTop + 118, '700 10px system-ui', 'rgba(244,234,210,0.75)', 'center');
  }

  function marketBoard(S) {
    rr(300, TOP + 58, 328, 64, 8, '#2c1e10', '#c9a227', 2);
    txt('KARTU PASAR', 464, TOP + 82, '700 11px system-ui', '#c9a227', 'center');
    spiceIcon(S.market, 348, TOP + 102, 0.8);
    txt(PR.SPICES[S.market].name + ' ×2 RONDE INI', 500, TOP + 110, '800 18px system-ui', PR.GOLD, 'center');
  }

  function aiZone(x, trader, S) {
    const y = TOP + 140, P = PR.PERSONAS[trader.persona];
    rr(x, y, 196, 112, 8, 'rgba(20,14,6,0.55)', '#8a6f35', 1.5);
    circle(x + 24, y + 24, 13, P.col); txt(P.initial, x + 24, y + 29, '800 13px system-ui', '#fff', 'center');
    txt(P.name, x + 44, y + 20, '800 12.5px system-ui', PR.PAPER);
    txt(P.tag, x + 44, y + 36, '600 9.5px system-ui', 'rgba(244,234,210,0.7)');
    circle(x + 166, y + 22, 11, PR.GOLD);
    txt(trader.coins + ' koin', x + 166, y + 50, '700 11px system-ui', PR.PAPER, 'center');
    txt('GUDANG', x + 12, y + 66, '700 9px system-ui', 'rgba(244,234,210,0.6)');
    const show = trader.rack.slice(0, 3);
    show.forEach((c, i) => miniCard(x + 58 + i * 36, y + 56, c));
    if (trader.rack.length > 3) txt('+' + (trader.rack.length - 3), x + 172, y + 84, '700 11px system-ui', PR.PAPER, 'center');
    if (trader.quip && trader.quipT > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, trader.quipT);
      rr(x + 2, y - 32, Math.max(120, trader.quip.length * 6.4 + 22), 26, 12, '#ffffff');
      txt(trader.quip, x + 14, y - 15, '600 11.5px system-ui', '#222222');
      ctx.restore();
    }
    if (S.phase !== 'bid' && S.winner === trader.idx) {
      ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(S.time * 6);
      rr(x - 3, y - 3, 202, 118, 10, null, PR.GOLD, 3); ctx.restore();
    }
  }

  function lotCards(S) {
    const MX = 254, MY = TOP + 230, MW = 420, MH = 272;
    rr(MX - 8, MY - 8, MW + 16, MH + 16, 8, '#8a6f35');
    for (let i = 0; i < 14; i++) for (let j = 0; j < 10; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#b8a05e' : '#a68f4e';
      ctx.fillRect(MX + i * 30, MY + j * 27.2, 30, 27.2);
    }
    txt('LOT ' + S.round + (S.carriedCount ? ' — TUMPUKAN LELANG (SERI MENUMPUK)' : ' — TUMPUKAN LELANG'),
      464, MY - 14, '800 12.5px system-ui', PR.PAPER, 'center');
    const n = S.lot.length;
    const row1 = Math.ceil(n / 2), rows = [row1, n - row1];
    let idx = 0;
    rows.forEach((count, r) => {
      if (!count) return;
      const totalW = count * 92 + (count - 1) * 14;
      let x = 464 - totalW / 2;
      const y = MY + 16 + r * 116;
      for (let i = 0; i < count; i++) {
        const c = S.lot[idx++];
        const lift = (S.phase === 'collect' && S.winner >= 0) ? -Math.min(1, S.phaseT / 0.9) * 10 : 0;
        card(x, y + lift, c, S.market, (S.phase === 'collect' && c.t === S.market) ? Math.min(1, S.phaseT / 0.5) : (c.x2 ? 1 : 0));
        x += 106;
      }
    });
  }

  function plaques(S) {
    const y = TOP + 512;
    S.traders.forEach((trader, i) => {
      const x = 196 + i * 192;
      const revealed = S.phase !== 'bid';
      const win = revealed && S.winner === i;
      const flip = S.phase === 'reveal' ? Math.sin(Math.min(1, S.phaseT / 0.45) * Math.PI / 2) : 1;
      ctx.save();
      ctx.translate(x + 75, y + 22); ctx.scale(Math.max(0.08, flip), 1); ctx.translate(-(x + 75), -(y + 22));
      rr(x, y, 150, 44, 8, win ? PR.GOLD : '#efe6cc', win ? '#fff2b0' : '#8a6f35', win ? 3 : 1.5);
      txt(i === 0 ? 'TAWARANMU' : PR.PERSONAS[trader.persona].name, x + 12, y + 19, '700 10.5px system-ui', win ? '#5a4300' : '#6a5a3a');
      txt(revealed ? String(trader.bid) : '?', x + 12, y + 39, '900 19px system-ui', win ? '#5a4300' : PR.INK);
      circle(x + 128, y + 22, 10, '#b8860b', '#7a5a10', 2); circle(x + 128, y + 22, 4.5, '#8a6a14');
      ctx.restore();
      if (win) txt(S.tie ? 'SERI' : 'MENANG', x + 75, y + 62, '800 11px system-ui', PR.GOLD, 'center');
    });
    if (S.tie && S.phase !== 'bid') txt('SERI — LOT MENUMPUK KE RONDE BERIKUTNYA', 464, y + 62, '800 11px system-ui', '#ff8a80', 'center');
  }

  function playerZone(S) {
    const PY = TOP + 592, me = S.traders[0];
    rr(24, PY, FW - 48, 150, 10, 'rgba(20,14,6,0.6)', '#c9a227', 2);
    circle(66, PY + 30, 15, '#7a3b2e'); txt('K', 66, PY + 36, '800 15px system-ui', '#fff', 'center');
    txt('KAMU — Pedagang Muda', 90, PY + 28, '800 14px system-ui', PR.PAPER);
    txt('Kantong:', 90, PY + 50, '600 12px system-ui', 'rgba(244,234,210,0.75)');
    circle(152, PY + 45, 10, PR.GOLD); txt(me.coins + ' koin', 170, PY + 50, '700 12px system-ui', PR.PAPER);
    txt('GUDANGMU', 330, PY + 26, '700 10px system-ui', 'rgba(244,234,210,0.65)');
    me.rack.slice(0, 6).forEach((c, i) => miniCard(330 + i * 38, PY + 36, c));
    if (me.rack.length > 6) txt('+' + (me.rack.length - 6), 330 + 6 * 38 + 12, PY + 60, '700 11px system-ui', PR.PAPER, 'center');
    const counts = [0, 0, 0, 0]; for (const c of me.rack) counts[c.t]++;
    txt('SET: ' + PR.SPICES.map((s, i) => s.name.toLowerCase() + (counts[i] ? ' ✓' : ' …')).join('  ') + '  → +12',
      330, PY + 96, '700 11px system-ui', PR.completeSets(me.rack) ? '#7dd87d' : 'rgba(244,234,210,0.75)');
    txt('ATUR TAWARANMU', 640, PY + 26, '700 10px system-ui', 'rgba(244,234,210,0.65)');
    const active = S.phase === 'bid';
    for (const [b, v] of [[BTN.chip1, '1'], [BTN.chip5, '5'], [BTN.chip10, '10']]) {
      circle(b.x + 17, b.y + 17, 17, active ? '#b8860b' : '#6a5a30', '#7a5a10', 2);
      txt(v, b.x + 17, b.y + 22, '800 13px system-ui', '#2a1e05', 'center');
    }
    rr(BTN.minus.x, BTN.minus.y, 36, 44, 8, active ? '#31456e' : '#3a3f4a'); txt('−', BTN.minus.x + 18, BTN.minus.y + 30, '900 22px system-ui', '#fff', 'center');
    rr(810, 664, 50, 44, 8, PR.PAPER); txt(String(S.playerBid), 835, 694, '900 20px system-ui', PR.INK, 'center');
    rr(BTN.plus.x, BTN.plus.y, 36, 44, 8, active ? '#31456e' : '#3a3f4a'); txt('+', BTN.plus.x + 18, BTN.plus.y + 29, '900 20px system-ui', '#fff', 'center');
    rr(BTN.bid.x, BTN.bid.y, 130, 40, 8, active ? '#8a2f27' : '#4a3436');
    txt('TAWAR!', BTN.bid.x + 65, BTN.bid.y + 26, '800 15px system-ui', '#ffd9d4', 'center');
    if (active && S.round === 1 && !S.hintDone) {
      ctx.save(); ctx.globalAlpha = 0.65 + 0.35 * Math.sin(S.time * 4);
      txt('▲ atur tawaranmu di sini, lalu tekan TAWAR!', 770, PY + 130, '700 11.5px system-ui', PR.GOLD);
      ctx.restore();
    }
  }

  function particles(S) {
    for (const p of S.particles) {
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore();
    }
  }

  /* ---- screens ---- */
  function backdrop() {
    const g = ctx.createLinearGradient(0, 0, 0, PR.H);
    g.addColorStop(0, '#241708'); g.addColorStop(0.55, '#3a2410'); g.addColorStop(1, '#1c1006');
    ctx.fillStyle = g; ctx.fillRect(0, 0, PR.W, PR.H);
    for (const lx of [180, 640, 1100]) {
      const rg = ctx.createRadialGradient(lx, 120, 6, lx, 120, 190);
      rg.addColorStop(0, 'rgba(255,190,80,0.30)'); rg.addColorStop(1, 'rgba(255,190,80,0)');
      ctx.fillStyle = rg; ctx.fillRect(lx - 190, 0, 380, 320);
      ctx.fillStyle = '#2c1e10'; ctx.fillRect(lx - 15, 30, 30, 20);
      circle(lx, 66, 13, '#ffca6a', '#7a4d16', 2);
    }
  }
  function drawTitle(S) {
    backdrop();
    const fan = [{ t: 0, x2: true }, { t: 1, x2: false }, { t: 2, x2: false }, { t: 3, x2: false }, { t: 0, x2: false }];
    fan.forEach((c, i) => { ctx.save(); ctx.translate(640 + (i - 2) * 86, 218); ctx.rotate((i - 2) * 0.10); card(-46, -64, c, -1, c.x2 ? 1 : 0); ctx.restore(); });
    txt('PASAR REMPAH', 640, 420, '900 64px Georgia,serif', PR.GOLD, 'center');
    txt('Lelang rempah Nusantara melawan dua pedagang licik', 640, 458, '600 19px system-ui', '#f4ead2', 'center');
    txt('Kalahkan Haji Karim yang agresif dan Nyonya Lie sang pemburu set.', 640, 492, '600 15px system-ui', 'rgba(244,234,210,0.8)', 'center');
    txt('Sembilan ronde. Satu pasar. Pedagang terkaya membawa pulang hari ini.', 640, 518, '600 15px system-ui', 'rgba(244,234,210,0.8)', 'center');
    rr(BTN.start.x, BTN.start.y, BTN.start.w, BTN.start.h, 10, '#8a2f27', '#ffd9d4', 2);
    txt('MULAI LELANG', 640, BTN.start.y + 37, '800 20px system-ui', '#ffe9e4', 'center');
    txt('Klik chip koin / panah atas-bawah: atur tawaran · Enter: kunci tawaran · M: suara', 640, 700, '600 13px system-ui', 'rgba(244,234,210,0.65)', 'center');
  }
  function drawIntro(S) {
    backdrop();
    txt('CARA MAIN', 640, 120, '900 40px Georgia,serif', PR.GOLD, 'center');
    const beats = [
      ['1', 'LIHAT LOT & KARTU PASAR', 'Setiap ronde satu tumpukan rempah dilelang. Kartu pasar menggandakan satu jenis rempah ronde ini — kartu jenis itu yang kamu menangkan bercap ×2 selamanya.'],
      ['2', 'ATUR TAWARANMU', 'Klik chip koin atau tombol −/+ (atau panah atas/bawah), lalu tekan TAWAR! atau Enter. Kedua lawan menawar diam-diam pada saat yang sama.'],
      ['3', 'TERTINGGI MENANG & MEMBAYAR', 'Penawar tertinggi membayar sejumlah tawarannya dan mengambil semua kartu. Seri tertinggi? Tidak ada pemenang — lot menumpuk ke ronde berikutnya.'],
      ['4', 'KUMPULKAN SET, JADI TERKAYA', 'Satu set lengkap berisi pala, cengkeh, lada, dan kayu manis bernilai bonus +12. Setelah 9 ronde: koin sisa + nilai gudang menentukan pedagang terkaya.'],
    ];
    beats.forEach((b, i) => {
      const y = 176 + i * 104;
      circle(300, y + 16, 17, '#8a2f27'); txt(b[0], 300, y + 22, '800 16px system-ui', '#ffe9e4', 'center');
      txt(b[1], 332, y + 10, '800 16px system-ui', PR.PAPER);
      /* wrap the explanation to two lines by hand at ~92 chars */
      const words = b[2].split(' '); let line = '', ly = y + 34;
      for (const w of words) { if ((line + ' ' + w).length > 96) { txt(line, 332, ly, '600 13.5px system-ui', 'rgba(244,234,210,0.85)'); ly += 19; line = w; } else line = line ? line + ' ' + w : w; }
      if (line) txt(line, 332, ly, '600 13.5px system-ui', 'rgba(244,234,210,0.85)');
    });
    rr(BTN.start.x, BTN.start.y + 40, BTN.start.w, BTN.start.h, 10, '#8a2f27', '#ffd9d4', 2);
    txt('MULAI LELANG', 640, BTN.start.y + 77, '800 20px system-ui', '#ffe9e4', 'center');
  }
  function drawTally(S) {
    backdrop();
    const standings = S.traders.map(t => ({ t, total: PR.wealth(t) })).sort((a, b) => b.total - a.total);
    const winner = standings[0].t;
    const playerWon = winner === S.traders[0];
    txt('PASAR TUTUP', 640, 92, '900 42px Georgia,serif', PR.GOLD, 'center');
    txt(playerWon ? 'KAMU MENANG — pedagang terkaya hari ini!' : 'KAMU KALAH — ' + PR.PERSONAS[winner.persona].name + ' membawa pulang pasar',
      640, 132, '800 20px system-ui', playerWon ? '#7dd87d' : '#ff8a80', 'center');
    standings.forEach((s, i) => {
      const x = 150 + i * 330, y = 176, isWin = s.t === winner;
      rr(x, y, 300, 440, 12, isWin ? 'rgba(255,217,77,0.13)' : 'rgba(20,14,6,0.55)', isWin ? PR.GOLD : '#8a6f35', isWin ? 3 : 1.5);
      if (isWin) txt('♛ PEDAGANG TERKAYA', x + 150, y + 30, '800 13px system-ui', PR.GOLD, 'center');
      txt(s.t === S.traders[0] ? 'KAMU' : PR.PERSONAS[s.t.persona].name, x + 150, y + 62, '800 19px system-ui', PR.PAPER, 'center');
      s.t.rack.slice(0, 12).forEach((c, j) => miniCard(x + 26 + (j % 6) * 42, y + 84 + Math.floor(j / 6) * 50, c));
      if (!s.t.rack.length) txt('(gudang kosong)', x + 150, y + 110, '600 13px system-ui', 'rgba(244,234,210,0.6)', 'center');
      const goods = PR.goodsValue(s.t.rack) - PR.SET_BONUS * PR.completeSets(s.t.rack);
      txt('Koin sisa', x + 26, y + 214, '600 14px system-ui', 'rgba(244,234,210,0.8)');
      txt(String(s.t.coins), x + 274, y + 214, '700 14px system-ui', PR.PAPER, 'right');
      txt('Nilai rempah', x + 26, y + 242, '600 14px system-ui', 'rgba(244,234,210,0.8)');
      txt(String(goods), x + 274, y + 242, '700 14px system-ui', PR.PAPER, 'right');
      txt('Bonus set ×' + PR.completeSets(s.t.rack), x + 26, y + 270, '600 14px system-ui', 'rgba(244,234,210,0.8)');
      txt(String(PR.SET_BONUS * PR.completeSets(s.t.rack)), x + 274, y + 270, '700 14px system-ui', PR.PAPER, 'right');
      ctx.strokeStyle = '#8a6f35'; ctx.beginPath(); ctx.moveTo(x + 26, y + 292); ctx.lineTo(x + 274, y + 292); ctx.stroke();
      txt('TOTAL', x + 26, y + 330, '800 17px system-ui', PR.PAPER);
      txt(String(s.total), x + 274, y + 330, '900 26px system-ui', isWin ? PR.GOLD : PR.PAPER, 'right');
      txt('peringkat ' + (i + 1), x + 150, y + 372, '600 13px system-ui', 'rgba(244,234,210,0.65)', 'center');
    });
    rr(BTN.again.x, BTN.again.y, BTN.again.w, BTN.again.h, 10, '#8a2f27', '#ffd9d4', 2);
    txt('MAIN LAGI', 640, BTN.again.y + 33, '800 18px system-ui', '#ffe9e4', 'center');
  }

  function draw(S) {
    if (!ctx) return;
    ctx.fillStyle = '#0a0e15'; ctx.fillRect(0, 0, PR.W, PR.H);
    if (S.mode === 'title') return drawTitle(S);
    if (S.mode === 'intro') return drawIntro(S);
    if (S.mode === 'tally') return drawTally(S);
    /* top strip */
    txt('PASAR REMPAH', 14, 28, '800 16px system-ui', PR.GOLD);
    txt('RONDE  ' + Math.min(S.round, PR.ROUNDS) + ' / ' + PR.ROUNDS, 250, 27, '600 13px system-ui', '#e8ecf4');
    txt('FASE  ' + (S.phase === 'bid' ? 'MENAWAR' : S.phase === 'reveal' ? 'TAWARAN DIBUKA' : 'PEMENANG MENGAMBIL LOT'),
      420, 27, '600 13px system-ui', '#e8ecf4');
    txt(S.carriedCount ? 'LOT SERI MENUMPUK — ' + S.lot.length + ' KARTU' : 'LOT: ' + S.lot.length + ' KARTU',
      PR.PANEL_X - 14, 27, '800 13px system-ui', S.carriedCount ? '#ff8a80' : '#e8ecf4', 'right');
    table(); scale();
    sack(64, TOP + 522, '#c0392b'); sack(FW - 64, TOP + 522, '#d97b2f');
    marketBoard(S);
    aiZone(36, S.traders[1], S); aiZone(FW - 232, S.traders[2], S);
    lotCards(S);
    plaques(S);
    playerZone(S);
    particles(S);
  }

  return { draw, BTN, init(c) { ctx = c; } };
})();
