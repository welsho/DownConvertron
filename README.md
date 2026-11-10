<div align="center">

# DownConvertron

**Il mecha che scarica e converte video per creator, streamer e videomaker.**<br>
Trova i B-roll mentre navighi, scaricali nel formato giusto per il montaggio
e prepara overlay con la trasparenza intatta, pronti per OBS, Premiere, Resolve e i ledwall.

![Versione](https://img.shields.io/badge/versione-7.0-39ff6a?style=flat-square)
![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-0078d4?style=flat-square)
![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon-black?style=flat-square)
![Lingue](https://img.shields.io/badge/lingue-IT%20%C2%B7%20EN%20%C2%B7%20%E4%B8%AD%E6%96%87-f2c230?style=flat-square)
![Licenza](https://img.shields.io/badge/licenza-GPL--3.0-d42a40?style=flat-square)

[**Scarica l'ultima versione**](../../releases/latest) · [English](#english) · designed by **Welsho**

<img src="docs/img/app-it-download.png" width="760" alt="DownConvertron: scheda Scarica da link">

</div>

---

## Per chi è

Per chi monta video tutti i giorni e perde tempo tra siti, convertitori online e formati che "non vanno":

- **YouTuber e videomaker**: B-roll, musica e voice-over scaricati già nel formato da montaggio (MOV, ProRes, WAV 24 bit).
- **Streamer**: overlay, stinger e alert con **canale alfa** per OBS, Streamlabs e vMix (WebM VP9 + alfa, ProRes 4444, HAP Alpha).
- **Social media manager**: clip verticali 1080×1920 e quadrate con bordi trasparenti, loop avanti-indietro, volume già normalizzato a -14 LUFS.
- **Visual e VJ**: HAP / HAP Q / HAP Alpha per Resolume, TouchDesigner, MadMapper e ledwall.

## Cosa fa

| | |
|---|---|
| **Scarica** da oltre 1.700 siti (con [yt-dlp](https://github.com/yt-dlp/yt-dlp)) | YouTube, Vimeo, Instagram, TikTok, X, Twitch, Drive… fino a 8K, MP4 · MOV · MKV · WebM · AVI · GIF, oppure solo audio MP3 · M4A · Opus · FLAC · WAV. Playlist, sottotitoli, capitoli, lingua dell'audio, nomi dei file a scelta. **Immagini** dai link diretti (JPG, PNG, WebP, GIF…): con impostazioni **separate dal video** (riquadro *Immagini*): *Originale* (il file così com'è, senza ricodifica) oppure PNG · WebP · JPG, anche riga per riga. |
| **Converte** senza perdere la trasparenza | WebM VP9 + alfa, ProRes 4444 / XQ, Animazione, PNG, CineForm 12 bit, HAP Alpha / Q, WebP e APNG animati, GIF, sequenze PNG · TIFF · EXR (anche in ingresso), HEVC con alfa sul Mac. Cambio contenitore MP4 ↔ MOV senza ricodifica. **Più immagini → un'animazione o immagini separate** (te lo chiede; immagini al secondo a scelta, a parte dagli FPS del video; misure diverse uniformate). **Una sola immagine → clip ferma** (durata a scelta) **o un'altra immagine** PNG · WebP · TIFF · JPG. |
| **Ritocca** | Taglio da/a, ripetizioni, avanti-indietro (boomerang), tela verticale / quadrata / 4:5 con bordi trasparenti, chroma key verde/blu, anteprima su scacchiera, normalizzazione EBU R128, tutte le tracce audio a 24 bit. |
| **Va veloce** | Codifica con la scheda video NVIDIA / Intel / AMD su Windows, con il chip Apple sul Mac (rilevate da sole). |
| **Estensione Chrome** | Raccoglie i link dei video dalle schede aperte e dalla pagina mentre fai ricerca, con una mini interfaccia *Video / Solo audio*: un clic e sono nella lista (**Metti in lista**) oppure il download parte subito (**Scarica subito**). Canali, dirette e pagine che non sono un video singolo partono non spuntate, con un avviso. Elenca anche le **immagini della pagina** con anteprima (anche quelle non ancora caricate): le mandi all'app o le salvi con **Salva nei Download**. Il logo dell'estensione apre l'app. |
| **Pensata per lo studio** | Trascini file e cartelle sul mecha (si gira e apre la botola), preset con nome, schermo di stato con il registro completo, spie dei componenti che diventano rosse se qualcosa va aggiornato, interfaccia in italiano, inglese e cinese. |

## Flussi di lavoro

**1 · Ricerca B-roll in 3 clic.** Apri i video in Chrome mentre cerchi le clip → icona di DownConvertron → *Video · MOV (montaggio) · Full HD* → **Metti in lista** → nell'app premi **Scarica** (oppure **Scarica subito** e parte da solo). I file arrivano in MOV H.264 + AAC copiati senza perdita, pronti per Premiere, Final Cut e Resolve (per il 4K scegli MP4 o MKV: YouTube in H.264 arriva a 1080p).

**2 · Overlay e alert per lo stream.** Trascina il MOV con alfa sul mecha → *WebM VP9 + alfa* per le browser source di OBS e Streamlabs, *ProRes 4444* per il montaggio, *HAP Alpha* per Resolume e i ledwall. La trasparenza non si perde mai: se il file è già trasparente l'app la mantiene anche quando scegli il chroma key.

**3 · Loop e stinger.** Taglio da/a, *Avanti-indietro* per un loop perfetto, *Ripetizioni* per allungarlo, anteprima su scacchiera prima di convertire.

**4 · Social verticale.** *Tela 1080×1920*, *Intero, bordi trasparenti* oppure *Riempi*, volume a -14 LUFS: si carica così com'è.

**5 · Musica e voice-over.** *Solo audio · WAV 24 bit* per il montaggio, *MP3 320* per le bozze; le tracce audio multiple restano tutte.

> Scarica solo contenuti di cui hai i diritti: i tuoi, royalty-free, Creative Commons o con licenza. DownConvertron è uno strumento: il rispetto dei termini dei siti e del diritto d'autore resta a chi lo usa.

## Installazione

### Windows 10 / 11
1. Dalla [pagina delle release](../../releases/latest) scarica **`DownConvertron-Setup.bat`** e aprilo con un doppio clic.
2. L'installer installa (o aggiorna) yt-dlp, ffmpeg e Deno con **winget** di Microsoft, copia l'app in `%LOCALAPPDATA%\Programs\DownConvertron` e crea le icone su Desktop e menu Start. Niente amministratore.
3. Se avevi *DownLTransFMecchazzi*, *Mecchazzi* o *Scarica Video* vengono tolti, ma impostazioni, preset e archivio vengono ripresi.

In alternativa **`DownConvertron.hta`** è l'app in un solo file: doppio clic e via (i componenti si installano dal pulsante *Installa / aggiorna componenti*).

> Windows SmartScreen o l'antivirus possono avvisarti perché il file non è firmato: è normale per i programmi open source distribuiti così. Il codice è tutto qui da leggere.

### Mac (Apple Silicon: M1, M2, M3, M4 · macOS 13 Ventura o successivo)
1. Scarica **`DownConvertron-Mac-AppleSilicon.zip`**, aprilo e trascina **DownConvertron.app** in *Applicazioni*.
2. Al primo avvio il Mac dice che non può verificare lo sviluppatore: *Impostazioni di Sistema → Privacy e sicurezza → Apri comunque*. Se dice "è danneggiato": `xattr -dr com.apple.quarantine /Applications/DownConvertron.app`
3. Premi **Installa / aggiorna componenti**: yt-dlp, ffmpeg e Deno (circa 150 MB) in `~/Library/Application Support/DownConvertron/bin`, controllati con SHA-256. Niente Homebrew, niente password.

### Estensione Chrome
Nell'app premi **Estensione Chrome**: l'app prepara l'estensione, apre Chrome sulla pagina *Estensioni* e la cartella da trascinare. Tu attivi *Modalità sviluppatore* e trascini la cartella (una volta sola). Chrome non permette a nessun programma di installare estensioni al posto tuo: per questo restano quei due clic.

<p align="center"><img src="docs/img/estensione-chrome.png" width="760" alt="Estensione Chrome in italiano, inglese e cinese"><br><img src="docs/img/estensione-immagini.png" width="300" alt="Immagini della pagina con download rapido"></p>

L'app prepara da sola la cartella dell'estensione all'avvio (anche se usi solo l'HTA): è sempre pronta da installare.

## In azione

<table>
<tr>
<td width="50%"><img src="docs/img/app-it-converti.png" alt="Convertitore con canale alfa"><br><sub>Convertitore: formati con alfa, ritocchi, preset, registro sotto i piedi.</sub></td>
<td width="50%"><img src="docs/img/mecha-rotazione.gif" alt="Il mecha si gira quando trascini un file"><br><sub>Trascini un file: il mecha ruota e apre la botola tra le gambe.</sub></td>
</tr>
<tr>
<td><img src="docs/img/app-en-convert.png" alt="English interface"><br><sub>Interfaccia in inglese.</sub></td>
<td><img src="docs/img/app-zh-download.png" alt="中文界面"><br><sub>Interfaccia in cinese semplificato.</sub></td>
</tr>
</table>

**Spie del secondo schermo** — REATTORE (yt-dlp), LINK (Deno + connessione), ENCODER (ffmpeg), COMPONENTI (estensione Chrome davvero installata in Chrome): verdi se tutto è a posto, rosse se manca qualcosa, non parte o va aggiornato (yt-dlp con più di 60 giorni). Clic sulla spia = installa o aggiorna proprio quella parte; su COMPONENTI = installa l'estensione.

**Schermo di stato** — sotto i piedi del mecha: registro completo di app, estensione Chrome e strumenti (yt-dlp, ffmpeg, winget), con filtri, copia e salvataggio. I messaggi principali scorrono anche nel display del casco, alternati alle frasi del mecha.

**Lingua** — IT · EN · 中文 nello slot sotto le fessure del casco. Il cambio è immediato e l'estensione Chrome segue la lingua dell'app.

## Privacy e sicurezza
- Nessuna telemetria, nessun account, nessun server: tutto gira sul tuo computer.
- I componenti arrivano dalle fonti ufficiali: winget (Microsoft) su Windows; GitHub e le build di Martin Riedl, con impronta SHA-256, sul Mac.
- Su Windows niente diritti di amministratore: l'unica voce di registro è `HKCU\Software\Classes\downconvertron` (serve al logo dell'estensione per aprire l'app).
- Nessun dato dell'utente nella riga di comando: link e opzioni passano a yt-dlp tramite file temporanei.
- L'estensione legge le schede solo quando la apri e non invia nulla in rete: copia i link negli appunti, l'app li riconosce dall'intestazione.

## Per sviluppatori

```
src/DownConvertron.hta        l'app: unica sorgente (HTML + JScript ES3 per mshta / IE11)
mac/                          livello Mac: Electron (shim delle API Windows, processo principale, build)
windows/                      ricevitore del trascinamento (C# + PowerShell) e costruzione dell'installer
extension/                    estensione Chrome (Manifest V3)
i18n/strings.json             traduzioni: frase italiana -> en, zh
tools/                        inserimento delle parti generate, mecha di schiena, elenco dei siti, controlli
tests/electron/               prove automatiche sull'app Mac (girano anche su Linux)
docs/img/                     screenshot e animazioni del README
```

**Costruire tutto** (Python 3, Node 20, `zip`; per l'app Mac firmata serve macOS o [rcodesign](https://github.com/indygreg/apple-platform-rs)):

```bash
npm install
./build.sh                 # dist/: installer Windows, HTA, app Mac, estensione
SKIP_MAC=1 ./build.sh      # solo Windows ed estensione
python3 tools/check.py     # controlli: JScript ES3, id, estensione, installer, ricevitore C#
```

**Regole del progetto**
- La sorgente è una sola: `src/DownConvertron.hta`. L'app Mac viene generata da lì (`mac/build_mac.py`), l'installer pure.
- Lo script dell'HTA deve restare **ES3** (mshta usa il motore di IE11): niente `let`, arrow function, template string.
- Le parti generate (estensione, ricevitore, mecha, traduzioni) si aggiornano con `python3 tools/embed.py`.
- Nuovi testi: scrivili in italiano, poi `python3 tools/i18n_extract.py` elenca in `i18n/_da_tradurre.json` quelli che mancano in `i18n/strings.json`.
- Il **canale alfa non si perde mai**: ogni modifica al convertitore va provata con file trasparenti.
- Una release parte da sola con un tag: `git tag v7.0 && git push --tags` (vedi `.github/workflows/build.yml`).

## Grazie a
[yt-dlp](https://github.com/yt-dlp/yt-dlp) · [FFmpeg](https://ffmpeg.org) · [Deno](https://deno.com) · [Electron](https://www.electronjs.org) · [winget](https://github.com/microsoft/winget-cli) · le build ffmpeg per Mac di [Martin Riedl](https://ffmpeg.martin-riedl.de)

## Licenza
[GPL-3.0-or-later](LICENSE). Puoi usarlo, studiarlo, modificarlo e ridistribuirlo; le versioni modificate che distribuisci restano libere con la stessa licenza.

<p align="center"><b>DownConvertron</b> · designed by <b>Welsho</b></p>

---

<a name="english"></a>
## English

**DownConvertron** is a mecha-styled desktop app (Windows and macOS Apple Silicon) that **downloads and converts video for creators, streamers and video makers**: grab B-roll while you research, get it in an editing-friendly format, and turn overlays into files that keep their **alpha channel** for OBS, Premiere, Resolve and LED walls. Interface in Italian, English and Simplified Chinese.

**Download** from 1,700+ sites through yt-dlp (up to 8K; MP4, MOV, MKV, WebM, AVI, GIF; audio-only MP3, M4A, Opus, FLAC, WAV; playlists, subtitles, chapters, audio language), plus images from direct links with settings **separate from video** (*Images* box): *Original* (the file as it is, no re-encoding) or PNG, WebP, JPG, also row by row.
**Convert** without losing transparency: WebM VP9 + alpha, ProRes 4444/XQ, Animation, PNG, CineForm 12-bit, HAP Alpha/Q, animated WebP and APNG, GIF, PNG/TIFF/EXR sequences (in and out), several images to one animation or to separate images (it asks; images per second independent from the video FPS), one image to a still clip (any length) or to PNG/WebP/TIFF/JPG, HEVC with alpha on Mac, lossless MP4 ↔ MOV remux.
**Touch up**: trim, repeats, forward-backward loops, vertical/square/4:5 canvas with transparent borders, chroma key, checkerboard preview, EBU R128 loudness, all audio tracks at 24-bit.
**Fast**: NVIDIA / Intel / AMD encoders on Windows, Apple chip encoders on Mac, detected automatically.
**Chrome extension**: collects video links from your open tabs and the current page, with a mini *Video / Audio only* setup, and lists the page's images with thumbnails (lazy-loaded ones too) to send to the app or **Save to Downloads**; links land in the app's list (**Add to list**) or the download starts right away (**Download now**). Channels, live streams and pages that are not a single video start unchecked, with a warning. Clicking the logo opens the app.
**Studio-friendly**: drag files onto the mecha (it turns around and opens a hatch between its legs), named presets, a status screen with the full log of app, extension and tools, component lights that turn red when something is missing or outdated (COMPONENTS shows whether the Chrome extension is really installed).

### Install
- **Windows 10/11**: download `DownConvertron-Setup.bat` from the [latest release](../../releases/latest) and double-click it. It installs yt-dlp, ffmpeg and Deno with winget, the app in `%LOCALAPPDATA%\Programs\DownConvertron`, and the shortcuts. No admin rights. `DownConvertron.hta` is the single-file version. SmartScreen or antivirus may warn because the file is unsigned.
- **Mac (Apple Silicon, macOS 13 Ventura or later)**: unzip `DownConvertron-Mac-AppleSilicon.zip`, move the app to Applications, then *System Settings → Privacy & Security → Open Anyway* (or `xattr -dr com.apple.quarantine /Applications/DownConvertron.app`). Press *Install / update components*.
- **Chrome extension**: press *Chrome extension* in the app; it opens Chrome's Extensions page and the folder to drag. Turn on *Developer mode* and drag the folder (once). Chrome does not let any program install extensions for you.

Download only content you have the rights to use (your own, royalty-free, Creative Commons or licensed).

### Build
`npm install && ./build.sh` creates everything in `dist/`. `python3 tools/check.py` runs the checks. The single source is `src/DownConvertron.hta` (JScript ES3 for mshta/IE11); the Mac app is generated from it with Electron. Translations live in `i18n/strings.json`. Pushing a `v*` tag builds and publishes a release.

### License
[GPL-3.0-or-later](LICENSE) · designed by **Welsho**
