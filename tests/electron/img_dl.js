// download di immagini da link diretti (curl), anche con il nome scelto e senza yt-dlp in lista
// Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
// serve le immagini da sé (server http locale sulla porta 8799); le crea con ffmpeg
const L = require('./lib'); const fs = require('fs'); const path = require('path');
const http = require('http'); const { execFileSync } = require('child_process');
(async () => {
  const www = path.join(L.ROOT, 'build', 'www'); fs.mkdirSync(www, { recursive: true });
  for (const [n, c] of [['foto prova.png', 'blue'], ['rosso.jpg', 'red']])
    if (!fs.existsSync(path.join(www, n))) execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=' + c + ':s=320x240', '-frames:v', '1', path.join(www, n)]);
  const srv = http.createServer((q, r) => {
    const f = path.join(www, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, ''));
    if (!f.startsWith(www) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200); fs.createReadStream(f).pipe(r);
  }).listen(8799, '127.0.0.1');
  const { app, w } = await L.open();
  const out = path.join(L.ROOT, 'build', 'img_dl'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
  await w.evaluate(o => { state.folder = o; state.items = []; showTab('dl');
    parseText("http://127.0.0.1:8799/foto%20prova.png\nhttp://127.0.0.1:8799/rosso.jpg | mio nome\nhttp://127.0.0.1:8799/manca.png"); startQueue(); }, out);
  await L.waitIdle(w, 30000);
  console.log(fs.readdirSync(out), await w.evaluate(() => state.items.map(i => i.status + ' ' + (i.error || ''))));
  console.log(await w.evaluate(() => $('msg').innerText));
  await app.close(); srv.close();
})();
