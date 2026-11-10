// screenshot dell'app: node shot.js out.png [larghezza altezza] [scheda]
// Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
const L = require('./lib');
(async () => {
  const { app, w } = await L.open();
  await w.setViewportSize({ width: +process.argv[3] || 1180, height: +process.argv[4] || 1000 });
  await w.evaluate(t => { try { fitToScreen(); } catch (e) {} if (t) showTab(t); }, process.argv[5] || '');
  await w.waitForTimeout(700);
  await w.screenshot({ path: process.argv[2] });
  console.log('errori:', w.errs);
  await app.close();
})();
