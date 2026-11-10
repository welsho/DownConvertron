// spia COMPONENTI = estensione Chrome: senza Chrome, Chrome senza estensione, estensione installata (profilo finto)
// Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
const L = require('./lib'); const fs = require('fs'); const path = require('path');
(async () => {
  const home = process.env.DCVT_TEST_HOME || path.join(L.ROOT, 'build', 'test-home');
  const prof = path.join(home, 'Library', 'Application Support', 'Google', 'Chrome', 'Default');
  fs.rmSync(path.join(home, 'Library', 'Application Support', 'Google'), { recursive: true, force: true });
  const { app, w } = await L.open();
  await w.setViewportSize({ width: 930, height: 1000 });
  const st = async () => w.evaluate(() => { extCheck(true); sysRender(); return EXTCHK.st + ' | ' + $('sysComp').className + ' | ' + $('sysComp').title; });
  await w.waitForTimeout(4200);
  console.log('cartella estensione:', await w.evaluate(() => extFolderVersion() + ' ' + extDir()));
  console.log('1', await st());
  fs.mkdirSync(prof, { recursive: true }); fs.writeFileSync(path.join(prof, 'Secure Preferences'), '{"extensions":{"settings":{}}}');
  console.log('2', await st());
  const dir = await w.evaluate(() => extDir());
  fs.writeFileSync(path.join(prof, 'Secure Preferences'), JSON.stringify({ extensions: { settings: { abc: { path: dir, location: 4 } } } }));
  console.log('3', await st());
  await w.screenshot({ path: path.join(L.ROOT, 'build', 'comp.png') });
  console.log('header:', await w.evaluate(() => { const t = $('logTabs'); return [$('logTtl').style.display, $('logTtl').innerText, t.scrollWidth, t.clientWidth].join(' '); }));
  await app.close();
})();
