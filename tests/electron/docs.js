// Screenshot per la documentazione (README): app nelle tre lingue con contenuti di esempio,
// Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
// fotogrammi della rotazione del mecha a 30 fps (poi tools/make_gif.py li unisce nella GIF). Uso: DCVT_TEST_HOME=/Users/creator node docs.js docs/img
const L = require('./lib'); const fs = require('fs'); const path = require('path');
(async () => {
  const out = path.resolve(process.argv[2] || 'docs/img'); fs.mkdirSync(out, { recursive: true });
  const { app, w } = await L.open();
  await w.setViewportSize({ width: 1180, height: 1180 });
  const H = process.env.DCVT_TEST_HOME;
  await w.evaluate(h => {
    parseText("https://www.youtube.com/watch?v=dQw4w9WgXcQ | intro b-roll\nhttps://vimeo.com/76979871 | timelapse citta\nhttps://www.instagram.com/reel/C1abcDEF/ | overlay fire");
    cvAddPaths([h + "/Videos/lower-third alpha.mov", h + "/Videos/broll city drone.mp4", h + "/Videos/broll sunset timelapse.mp4", h + "/Videos/logo_sequence"], true);
    setSelect($("cvFmt"), "prores"); cvCheck(); SYSST.net = true; EXTCHK.st = "ok"; EXTCHK.ver = APP_VER; EXTCHK.prof = "Default"; EXTCHK.at = 9e15; sysRender();
  }, H);
  await w.waitForTimeout(3500);
  const shot = async (lang, tab, name) => {
    await w.evaluate(([l, t]) => {
      setLang(l); showTab(t); $("msg").style.display = "none";
      /* registro di esempio nella lingua dello screenshot */
      logClear(); SYSST.last = {};
      logEvent("app", T("DownConvertron {0} avviata. Cartella dati: {1}", APP_VER, DIR_APP));
      sysRender();
      logEvent("ext", T("Estensione {0}: {1} link ricevuti, {2} nuovi in lista{3}.", "7.0", 3, 3, " \u2022 " + T("Video {0} {1}", "MOV", "4K (2160p)")), "ok");
      logEvent("tool", "[youtube] dQw4w9WgXcQ: Downloading webpage");
      logEvent("tool", "[download] Destination: intro b-roll.mov");
      logEvent("app", T("Completato") + ": intro b-roll", "ok");
    }, [lang, tab]);
    await w.waitForTimeout(900);
    await w.screenshot({ path: path.join(out, name) });
  };
  await shot('it', 'dl', 'app-it-download.png');
  await shot('it', 'cv', 'app-it-converti.png');
  await shot('en', 'cv', 'app-en-convert.png');
  await shot('zh', 'dl', 'app-zh-download.png');
  await w.evaluate(() => setLang('it'));
  // rotazione del mecha: fotogrammi fermati con l'API delle animazioni
  await w.setViewportSize({ width: 900, height: 760 });
  await w.evaluate(() => { dropKeepAlive = function () {}; const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.mov')); document.dispatchEvent(new DragEvent('dragenter', { dataTransfer: dt, clientX: 640, clientY: 260, bubbles: true })); });
  const fr = path.join(out, '_frames'); fs.mkdirSync(fr, { recursive: true });
  const times = []; for (let t = 0; t <= 800; t += 1000 / 30) times.push(Math.round(t));   /* 30 fotogrammi al secondo */
  for (let i = 0; i < times.length; i++) {
    await w.evaluate(tt => { for (const a of document.getAnimations()) if (/^dz(Front|Back|Shade|fade)/.test(a.animationName || '')) { a.pause(); a.currentTime = tt; } }, times[i]);
    await w.screenshot({ path: path.join(fr, 'f' + i + '.png') });
  }
  console.log('errori:', w.errs);
  await app.close();
})();
