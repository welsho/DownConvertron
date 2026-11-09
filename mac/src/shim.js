/* DownConvertron per Mac - livello di compatibilita' (designed by Welsho)
   Copyright (C) 2026 Daniele Moretti (Welsho) - licenza GPL-3.0-or-later (vedi LICENSE)
   L'interfaccia e' la stessa dell'app Windows (HTA): qui ricreo con Node i pochi oggetti di Windows che usa
   (FileSystemObject, WScript.Shell, ADODB.Stream, Shell.Application, appunti), cosi' tutta la logica
   di download e conversione resta identica. I percorsi con "\" diventano percorsi Mac con "/". */
(function () {
  "use strict";
  var fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
  var electron = require("electron"), ipc = electron.ipcRenderer;

  var HOME = os.homedir();
  var SUPPORT = process.platform === "darwin" ? path.join(HOME, "Library", "Application Support") : path.join(HOME, ".local", "share");
  var ENV = {
    APPDATA: SUPPORT, LOCALAPPDATA: SUPPORT, USERPROFILE: HOME, TEMP: os.tmpdir(), TMP: os.tmpdir(),
    USERNAME: (function () { try { return os.userInfo().username; } catch (e) { return ""; } })(), SystemRoot: "/__windows__", ProgramW6432: "/__windows__/pf", ProgramFiles: "/__windows__/pf", PATH: process.env.PATH || ""
  };
  function expand(s) { return String(s).replace(/%([A-Za-z0-9_]+)%/g, function (m, k) { return ENV.hasOwnProperty(k) ? ENV[k] : m; }); }
  /* percorso Windows-style -> Mac: tutte le "\" diventano "/", doppie barre ridotte */
  function P(p) { return String(p == null ? "" : p).replace(/\\/g, "/").replace(/\/{2,}/g, "/"); }

  /* divide una riga di comando con le virgolette di Windows in argomenti */
  function tokenize(s) {
    var out = [], cur = "", inQ = false, has = false, i, c;
    s = String(s);
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (c === '"') { inQ = !inQ; has = true; continue; }
      if (!inQ && (c === " " || c === "\t")) { if (has || cur) { out.push(cur); cur = ""; has = false; } continue; }
      cur += c; has = true;
    }
    if (has || cur) out.push(cur);
    return out;
  }
  /* gli argomenti che sono percorsi (iniziano con "/") vengono normalizzati; filtri e opzioni restano intatti */
  function fixArgs(list) { var o = [], i; for (i = 0; i < list.length; i++) o.push(/^\//.test(list[i]) ? P(list[i]) : list[i]); return o; }

  /* ---------- Scripting.FileSystemObject ---------- */
  function decode(buf, format) {
    if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) return buf.slice(2).toString("utf16le");
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return buf.slice(3).toString("utf8");
    if (format === -1) return buf.toString("utf16le");
    return buf.toString("utf8");
  }
  function fileObj(p) {
    var st = fs.statSync(p);
    if (!st.isFile()) throw new Error("File non trovato: " + p);
    return {
      Path: p, Name: path.basename(p), ShortPath: p, Size: st.size, DateLastModified: st.mtime,
      Delete: function () { fs.unlinkSync(p); }
    };
  }
  function collection(items) { return { __items: items, Count: items.length }; }
  function folderObj(p) {
    var st = fs.statSync(p);
    if (!st.isDirectory()) throw new Error("Cartella non trovata: " + p);
    return {
      Path: p, Name: path.basename(p), ShortPath: p,
      get Files() {
        var names = [], i; try { names = fs.readdirSync(p); } catch (e) {}
        var o = []; for (i = 0; i < names.length; i++) { try { var q = path.join(p, names[i]); if (fs.statSync(q).isFile()) o.push(fileObj(q)); } catch (e) {} }
        return collection(o);
      },
      get SubFolders() {
        var names = [], i; try { names = fs.readdirSync(p); } catch (e) {}
        var o = []; for (i = 0; i < names.length; i++) { try { var q = path.join(p, names[i]); if (fs.statSync(q).isDirectory()) o.push(folderObj(q)); } catch (e) {} }
        return collection(o);
      },
      Delete: function () { fs.rmSync(p, { recursive: true, force: true }); }
    };
  }
  function textWriter(p, unicode, append) {
    var parts = [];
    return {
      Write: function (t) { parts.push(String(t)); },
      WriteLine: function (t) { parts.push(String(t) + "\r\n"); },
      Close: function () {
        var t = parts.join("");
        if (unicode) {
          var b = Buffer.from(t, "utf16le");
          fs[append ? "appendFileSync" : "writeFileSync"](p, append && fs.existsSync(p) ? b : Buffer.concat([Buffer.from([0xFF, 0xFE]), b]));
        } else fs[append ? "appendFileSync" : "writeFileSync"](p, t, "utf8");
      }
    };
  }
  function textReader(p, format) {
    var t = decode(fs.readFileSync(p), format), pos = 0;
    return {
      get AtEndOfStream() { return pos >= t.length; },
      ReadAll: function () { var r = t.substring(pos); pos = t.length; return r; },
      Read: function (n) { var r = t.substr(pos, n); pos += r.length; return r; },
      Skip: function (n) { pos += n; },
      ReadLine: function () { var e = t.indexOf("\n", pos), r; if (e < 0) { r = t.substring(pos); pos = t.length; } else { r = t.substring(pos, e); pos = e + 1; } return r.replace(/\r$/, ""); },
      Close: function () {}
    };
  }
  var FSO = {
    FileExists: function (p) { try { return fs.statSync(P(p)).isFile(); } catch (e) { return false; } },
    FolderExists: function (p) { try { return fs.statSync(P(p)).isDirectory(); } catch (e) { return false; } },
    CreateFolder: function (p) { fs.mkdirSync(P(p), { recursive: true }); return folderObj(P(p)); },
    CreateTextFile: function (p, overwrite, unicode) {
      p = P(p);
      if (overwrite === false && fs.existsSync(p)) throw new Error("Il file esiste gia': " + p);
      fs.writeFileSync(p, "");
      return textWriter(p, !!unicode, false);
    },
    OpenTextFile: function (p, mode, create, format) {
      p = P(p); mode = mode || 1;
      if (mode === 1) return textReader(p, format);
      if (!fs.existsSync(p) && !create) throw new Error("File non trovato: " + p);
      return textWriter(p, format === -1, mode === 8);
    },
    DeleteFile: function (p) { fs.unlinkSync(P(p)); },
    DeleteFolder: function (p) { fs.rmSync(P(p), { recursive: true, force: true }); },
    CopyFile: function (a, b, overwrite) {
      a = P(a); b = P(b);
      if (overwrite === false && fs.existsSync(b)) throw new Error("Il file esiste gia': " + b);
      fs.copyFileSync(a, b);
    },
    MoveFolder: function (a, b) {
      a = P(a); b = P(b);
      if (fs.existsSync(b)) throw new Error("La cartella esiste gia': " + b);
      fs.renameSync(a, b);
    },
    MoveFile: function (a, b) {
      a = P(a); b = P(b);
      if (fs.existsSync(b)) throw new Error("Il file esiste gia': " + b);
      try { fs.renameSync(a, b); }
      catch (e) { if (e.code !== "EXDEV") throw e; fs.copyFileSync(a, b, fs.constants.COPYFILE_EXCL); fs.unlinkSync(a); }
    },
    GetFile: function (p) { return fileObj(P(p)); },
    GetFolder: function (p) { return folderObj(P(p)); },
    GetFileName: function (p) { return path.basename(P(p)); },
    GetBaseName: function (p) { var b = path.basename(P(p)); var i = b.lastIndexOf("."); return i > 0 ? b.substring(0, i) : b; },
    GetExtensionName: function (p) { var e = path.extname(P(p)); return e ? e.substring(1) : ""; },
    GetParentFolderName: function (p) { p = P(p).replace(/\/+$/, ""); var d = path.dirname(p); return d === "." ? "" : d; },
    BuildPath: function (a, b) { return path.join(P(a), P(b)); },
    GetDriveName: function (p) { return "/"; },
    GetDrive: function () { return { DriveType: 2, VolumeName: "" }; }
  };

  /* ---------- WScript.Shell ---------- */
  var SH = {
    ExpandEnvironmentStrings: expand,
    RegRead: function () { throw new Error("Registro di Windows non disponibile sul Mac"); },
    Exec: function () { throw new Error("Exec non disponibile sul Mac"); },
    set CurrentDirectory(v) {}, get CurrentDirectory() { return HOME; },
    /* Run: riconosce i tre usi dell'app (comando con output su file, apertura cartella/file/link) */
    Run: function (cmd, style, wait) {
      var t = tokenize(cmd), exe = P(t[0] || "").toLowerCase(), name = exe.substring(exe.lastIndexOf("/") + 1);
      if (name === "explorer.exe" || name === "notepad.exe") {
        var target = t[1] || "";
        if (/^https:\/\//i.test(target)) ipc.sendSync("open-url", target); else ipc.sendSync("open-path", P(target));
        return 0;
      }
      if (name === "cmd.exe") {
        /* "cmd" /d /v:off /s /c ""programma" argomenti > "file" 2>&1" */
        var k = cmd.indexOf("/c ");
        if (k < 0) return 1;
        var inner = cmd.substring(k + 3).replace(/^\s*"/, "").replace(/"\s*$/, "");
        var a = tokenize(inner), out = "", j;
        for (j = 0; j < a.length; j++) if (a[j] === ">" && j + 1 < a.length) { out = P(a[j + 1]); a.splice(j, a[j + 2] === "2>&1" ? 3 : 2); break; }
        a = fixArgs(a);
        var r = cp.spawnSync(a[0], a.slice(1), { maxBuffer: 64 * 1024 * 1024, timeout: 120000, windowsHide: true, env: MAC.childEnv() });
        var text = Buffer.concat([r.stdout || Buffer.alloc(0), r.stderr || Buffer.alloc(0)]);
        if (out) fs.writeFileSync(out, text);
        return r.status === null ? 1 : r.status;
      }
      throw new Error("Comando non supportato sul Mac: " + name);
    }
  };

  /* ---------- ADODB.Stream (solo lettura di testo) ---------- */
  function Stream() {
    var buf = null, self = { Type: 2, Charset: "utf-8" };
    self.Open = function () {};
    self.LoadFromFile = function (p) { buf = fs.readFileSync(P(p)); };
    self.ReadText = function () { return buf ? decode(buf, 0) : ""; };
    self.Close = function () { buf = null; };
    return self;
  }

  /* ---------- Shell.Application: scelta della cartella ---------- */
  var SHELLAPP = {
    BrowseForFolder: function (hwnd, title) {
      var p = ipc.sendSync("pick-folder", String(title || ""));
      return p ? { Self: { Path: p } } : null;
    }
  };

  window.DCVT_MAC = true;
  window.ActiveXObject = function (name) {
    switch (String(name)) {
      case "Scripting.FileSystemObject": return FSO;
      case "WScript.Shell": return SH;
      case "ADODB.Stream": return Stream();
      case "Shell.Application": return SHELLAPP;
      default: throw new Error("Oggetto Windows non disponibile sul Mac: " + name);
    }
  };
  window.Enumerator = function (coll) {
    var items = coll && coll.__items ? coll.__items : [], i = 0;
    this.atEnd = function () { return i >= items.length; };
    this.moveNext = function () { i++; };
    this.item = function () { return items[i]; };
  };
  window.clipboardData = {
    getData: function () { return electron.clipboard.readText(); },
    /* scrittura dal processo principale, senza attendere: l'interfaccia non si blocca mai */
    setData: function (f, t) { ipc.send("clip-write", String(t)); return true; }
  };
  window.resizeTo = function (w, h) { ipc.sendSync("set-bounds", { width: w, height: h }); };
  window.moveTo = function (x, y) { ipc.sendSync("set-bounds", { x: x, y: y }); };

  /* strumenti per mac.js */
  var MAC = window.MAC = {
    fs: fs, path: path, os: os, cp: cp, electron: electron, ipc: ipc, P: P, tokenize: tokenize, fixArgs: fixArgs,
    SUPPORT: SUPPORT, HOME: HOME,
    BIN: path.join(SUPPORT, "DownConvertron", "bin"),
    BIN_OLD: path.join(SUPPORT, "DownLTransF" + "Mecchazzi", "bin"),
    BIN_OLD2: path.join(SUPPORT, "Mecchazzi", "bin"),
    childEnv: function () {
      var e = {}, k;
      for (k in process.env) if (Object.prototype.hasOwnProperty.call(process.env, k)) e[k] = process.env[k];
      /* le app aperte dal Finder hanno un PATH minimo: aggiungo i componenti e Homebrew */
      e.PATH = [MAC.BIN, MAC.BIN_OLD, MAC.BIN_OLD2, "/opt/homebrew/bin", "/usr/local/bin", e.PATH || "/usr/bin:/bin:/usr/sbin:/sbin"].join(":");
      e.LANG = e.LANG || "it_IT.UTF-8"; e.PYTHONIOENCODING = "utf-8";
      return e;
    }
  };
})();
