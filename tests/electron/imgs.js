// immagini singole (misure e formati diversi) -> GIF e MP4, un fotogramma per immagine
// Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
const L = require('./lib'); const fs = require('fs'); const path = require('path');
(async () => {
  const { app, w } = await L.open();
  const d = path.join(L.ROOT, 'build', 'imgs'), out = path.join(d, 'out'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
  const r = await w.evaluate(([d, out]) => {
    showTab('cv'); cv.items = []; cvAddPaths([d + '/b_02.png', d + '/a_10.jpg', d + '/c_3.png'], true);
    cv.folder = out; setSelect($('cvOutMode'), 'folder'); setSelect($('cvCanvas'), ''); setSelect($('cvLoop'), '1'); $('cvBounce').checked = false;
    return cv.items.map(i => i.kind + ' | ' + i.title + ' | ' + (i.info ? i.info.w + 'x' + i.info.h + ' ' + i.info.dur + 's' : '-'));
  }, [d, out]);
  console.log(r);
  for (const fmt of ['gif', 'mp4h264']) {
    await w.evaluate(f => { setSelect($('cvFmt'), f); setSelect($('cvSeqFps'), '24'); cvCheck(); for (const it of cv.items) it.status = 'wait'; cvStart(); }, fmt);
    await L.waitIdle(w, 60000);
  }
  console.log(fs.readdirSync(out), await w.evaluate(() => cv.items.map(i => i.status + ' ' + i.error)));
  await app.close();
})();
