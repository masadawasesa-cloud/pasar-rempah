'use strict';
/* Pasar Rempah — mouse + keyboard. Clicks are queued as canvas-space
   points; game.js hit-tests them against the buttons it lays out. */
PR.input = (function () {
  const clicks = [];
  const keys = {};
  let mx = 0, my = 0;
  function toGame(e, canvas) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (PR.W / r.width), y: (e.clientY - r.top) * (PR.H / r.height) };
  }
  return {
    clicks, keys,
    attach(canvas) {
      canvas.addEventListener('mousemove', e => { const p = toGame(e, canvas); mx = p.x; my = p.y; });
      canvas.addEventListener('mousedown', e => { PR.audio.unlock(); clicks.push(toGame(e, canvas)); });
      window.addEventListener('keydown', e => {
        keys[e.key] = true;
        if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
      });
      window.addEventListener('keyup', e => { keys[e.key] = false; });
    },
    mouse() { return { x: mx, y: my }; },
    pressed(key) { const p = !!keys[key]; keys[key] = false; return p; },
  };
})();
