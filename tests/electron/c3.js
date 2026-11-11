// DownConvertron - prova automatica dell'app Electron. Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
const L = require('./lib.js'), fs = require('fs');
(async () => {
  const { app, w } = await L.open();
  await w.evaluate(() => { clearQueue(); showTab('cv'); require('electron').clipboard.writeText('#DCVT-LINKS v2\nhttps://www.youtube.com/watch?v=aqz-KE-bpKQ | Bunny prova\nhttps://vimeo.com/76979871\n'); });
  await w.waitForTimeout(2500);
  console.log(JSON.stringify(await w.evaluate(() => ({ tab: state.tab, items: state.items.map(i => i.url + ' | ' + i.name), msg: $('msg').innerText, clip: require('electron').clipboard.readText().slice(0, 40) }))));
  await w.waitForTimeout(2000);
  console.log('dopo altri 2s:', await w.evaluate(() => state.items.length));
  await w.evaluate(() => extInstall());
  const d = await w.evaluate(() => MAC.P(extDir()));
  console.log('cartella', d, fs.readdirSync(d).join(' '), fs.statSync(d + '/icon128.png').size, JSON.parse(fs.readFileSync(d + '/manifest.json')).name);
  await w.screenshot({ path: require('path').join(L.ROOT, 'build', 'ext_info.png') });
  console.log('errs', w.errs, await w.evaluate(() => DEBUG_ERRORS));
  await app.close();
})();
