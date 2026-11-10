// DownConvertron - verifica delle regole dei siti (dopo tools/gen_sites.py): compilazione in JS,
// Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
// URL di prova di yt-dlp riconosciuti, falsi positivi su pagine che non sono video.
const path = require('path'), W = path.join(__dirname, '..', 'build');
const items = require(path.join(W, 'sites_raw.json')), tests = require(path.join(W, 'tests.json')), fs = require('fs');
const ok = [], bad = [];
for (const [n, s, f] of items) { try { new RegExp(s, f); ok.push([n, s, f]); } catch (e) { bad.push(n + ': ' + e.message.slice(0, 80)); } }
const rx = ok.map(([n, s, f]) => [n, new RegExp(s, f)]);
let tot = 0, hit = 0, miss = [];
for (const n in tests) for (const u of tests[n]) { tot++; if (rx.some(([nm, r]) => r.test(u))) hit++; else miss.push(n + ' ' + u); }
console.log('compilate', ok.length, 'scartate', bad.length, '| URL di test riconosciuti', hit + '/' + tot, '(' + (100 * hit / tot).toFixed(1) + '%)');
console.log('esempi scartati:', bad.slice(0, 5));
console.log('esempi mancati:', miss.slice(0, 8));
// falsi positivi: pagine che NON sono video
const neg = ['https://www.google.com/search?q=gatti', 'https://mail.google.com/mail/u/0/#inbox', 'https://www.amazon.it/dp/B0CX', 'https://github.com/yt-dlp/yt-dlp', 'https://www.youtube.com/', 'https://www.repubblica.it/', 'https://www.wikipedia.org/wiki/Video', 'https://docs.google.com/document/d/abc/edit'];
for (const u of neg) { const m = rx.filter(([n, r]) => r.test(u)).map(x => x[0]); console.log('NEG', u, '->', m.join(',') || 'nessuno'); }
const pos = ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/shorts/abcdefghijk', 'https://www.youtube.com/playlist?list=PL123', 'https://vimeo.com/76979871', 'https://www.instagram.com/reel/C1abcDEF/', 'https://www.tiktok.com/@user/video/7300000000000000000', 'https://x.com/user/status/1790000000000000000', 'https://www.raiplay.it/video/2024/01/abc-123.html', 'https://soundcloud.com/artist/track', 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view'];
for (const u of pos) { const m = rx.filter(([n, r]) => r.test(u)).map(x => x[0]); console.log('POS', u, '->', m.slice(0, 3).join(',') || 'NESSUNO'); }
fs.writeFileSync(path.join(W, 'sites_ok.json'), JSON.stringify(ok));
