// Mac: percorso HTML5 (nessun ricevitore), overlay + animazione + aggiunta in lista
const L = require('./lib'); const fs = require('fs');
(async () => {
  const { app, w } = await L.open();
  await w.setViewportSize({ width: 1180, height: 900 });
  const md = require('path').join(L.ROOT, 'build', 'macdrop'); fs.mkdirSync(md, { recursive: true });
  /* un piccolo MOV con alfa generato con ffmpeg (deve essere nel PATH) */
  require('child_process').execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=320x180:d=1,format=rgba', '-c:v', 'qtrle', md + '/alfa.mov']);
  console.log('mac:', await w.evaluate(() => window.DCVT_MAC + ' helper=' + DROP.helper));
  await w.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.mov')); document.dispatchEvent(new DragEvent('dragenter', { dataTransfer: dt, bubbles: true })); });
  await w.waitForTimeout(600);
  console.log('overlay:', await w.evaluate(() => $('dropOv').style.display + ' ' + $('dropOv').className + ' | ' + $('dropL1').textContent + ' / ' + $('dropL2').textContent));
  await w.screenshot({ path: require('path').join(L.ROOT, 'build', 'mac_open.png') });
  // il drop reale passa da dropFilePaths (webUtils.getPathForFile); qui simulo i percorsi gia' risolti
  await w.evaluate((md) => { dropFilePaths = function () { return [md + '/alfa.mov', md]; };
    const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.mov')); document.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, clientX: 900, clientY: 200, bubbles: true, cancelable: true })); }, md);
  await w.waitForTimeout(400);
  console.log('durante:', await w.evaluate(() => $('dropL1').textContent + ' / ' + $('dropL2').textContent + ' anim=' + DROP.anim));
  await w.waitForTimeout(2500);
  console.log('dopo:', await w.evaluate(() => $('dropOv').style.display + ' tab=' + state.tab + ' lista=' + cv.items.map(i => i.path).join(',')));
  console.log('errori:', w.errs, await w.evaluate(() => DEBUG_ERRORS));
  await app.close();
})();
