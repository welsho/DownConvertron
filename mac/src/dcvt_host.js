/* DownConvertron per Mac - ponte native messaging per l'estensione Chrome (designed by Welsho)
   Copyright (C) 2026 Daniele Moretti (Welsho) - licenza GPL-3.0-or-later (vedi LICENSE)
   Gira con il motore dell'app (ELECTRON_RUN_AS_NODE=1, vedi dcvt_host.sh scritto da main.js) e Chrome lo avvia
   SOLO per l'estensione DownConvertron (allowed_origins). Stesso compito di windows/dcvt_host.ps1: riceve il login
   del sito (cookie Netscape) scelto con «Usa il mio login» e lo scrive in
   ~/Library/Application Support/DownConvertron/cookies/<token>.txt (solo il tuo utente puo' leggerlo).
   Protocollo di Chrome: 4 byte di lunghezza (little endian) + JSON UTF-8. Su stdout esce solo la risposta. */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const MAX = 1572864;
function reply(obj) {
  const b = Buffer.from(JSON.stringify(obj), "utf8"), h = Buffer.alloc(4);
  h.writeUInt32LE(b.length, 0);
  process.stdout.write(Buffer.concat([h, b]), () => process.exit(obj.ok ? 0 : 1));
}
const dirApp = process.platform === "darwin" ? path.join(os.homedir(), "Library", "Application Support", "DownConvertron")
  : path.join(process.env.APPDATA || path.join(os.homedir(), ".local", "share"), "DownConvertron");
function handle(msg) {
  const dir = path.join(dirApp, "cookies");
  if (msg.op === "ping") return { ok: true, v: 1 };
  if (msg.op !== "cookies") throw new Error("operazione sconosciuta");
  const tok = String(msg.token || ""), data = String(msg.data || "");
  if (!/^[a-z0-9]{16,64}$/.test(tok)) throw new Error("token non valido");
  if (data.indexOf("# Netscape HTTP Cookie File") !== 0) throw new Error("dati non validi");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  /* login vecchi rimasti (app chiusa di colpo): via dopo 6 ore */
  for (const f of fs.readdirSync(dir)) {
    try { const p = path.join(dir, f); if (/\.txt$/.test(f) && Date.now() - fs.statSync(p).mtimeMs > 6 * 3600 * 1000) fs.unlinkSync(p); } catch (e) {}
  }
  fs.writeFileSync(path.join(dir, tok + ".txt"), data, { encoding: "utf8", mode: 0o600 });
  return { ok: true };
}
let buf = Buffer.alloc(0), done = false;
function tryMsg() {
  if (done || buf.length < 4) return;
  const n = buf.readUInt32LE(0);
  if (n <= 0 || n > MAX) { done = true; reply({ ok: false, err: "messaggio troppo grande" }); return; }
  if (buf.length < 4 + n) return;
  done = true;
  try { reply(handle(JSON.parse(buf.slice(4, 4 + n).toString("utf8")))); }
  catch (e) { reply({ ok: false, err: String(e.message || e) }); }
}
process.stdin.on("data", (d) => { buf = Buffer.concat([buf, d]); tryMsg(); });
process.stdin.on("end", () => { if (!done) { done = true; reply({ ok: false, err: "messaggio incompleto" }); } });
