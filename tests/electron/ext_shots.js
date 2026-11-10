// Screenshot dell'estensione Chrome per il README: il popup vero (extension/) aperto in Chromium senza finestra,
// con l'API chrome simulata (schede, link e immagini di esempio). Uso: node tests/electron/ext_shots.js docs/img
// (DCVT_CHROMIUM = eseguibile di Chromium da usare, se non quello di playwright)
// Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require(process.env.DCVT_PLAYWRIGHT || 'playwright');
const EXT = path.resolve(__dirname, '..', '..', 'extension');
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };

/* immagini di esempio della "pagina" (SVG generati qui) */
function figura(n) {
  const c = [['#ff7a18', '#af002d'], ['#00c6ff', '#0072ff'], ['#7cff6b', '#0b8f3a'], ['#f2c230', '#6b3a00']][n % 4];
  return '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><defs><linearGradient id="g" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
    '<rect width="320" height="200" fill="url(#g)"/><circle cx="' + (80 + n * 50) + '" cy="110" r="46" fill="rgba(255,255,255,0.35)"/></svg>';
}
/* /it/popup.html, /en/..., /zh/...: stessi file dell'estensione, lingua.js nella lingua della cartella */
const server = http.createServer((req, res) => {
  const m = /^\/(it|en|zh)\/([\w.-]+)$/.exec(req.url.split('?')[0]), f = /^\/pic\/(\d)\.svg$/.exec(req.url);
  if (f) { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(figura(+f[1])); return; }
  if (!m) { res.writeHead(404); res.end(); return; }
  if (m[2] === 'lingua.js') { res.writeHead(200, { 'Content-Type': TIPI['.js'] }); res.end('var DCVT_LANG = "' + m[1] + '";\n'); return; }
  const p = path.join(EXT, m[2]);
  if (!fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TIPI[path.extname(p)] || 'application/octet-stream' }); res.end(fs.readFileSync(p));
});

/* API chrome finta: due schede di siti video, una pagina con un link YouTube e quattro immagini grandi */
function finto(base) {
  const schede = [
    { id: 1, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Intro b-roll - YouTube' },
    { id: 2, url: 'https://vimeo.com/76979871', title: 'Timelapse citta' },
    { id: 3, url: 'https://www.example.com/galleria-foto', title: 'Galleria', active: true }];
  window.chrome = {
    tabs: { query: async (q) => (q && q.active ? [schede[2]] : schede), update: async () => {}, create: async () => {} },
    scripting: { executeScript: async () => [{ result: {
      link: [['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'Big Buck Bunny']],
      img: [0, 1, 2, 3].map((n) => [base + '/pic/' + n + '.svg', 'foto ' + (n + 1), [1920, 1280, 2400, 1600][n], [1080, 853, 1600, 900][n]]) } }] },
    downloads: { download: async () => 1, cancel: () => {}, onDeterminingFilename: { addListener: () => {} } }
  };
}

(async () => {
  const out = path.resolve(process.argv[2] || 'docs/img'); fs.mkdirSync(out, { recursive: true });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port, errori = [];
  const browser = await chromium.launch(process.env.DCVT_CHROMIUM ? { executablePath: process.env.DCVT_CHROMIUM } : {});
  const apri = async (lingua, modo, w, h) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(finto, base);
    await ctx.addInitScript((m) => { try { localStorage.setItem('dcvt_modo', m); localStorage.setItem('dcvt_ap', 'mp3|c320'); } catch (e) {} }, modo);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errori.push(lingua + ': ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') errori.push(lingua + ': ' + m.text()); });
    await p.goto(base + '/' + lingua + '/popup.html');
    await p.waitForFunction(() => /\d/.test(document.getElementById('stato').textContent));
    await p.waitForTimeout(400);
    return { ctx, p };
  };

  /* 1. le tre lingue affiancate, modo Solo audio, solo le schede scelte */
  const pezzi = [];
  for (const l of ['it', 'en', 'zh']) {
    const { ctx, p } = await apri(l, 'audio', 470, 760);
    const f = path.join(out, '_ext_' + l + '.png'); await p.screenshot({ path: f }); pezzi.push(f); await ctx.close();
  }
  const ctx3 = await browser.newContext({ viewport: { width: 1410, height: 760 } });
  const p3 = await ctx3.newPage();
  await p3.setContent('<body style="margin:0;background:#15181c;display:flex">' + pezzi.map((f) => '<img src="data:image/png;base64,' + fs.readFileSync(f).toString('base64') + '">').join('') + '</body>');
  await p3.screenshot({ path: path.join(out, 'estensione-chrome.png') });
  await ctx3.close(); pezzi.forEach((f) => fs.unlinkSync(f));

  /* 2. immagini della pagina: schede tolte, due immagini scelte, formato PNG per l'app */
  {
    const { ctx, p } = await apri('it', 'app', 470, 900);
    await p.evaluate(() => {
      for (const c of document.querySelectorAll('#schede input[type=checkbox]')) if (c.checked) c.click();
      const t = document.querySelectorAll('#immagini input[type=checkbox]'); t[0].click(); t[1].click();
      const s = document.getElementById('if'); s.value = 'png'; s.dispatchEvent(new Event('change'));
    });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(out, 'estensione-immagini.png'), fullPage: true });
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(errori.length ? 'errori:\n' + errori.join('\n') : 'estensione: screenshot fatti, nessun errore');
  process.exit(errori.length ? 1 : 0);
})();
