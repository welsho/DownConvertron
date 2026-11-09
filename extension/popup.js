/* DownConvertron - estensione Chrome (designed by Welsho)
   Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later

   Raccoglie i link delle schede aperte e della pagina corrente, tiene solo quelli dei siti supportati
   da yt-dlp (stesse regole di riconoscimento, generate dal suo elenco) e li copia negli appunti con
   un'intestazione: l'app la riconosce, applica le impostazioni rapide scelte qui (video / solo audio)
   e mette i link nella lista dei download. Il download lo avvii tu nell'app.
   Il logo apre DownConvertron con il collegamento downconvertron:// registrato dall'app. */
"use strict";
const VERS = "7.0";
const MARCATORE = "#DCVT-LINKS v2";
const FILE_DIRETTO = /\.(mp4|m4v|mov|webm|mkv|avi|m3u8|mpd|mp3|m4a|aac|ogg|opus|flac|wav)(\?|#|$)/i;
const FILE_IMMAGINE = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|heic|svg)(\?|#|$)/i;
const LANG = (typeof DCVT_LANG === "string" && DCVT_TESTI[DCVT_LANG]) ? DCVT_LANG : "it";
let REGOLE = null;
const voci = { schede: [], pagina: [], immagini: [] };

function t(k) {
  let s = (DCVT_TESTI[LANG] && DCVT_TESTI[LANG][k]) || DCVT_TESTI.it[k] || k;
  for (let i = 1; i < arguments.length; i++) s = s.split("{" + (i - 1) + "}").join(String(arguments[i]));
  return s;
}
function memo(k, v) {
  try { if (v === undefined) return localStorage.getItem("dcvt_" + k); localStorage.setItem("dcvt_" + k, v); } catch (e) { return null; }
}
/* registro dell'estensione: le voci viaggiano con il prossimo invio e finiscono nello schermo dell'app */
function registra(testo) {
  let l = [];
  try { l = JSON.parse(memo("log") || "[]"); } catch (e) {}
  const d = new Date(), p = n => (n < 10 ? "0" : "") + n;
  l.push(p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()) + " " + String(testo).replace(/[\r\n]+/g, " "));
  memo("log", JSON.stringify(l.slice(-30)));
}
function regole() {
  if (!REGOLE) {
    REGOLE = [];
    for (const [nome, src, fl] of (window.DCVT_SITES || [])) { try { REGOLE.push([nome, new RegExp(src, fl)]); } catch (e) { /* regola non valida in JS: saltata */ } }
  }
  return REGOLE;
}
const NOMI = { youtube: "YouTube", vimeo: "Vimeo", Instagram: "Instagram", TikTok: "TikTok", twitter: "X / Twitter", facebook: "Facebook",
               twitch: "Twitch", dailymotion: "Dailymotion", soundcloud: "SoundCloud", Bandcamp: "Bandcamp", reddit: "Reddit", GoogleDrive: "Drive" };
/* sito supportato? restituisce il nome da mostrare, oppure "" */
function riconosci(u) {
  let url;
  try { url = new URL(u); } catch (e) { return ""; }
  if (!/^https?:$/.test(url.protocol)) return "";
  if ((url.pathname === "/" || url.pathname === "") && !url.search) return "";      /* home page dei siti: non e' un video */
  if (FILE_DIRETTO.test(url.pathname)) return "File";
  /* /wiki/File:Foto.jpg e' una pagina, non un'immagine */
  if (FILE_IMMAGINE.test(url.pathname) && !/\/wiki\/[^\/]+:/i.test(url.pathname)) return t("img");
  for (const [nome, re] of regole()) if (re.test(u)) return NOMI[nome] || nome.replace(/IE$/, "");
  return "";
}
/* pagine di siti video che non sono un video singolo: "" = video, altrimenti la chiave del tipo.
   Partono non spuntate e con un avviso: un canale scarica tutti i suoi video, una diretta registra finche' non la fermi. */
