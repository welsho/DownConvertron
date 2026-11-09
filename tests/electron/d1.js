// prova del protocollo HTA <-> ricevitore (il ricevitore e' simulato: scrive i file come farebbe lui)
const L = require('./lib'); const fs = require('fs'); const path = require('path');
(async () => {
  const { app, w } = await L.open();
  await w.setViewportSize({ width: 1180, height: 940 });
  const dir = require('path').join(L.ROOT, 'build', 'test-xchg'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dir + '/ready.flag', '1');
  await w.evaluate(d => { window.DCVT_MAC = false; DROP.helper = 'starting'; DROP.dir = d; window.__added = null; cvAddDropped = function (p) { window.__added = p; }; }, dir);
  const fire = async (type) => w.evaluate(t => { const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.mov')); const e = new DragEvent(t, { dataTransfer: dt, clientX: 300, clientY: 300, bubbles: true, cancelable: true }); document.dispatchEvent(e); }, type);
  await fire('dragenter'); await w.waitForTimeout(120); await fire('dragover');
  const show = fs.existsSync(dir + '/show.txt') ? fs.readFileSync(dir + '/show.txt', 'utf8') : 'MANCANTE';
  console.log('show.txt =', show, '| overlay', await w.evaluate(() => $('dropOv').style.display + ' ' + $('dropOv').className + ' helper=' + DROP.helper));
  await w.waitForTimeout(500); await w.screenshot({ path: require('path').join(L.ROOT, 'build', 't_open.png') });
  fs.unlinkSync(dir + '/show.txt');               // il ricevitore l'ha raccolto
  fs.writeFileSync(dir + '/in.flag', '1'); await w.waitForTimeout(200);
  console.log('hot:', await w.evaluate(() => $('dropOv').className));
  await w.screenshot({ path: require('path').join(L.ROOT, 'build', 't_hot.png') });
  fs.unlinkSync(dir + '/in.flag');
  fs.writeFileSync(dir + '/drop_1_1.txt', '@250,260\nC:\\Users\\welsh\\Videos\\sigla V7.mov\nC:\\Users\\welsh\\Videos\\logo.mov\n');
  await w.waitForTimeout(260); await w.screenshot({ path: require('path').join(L.ROOT, 'build', 't_fly1.png') });
  await w.waitForTimeout(330); await w.screenshot({ path: require('path').join(L.ROOT, 'build', 't_fly2.png') });
  await w.waitForTimeout(1300);
  console.log('aggiunti:', JSON.stringify(await w.evaluate(() => window.__added)), '| overlay', await w.evaluate(() => $('dropOv').style.display), '| file rimasti', fs.readdirSync(dir).join(','));
  // secondo giro: uscita senza rilascio
  await fire('dragenter'); await w.waitForTimeout(100);
  fs.existsSync(dir + '/show.txt') && fs.unlinkSync(dir + '/show.txt');
  fs.writeFileSync(dir + '/leave.flag', '1'); await w.waitForTimeout(600);
  console.log('dopo leave:', await w.evaluate(() => $('dropOv').style.display + ' signaled=' + DROP.signaled));
  // terzo giro: ricevitore morto (show.txt non raccolto)
  await fire('dragenter'); await w.waitForTimeout(2600);
  console.log('ricevitore morto:', await w.evaluate(() => $('dropOv').style.display + ' helper=' + DROP.helper));
  // link di testo
  await w.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'); document.dispatchEvent(new DragEvent('dragenter', { dataTransfer: dt, bubbles: true })); });
  await w.waitForTimeout(300);
  console.log('link:', await w.evaluate(() => $('dropOv').className + ' ' + $('dropL1').textContent));
  console.log('errori pagina:', w.errs.filter(e => !/favicon/.test(e)).slice(0, 5));
  await app.close();
})();
