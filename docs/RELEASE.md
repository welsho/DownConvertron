## DownConvertron 7.0 beta 2

English · [Italiano](#italiano)

First public release, as a **pre-release**. DownConvertron downloads video, audio and images from the web in bulk and converts them without losing the alpha channel. It is a front end for yt-dlp and ffmpeg, made for creators, streamers and video makers. Interface in Italian, English and Simplified Chinese.

About the number: 7.0 comes from the internal versions. This is the first public one.

### What it does
- **Bulk download**: lists of links, or your open tabs and the images of a page through the Chrome extension, with **Add to list** or **Download now**. Video, audio only, images.
- **Images**: from direct links, as they are or as PNG, WebP, JPG.
- **Conversion that keeps alpha**: WebM VP9 + alpha, ProRes 4444, HAP Alpha, animated WebP and APNG, PNG/TIFF/EXR sequences. Formats without alpha (MP4, JPG) are labelled as such.
- **Images to animation**: several images become one animation; one image becomes a still clip.
- Trim, forward-backward loops, vertical canvas with transparent borders, chroma key, checkerboard preview.

### What has been tested
| Part | Status |
|---|---|
| Windows app: download, converter, images | Tried by the author and by beta testers on Windows PCs, plus automated tests of the same code in Electron on Linux |
| Chrome extension: links and images | Tried by beta testers in Chrome on Windows and on Mac, plus automated tests in Chromium on Linux |
| Chrome extension: "Use my login" | Tried by beta testers in Chrome, plus a local test server (refused → retried with the login → downloaded) for a video and for an image |
| Mac app (Apple Silicon): download, images | Tried by beta testers on Apple Silicon Macs, plus automated tests of the interface code in Electron on Linux |
| Mac app (Apple Silicon): converter | Tried by beta testers on Apple Silicon Macs: formats with alpha, sequences, images to animation, trim and the other touch-ups |
| Screens less than about 950 px high | The window scrolls |

### Known issues
- **Single-file HTA (Windows)**: if you use `DownConvertron.hta` without installing and the extension opens the app, a later double-click on the file can open a second window. Open it one way only, or install it with the Setup.
- **Security programs (Windows)**: the extension talks to the app through a small PowerShell script that Chrome starts, hidden, every time you open the popup. To open the app or bring it to the front, that script starts `mshta.exe` and simulates the Alt key. Some antivirus programs may flag or block this. When it is blocked, the extension falls back to the `downconvertron://` link and sends the links without the login, and says so.
- **Cookies on shared domains**: for a link on a shared hosting domain (`name.github.io`, `name.blogspot.com`, a bucket on `amazonaws.com` and similar), "Use my login" passes the cookies of the whole parent domain, not only those of that one site.
- **Other Chromium browsers (Windows)**: the local bridge is registered for Google Chrome only. In Edge, Brave and the others the extension still sends links, but the login and opening the app through the bridge do not work.

### Files
| File | What it is |
|---|---|
| `DownConvertron-Setup.bat` | Installer for Windows 10/11. Recommended on Windows |
| `DownConvertron.hta` | The Windows app in one file, without installing |
| `DownConvertron-Mac-AppleSilicon.zip` | Mac app for Apple Silicon, macOS 13 or later |
| `DownConvertron-ChromeExtension.zip` | The Chrome extension, for those who want to inspect it. You do not need to download it: the app already contains it (**Chrome extension** button) |
| `SHA256SUMS.txt` | SHA-256 checksums of the files above |

### Before you install
- **None of these files is signed.** Windows SmartScreen will ask for confirmation (*More info → Run anyway*) and some antivirus programs will flag the installer: it is a `.bat` that runs a PowerShell script stored inside itself. What it does, item by item, is in [SECURITY.md](https://github.com/welsho/DownConvertron/blob/main/SECURITY.md).
- **Mac**: macOS will say that it cannot verify the developer, or that the app is damaged. The app is not signed with an Apple Developer ID and not notarized; that is what the message means. Open *System Settings → Privacy & Security → Open Anyway*. If macOS still refuses, run `xattr -dr com.apple.quarantine /Applications/DownConvertron.app` in Terminal: it removes the mark macOS puts on downloaded files, nothing else.
- **Chrome extension**: loaded by hand in Developer mode, from the folder the app prepares. It is not on the Chrome Web Store.
- The app installs yt-dlp, ffmpeg and Deno from their own sources (winget on Windows). It does not include them.

### Login and permissions
The extension has fixed permissions for tabs, the active page, the clipboard, downloads, cookies, all sites, and a local bridge to the app.

**"Use my login" is on by default** and can be switched off in the extension. While it is on, every time you send links the extension also passes Chrome's cookies for the sites of those links to the app, through the local bridge. They are written to an unencrypted file in the app's data folder, used only if the site asks you to sign in, and deleted when the download ends, as soon as no link in the list needs them, after 30 minutes if the links are left waiting, and when you close the app. While that file exists, whoever has it has access to your account on that site. It is meant for videos you can already watch with your own account. Details in the [README](https://github.com/welsho/DownConvertron/blob/main/README.md#chrome-extension-permissions-and-login).

### Checking the files
Compare each file with its line in `SHA256SUMS.txt`:
- Windows (PowerShell): `Get-FileHash .\DownConvertron-Setup.bat -Algorithm SHA256`
- Mac (Terminal): `shasum -a 256 DownConvertron-Mac-AppleSilicon.zip`

The files were built by GitHub Actions from this tag. Source code: this tag. Licence: GPL-3.0-or-later.

Download only content you have the right to use. Problems: [open an issue](https://github.com/welsho/DownConvertron/issues/new/choose). Full history (in Italian): [CHANGELOG.md](https://github.com/welsho/DownConvertron/blob/main/CHANGELOG.md).

If you had an earlier version (DownLTransFMecchazzi, Mecchazzi, Scarica Video), the installer removes it and the app picks up its settings.

designed by **Welsho**

---

## Italiano

Prima release pubblica, come **pre-release**. DownConvertron scarica in blocco dal web video, audio e immagini e li converte senza perdere il canale alfa. È un front end per yt-dlp e ffmpeg, pensato per creator, streamer e video maker. Interfaccia in italiano, inglese e cinese semplificato.

Sul numero: 7.0 viene dalle versioni interne. Questa è la prima pubblica.

### Cosa fa
- **Download in blocco**: liste di link, oppure le schede aperte e le immagini di una pagina dall'estensione Chrome, con **Metti in lista** o **Scarica subito**. Video, solo audio, immagini.
- **Immagini**: dai link diretti, così come sono oppure in PNG, WebP, JPG.
- **Conversione che conserva l'alfa**: WebM VP9 + alfa, ProRes 4444, HAP Alpha, WebP e APNG animati, sequenze PNG/TIFF/EXR. I formati senza alfa (MP4, JPG) sono indicati come tali.
- **Dalle immagini all'animazione**: più immagini diventano un'animazione; una sola immagine diventa una clip ferma.
- Taglio, avanti-indietro, tela verticale con bordi trasparenti, chroma key, anteprima su scacchiera.

### Cosa è stato provato
| Parte | Stato |
|---|---|
| App Windows: download, convertitore, immagini | Provata dall'autore e dai beta tester su PC Windows, più le prove automatiche dello stesso codice in Electron su Linux |
| Estensione Chrome: link e immagini | Provata dai beta tester in Chrome su Windows e su Mac, più le prove automatiche in Chromium su Linux |
| Estensione Chrome: «Usa il mio login» | Provato dai beta tester in Chrome, più un server di prova locale (rifiutato → nuovo tentativo con il login → scaricato) per un video e per un'immagine |
| App Mac (Apple Silicon): download, immagini | Provata dai beta tester su Mac Apple Silicon, più le prove automatiche del codice dell'interfaccia in Electron su Linux |
| App Mac (Apple Silicon): convertitore | Provato dai beta tester su Mac Apple Silicon: formati con alfa, sequenze, dalle immagini all'animazione, taglio e gli altri ritocchi |
| Schermi più bassi di circa 950 px | La finestra scorre |

### Limiti noti
- **HTA in file unico (Windows)**: se usi `DownConvertron.hta` senza installare e l'app viene aperta dall'estensione, un doppio clic successivo sul file può aprire una seconda finestra. Aprila sempre in un modo solo, oppure installala con il Setup.
- **Programmi di sicurezza (Windows)**: l'estensione parla con l'app attraverso un piccolo script PowerShell che Chrome avvia, nascosto, a ogni apertura del popup. Per aprire l'app o portarla in primo piano, quello script avvia `mshta.exe` e simula il tasto Alt. Alcuni antivirus possono segnalarlo o bloccarlo. Se viene bloccato, l'estensione ripiega sul link `downconvertron://` e manda i link senza il login, avvisandoti.
- **Cookie sui domini condivisi**: per un link su un dominio di hosting condiviso (`nome.github.io`, `nome.blogspot.com`, un bucket su `amazonaws.com` e simili), «Usa il mio login» passa i cookie di tutto il dominio superiore, non solo quelli di quel sito.
- **Altri browser Chromium (Windows)**: il ponte locale è registrato solo per Google Chrome. In Edge, Brave e negli altri l'estensione manda comunque i link, ma il login e l'apertura dell'app attraverso il ponte non funzionano.

### File
| File | Cos'è |
|---|---|
| `DownConvertron-Setup.bat` | Installer per Windows 10/11. Consigliato su Windows |
| `DownConvertron.hta` | L'app per Windows in un solo file, senza installare |
| `DownConvertron-Mac-AppleSilicon.zip` | App per Mac Apple Silicon, macOS 13 o successivo |
| `DownConvertron-ChromeExtension.zip` | L'estensione Chrome, per chi vuole ispezionarla. Non serve scaricarla: è già dentro l'app (pulsante **Estensione Chrome**) |
| `SHA256SUMS.txt` | Impronte SHA-256 dei file qui sopra |

### Prima di installare
- **Nessuno di questi file è firmato.** Windows SmartScreen chiede una conferma (*Ulteriori informazioni → Esegui comunque*) e alcuni antivirus segnaleranno l'installer: è un `.bat` che esegue uno script PowerShell contenuto al suo interno. Cosa fa, voce per voce, è scritto in [SECURITY.md](https://github.com/welsho/DownConvertron/blob/main/SECURITY.md#sicurezza).
- **Mac**: macOS dirà che non può verificare lo sviluppatore, oppure che l'app è danneggiata. L'app non è firmata con un Developer ID Apple e non è notarizzata: il messaggio vuol dire questo. Apri *Impostazioni di Sistema → Privacy e sicurezza → Apri comunque*. Se il Mac rifiuta ancora, esegui nel Terminale `xattr -dr com.apple.quarantine /Applications/DownConvertron.app`: toglie il contrassegno che macOS mette ai file scaricati, nient'altro.
- **Estensione Chrome**: si carica a mano in Modalità sviluppatore, dalla cartella che prepara l'app. Non è sul Chrome Web Store.
- L'app installa yt-dlp, ffmpeg e Deno dalle loro fonti (winget su Windows). Non li include.

### Login e permessi
L'estensione ha permessi fissi per le schede, la pagina attiva, gli appunti, i download, i cookie, tutti i siti e un ponte locale verso l'app.

**«Usa il mio login» è acceso di base** e si può spegnere nell'estensione. Finché è acceso, ogni volta che mandi dei link l'estensione passa all'app anche i cookie di Chrome dei siti di quei link, attraverso il ponte locale. Vengono scritti in un file non cifrato nella cartella dati dell'app, usati solo se il sito chiede l'accesso, e cancellati a fine download, appena nessun link in lista li usa, dopo 30 minuti se i link restano fermi, e quando chiudi l'app. Finché quel file esiste, chi lo ha ha l'accesso al tuo account su quel sito. Serve per i video a cui hai già accesso con il tuo account. I dettagli sono nel [README](https://github.com/welsho/DownConvertron/blob/main/README.it.md#estensione-chrome-permessi-e-login).

### Controllare i file
Confronta ogni file con la sua riga in `SHA256SUMS.txt`:
- Windows (PowerShell): `Get-FileHash .\DownConvertron-Setup.bat -Algorithm SHA256`
- Mac (Terminale): `shasum -a 256 DownConvertron-Mac-AppleSilicon.zip`

I file sono stati costruiti da GitHub Actions a partire da questo tag. Codice sorgente: questo tag. Licenza: GPL-3.0-or-later.

Scarica solo contenuti che hai il diritto di usare. Problemi: [apri una issue](https://github.com/welsho/DownConvertron/issues/new/choose). Storia completa: [CHANGELOG.md](https://github.com/welsho/DownConvertron/blob/main/CHANGELOG.md).

Se avevi una versione precedente (DownLTransFMecchazzi, Mecchazzi, Scarica Video), l'installer la toglie e l'app ne riprende le impostazioni.

designed by **Welsho**
