/* DownConvertron per Mac - processo principale di Electron (designed by Welsho)
   Copyright (C) 2026 Daniele Moretti (Welsho) - licenza GPL-3.0-or-later (vedi LICENSE)
   Apre una sola finestra con l'interfaccia locale. Nessun contenuto remoto viene caricato. */
"use strict";
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, screen, clipboard } = require("electron");
const path = require("path");

app.setName("DownConvertron");
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;

function createWindow() {
  const wa = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    x: wa.x + Math.max(0, Math.round((wa.width - Math.min(1200, wa.width)) / 2)), y: wa.y,
    width: Math.min(1200, wa.width), height: wa.height,
    minWidth: 640, minHeight: 480,
    backgroundColor: "#030504", title: "DownConvertron", show: false,
    webPreferences: {
      /* l'interfaccia locale usa Node per lanciare yt-dlp e ffmpeg: nessuna pagina web esterna viene mai aperta qui */
      nodeIntegration: true, contextIsolation: false, sandbox: false, spellcheck: false,
      webSecurity: true, allowRunningInsecureContent: false
    }
  });
  win.loadFile(path.join(__dirname, "index.html"));
  win.once("ready-to-show", () => win.show());
  /* niente navigazione fuori dall'app: i link http si aprono nel browser */
  win.webContents.on("will-navigate", (e, url) => { e.preventDefault(); if (/^https:\/\//i.test(url)) shell.openExternal(url); });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) shell.openExternal(url); return { action: "deny" }; });
  /* lavoro in corso: l'interfaccia chiede conferma prima di chiudere (in Electron va mostrata da qui) */
  win.webContents.on("will-prevent-unload", (e) => {
    const c = dialog.showMessageBoxSync(win, { type: "question", buttons: ["Chiudi comunque", "Resta aperto"], defaultId: 1, cancelId: 1,
      message: "C'\u00e8 un lavoro in corso.", detail: "Se chiudi DownConvertron adesso, il download o la conversione in corso viene annullato." });
    if (c === 0) e.preventDefault();
  });
  win.on("closed", () => { win = null; });
  /* finestra di nuovo davanti (per esempio dopo un invio dall'estensione): copia degli appunti aggiornata subito */
  win.on("focus", () => clipRefresh());
  clipRefresh();
}

/* ---------- servizi richiesti dall'interfaccia (sincroni, come in Windows) ---------- */
ipcMain.on("pick-folder", (e, title) => {
  const r = dialog.showOpenDialogSync(win, { title: String(title || ""), message: String(title || ""), properties: ["openDirectory", "createDirectory"] });
  e.returnValue = r && r[0] ? r[0] : "";
});
ipcMain.on("pick-files", (e, opts) => {
  opts = opts || {};
  const r = dialog.showOpenDialogSync(win, {
    title: String(opts.title || ""), message: String(opts.title || ""),
    properties: ["openFile"].concat(opts.multi ? ["multiSelections"] : []),
    filters: opts.filters || []
  });
  e.returnValue = r || [];
});
ipcMain.on("set-bounds", (e, b) => {
  try {
    if (win && b) {
      const wa = screen.getDisplayMatching(win.getBounds()).workArea, cur = win.getBounds();
      const w = Math.max(640, Math.min(wa.width, Math.round(b.width || cur.width)));
      const h = Math.max(480, Math.min(wa.height, Math.round(b.height || cur.height)));
      const x = b.x === undefined ? cur.x : wa.x + Math.max(0, Math.min(wa.width - w, Math.round(b.x)));
      const y = b.y === undefined ? cur.y : wa.y + Math.max(0, Math.min(wa.height - h, Math.round(b.y)));
      win.setBounds({ x, y, width: w, height: h });
    }
  } catch (x) {}
  e.returnValue = true;
});
/* rispondo subito all'interfaccia e apro dopo: aprire file, link o scrivere negli appunti non deve mai bloccare la finestra */
ipcMain.on("open-path", (e, p) => { e.returnValue = true; setImmediate(() => { shell.openPath(String(p || "")).catch(() => {}); }); });
ipcMain.on("open-url", (e, u) => { e.returnValue = true; if (/^https:\/\//i.test(String(u))) setImmediate(() => { shell.openExternal(String(u)).catch(() => {}); }); });
/* appunti: da Electron 44 la pagina non puo' piu' usarli e qui sono asincroni (Promise). Tengo una copia del testo
   e la do subito all'interfaccia, che resta sincrona come in Windows; la copia si aggiorna dopo ogni lettura
   (l'app controlla gli appunti ogni 1,5 s) e quando la finestra torna davanti. Durante una scrittura non la rileggo,
   cosi' non torna il testo vecchio */
let clipText = "", clipReading = false, clipWriting = 0, clipGen = 0;
function clipRefresh() {
  if (clipReading || clipWriting) return;
  clipReading = true;
  const gen = clipGen;   /* una scrittura arrivata mentre leggevo rende vecchia questa lettura */
  Promise.resolve().then(() => clipboard.readText())
    .then((t) => { if (!clipWriting && gen === clipGen) clipText = String(t || ""); }, () => {})
    .then(() => { clipReading = false; });
}
ipcMain.on("clip-read", (e) => { e.returnValue = clipText; clipRefresh(); });
ipcMain.on("clip-write", (e, t) => {
  clipText = String(t || ""); clipWriting++; clipGen++;
  setImmediate(() => {
    Promise.resolve().then(() => clipboard.writeText(clipText)).catch(() => {})
      .then(() => { clipWriting--; });
  });
});
/* «Incolla file» (Cmd+C nel Finder): i file arrivano come text/uri-list (URI file://) */
ipcMain.handle("clip-files", async () => {
  const { fileURLToPath } = require("url");
  try {
    for (const it of await clipboard.read()) {
      if ((it.types || []).indexOf("text/uri-list") < 0) continue;
      const b = await it.getType("text/uri-list"), t = typeof b === "string" ? b : await b.text();
      return t.split(/\r?\n/).filter((l) => /^file:/i.test(l)).map((l) => { try { return fileURLToPath(l); } catch (x) { return ""; } }).filter(Boolean);
    }
  } catch (x) {}
  return [];
});

/* menu: serve anche per Copia/Incolla con Cmd+C / Cmd+V nei campi di testo */
function buildMenu() {
  const t = [
    { label: "DownConvertron", submenu: [
      { role: "about", label: "Informazioni su DownConvertron" }, { type: "separator" },
      { role: "hide", label: "Nascondi DownConvertron" }, { role: "hideOthers", label: "Nascondi altre" }, { role: "unhide", label: "Mostra tutte" },
      { type: "separator" }, { role: "quit", label: "Esci da DownConvertron" }] },
    { label: "Modifica", submenu: [
      { role: "undo", label: "Annulla" }, { role: "redo", label: "Ripeti" }, { type: "separator" },
      { role: "cut", label: "Taglia" }, { role: "copy", label: "Copia" }, { role: "paste", label: "Incolla" }, { role: "selectAll", label: "Seleziona tutto" }] },
    { label: "Finestra", submenu: [
      { role: "minimize", label: "Contrai" }, { role: "zoom", label: "Ridimensiona" },
      { type: "separator" }, { role: "toggleDevTools", label: "Strumenti di diagnosi" }] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(t));
}

app.setAboutPanelOptions({ applicationName: "DownConvertron", applicationVersion: app.getVersion(), copyright: "designed by Welsho \u00b7 \u00a9 2026 Daniele Moretti \u00b7 GPL-3.0" });
/* apertura dal logo dell'estensione Chrome: link downconvertron:// (registrato anche nell'Info.plist) */
let pendingProto = "";
function deliverProto(u) {
  if (!/^downconvertron:\/\//i.test(String(u || ""))) return;
  if (win && !win.webContents.isLoading()) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); win.webContents.send("proto", String(u)); }
  else pendingProto = String(u);
}
app.setAsDefaultProtocolClient("downconvertron");
app.on("open-url", (e, u) => { e.preventDefault(); deliverProto(u); });
ipcMain.on("proto-pending", (e) => { e.returnValue = pendingProto; pendingProto = ""; });
app.on("second-instance", (e, argv) => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } (argv || []).forEach(deliverProto); });
/* «Usa il mio login» dell'estensione Chrome: ponte native messaging (dcvt_host.js) registrato per il tuo utente a ogni
   avvio, cosi' segue l'app anche se la sposti. Chrome lo avvia solo per l'estensione DownConvertron (ID fisso dalla chiave) */
const EXT_ID = "pebnkaehmjjlhikgbcidlhkjjgonagei", NMH_NAME = "com.welsho.downconvertron";
function nmhRegister() {
  try {
    const fs = require("fs"), sup = app.getPath("appData"), dir = path.join(sup, "DownConvertron", "nmhost");
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const js = path.join(dir, "dcvt_host.js"), sh = path.join(dir, "dcvt_host.sh");
    const q = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
    fs.writeFileSync(js, fs.readFileSync(path.join(__dirname, "dcvt_host.js")));
    fs.writeFileSync(sh, "#!/bin/sh\nELECTRON_RUN_AS_NODE=1 exec " + q(process.execPath) + " " + q(js) + "\n", { mode: 0o700 });
    fs.chmodSync(sh, 0o700);
    const man = JSON.stringify({ name: NMH_NAME, description: "DownConvertron", path: sh, type: "stdio", allowed_origins: ["chrome-extension://" + EXT_ID + "/"] }, null, 1);
    /* solo nei Chrome presenti (cartella del profilo gia' esistente) */
    for (const b of ["Google/Chrome", "Google/Chrome Beta", "Chromium"]) {
      const base = path.join(sup, b);
      if (!fs.existsSync(base)) continue;
      fs.mkdirSync(path.join(base, "NativeMessagingHosts"), { recursive: true });
      fs.writeFileSync(path.join(base, "NativeMessagingHosts", NMH_NAME + ".json"), man);
    }
  } catch (e) { /* senza ponte l'estensione manda i link senza login e lo scrive nel registro */ }
}
app.whenReady().then(() => { buildMenu(); createWindow(); nmhRegister(); });
app.on("window-all-closed", () => app.quit());
