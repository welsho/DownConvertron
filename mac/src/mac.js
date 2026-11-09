/* DownConvertron per Mac (Apple Silicon) - funzioni di sistema al posto di quelle Windows (designed by Welsho)
   Copyright (C) 2026 Daniele Moretti (Welsho) - licenza GPL-3.0-or-later (vedi LICENSE)
   Caricato DOPO lo script dell'app: sostituisce solo processi, scelta file, componenti e percorsi.
   Tutta la logica di download/conversione resta quella dell'app Windows. */
(function () {
  "use strict";
  var M = window.MAC, fs = M.fs, path = M.path, cp = M.cp;
  var StringDecoder = require("string_decoder").StringDecoder;
  var IS_MAC = process.platform === "darwin";

  /* ---------- percorsi Mac puliti ---------- */
  DIR_APP = M.P(DIR_APP); DIR_APP_OLD = M.P(DIR_APP_OLD); DIR_APP_OLDER = M.P(DIR_APP_OLDER); DIR_APP_OLDEST = M.P(DIR_APP_OLDEST); DIR_TMP = M.P(DIR_TMP);
  FILE_SETTINGS = M.P(FILE_SETTINGS); FILE_ARCHIVE = M.P(FILE_ARCHIVE);
  state.folder = M.P(state.folder); cv.folder = M.P(cv.folder);
  MIN_ZOOM = 0.7;                                   /* sul Mac le misure sono gia' in punti: niente correzione DPI */
  dpiRatio = function () { return 1; };

  /* ---------- programmi: prima la cartella dell'app (e quelle delle versioni precedenti), poi Homebrew, poi il PATH ---------- */
  var TOOL_DIRS = [M.BIN, M.BIN_OLD, M.BIN_OLD2, "/opt/homebrew/bin", "/usr/local/bin"].concat(String(process.env.PATH || "").split(":"));
  function isExec(p) { try { var st = fs.statSync(p); return st.isFile() && (st.mode & 73) !== 0; } catch (e) { return false; } }
  findTool = function (name) {
    if (toolCache[name] && isExec(toolCache[name])) return toolCache[name];
    var n = String(name).replace(/\.exe$/i, ""), i;
    for (i = 0; i < TOOL_DIRS.length; i++) {
      if (!TOOL_DIRS[i] || TOOL_DIRS[i].charAt(0) !== "/") continue;     /* mai percorsi relativi */
      var p = path.join(TOOL_DIRS[i], n);
      if (isExec(p)) { toolCache[name] = p; return p; }
    }
    return "";
  };

  /* ---------- esecuzione: processo vero, output su log letto dal poll dell'app ---------- */
  runCommand = function (inner) {
    state.token = newToken();
    state.offset = 0; state.partial = ""; state.itemErrors = 0; state.itemDone = 0; state.lastErr = ""; state.lastHint = "";
    state.dec = new StringDecoder("utf8");
    var log = M.P(state.files.log), argv = M.fixArgs(M.tokenize(inner)), tok = state.token, fd, child, finished = false;
    tryDelete(log);
    try { fd = fs.openSync(log, "a"); }
    catch (e) { state.lastErr = "Impossibile creare il file di log: " + (e.message || e); stepDone(false); return; }
    function fin(ok) {
      if (finished) return; finished = true;
      try { fs.appendFileSync(log, "\n" + tok + (ok ? "_OK" : "_ERR") + "\n"); } catch (e) {}
      try { fs.closeSync(fd); } catch (e) {}
      if (state.child === child) state.child = null;
    }
    try {
      child = cp.spawn(argv[0], argv.slice(1), { detached: true, stdio: ["ignore", fd, fd], env: M.childEnv(), cwd: DIR_TMP });
    } catch (e) {
      try { fs.closeSync(fd); } catch (x) {}
      state.lastErr = "Impossibile avviare " + baseName(argv[0] || "") + ": " + (e.message || e); stepDone(false); return;
    }
    state.child = child;
    child.on("error", function (e) { try { fs.appendFileSync(log, "ERROR: impossibile avviare " + baseName(argv[0] || "") + ": " + (e.message || e) + "\n"); } catch (x) {} fin(false); });
    child.on("exit", function (code) { fin(code === 0); });
    state.startedAt = new Date().getTime();
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(poll, POLL_MS);
  };
  /* legge solo i byte nuovi del log; i caratteri UTF-8 spezzati a meta' vengono ricomposti */
  readNew = function () {
    var p = M.P(state.files.log), st;
    try { st = fs.statSync(p); } catch (e) { return ""; }
    if (st.size <= state.offset) return "";
    var len = st.size - state.offset, b = Buffer.alloc(len), fd = fs.openSync(p, "r");
    try { fs.readSync(fd, b, 0, len, state.offset); } finally { fs.closeSync(fd); }
    state.offset = st.size;
    return (state.dec || (state.dec = new StringDecoder("utf8"))).write(b);
  };
  /* annulla: termina il gruppo di processi del lavoro (yt-dlp con il suo ffmpeg, o lo scaricamento componenti) */
  killJob = function () {
    var c = state.child;
    if (!c || c.exitCode !== null || c.signalCode) return;
    try { process.kill(-c.pid, "SIGTERM"); } catch (e) { try { c.kill("SIGTERM"); } catch (x) {} }
    setTimeout(function () { try { if (c.exitCode === null && !c.signalCode) process.kill(-c.pid, "SIGKILL"); } catch (e) {} }, 2500);
  };

  /* chiudendo la finestra non restano processi orfani (yt-dlp/ffmpeg girano in un gruppo a parte) */
  window.addEventListener("unload", function () {
    var c = state.child;
    if (c && c.exitCode === null && (state.job === "download" || state.job === "convert")) { try { process.kill(-c.pid, "SIGKILL"); } catch (e) { try { c.kill("SIGKILL"); } catch (x) {} } }
  });
  /* sul Mac il simbolo % nei percorsi non e' un problema (niente cmd); le virgolette si' */
  safePath = function (p) { return String(p).indexOf('"') >= 0 ? "" : p; };

  /* ---------- scelta di file e cartelle con le finestre del Mac ---------- */
  var MEDIA_EXTS = ["mp4", "m4v", "mov", "qt", "mkv", "webm", "avi", "wmv", "flv", "mpg", "mpeg", "m2ts", "mts", "ts", "3gp", "ogv", "gif", "apng", "png", "mxf", "dv", "vob", "f4v", "asf",
                    "tif", "tiff", "exr", "jpg", "jpeg", "dpx", "tga", "bmp", "webp"];
  cvAddFiles = function () {
    if (state.busy) return;
    var list = M.ipc.sendSync("pick-files", { title: "Scegli i file da convertire", multi: true, filters: [{ name: "Video, animazioni e sequenze", extensions: MEDIA_EXTS }, { name: "Tutti i file", extensions: ["*"] }] });
    if (list && list.length) cvAddPaths(list);
  };
  importTxt = function () {
    if (state.busy) return;
    var r = M.ipc.sendSync("pick-files", { title: "Scegli il file .txt con i link", multi: false, filters: [{ name: "Testo", extensions: ["txt"] }] });
    if (r && r[0]) onFilePicked({ value: r[0] });
  };
  /* trascinamento: Electron fornisce il percorso completo di ogni file e cartella */
  dropFilePaths = function (ev) {
    var out = [], i, f = ev && ev.dataTransfer ? ev.dataTransfer.files : null;
    if (!f) return out;
    for (i = 0; i < f.length; i++) { try { var p = M.electron.webUtils.getPathForFile(f[i]); if (p) out.push(p); } catch (e) {} }
    return out;
  };
  /* incolla file copiati nel Finder (Cmd+C): elenco dei file dagli appunti */
  cvPasteFiles = function () {
    if (state.busy) return;
    var list = [];
    try {
      var x = M.electron.clipboard.read("NSFilenamesPboardType") || "", m, re = /<string>([^<]+)<\/string>/g;
      while ((m = re.exec(x))) list.push(m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'").replace(/&quot;/g, '"'));
      if (!list.length) { var u = M.electron.clipboard.read("public.file-url") || ""; if (/^file:/.test(u)) list.push(decodeURIComponent(u.replace(/^file:\/\//, ""))); }
    } catch (e) {}
    if (!list.length) { showMsg("Negli appunti non ci sono file: selezionali nel Finder, premi Cmd+C e poi \u00abIncolla file\u00bb.", "err"); return; }
    cvAddDropped(list);
  };
  /* percorsi mostrati all'utente con le barre del Mac */
  extDir = function () { return M.P(DIR_APP) + "/chrome-extension"; };
  var setBadgeWin = setBadge;
  setBadge = function (it, status, err) { return setBadgeWin(it, status, err ? String(err).replace(/\\/g, "/") : err); };
  /* estensione Chrome: icone scritte direttamente, pagina Estensioni aperta in Chrome */
  extWriteBinary = function (p, b64) { fs.writeFileSync(M.P(p), Buffer.from(b64, "base64")); };
  /* Chrome ignora gli indirizzi chrome:// aperti da fuori (open -a): uso AppleScript, che apre una scheda nuova
     sulla pagina Estensioni. La prima volta il Mac chiede il permesso di controllare Chrome: rispondi OK. */
  extOpenChrome = function () {
    if (!IS_MAC) return false;
    if (!fs.existsSync("/Applications/Google Chrome.app") && !fs.existsSync(path.join(process.env.HOME || "", "Applications/Google Chrome.app"))) return false;
    var scr = ['tell application "Google Chrome"', 'activate', 'if (count of windows) = 0 then make new window',
               'tell front window to make new tab with properties {URL:"chrome://extensions/"}', 'end tell'].join("\n");
    try {
      cp.execFile("/usr/bin/osascript", ["-e", scr], { timeout: 30000 }, function (err) {
        if (err) {
          DEBUG_ERRORS.push("estensione: AppleScript " + String(err.message || err).substring(0, 200));
          try { cp.spawn("/usr/bin/open", ["-a", "Google Chrome"], { detached: true, stdio: "ignore" }).unref(); } catch (x) {}
        }
        setTimeout(function () { try { extOpenFolder(); } catch (y) {} }, 700);
      });
    } catch (e) { return false; }
    return true;
  };
  /* spia LINK: connessione controllata con Node (la pagina non puo' fare richieste in rete) */
  sysNet = function () {
    var https = require("https"), done = false;
    var fin = function (ok) { if (done) return; done = true; var was = SYSST.net; SYSST.net = ok; SYSST.netAt = Date.now(); if (was !== ok) sysRender(); };
    try {
      var rq = https.get({ host: "www.youtube.com", path: "/generate_204", timeout: 10000 }, function (r) { fin(r.statusCode > 0); r.resume(); });
      rq.on("timeout", function () { rq.destroy(); fin(false); }); rq.on("error", function () { fin(false); });
    } catch (e) { fin(false); }
  };
  /* protocollo downconvertron:// (logo dell'estensione) */
  protoRegister = function () {};
  M.electron.ipcRenderer.on("proto", function (e, u) { try { protoArgs(u); } catch (x) {} });
  setTimeout(function () { try { var u = M.ipc.sendSync("proto-pending"); if (u) protoArgs(u); } catch (x) {} }, 1500);
  /* file nel cloud (Google Drive, iCloud, Dropbox): niente analisi subito, scaricherebbe il file intero */
  isLocalFixed = function (p) { return !/\/Library\/(CloudStorage|Mobile Documents)\//.test(M.P(p)); };
  /* immagini: primi byte del file (formato vero) e Content-Type di un link (curl -I, al massimo 15 secondi) */
  fileHead = function (p, n) {
    return fs.readFileSync(M.P(p)).slice(0, n).toString("latin1");   /* immagini: file piccoli, lettura intera accettabile */
  };
  urlContentType = function (url) {
    var curl = curlExe(), ct = "";
    if (!curl) return "";
    try {
      var r = cp.spawnSync(curl, ["-sIL", "--max-redirs", "10", "--connect-timeout", "10", "--max-time", "15", "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", String(url)], { encoding: "latin1", timeout: 20000 });
      var lines = String(r.stdout || "").split(/\r?\n/), i, m;
      for (i = 0; i < lines.length; i++) if ((m = /^content-type:\s*([^;\s]+)/i.exec(lines[i]))) ct = m[1].toLowerCase();
    } catch (e) { DEBUG_ERRORS.push("urlContentType: " + (e.message || e)); }
    return ct;
  };

  /* ---------- componenti: download diretto, niente Homebrew ---------- */
  COMPONENTS[1].why = "unisce audio e video e converte (VP9, Opus, ProRes, HAP, CineForm, WebP, EXR, chip Mac)";
  function shq(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }
  function setupScript() {
    var linuxTest = !IS_MAC;     /* solo per le prove su Linux */
    var v = {
      YT_URL: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/" + (linuxTest ? "yt-dlp_linux" : "yt-dlp_macos"),
      YT_NAME: linuxTest ? "yt-dlp_linux" : "yt-dlp_macos",
      YT_SUMS: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS",
      FF_BASE: process.env.DCVT_FFMPEG_BASE || "https://ffmpeg.martin-riedl.de/redirect/latest/macos/arm64/release",
      DENO_URL: "https://github.com/denoland/deno/releases/latest/download/deno-" + (linuxTest ? "x86_64-unknown-linux-gnu" : "aarch64-apple-darwin") + ".zip"
    }, k, head = [];
    for (k in v) head.push(k + "=" + shq(v[k]));
    return [
      "#!/bin/sh",
      "# DownConvertron - scaricamento componenti per Mac Apple Silicon",
      "BIN=\"$1\"; WORK=\"$BIN/.scarico\"",
      head.join("\n"),
      "if [ \"$(uname -s)\" = Darwin ] && [ \"$(uname -m)\" != arm64 ]; then echo \"ERROR: questo DownConvertron e' per Mac Apple Silicon (M1/M2/M3/M4)\"; exit 1; fi",
      "mkdir -p \"$BIN\" || { echo \"ERROR: impossibile creare la cartella $BIN\"; exit 1; }",
      "rm -rf \"$WORK\"; mkdir -p \"$WORK\" || exit 1",
      "get() { curl -fL --retry 2 --connect-timeout 20 --max-time 1200 -sS -o \"$2\" \"$1\"; }",
      "sums() { curl -fsSL --connect-timeout 20 --max-time 60 \"$1\" 2>/dev/null; }",
      "hash() { if command -v shasum >/dev/null 2>&1; then shasum -a 256 \"$1\" | cut -d' ' -f1; else sha256sum \"$1\" | cut -d' ' -f1; fi; }",
      "hex64() { printf '%s' \"$1\" | tr 'A-F' 'a-f' | grep -E '^[0-9a-f]{64}$'; }",
      "check() {",
      "  e=$(hex64 \"$2\")",
      "  if [ -z \"$e\" ]; then echo \"Impronta SHA-256 non pubblicata per $(basename \"$1\"): controllo saltato\"; return 0; fi",
      "  if [ \"$(hash \"$1\")\" = \"$e\" ]; then echo \"Impronta SHA-256 verificata: $(basename \"$1\")\"; return 0; fi",
      "  echo \"ERROR: impronta SHA-256 diversa per $(basename \"$1\"): file scartato\"; return 9",
      "}",
      "step_yt() {",
      "  echo \"Scarico yt-dlp da GitHub...\"",
      "  get \"$YT_URL\" \"$WORK/yt-dlp\" || return 2",
      "  check \"$WORK/yt-dlp\" \"$(sums \"$YT_SUMS\" | awk -v n=\"$YT_NAME\" '$2==n{print $1}' | head -1)\" || return 3",
      "  chmod 755 \"$WORK/yt-dlp\" || return 4",
      "  echo \"Prima apertura di yt-dlp (puo' richiedere qualche secondo)...\"",
      "  \"$WORK/yt-dlp\" --version || return 5",
      "  mv -f \"$WORK/yt-dlp\" \"$BIN/yt-dlp\" || return 6",
      "}",
      "step_ff() {",
      "  for t in ffmpeg ffprobe; do",
      "    echo \"Scarico $t per Apple Silicon...\"",
      "    get \"$FF_BASE/$t.zip\" \"$WORK/$t.zip\" || return 2",
      "    check \"$WORK/$t.zip\" \"$(sums \"$FF_BASE/$t.zip.sha256\" | awk '{print $1}' | head -1)\" || return 3",
      "    rm -rf \"$WORK/$t.d\"; mkdir -p \"$WORK/$t.d\"",
      "    unzip -o -q \"$WORK/$t.zip\" -d \"$WORK/$t.d\" || return 4",
      "    f=$(find \"$WORK/$t.d\" -type f -name \"$t\" | head -1)",
      "    [ -n \"$f\" ] || { echo \"ERROR: $t non trovato nello zip\"; return 5; }",
      "    chmod 755 \"$f\"; \"$f\" -hide_banner -version >/dev/null || return 6",
      "    mv -f \"$f\" \"$BIN/$t\" || return 7",
      "  done",
      "}",
      "step_deno() {",
      "  echo \"Scarico Deno da GitHub...\"",
      "  get \"$DENO_URL\" \"$WORK/deno.zip\" || return 2",
      "  check \"$WORK/deno.zip\" \"$(sums \"$DENO_URL.sha256sum\" | grep -oE '[0-9a-fA-F]{64}' | head -1)\" || return 3",
      "  rm -rf \"$WORK/deno.d\"; mkdir -p \"$WORK/deno.d\"",
      "  unzip -o -q \"$WORK/deno.zip\" -d \"$WORK/deno.d\" || return 4",
      "  chmod 755 \"$WORK/deno.d/deno\"; \"$WORK/deno.d/deno\" --version >/dev/null || return 5",
      "  mv -f \"$WORK/deno.d/deno\" \"$BIN/deno\" || return 6",
      "}",
      "run() { n=$1; name=$2; shift 2; echo \"SVSTEP $n $name install\"; \"$@\"; rc=$?; if [ $rc -eq 0 ]; then echo \"SVEXIT $n OK 0\"; else echo \"SVEXIT $n KO $rc\"; fi; }",
      "run 1 yt-dlp step_yt",
      "run 2 ffmpeg step_ff",
      "run 3 Deno step_deno",
      "rm -rf \"$WORK\"",
      "command -v xattr >/dev/null 2>&1 && xattr -dr com.apple.quarantine \"$BIN\" 2>/dev/null",
      "exit 0", ""
    ].join("\n");
  }
  installComponents = function (only) {
    if (state.busy) { if (state.job === "setup") cancel(); return false; }
    $("msg").style.display = "none";
    var want = function (c) { if (!only || !only.length) return true; for (var w = 0; w < only.length; w++) if (only[w] === c.name) return true; return false; };
    var st = componentState(), lines = [], i;
    for (i = 0; i < st.length; i++) if (want(st[i].c)) lines.push((st[i].path && !(st[i].incomplete && st[i].incomplete.length) ? "\u2022 aggiornare   " : "\u2022 installare   ") + st[i].c.name + "  (" + st[i].c.why + ")" + (st[i].incomplete && st[i].incomplete.length ? "  \u2014 mancano i codec " + encNames(st[i].incomplete) : ""));
    if (!confirmT("DownConvertron scaricher\u00e0 le ultime versioni ufficiali per Apple Silicon:\n\n" + lines.join("\n") +
        "\n\nyt-dlp e Deno da GitHub, ffmpeg dalle build per Mac di Martin Riedl (ffmpeg.martin-riedl.de). Ogni file viene controllato con la sua impronta SHA-256 quando \u00e8 pubblicata.\n" +
        "Vanno nella cartella di DownConvertron (" + M.BIN + "): niente Homebrew, niente password, circa 150 MB.\nPuoi interrompere con lo stesso pulsante.\n\nContinuare?")) return false;
    ensureDir(DIR_TMP);
    cleanupTmp();
    state.files = jobFiles("setup");
    var script = DIR_TMP + "/setup_" + newToken() + ".sh";
    /* clic su una spia: solo il componente di quella spia */
    var body = setupScript().split("\n").filter(function (l) { var m = /^run \d+ (\S+) /.exec(l); return !m || want({ name: m[1] }); }).join("\n");
    try { fs.writeFileSync(script, body, { mode: 448 }); }
    catch (e) { showMsg("Impossibile preparare lo scaricamento: " + (e.message || e), "err"); return false; }
    state.current = null; state.setupStep = 0; state.setupRes = {}; state.setupCode = {}; state.setupLast = {}; state.cancelled = false; state.setupTimeout = false;
    state.setupVerb = st;
    setBusy(true, "setup");
    var cb = $("compBtn"); cb.disabled = false; cb.className = "btn sm"; cb.innerText = "Annulla installazione";
    $("status").style.display = "block";
    $("overall").innerText = "Componenti: avvio dello scaricamento..."; $("fill").style.width = "0%"; $("pct").innerText = ""; $("spd").innerText = ""; $("file").innerText = "";
    runCommand('"/bin/sh" "' + script + '" "' + M.BIN + '"');
    return true;
  };

  /* ---------- formati con il chip del Mac (VideoToolbox) nel menu del convertitore ---------- */
  function addOpt(afterValue, value, text) {
    var sel = $("cvFmt"), i, ref = null;
    for (i = 0; i < sel.options.length; i++) if (sel.options[i].value === afterValue) ref = sel.options[i];
    if (!ref) return;
    var o = document.createElement("option"); o.value = value; o.text = text;
    ref.parentNode.insertBefore(o, ref.nextSibling);
  }
  addOpt("cfhd", "vthevcalpha", "MOV HEVC + alfa (Apple, chip Mac)");
  addOpt("mp4h265", "vthevc", "MP4 H.265 veloce (chip Mac)");
  addOpt("mp4h265", "vth264", "MP4 H.264 veloce (chip Mac)");

  /* testi pensati per Windows */
  try {
    var hints = document.querySelectorAll(".hint"), j;
    for (j = 0; j < hints.length; j++) if (/G:\\Il mio Drive/.test(hints[j].innerHTML))
      hints[j].innerHTML = hints[j].innerHTML.replace(/<b>Google Drive sul PC<\/b>: i file sono in <b>G:\\Il mio Drive<\/b>\./, "<b>Google Drive sul Mac</b>: nel Finder sotto <b>Google Drive</b>.");
  } catch (e) {}

  appInit();
})();
