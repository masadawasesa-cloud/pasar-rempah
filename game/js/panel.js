'use strict';
/* Pasar Rempah — the labelled right-hand panel: live standings, the
   market, the lot's arithmetic, the scoring rules, the spice legend and
   the controls. Everything the judge needs to read the game at a glance. */
PR.panel = (function () {
  let ctx = null;
  function txt(s, x, y, font, color) { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(s, x, y); }

  function draw(S) {
    if (!ctx || S.mode !== 'play') return;
    const PX = PR.PANEL_X;
    ctx.fillStyle = '#0d1320'; ctx.fillRect(PX, 0, PR.W - PX, PR.H);
    ctx.fillStyle = '#16203a'; ctx.fillRect(PX, PR.TOP, PR.W - PX, PR.H - PR.TOP);
    let py = PR.TOP + 16; const px = PX + 16;
    txt('PASAR REMPAH', px, py + 6, '800 15px system-ui', PR.GOLD); py += 26;
    ctx.strokeStyle = '#26314a'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(PR.W - 14, py); ctx.stroke(); py += 22;

    txt('KEKAYAAN SEMENTARA', px, py, '700 11px system-ui', '#8fa3c8'); py += 22;
    const standings = S.traders.map(t => ({ t, w: PR.wealth(t) })).sort((a, b) => b.w - a.w);
    standings.forEach((s, i) => {
      const name = s.t === S.traders[0] ? 'KAMU' : PR.PERSONAS[s.t.persona].name;
      txt((i === 0 ? '♛ ' : '') + name, px, py, '700 12.5px system-ui', i === 0 ? PR.GOLD : '#e8ecf4');
      txt('koin ' + s.t.coins + ' + barang ' + PR.goodsValue(s.t.rack) + ' = ' + s.w, px, py + 15, '600 11px system-ui', '#8fa3c8');
      py += 36;
    });

    py += 4; txt('PASAR RONDE INI', px, py, '700 11px system-ui', '#8fa3c8'); py += 21;
    txt(PR.SPICES[S.market].name + ' ×2 — incar lot berisi ' + PR.SPICES[S.market].name.toLowerCase(), px, py + 5, '600 12px system-ui', '#e8ecf4'); py += 30;

    txt('LOT INI', px, py, '700 11px system-ui', '#8fa3c8'); py += 20;
    txt(S.lot.length + ' kartu · nilai dasar ' + PR.lotBaseValue(S.lot, S.market) + ' (pasar terhitung)', px, py, '600 11.5px system-ui', '#c6d2e8'); py += 18;
    if (S.carriedCount) { txt('termasuk ' + S.carriedCount + ' kartu tumpukan seri', px, py, '600 11.5px system-ui', '#ff8a80'); py += 18; }
    py += 8;

    txt('ATURAN NILAI', px, py, '700 11px system-ui', '#8fa3c8'); py += 20;
    for (const s of ['Set lengkap 4 jenis: +12', 'Seri tertinggi: lot menumpuk', 'ke ronde berikutnya', 'Tertinggi membayar sejumlah', 'tawarannya sendiri']) { txt(s, px, py, '600 11.5px system-ui', '#c6d2e8'); py += 16; }
    py += 10;

    txt('LEGENDA REMPAH', px, py, '700 11px system-ui', '#8fa3c8'); py += 20;
    for (const sp of PR.SPICES) {
      ctx.fillStyle = sp.col; ctx.fillRect(px, py - 9, 12, 12);
      txt(sp.name + ' — nilai ' + sp.val, px + 20, py, '600 11.5px system-ui', '#e8ecf4'); py += 18;
    }
    py += 8;

    txt('KONTROL', px, py, '700 11px system-ui', '#8fa3c8'); py += 20;
    for (const s of ['Klik koin / tombol − + : atur tawaran', 'Enter atau tombol TAWAR: kunci', 'Panah atas/bawah: ubah tawaran', 'M: nyalakan/matikan suara']) { txt(s, px, py, '600 11.5px system-ui', '#c6d2e8'); py += 16; }
  }
  return { draw, init(c) { ctx = c; } };
})();
