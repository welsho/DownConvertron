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
const FILE_IMMAGINE = /\.(jpe?g|jfif|png|gif|webp|avif|bmp|tiff?|heic|svg)(\?|#|$)/i;
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
  aggiorna();
}
function testoScelto(id) { const s = document.getElementById(id); return s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : s.value; }
function descriviModo() {
  if (modo === "video") return t("mVideo") + " \u00b7 " + testoScelto("vc") + " \u00b7 " + testoScelto("vq");
  if (modo === "audio") return t("mAudio") + " \u00b7 " + testoScelto("ap");
  return t("mApp");
}
/* "Scarica subito": con i video servono le impostazioni rapide (con "Come nell'app" vanno solo in lista);
   le sole immagini partono sempre, con il loro formato separato */
function soloImmagini() { const s = scelti(); return s.length > 0 && s.every(v => v.img); }
function puoAvviare() { return modo !== "app" || soloImmagini(); }
function intestazioni(avvia, login) {
  const h = ["#ext=" + VERS, "#lang=" + LANG, "#mode=" + modo];
  if (avvia) h.push("#start=1");                                    /* l'app avvia il download da sola */
  if (login) h.push("#cookies=" + login);                           /* solo il nome del file scritto dal ponte, mai i cookie */
  if (scelti().some(v => v.img)) h.push("#imgfmt=" + document.getElementById("if").value);
  /* pagina da cui vengono le immagini: l'app la usa come Referer (CDN che rifiutano le immagini chieste da fuori) */
  if (paginaImmagini && voci.immagini.some(v => v.scelto)) h.push("#ref=" + paginaImmagini);
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
  c.setAttribute("aria-label", v.titolo || nomeImmagine(v.url, "").base.replace(/^DownConvertron\//, ""));
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
  a.style.display = puoAvviare() ? "" : "none";
  const ni = voci.immagini.filter(v => v.scelto).length, q = document.getElementById("scaricaSubito");
  q.disabled = !ni; q.textContent = t("salvaDownload") + (ni ? " (" + ni + ")" : "");
}
let totImmagini = 0, paginaImmagini = "";
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
    paginaImmagini = att && /^https?:/.test(att.url || "") ? att.url : "";
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
          /* da un srcset la voce con il descrittore piu' grande (800w, 2x); i segnaposto data: non contano */
          const migliore = s => {
            /* come lo standard HTML: l'URL va fino al primo spazio (puo' contenere virgole, es. Cloudinary);
               i descrittori finiscono alla virgola, che separa le voci anche senza spazio ("a.jpg 1x,b.jpg 2x") */
            s = String(s || "");
            let best = "", bn = -1, i = 0;
            while (i < s.length) {
              while (i < s.length && /[\s,]/.test(s[i])) i++;
              let j = i;
              while (j < s.length && !/\s/.test(s[j])) j++;
              let url = s.slice(i, j), desc = "";
              if (/,$/.test(url)) url = url.replace(/,+$/, "");
              else { let k = j; while (k < s.length && s[k] !== ",") k++; desc = s.slice(j, k); j = k + 1; }
              i = j;
              const n = parseFloat((/(\d+(?:\.\d+)?)[wx]/.exec(desc) || [])[1]) || 1;
              if (url && !/^data:/.test(url) && n > bn) { best = url; bn = n; }
            }
            return best;
          };
          /* fonte massima: la versione piu' grande dichiarata dalla pagina (srcset dell'immagine e delle <source> del <picture>),
             non quella che il browser ha scelto per lo schermo */
          const massima = i => {
            const s = [i.getAttribute("srcset") || ""];
            if (i.parentElement && i.parentElement.tagName === "PICTURE") for (const so of i.parentElement.querySelectorAll("source[srcset]:not([media])")) s.push(so.getAttribute("srcset"));
            return migliore(s.filter(Boolean).join(", "));
          };
          for (const i of document.images) {
            /* immagini lazy: finche' non si caricano c'e' un segnaposto (data:, 1x1) e l'URL vero sta in data-src / data-srcset */
            const lazy = i.getAttribute("data-src") || i.getAttribute("data-lazy-src") || i.getAttribute("data-original") || migliore(i.getAttribute("data-srcset") || i.getAttribute("data-lazy-srcset"));
            let u = massima(i) || i.currentSrc || i.src;
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
const EST_IMG = /\.(jpe?g|jfif|png|gif|webp|avif|bmp|tiff?|heic|svg)$/i;
/* nome valido su Windows e Mac: niente caratteri vietati, ~ (Chrome lo rifiuta), caratteri invisibili, punti e spazi ai bordi */
function nomeFile(s) {
  return String(s || "").replace(/\p{Cf}/gu, "").replace(/[<>:"\/\\|?*~\x00-\x1f]+/g, " ").replace(/\s+/g, " ").replace(/^[\s.]+|[\s.]+$/g, "");
}
function nomeImmagine(u, titolo) {
  let n = "";
  try { n = new URL(u).pathname.split("/").pop() || ""; } catch (e) {}
  try { n = decodeURIComponent(n); } catch (e) {}
  n = nomeFile(n);
  const m = n.match(EST_IMG), est = m ? m[0].toLowerCase() : "";        /* senza estensione nell'URL: la decide il tipo del file */
  let base = nomeFile(m ? n.slice(0, -m[0].length) : (pulisciNome(titolo) || n.replace(/\.\w{1,5}$/, ""))).slice(0, 100);
  base = base.replace(/[\s.]+$/, "") || t("nomeImg");
  if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(base)) base = "_" + base;  /* nomi riservati di Windows */
  return { base: "DownConvertron/" + base, est };
}
/* estensione dal tipo che il server dichiara: un WebP senza estensione nell'URL non diventa .jpg */
const EST_MIME = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/pjpeg": ".jpg", "image/png": ".png", "image/apng": ".png", "image/gif": ".gif", "image/webp": ".webp",
  "image/avif": ".avif", "image/bmp": ".bmp", "image/tiff": ".tif", "image/svg+xml": ".svg", "image/heic": ".heic", "image/heif": ".heic" };
const nomiInAttesa = new Map();   /* url -> { base, est } dei download rapidi partiti da qui */
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  const n = nomiInAttesa.get(item.url) || nomiInAttesa.get(item.finalUrl);
  if (!n) { suggest(); return; }
  nomiInAttesa.delete(item.url); nomiInAttesa.delete(item.finalUrl);
  /* il server ha mandato una pagina (protezione hotlink, login): non la salvo come immagine */
  if (/^(text\/html|application\/xhtml)/i.test(String(item.mime || ""))) {
    suggest(); chrome.downloads.cancel(item.id);
    const nota = document.getElementById("nota"); nota.className = "nota warn"; nota.textContent = n.base.replace(/^DownConvertron\//, "") + ": " + t("nonImmagine");
    return;
  }
  const est = EST_MIME[String(item.mime || "").toLowerCase()] || n.est || ".jpg";
  suggest({ filename: n.base + est, conflictAction: "uniquify" });
});
async function scaricaSubito() {
  const sel = voci.immagini.filter(v => v.scelto), nota = document.getElementById("nota");
  let ok = 0, ko = 0, errore = "";
  for (const v of sel) {
    const n = nomeImmagine(v.url, v.titolo);
    nomiInAttesa.set(v.url, n);
    /* il nome passato qui vale solo se il popup si chiude prima che Chrome conosca il tipo del file */
    try { await chrome.downloads.download({ url: v.url, filename: n.base + (n.est || ".jpg"), conflictAction: "uniquify", saveAs: false }); ok++; }
    catch (e) { ko++; errore = e.message || String(e); nomiInAttesa.delete(v.url); }
  }
  registra(t("logScaricate", ok) + (ko ? " / " + ko + " KO: " + errore : ""));
  nota.className = "nota " + (ko ? (ok ? "warn" : "err") : "ok");
  nota.textContent = (ok ? t("scaricate", ok) + " " : "") + (ko ? t("nonRiuscite", ko, errore) : "");
}
/* ---------- "Usa il mio login" ----------
   Per i video con limite di eta', privati o per abbonati. Con l'interruttore acceso, a ogni invio leggo i cookie di Chrome
   dei siti inviati e li passo al ponte native messaging dell'app (registrato da DownConvertron, accetta solo questa
   estensione), che li scrive in un file della cartella dati; negli appunti viaggia solo il nome del file (token casuale).
   L'app li usa solo se il sito chiede l'accesso e li cancella a fine lavoro. I permessi (cookie, ponte, tutti i siti) sono
   opzionali: Chrome li chiede quando accendi l'interruttore e li tolgo quando lo spegni. */
const PONTE = "com.welsho.downconvertron";
const PERMESSI_LOGIN = { permissions: ["cookies", "nativeMessaging"], origins: ["<all_urls>"] };
/* dominio da cui leggere i cookie: www.youtube.com e youtu.be -> youtube.com, foo.bbc.co.uk -> bbc.co.uk */
function dominioBase(u) {
  let h;
  try { h = new URL(u).hostname.toLowerCase(); } catch (e) { return ""; }
  if (!h || /^[\d.]+$/.test(h) || h.indexOf(".") < 0) return h;
  if (h === "youtu.be" || /(^|\.)youtube-nocookie\.com$/.test(h)) return "youtube.com";
  const p = h.split(".");
  const n = p.length > 2 && p[p.length - 1].length === 2 && /^(co|com|net|org|gov|edu|ac|ne|or)$/.test(p[p.length - 2]) ? 3 : 2;
  return p.slice(-n).join(".");
}
/* cookie in formato Netscape (quello di yt-dlp --cookies e di curl) */
function rigaNetscape(c) {
  const pulito = v => String(v).replace(/[\t\r\n]/g, "");
  const dom = (c.hostOnly ? c.domain.replace(/^\./, "") : (c.domain.charAt(0) === "." ? c.domain : "." + c.domain));
  return (c.httpOnly ? "#HttpOnly_" : "") + pulito(dom) + "\t" + (c.hostOnly ? "FALSE" : "TRUE") + "\t" + pulito(c.path || "/") + "\t" +
    (c.secure ? "TRUE" : "FALSE") + "\t" + (c.session || !c.expirationDate ? 0 : Math.floor(c.expirationDate)) + "\t" + pulito(c.name) + "\t" + pulito(c.value);
}
/* "" = niente login (spento, nessun cookie, ponte assente: in quel caso lo dico nella nota e nel registro) */
async function preparaLogin(urls) {
  if (!document.getElementById("usaLogin").checked) return "";
  if (!(await chrome.permissions.contains(PERMESSI_LOGIN).catch(() => false))) { mostraLogin(false); registra(t("loginNegato")); return ""; }
  const domini = [...new Set(urls.map(dominioBase).filter(Boolean))], visti = new Set(), righe = [];
  for (const d of domini) {
    for (const c of await chrome.cookies.getAll({ domain: d }).catch(() => [])) {
      const k = c.domain + "|" + c.path + "|" + c.name;
      if (!visti.has(k)) { visti.add(k); righe.push(rigaNetscape(c)); }
    }
  }
  if (!righe.length) { registra(t("loginNessuno")); return ""; }
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  const token = Array.from(b, x => (x < 16 ? "0" : "") + x.toString(16)).join("");
  const dati = "# Netscape HTTP Cookie File\n# DownConvertron: login di Chrome, valido solo per questo invio\n" + righe.join("\n") + "\n";
  try {
    const r = await chrome.runtime.sendNativeMessage(PONTE, { op: "cookies", token, data: dati });
    if (!r || !r.ok) throw new Error((r && r.err) || "?");
  } catch (e) {
    const msg = t("loginNoApp", e.message || e);
    registra(msg);
    return { errore: msg };
  }
  registra(t("loginInviato", domini.length, righe.length));
  return token;
}
function mostraLogin(acceso) { document.getElementById("usaLogin").checked = acceso; memo("usaLogin", acceso ? "1" : "0"); }

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
  avvia = avvia === true && puoAvviare();
  /* se il login non passa, i link partono lo stesso (senza) e la nota lo dice */
  let login = "";
  try { login = await preparaLogin([...visti]); } catch (e) { login = { errore: t("loginNoApp", e.message || e) }; }
  const erroreLogin = login && login.errore ? login.errore : "";
  if (erroreLogin) login = "";
  registra(t("logInviati", righe.length, descriviModo()) + (avvia ? " +start" : "") + (login ? " +login" : ""));
  try {
    await navigator.clipboard.writeText(MARCATORE + "\n" + intestazioni(avvia, login).join("\n") + "\n" + righe.join("\n") + "\n");
    memo("log", "[]");
    nota.className = erroreLogin ? "nota warn" : "nota ok";
    nota.textContent = t(avvia ? "avviati" : "inviati", righe.length, descriviModo()) + (login ? t("conLogin") : "") + (erroreLogin ? " " + erroreLogin : "");
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
for (const id of ["vq", "vc", "ap", "if"]) {
  const el = document.getElementById(id), v = memo(id);
  if (v) el.value = v;
  el.onchange = () => memo(id, el.value);
}
for (const id of ["tutteFinestre", "usaTitoli", "apriDopo"]) {
  const el = document.getElementById(id), v = memo(id);
  el.checked = v === null ? id === "apriDopo" : v === "1";
  el.onchange = () => { memo(id, el.checked ? "1" : "0"); if (id === "tutteFinestre") raccogli(); };
}
/* interruttore del login: i permessi si chiedono qui (serve il clic) e si tolgono quando lo spegni */
{
  const el = document.getElementById("usaLogin");
  el.checked = memo("usaLogin") === "1";
  /* lo stato vero sono i permessi: se il popup si e' chiuso mentre Chrome chiedeva il permesso, il si' conta lo stesso */
  chrome.permissions.contains(PERMESSI_LOGIN).then(ok => mostraLogin(!!ok), () => mostraLogin(false));
  el.onchange = () => {
    if (el.checked) {
      chrome.permissions.request(PERMESSI_LOGIN).then(ok => {
        mostraLogin(!!ok);
        if (!ok) { const nota = document.getElementById("nota"); nota.className = "nota warn"; nota.textContent = t("loginNegato"); }
      }, e => { mostraLogin(false); const nota = document.getElementById("nota"); nota.className = "nota err"; nota.textContent = t("loginNegato") + " " + (e.message || e); });
    } else { mostraLogin(false); chrome.permissions.remove(PERMESSI_LOGIN).catch(() => {}); }
  };
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