const YT_PAGINE = /^\/(feed|premium|gaming|results|podcasts|account|hashtag|channel_switcher|signin|browse|explore|library|search|reporthistory)(\/|$)/i;
const YT_CANALE = /^\/(@[^\/]+|channel\/[^\/]+|c\/[^\/]+|user\/[^\/]+)(\/([^\/]*))?\/?$/i;
const TW_PAGINE = /^\/(settings|directory|downloads|inventory|wallet|search|moderator|popout|p|subscriptions|drops|turbo|prime|friends|messages|following|videos)(\/?$|\/(?!\d))/i;
const TW_CANALE = /^\/[^\/]+\/(videos|clips|schedule|about|collections|squad)\/?$/i;
function tipoPagina(u) {
  let url;
  try { url = new URL(u); } catch (e) { return ""; }
  const h = url.hostname.toLowerCase(), p = url.pathname;
  if (/(^|\.)youtube\.com$/.test(h)) {
    if (YT_PAGINE.test(p)) return "kPagina";
    const m = YT_CANALE.exec(p);
    if (m) return (m[3] || "").toLowerCase() === "live" ? "kDiretta" : "kCanale";
  }
  if (/(^|\.)twitch\.tv$/.test(h) && !/^clips\./.test(h)) {
    if (TW_PAGINE.test(p)) return "kPagina";
    if (TW_CANALE.test(p)) return "kCanale";
    if (/^\/[^\/]+\/?$/.test(p)) return "kDiretta";              /* twitch.tv/nome = il canale in diretta */
  }
  return "";
}
function pulisciNome(s) {
  return String(s || "").replace(/[\r\n\t|]+/g, " ").replace(/\s+-\s+YouTube$/, "").replace(/[<>:"\/\\?*]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

/* ---------- impostazioni rapide ---------- */
let modo = memo("modo") || "app";
function mostraModo() {
  for (const b of document.querySelectorAll(".seg button")) b.className = b.dataset.m === modo ? "on" : "";
  document.getElementById("qVideo").style.display = modo === "video" ? "flex" : "none";
  document.getElementById("qAudio").style.display = modo === "audio" ? "flex" : "none";
  document.getElementById("qApp").style.display = modo === "app" ? "block" : "none";
  /* "Scarica subito" solo con le impostazioni rapide: con "Come nell'app" i link vanno solo in lista */
  document.getElementById("avvia").style.display = modo === "app" ? "none" : "";
  aggiorna();
}
function testoScelto(id) { const s = document.getElementById(id); return s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : s.value; }
function descriviModo() {
  if (modo === "video") return t("mVideo") + " \u00b7 " + testoScelto("vc") + " \u00b7 " + testoScelto("vq");
  if (modo === "audio") return t("mAudio") + " \u00b7 " + testoScelto("ap");
  return t("mApp");
}
function intestazioni(avvia) {
  const h = ["#ext=" + VERS, "#lang=" + LANG, "#mode=" + modo];
  if (avvia && modo !== "app") h.push("#start=1");                  /* l'app avvia il download da sola */
  if (modo === "video") h.push("#quality=" + document.getElementById("vq").value, "#container=" + document.getElementById("vc").value);
  if (modo === "audio") { const [f, q] = document.getElementById("ap").value.split("|"); h.push("#afmt=" + f, "#aq=" + (q || "")); }
  let l = [];
  try { l = JSON.parse(memo("log") || "[]"); } catch (e) {}
  for (const r of l) h.push("#log=" + r);
  return h;
}

/* ---------- liste ---------- */
function riga(v, lista) {
  const r = document.createElement("label"); r.className = "row";
  const c = document.createElement("input"); c.type = "checkbox"; c.checked = v.scelto;
  c.onchange = () => { v.scelto = c.checked; aggiorna(); };
  const tx = document.createElement("div"); tx.className = "t";
  const n = document.createElement("div"); n.className = "n"; n.textContent = v.titolo || v.url;
  const u = document.createElement("div"); u.className = "u"; u.textContent = v.url;
  const b = document.createElement("span"); b.className = "badge" + (v.avviso ? " warn" : "");
  b.textContent = v.avviso ? v.sito + " \u00b7 " + t(v.avviso) : v.sito;
  tx.append(n, u); r.append(c, tx, b); lista.appendChild(r);
}
function miniatura(v, box) {
  const d = document.createElement("label"); d.className = "thumb" + (v.scelto ? " on" : ""); d.title = v.url;
  const c = document.createElement("input"); c.type = "checkbox"; c.checked = v.scelto;
  c.setAttribute("aria-label", v.titolo || nomeImmagine(v.url, "").replace(/^DownConvertron\//, ""));
  c.onchange = () => { v.scelto = c.checked; d.className = "thumb" + (v.scelto ? " on" : ""); aggiorna(); };
  const im = document.createElement("img"); im.src = v.url; im.alt = v.titolo || ""; im.loading = "lazy"; im.referrerPolicy = "no-referrer";
  const dm = document.createElement("span"); dm.className = "dim"; dm.textContent = v.w && v.h ? v.w + "\u00d7" + v.h : "";
  d.append(im, c, dm); box.appendChild(d);
}
function disegna(chiave) {
  const box = document.getElementById(chiave);
  box.textContent = "";
  if (!voci[chiave].length) { const e = document.createElement("div"); e.className = "vuoto"; e.textContent = chiave === "schede" ? t("nessunaScheda") : chiave === "pagina" ? t("nessunLink") : t("nessunaImg"); box.appendChild(e); }
  for (const v of voci[chiave]) (chiave === "immagini" ? miniatura : riga)(v, box);
  document.getElementById({ schede: "nSchede", pagina: "nPagina", immagini: "nImmagini" }[chiave]).textContent = voci[chiave].length;
  const av = chiave === "schede" ? document.getElementById("avvisoSchede") : chiave === "immagini" ? document.getElementById("avvisoImmagini") : null;
  if (av) {
    const n = chiave === "schede" ? voci.schede.filter(v => v.avviso).length : 0;
    av.textContent = chiave === "schede" ? (n ? t("avvisoSchede", n) : "") : (totImmagini > voci.immagini.length ? t("avvisoImmagini", voci.immagini.length, totImmagini) : "");
    av.hidden = !av.textContent;
  }
}
function scelti() { return voci.schede.concat(voci.pagina, voci.immagini).filter(v => v.scelto); }
function aggiorna() {
  const n = new Set(scelti().map(v => v.url)).size;
  const b = document.getElementById("invia"), a = document.getElementById("avvia");
  b.disabled = a.disabled = !n;
  b.textContent = n ? t("invia", n) : t("nessunoScelto");
  a.textContent = t("avvia", n);
  const ni = voci.immagini.filter(v => v.scelto).length, q = document.getElementById("scaricaSubito");
  q.disabled = !ni; q.textContent = t("salvaDownload") + (ni ? " (" + ni + ")" : "");
}
let totImmagini = 0;
async function raccogli() {
  const tutte = document.getElementById("tutteFinestre").checked;
  /* le scelte fatte restano quando la lista si aggiorna (per esempio con "Tutte le finestre") */
  const prima = new Map();
  for (const v of voci.schede.concat(voci.pagina, voci.immagini)) prima.set(v.url, v.scelto);
  const scegli = (u, normale) => prima.has(u) ? prima.get(u) : normale;
  const tabs = await chrome.tabs.query(tutte ? {} : { currentWindow: true });
  const visti = new Set();
  voci.schede = [];
  for (const tb of tabs) {
    const sito = riconosci(tb.url || "");
    if (!sito || visti.has(tb.url)) continue;
    visti.add(tb.url);
    const avviso = tipoPagina(tb.url);
    voci.schede.push({ url: tb.url, titolo: tb.title || "", sito, avviso, scelto: scegli(tb.url, !avviso), img: sito === t("img") });
  }
  voci.pagina = [];
  try {
    const [att] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (att && /^https?:/.test(att.url || "")) {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: att.id },
        func: () => {
          const out = [];
          for (const a of document.links) out.push([a.href, (a.innerText || a.title || a.getAttribute("aria-label") || "").trim().slice(0, 140)]);
          for (const v of document.querySelectorAll("video[src], video source[src]")) out.push([v.src, document.title]);
          /* immagini grandi (niente icone e loghi piccoli): la versione piu' grande che il browser ha scelto */
          const img = [];
          const add = (u, alt, w, h) => {
            try { u = new URL(u, document.baseURI).href; } catch (e) { return; }
            if (/^https?:/.test(u) && w >= 200 && h >= 150) img.push([u, String(alt || "").trim().slice(0, 120), Math.round(w), Math.round(h)]);
          };
          /* da un srcset la voce con il descrittore piu' grande (800w, 2x) */
          const migliore = s => {
            let best = "", bn = -1;
            for (const p of String(s || "").split(/,\s+/)) { const a = p.trim().split(/\s+/), n = parseFloat(a[1]) || 1; if (a[0] && n > bn) { best = a[0]; bn = n; } }
            return best;
          };
          for (const i of document.images) {
            /* immagini lazy: finche' non si caricano c'e' un segnaposto (data:, 1x1) e l'URL vero sta in data-src / data-srcset */
            const lazy = i.getAttribute("data-src") || i.getAttribute("data-lazy-src") || i.getAttribute("data-original") || migliore(i.getAttribute("data-srcset") || i.getAttribute("data-lazy-srcset"));
            let u = i.currentSrc || i.src;
            if (lazy && (!u || /^data:/.test(u) || i.naturalWidth < 50)) u = lazy;
            /* la misura vera se c'e', altrimenti quella a schermo (o negli attributi) */
            const w = Math.max(i.naturalWidth || 0, i.width || 0, parseInt(i.getAttribute("width"), 10) || 0);
            const h = Math.max(i.naturalHeight || 0, i.height || 0, parseInt(i.getAttribute("height"), 10) || 0);
            if (u) add(u, i.alt || i.title, w, h);
          }
          /* immagini di sfondo nello stile della pagina (gallerie, copertine) */
          let nb = 0;
          for (const el of document.querySelectorAll("[style*='background']")) {
            if (++nb > 2000) break;
            const m = /url\(\s*['"]?([^'")]+)['"]?\s*\)/.exec(el.style.backgroundImage || "");
            if (!m || /^data:/.test(m[1])) continue;
            const r = el.getBoundingClientRect();
            add(m[1], el.getAttribute("aria-label") || el.title, r.width, r.height);
          }
          return { link: out, img: img };
        }
      });
      const ris = (res && res.result) || { link: [], img: [] };
      voci.immagini = [];
      const vistiImg = new Set();
      for (const [u, testo, w, h] of ris.img) {
        if (vistiImg.has(u)) continue;
        vistiImg.add(u);
        if (voci.immagini.length < 200) voci.immagini.push({ url: u, titolo: testo, sito: t("img"), scelto: scegli(u, false), w, h, img: true });
      }
      totImmagini = vistiImg.size;
      for (const [u, testo] of ris.link) {
        const pulito = String(u).split("#")[0];
        const sito = riconosci(pulito);
        if (!sito || visti.has(pulito) || /^blob:/.test(u)) continue;
        visti.add(pulito);
        voci.pagina.push({ url: pulito, titolo: testo, sito, avviso: tipoPagina(pulito), scelto: scegli(pulito, false), img: sito === t("img") });
        if (voci.pagina.length >= 300) break;
      }
    }
  } catch (e) { registra(t("logPagina", e.message || e)); }
  disegna("schede"); disegna("pagina"); disegna("immagini"); aggiorna();
  document.getElementById("stato").textContent = t("trovati", voci.schede.length + voci.pagina.length + voci.immagini.length, regole().length);
  return [voci.schede.length, voci.pagina.length + voci.immagini.length];
}

/* ---------- apertura dell'app (logo o dopo l'invio) ---------- */
async function apriApp(motivo) {
  const url = "downconvertron://" + motivo + "?ext=" + VERS;
  registra(t("logApri"));
  try {
    const [att] = await chrome.tabs.query({ active: true, currentWindow: true });
    /* sulla scheda attuale la pagina resta dov'e': Chrome chiede solo se aprire l'app */
    if (att && /^https?:/.test(att.url || "")) await chrome.tabs.update(att.id, { url });
    else await chrome.tabs.create({ url });
  } catch (e) { try { await chrome.tabs.create({ url }); } catch (e2) {} }
}

/* download rapido: le immagini scelte vanno subito nella cartella Download/DownConvertron (senza passare dall'app) */
const EST_IMG = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|heic|svg)$/i;
/* nome valido su Windows e Mac: niente caratteri vietati, ~ (Chrome lo rifiuta), caratteri invisibili, punti e spazi ai bordi */
function nomeFile(s) {
  return String(s || "").replace(/\p{Cf}/gu, "").replace(/[<>:"\/\\|?*~\x00-\x1f]+/g, " ").replace(/\s+/g, " ").replace(/^[\s.]+|[\s.]+$/g, "");
}
function nomeImmagine(u, titolo) {
  let n = "";
  try { n = new URL(u).pathname.split("/").pop() || ""; } catch (e) {}
  try { n = decodeURIComponent(n); } catch (e) {}
  n = nomeFile(n);
  const m = n.match(EST_IMG), est = m ? m[0].toLowerCase() : ".jpg";        /* senza estensione nell'URL: .jpg */
  let base = nomeFile(m ? n.slice(0, -m[0].length) : (pulisciNome(titolo) || n.replace(/\.\w{1,5}$/, ""))).slice(0, 100);
  base = base.replace(/[\s.]+$/, "") || t("nomeImg");
  if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(base)) base = "_" + base;  /* nomi riservati di Windows */
  return "DownConvertron/" + base + est;
}
async function scaricaSubito() {
  const sel = voci.immagini.filter(v => v.scelto), nota = document.getElementById("nota");
  let ok = 0, ko = 0, errore = "";
  for (const v of sel) {
    try { await chrome.downloads.download({ url: v.url, filename: nomeImmagine(v.url, v.titolo), conflictAction: "uniquify", saveAs: false }); ok++; }
    catch (e) { ko++; errore = e.message || String(e); }
  }
  registra(t("logScaricate", ok) + (ko ? " / " + ko + " KO: " + errore : ""));
  nota.className = "nota " + (ko ? (ok ? "warn" : "err") : "ok");
  nota.textContent = (ok ? t("scaricate", ok) + " " : "") + (ko ? t("nonRiuscite", ko, errore) : "");
}
/* avvia = true: "Scarica subito" (l'app mette in lista e avvia il download); false: "Metti in lista" */
async function invia(avvia) {
  const usaTitoli = document.getElementById("usaTitoli").checked;
  const visti = new Set(), righe = [];
  for (const v of scelti()) {
    if (visti.has(v.url)) continue;
    visti.add(v.url);
    const nome = usaTitoli ? pulisciNome(v.titolo) : "";
    const riga = nome ? v.url + " | " + nome : v.url;
    /* le immagini viaggiano marcate: l'app le scarica come immagini anche se l'URL non ha estensione */
    righe.push(v.img ? "#img=" + riga : riga);
  }
  const nota = document.getElementById("nota");
  avvia = avvia === true && modo !== "app";
  registra(t("logInviati", righe.length, descriviModo()) + (avvia ? " +start" : ""));
  try {
    await navigator.clipboard.writeText(MARCATORE + "\n" + intestazioni(avvia).join("\n") + "\n" + righe.join("\n") + "\n");
    memo("log", "[]");
    nota.className = "nota ok";
    nota.textContent = t(avvia ? "avviati" : "inviati", righe.length, descriviModo());
    if (document.getElementById("apriDopo").checked) apriApp("send");
  } catch (e) {
    nota.className = "nota err";
    nota.textContent = t("erroreAppunti", e.message || e);
  }
}

/* ---------- avvio ---------- */
document.documentElement.lang = LANG === "zh" ? "zh-CN" : LANG;
for (const el of document.querySelectorAll("[data-t]")) el.textContent = t(el.dataset.t);
for (const el of document.querySelectorAll("[data-tt]")) el.title = t(el.dataset.tt);
document.getElementById("nota").textContent = t("notaInizio");
for (const b of document.querySelectorAll(".seg button")) b.onclick = () => { modo = b.dataset.m; memo("modo", modo); mostraModo(); };
for (const id of ["vq", "vc", "ap"]) {
  const el = document.getElementById(id), v = memo(id);
  if (v) el.value = v;
  el.onchange = () => memo(id, el.value);
}
for (const id of ["tutteFinestre", "usaTitoli", "apriDopo"]) {
  const el = document.getElementById(id), v = memo(id);
  el.checked = v === null ? id === "apriDopo" : v === "1";
  el.onchange = () => { memo(id, el.checked ? "1" : "0"); if (id === "tutteFinestre") raccogli(); };
}
for (const b of document.querySelectorAll("[data-tutti]")) {
  b.onclick = () => { const k = b.dataset.tutti, tutti = !voci[k].every(v => v.scelto); for (const v of voci[k]) v.scelto = tutti; disegna(k); aggiorna(); };
}
document.getElementById("logo").onclick = () => { document.getElementById("nota").className = "nota"; document.getElementById("nota").textContent = t("apertura"); apriApp("open"); };
document.getElementById("invia").onclick = () => invia(false);
document.getElementById("avvia").onclick = () => invia(true);
document.getElementById("scaricaSubito").onclick = scaricaSubito;
mostraModo();
raccogli().then(([a, b]) => registra(t("logAperto", a, b)));
