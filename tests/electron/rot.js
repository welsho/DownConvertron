// fotogrammi della rotazione del mecha (apertura e chiusura dell'overlay di trascinamento)
const L = require('./lib'); const fs = require('fs');
(async () => {
  const { app, w } = await L.open();
  await w.setViewportSize({ width: 1000, height: 820 });
  const out = process.argv[2] || require('path').join(L.ROOT, 'build', 'test-rot'); fs.mkdirSync(out, { recursive: true });
  await w.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.mov')); document.dispatchEvent(new DragEvent('dragenter', { dataTransfer: dt, clientX: 700, clientY: 300, bubbles: true })); });
  const times = [0, 90, 180, 270, 320, 400, 490, 580, 640];
  let i = 0;
  for (const t of times) {
    await w.evaluate(tt => { for (const a of document.getAnimations()) { if (a.animationName && /^dz(Front|Back|Shade|fade)/.test(a.animationName)) { a.pause(); a.currentTime = tt; } } }, t);
    await w.screenshot({ path: out + '/in_' + (i++) + '.png' });
  }
  console.log('errori:', w.errs);
  await app.close();
})();
