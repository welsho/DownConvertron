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
ipcMain.on("clip-write", (e, t) => { setImmediate(() => { try { clipboard.writeText(String(t || "")); } catch (x) {} }); });

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
app.whenReady().then(() => { buildMenu(); createWindow(); });
app.on("window-all-closed", () => app.quit());
