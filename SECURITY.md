# Security

English · [Italiano](#sicurezza)

DownConvertron is not signed and does things security tools look at closely: a `.bat` installer that runs PowerShell, an HTA, an unsigned Mac app, a Chrome extension loaded by hand that can read cookies. This page lists what each part does, with the names of the files that do it, so you can check.

## Supported versions

Only the latest release gets fixes.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private reporting: the **Security** tab of this repository → **Report a vulnerability**.

The project is maintained by one person in his spare time: expect a first answer within about a week. You will be credited in the changelog unless you prefer not to be.

In scope: the app, the Windows installer, the Chrome extension, the native messaging bridge, the build and release workflow.
Out of scope: bugs in yt-dlp, FFmpeg, Deno, Electron or Chrome (please report them to those projects), and sites that stop working.

## What DownConvertron does on your computer

### Windows installer (`DownConvertron-Setup.bat`, built by `windows/build_installer.py`)

- The `.bat` starts PowerShell with `-NoProfile -ExecutionPolicy Bypass`, reads itself and runs the script stored after a marker inside the same file. Some antivirus programs flag this pattern.
- It installs or updates three packages with winget: `yt-dlp.yt-dlp`, `yt-dlp.FFmpeg`, `DenoLand.Deno`. DownConvertron does not bundle or redistribute them.
- It writes the app, its icon and `Uninstall.cmd` to `%LOCALAPPDATA%\Programs\DownConvertron`, and removes the Windows "downloaded from the Internet" mark from those files.
- It creates three shortcuts: *DownConvertron* on the Desktop and in the Start menu, and *Uninstall DownConvertron* in the Start menu.
- It writes `HKCU\Software\Classes\downconvertron` (the `downconvertron://` link) and the launcher `%APPDATA%\DownConvertron\apri.js`.
- It deletes the shortcuts and program folders of the previous versions of this app (DownLTransFMecchazzi, Mecchazzi, Scarica Video). Their settings are kept and picked up by the new app.
- It does not ask for admin rights. Whether winget asks for elevation for a package depends on winget and on your PC.

### Windows app (`DownConvertron.hta`)

- It is an HTA: Windows' own `mshta.exe` runs it with your user's rights and without a browser sandbox.
- Data folder: `%APPDATA%\DownConvertron`: settings and presets, download archive, the configuration and log of the last job, the debug report, the Chrome extension folder (`chrome-extension`), the bridge (`nmhost`), the launcher (`apri.js`), the drag-and-drop helper (`trascina`), temporary cookie files (`cookies`) and the list of links that asked for a login (`login_richiesto.txt`). Temporary files go to `%TEMP%\DownConvertron`.
- Registry, current user only, written again at every start so that they follow the app if you move it:
  - `HKCU\Software\Classes\downconvertron`: the `downconvertron://` link;
  - `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.welsho.downconvertron`: the bridge.
- Programs it starts: yt-dlp, ffmpeg, Deno (through yt-dlp), Windows' `curl.exe` (direct image downloads), winget (components), `wscript.exe` (the launcher), Explorer, Chrome (to show the Extensions page) and PowerShell (the bridge and the drag-and-drop helper).
- The drag-and-drop helper is a small C# program (`windows/Ricevitore.cs`). PowerShell compiles it on your PC the first time, with the compiler that ships with Windows, and keeps the result in `%APPDATA%\DownConvertron\trascina`.
- To open Chrome's Extensions page the app starts Chrome on a local page and then sends keystrokes to that Chrome window (`Ctrl+L`, `chrome://extensions`, Enter). It does so only when you press **Chrome extension** or the COMPONENTS light.
- To know whether the extension is installed (COMPONENTS light), the app reads the `Preferences` and `Secure Preferences` files of your Chrome profiles and looks for the path of the extension folder.
- Links and options reach yt-dlp and curl through temporary files, not on the command line.
- The single-file HTA, used without the installer, does all of the above too. It has no uninstaller: see "Removing everything".

### Mac app (`DownConvertron-Mac-AppleSilicon.zip`)

- An Electron app, ad-hoc signed, not signed with an Apple Developer ID and not notarized. macOS blocks it until you allow it.
- The window loads only the local interface, with a Content Security Policy that allows no remote content. The interface has Node.js access, because it has to start yt-dlp and ffmpeg.
- Data folder: `~/Library/Application Support/DownConvertron`.
- **Install / update components** downloads the latest yt-dlp and Deno from their GitHub releases and ffmpeg and ffprobe from ffmpeg.martin-riedl.de, into `~/Library/Application Support/DownConvertron/bin`. Each file is compared with the SHA-256 published by its source; a file that does not match is discarded. If the source publishes no checksum, the check is skipped and the log says so. The quarantine mark is then removed from that `bin` folder.
- At every start it copies the bridge to `~/Library/Application Support/DownConvertron/nmhost` and writes `NativeMessagingHosts/com.welsho.downconvertron.json` in the profile folder of Google Chrome, Chrome Beta and Chromium, where those folders exist.
- To open Chrome's Extensions page it uses AppleScript: the first time, macOS asks whether DownConvertron may control Chrome.
- The Mac app has never been run on a real Mac. What is written here comes from the code.

### Network

The app itself contacts:
- the sites you download from (through yt-dlp and curl);
- the sources of its components (winget on Windows; GitHub and ffmpeg.martin-riedl.de on Mac), when you install or update them;
- `https://www.youtube.com/generate_204`, at start and every five minutes while idle: the LINK light uses it to know whether you are online.

There is no telemetry, no account, no update check for the app, and no server of ours.

### Chrome extension (`extension/`)

- Manifest V3, with no background script and no content script: it runs only while its popup is open.
- Permissions: `tabs`, `activeTab`, `scripting`, `clipboardWrite`, `downloads`, `nativeMessaging`, `cookies`, and access to all sites (`<all_urls>`). They are fixed in the manifest.
- When you open the popup it lists your open tabs, runs a script in the active tab to read its links, video sources and images, loads the thumbnails of those images, and asks the bridge whether any link is waiting for a login.
- When you press a send button it writes the links and your settings to the clipboard, with a header the app recognises. The extension's own short log travels with them and appears in the app's log.
- **Save to Downloads** downloads the chosen images with Chrome's download manager, into `Downloads/DownConvertron`.
- The public key in the manifest gives the extension a fixed ID (`pebnkaehmjjlhikgbcidlhkjjgonagei`), which the bridge needs. The private key was discarded.
- It is not on the Chrome Web Store; the app prepares the folder and you load it in Developer mode.

### The bridge (`windows/dcvt_host.ps1`, `mac/src/dcvt_host.js`)

- A native messaging host named `com.welsho.downconvertron`. Chrome starts it, and only for the extension with the ID above (`allowed_origins`). It handles one message and exits.
- It accepts four operations: `ping`; `richieste` (returns the links that asked for a login); `open` (starts the app or brings it to the front; only a `downconvertron://` link is accepted); `cookies` (saves one cookie file; the name must be 16 to 64 lowercase letters and digits and the content must start with the Netscape cookie header).
- On Windows, `open` looks for the running app, or starts it through WMI, and to bring it to the front simulates a press of the Alt key. A security product may report that.
- At every call it also deletes old cookie files (see below).
- What `allowed_origins` does not do: it keeps other extensions out, but it does not protect you from a program already running under your user account, which could read the files of your profile anyway.

### Cookies: "Use my login" and "Use Firefox login"

"Use my login" is a switch in the extension. **It is on by default.**

1. With the switch on, every time you press **Add to list** or **Download now** the extension reads all the Chrome cookies of the base domain of each link you are sending, subdomains included (`extension/popup.js`, `mandaCookie`). This happens whether or not the site will ask for a login. With the switch off, it happens only when you press **Retry with my login**.
2. The cookies go to the bridge, which writes them to `%APPDATA%\DownConvertron\cookies\<random name>.txt` (Mac: `~/Library/Application Support/DownConvertron/cookies/`), in Netscape format, **not encrypted**. On Mac the file is readable by your user only. The clipboard carries only the random name.
3. The app uses the file only when a download fails with a message that asks for a login, or with HTTP 401 or 403: it retries that link once, with `--cookies` for yt-dlp or `cookie =` in curl's configuration file. With **Retry with my login** the file is used on the first attempt.
4. The file is deleted:
   - when the download run ends or is cancelled;
   - as soon as no link in the list needs it (row removed, list cleared, link already downloaded);
   - after 30 minutes, if its links sit in the list and no download is running;
   - when you close the app (files that arrived less than a minute earlier and are not yet in the list are left to the next two rules);
   - when the app starts, for files older than 10 minutes;
   - by the bridge, at each of its calls (so every time you open the extension): files older than 10 minutes when the app is closed or no longer using them, and in any case files older than 6 hours.
5. What you should know:
   - while the file exists, whoever can read it has access to your account on that site, for as long as that session is valid;
   - if the app crashes or the computer is switched off, the file stays until the app starts again or the extension is opened;
   - using your account's cookies to download may be against a site's terms.

"Use Firefox login" is a checkbox in the app, off by default and not remembered between sessions. When ticked, the app passes `--cookies-from-browser firefox` to yt-dlp, which reads the cookies from your Firefox profile for all the links of that run. DownConvertron writes no cookie file in this case.

## Checking a download

Each release lists the SHA-256 of its files in `SHA256SUMS.txt`.

- Windows (PowerShell): `Get-FileHash .\DownConvertron-Setup.bat -Algorithm SHA256`
- Mac (Terminal): `shasum -a 256 DownConvertron-Mac-AppleSilicon.zip`

Compare the result with the line for that file. A checksum published next to the files protects you from altered copies found elsewhere and from broken downloads; it does not protect you if the GitHub account itself were compromised.

Release files are built by GitHub Actions from the tagged commit (`.github/workflows/build.yml`). You can also build them yourself: see "For developers" in the README.

## Removing everything

- **Windows, installed**: Start menu → *Uninstall DownConvertron*. It removes the shortcuts, the two registry entries, the bridge (`nmhost`), the `cookies` folder and the program folder. To remove settings, logs and the extension folder too, delete `%APPDATA%\DownConvertron`. yt-dlp, ffmpeg and Deno stay installed: remove them with winget if you no longer need them.
- **Windows, single-file HTA**: delete the `.hta`, delete `%APPDATA%\DownConvertron`, and remove the two registry entries, for example from a Command Prompt:
  `reg delete "HKCU\Software\Classes\downconvertron" /f`
  `reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.welsho.downconvertron" /f`
- **Mac**: delete the app, `~/Library/Application Support/DownConvertron`, and `com.welsho.downconvertron.json` in `~/Library/Application Support/Google/Chrome/NativeMessagingHosts` (and in the same folder of Chrome Beta or Chromium, if you use them).
- **Chrome**: remove the extension from `chrome://extensions`.

---

# Sicurezza

[English](#security) · Italiano

DownConvertron non è firmato e fa cose che i programmi di sicurezza guardano da vicino: un installer `.bat` che esegue PowerShell, un'HTA, un'app Mac non firmata, un'estensione Chrome caricata a mano che può leggere i cookie. Questa pagina elenca cosa fa ogni parte, con i nomi dei file che lo fanno, così puoi controllare.

## Versioni supportate

Solo l'ultima release riceve correzioni.

## Segnalare una vulnerabilità

Per favore non aprire una issue pubblica. Usa la segnalazione privata di GitHub: scheda **Security** di questa repository → **Report a vulnerability**.

Il progetto è seguito da una persona sola nel tempo libero: aspettati una prima risposta entro una settimana circa. Sarai citato nel changelog, a meno che tu non preferisca di no.

Rientrano: l'app, l'installer per Windows, l'estensione Chrome, il ponte di native messaging, il processo di build e di release.
Non rientrano: i difetti di yt-dlp, FFmpeg, Deno, Electron o Chrome (vanno segnalati a quei progetti) e i siti che smettono di funzionare.

## Cosa fa DownConvertron sul tuo computer

### Installer per Windows (`DownConvertron-Setup.bat`, costruito da `windows/build_installer.py`)

- Il `.bat` avvia PowerShell con `-NoProfile -ExecutionPolicy Bypass`, legge se stesso ed esegue lo script che si trova dopo un marcatore nello stesso file. Alcuni antivirus segnalano questo schema.
- Installa o aggiorna tre pacchetti con winget: `yt-dlp.yt-dlp`, `yt-dlp.FFmpeg`, `DenoLand.Deno`. DownConvertron non li include e non li ridistribuisce.
- Scrive l'app, la sua icona e `Uninstall.cmd` in `%LOCALAPPDATA%\Programs\DownConvertron`, e toglie da quei file il contrassegno di Windows «scaricato da Internet».
- Crea tre collegamenti: *DownConvertron* sul Desktop e nel menu Start, *Uninstall DownConvertron* nel menu Start.
- Scrive `HKCU\Software\Classes\downconvertron` (il link `downconvertron://`) e il lanciatore `%APPDATA%\DownConvertron\apri.js`.
- Cancella i collegamenti e le cartelle di programma delle versioni precedenti di questa app (DownLTransFMecchazzi, Mecchazzi, Scarica Video). Le loro impostazioni restano e la nuova app le riprende.
- Non chiede diritti di amministratore. Se winget chieda l'elevazione per un pacchetto dipende da winget e dal tuo PC.

### App per Windows (`DownConvertron.hta`)

- È un'HTA: la esegue `mshta.exe` di Windows, con i diritti del tuo utente e senza la sandbox di un browser.
- Cartella dati: `%APPDATA%\DownConvertron`: impostazioni e preset, archivio dei download, configurazione e registro dell'ultimo lavoro, report di debug, cartella dell'estensione Chrome (`chrome-extension`), ponte (`nmhost`), lanciatore (`apri.js`), programma del trascinamento (`trascina`), file temporanei dei cookie (`cookies`) ed elenco dei link che hanno chiesto l'accesso (`login_richiesto.txt`). I file temporanei vanno in `%TEMP%\DownConvertron`.
- Registro, solo per il tuo utente, riscritto a ogni avvio perché segua l'app se la sposti:
  - `HKCU\Software\Classes\downconvertron`: il link `downconvertron://`;
  - `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.welsho.downconvertron`: il ponte.
- Programmi che avvia: yt-dlp, ffmpeg, Deno (attraverso yt-dlp), `curl.exe` di Windows (download diretto delle immagini), winget (componenti), `wscript.exe` (il lanciatore), Esplora file, Chrome (per mostrare la pagina Estensioni) e PowerShell (il ponte e il programma del trascinamento).
- Il programma del trascinamento è un piccolo programma in C# (`windows/Ricevitore.cs`). PowerShell lo compila sul tuo PC la prima volta, con il compilatore incluso in Windows, e tiene il risultato in `%APPDATA%\DownConvertron\trascina`.
- Per aprire la pagina Estensioni di Chrome, l'app avvia Chrome su una pagina locale e poi manda dei tasti a quella finestra di Chrome (`Ctrl+L`, `chrome://extensions`, Invio). Lo fa solo quando premi **Estensione Chrome** o la spia COMPONENTI.
- Per sapere se l'estensione è installata (spia COMPONENTI), l'app legge i file `Preferences` e `Secure Preferences` dei tuoi profili di Chrome e cerca il percorso della cartella dell'estensione.
- Link e opzioni arrivano a yt-dlp e a curl attraverso file temporanei, non nella riga di comando.
- L'HTA in file unico, usata senza installer, fa anche lei tutto questo. Non ha un programma di disinstallazione: vedi «Togliere tutto».

### App per Mac (`DownConvertron-Mac-AppleSilicon.zip`)

- Un'app Electron con firma ad-hoc, non firmata con un Developer ID Apple e non notarizzata. macOS la blocca finché non la autorizzi.
- La finestra carica solo l'interfaccia locale, con una Content Security Policy che non ammette contenuti remoti. L'interfaccia ha accesso a Node.js, perché deve avviare yt-dlp e ffmpeg.
- Cartella dati: `~/Library/Application Support/DownConvertron`.
- **Installa / aggiorna componenti** scarica le ultime versioni di yt-dlp e Deno dalle loro release su GitHub, e ffmpeg e ffprobe da ffmpeg.martin-riedl.de, in `~/Library/Application Support/DownConvertron/bin`. Ogni file viene confrontato con l'impronta SHA-256 pubblicata dalla sua fonte; un file che non corrisponde viene scartato. Se la fonte non pubblica l'impronta, il controllo viene saltato e il registro lo dice. Poi dalla cartella `bin` viene tolto il contrassegno di quarantena.
- A ogni avvio copia il ponte in `~/Library/Application Support/DownConvertron/nmhost` e scrive `NativeMessagingHosts/com.welsho.downconvertron.json` nella cartella del profilo di Google Chrome, Chrome Beta e Chromium, dove quelle cartelle esistono.
- Per aprire la pagina Estensioni di Chrome usa AppleScript: la prima volta macOS chiede se DownConvertron può controllare Chrome.
- L'app per Mac non è mai stata avviata su un Mac vero. Quello che è scritto qui viene dal codice.

### Rete

L'app, da parte sua, contatta:
- i siti da cui scarichi (attraverso yt-dlp e curl);
- le fonti dei suoi componenti (winget su Windows; GitHub e ffmpeg.martin-riedl.de sul Mac), quando li installi o li aggiorni;
- `https://www.youtube.com/generate_204`, all'avvio e ogni cinque minuti quando è ferma: serve alla spia LINK per sapere se sei in rete.

Non c'è telemetria, non c'è account, non c'è un controllo di aggiornamenti dell'app e non c'è nessun nostro server.

### Estensione Chrome (`extension/`)

- Manifest V3, senza script in background e senza content script: lavora solo mentre il suo popup è aperto.
- Permessi: `tabs`, `activeTab`, `scripting`, `clipboardWrite`, `downloads`, `nativeMessaging`, `cookies` e accesso a tutti i siti (`<all_urls>`). Sono fissi nel manifest.
- Quando apri il popup elenca le schede aperte, esegue uno script nella scheda attiva per leggerne link, video e immagini, carica le miniature di quelle immagini e chiede al ponte se qualche link aspetta il login.
- Quando premi un pulsante di invio scrive negli appunti i link e le tue impostazioni, con un'intestazione che l'app riconosce. Insieme viaggia il breve registro dell'estensione, che compare nel registro dell'app.
- **Salva nei Download** scarica le immagini scelte con il gestore dei download di Chrome, in `Download/DownConvertron`.
- La chiave pubblica nel manifest dà all'estensione un ID fisso (`pebnkaehmjjlhikgbcidlhkjjgonagei`), che serve al ponte. La chiave privata è stata scartata.
- Non è sul Chrome Web Store: l'app prepara la cartella e tu la carichi in Modalità sviluppatore.

### Il ponte (`windows/dcvt_host.ps1`, `mac/src/dcvt_host.js`)

- È un host di native messaging che si chiama `com.welsho.downconvertron`. Lo avvia Chrome, e solo per l'estensione con l'ID qui sopra (`allowed_origins`). Gestisce un messaggio e si chiude.
- Accetta quattro operazioni: `ping`; `richieste` (restituisce i link che hanno chiesto l'accesso); `open` (avvia l'app o la porta in primo piano; è accettato solo un link `downconvertron://`); `cookies` (salva un file di cookie; il nome deve avere da 16 a 64 lettere minuscole e cifre e il contenuto deve iniziare con l'intestazione dei cookie Netscape).
- Su Windows, `open` cerca l'app già aperta, oppure la avvia attraverso WMI, e per portarla in primo piano simula la pressione del tasto Alt. Un prodotto di sicurezza può segnalarlo.
- A ogni chiamata cancella anche i file di cookie vecchi (vedi sotto).
- Cosa non fa `allowed_origins`: tiene fuori le altre estensioni, ma non ti protegge da un programma già in esecuzione con il tuo utente, che potrebbe comunque leggere i file del tuo profilo.

### Cookie: «Usa il mio login» e «Usa login di Firefox»

«Usa il mio login» è un interruttore dell'estensione. **È acceso di base.**

1. Con l'interruttore acceso, ogni volta che premi **Metti in lista** o **Scarica subito** l'estensione legge tutti i cookie di Chrome del dominio base di ogni link che stai mandando, sottodomini compresi (`extension/popup.js`, `mandaCookie`). Succede che il sito poi chieda l'accesso oppure no. Con l'interruttore spento, succede solo quando premi **Riprova con il mio login**.
2. I cookie vanno al ponte, che li scrive in `%APPDATA%\DownConvertron\cookies\<nome casuale>.txt` (Mac: `~/Library/Application Support/DownConvertron/cookies/`), in formato Netscape, **non cifrati**. Sul Mac il file è leggibile solo dal tuo utente. Negli appunti viaggia solo il nome casuale.
3. L'app usa il file solo quando un download fallisce con un messaggio che chiede l'accesso, oppure con un errore HTTP 401 o 403: riprova quel link una volta, con `--cookies` per yt-dlp o `cookie =` nel file di configurazione di curl. Con **Riprova con il mio login** il file viene usato al primo tentativo.
4. Il file viene cancellato:
   - quando il download finisce o viene annullato;
   - appena nessun link in lista lo usa più (riga tolta, lista svuotata, link già scaricato);
   - dopo 30 minuti, se i suoi link restano in lista e nessun download è in corso;
   - quando chiudi l'app (i file arrivati da meno di un minuto e non ancora in lista restano alle due regole seguenti);
   - all'avvio dell'app, per i file più vecchi di 10 minuti;
   - dal ponte, a ogni sua chiamata (quindi ogni volta che apri l'estensione): i file più vecchi di 10 minuti quando l'app è chiusa o non li usa più, e in ogni caso i file più vecchi di 6 ore.
5. Cosa devi sapere:
   - finché il file esiste, chi può leggerlo ha l'accesso al tuo account su quel sito, per tutto il tempo in cui quella sessione resta valida;
   - se l'app si blocca o il computer viene spento, il file resta fino al prossimo avvio dell'app o alla prossima apertura dell'estensione;
   - usare i cookie del tuo account per scaricare può essere contrario ai termini di un sito.

«Usa login di Firefox» è una casella dell'app, spenta di base e non ricordata da una sessione all'altra. Quando è spuntata, l'app passa `--cookies-from-browser firefox` a yt-dlp, che legge i cookie dal tuo profilo Firefox per tutti i link di quel download. In questo caso DownConvertron non scrive nessun file di cookie.

## Controllare un file scaricato

Ogni release elenca le impronte SHA-256 dei suoi file in `SHA256SUMS.txt`.

- Windows (PowerShell): `Get-FileHash .\DownConvertron-Setup.bat -Algorithm SHA256`
- Mac (Terminale): `shasum -a 256 DownConvertron-Mac-AppleSilicon.zip`

Confronta il risultato con la riga di quel file. Un'impronta pubblicata accanto ai file ti protegge dalle copie alterate trovate altrove e dai download rovinati; non ti protegge se a essere compromesso fosse l'account GitHub.

I file delle release sono costruiti da GitHub Actions a partire dal commit del tag (`.github/workflows/build.yml`). Puoi anche costruirli da solo: vedi «Per sviluppatori» nel README.

## Togliere tutto

- **Windows, installata**: menu Start → *Uninstall DownConvertron*. Toglie i collegamenti, le due voci di registro, il ponte (`nmhost`), la cartella `cookies` e la cartella del programma. Per togliere anche impostazioni, registro e cartella dell'estensione, cancella `%APPDATA%\DownConvertron`. yt-dlp, ffmpeg e Deno restano installati: toglili con winget se non ti servono più.
- **Windows, HTA in file unico**: cancella il file `.hta`, cancella `%APPDATA%\DownConvertron` e togli le due voci di registro, per esempio dal Prompt dei comandi:
  `reg delete "HKCU\Software\Classes\downconvertron" /f`
  `reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.welsho.downconvertron" /f`
- **Mac**: cestina l'app, `~/Library/Application Support/DownConvertron` e il file `com.welsho.downconvertron.json` in `~/Library/Application Support/Google/Chrome/NativeMessagingHosts` (e nella stessa cartella di Chrome Beta o Chromium, se li usi).
- **Chrome**: rimuovi l'estensione da `chrome://extensions`.
