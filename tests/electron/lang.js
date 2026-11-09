// screenshot nelle tre lingue (entrambe le schede) e controllo dei testi rimasti in italiano
const L = require('./lib');
(async () => {
  const { app, w } = await L.open();
  await w.setViewportSize({ width: 1180, height: 1120 });
  const out = process.argv[2] || require('path').join(L.ROOT, 'build', 'test-shots');
  require('fs').mkdirSync(out, { recursive: true });
  for (const l of ['en', 'zh', 'it']) {
    await w.evaluate(x => setLang(x), l);
    await w.waitForTimeout(3200);
    for (const t of ['dl', 'cv']) {
      await w.evaluate(x => showTab(x), t); await w.waitForTimeout(300);
      await w.screenshot({ path: out + '/' + l + '_' + t + '.png' });
    }
    if (l !== 'it') {
      const left = await w.evaluate(() => {
        const r = [], walk = el => { for (let n = el.firstChild; n; n = n.nextSibling) {
          if (n.nodeType === 3) { const t = n.nodeValue.trim(); if (/\b(il|della|con|per|una|che|non|sono|alla|dei|delle|gli|nel|sul|tutti|scegli|premi)\b/i.test(t)) r.push(t.slice(0, 80)); }
          else if (n.nodeType === 1 && !/^(SCRIPT|STYLE|svg)$/i.test(n.tagName) && n.style.display !== 'none' && n.id !== 'logBody') walk(n); } };
        walk(document.body); return r; });
      console.log(l, 'testi italiani visibili:', left.length, JSON.stringify(left.slice(0, 15)));
    }
  }
  console.log('errori:', w.errs);
  await app.close();
})();
