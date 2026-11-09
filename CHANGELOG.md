# Changelog

## 7.0 — DownConvertron
- **Immagini nel downloader, formato per riga**: ogni immagine in lista ha il suo menu. **Originale** (predefinito) salva il file così com'è sul server, byte per byte, senza ricodifica; **PNG**, **WebP** e **JPG** la convertono con ffmpeg dopo il download. PNG e WebP conservano l'alfa (WebP senza perdita, con perdita solo partendo da un JPG; una GIF animata resta animata in WebP). Con JPG le parti trasparenti diventano bianche e il registro lo avvisa. Se ffmpeg manca o la conversione fallisce, resta l'immagine originale (stato «Parziale» con il motivo).
- **Estensione, fonte massima**: per ogni immagine si prende la versione più grande dichiarata dalla pagina (`srcset` dell'immagine e delle `<source>` del `<picture>`), non quella che il browser ha scelto per lo schermo.
- **Estensione, «Salva nei Download»**: un'immagine senza estensione nell'URL prende l'estensione dal tipo dichiarato dal server (un WebP non viene più salvato come .jpg).
- **Estensione**: due pulsanti, «Metti in lista» e «Scarica subito» (con Video o Solo audio l'app avvia il download da sola). Le impostazioni rapide azzerano codec, audio, frequenza e canali alle scelte automatiche: non resta più, per esempio, un «Nessun audio» scelto prima nell'app.
- **Immagini dall'estensione**: arrivano all'app marcate come immagini e si scaricano anche quando l'URL non ha estensione (X, Unsplash, Google…). L'estensione del file viene dal contenuto (un .jpg che in realtà è WebP diventa .webp); una pagina web al posto dell'immagine dà un errore chiaro. Raccolte anche le immagini non ancora caricate (lazy).
- **Link incollati a mano**: se yt-dlp risponde «Unsupported URL» e il server dice che è un'immagine, l'app la scarica direttamente.
- **Convertitore, immagini singole**: un'immagine sola ora entra in lista (prima veniva scartata). Con un'uscita video diventa una clip ferma, con la durata scelta nella sua riga; con un'uscita immagine diventa un file (nuovo gruppo «Immagine singola»: PNG, WebP, TIFF con alfa, JPG; le Sequenze PNG/TIFF/EXR con un'immagine sola danno un file, non una cartella). Dai video, i formati immagine salvano il fotogramma all'inizio del taglio.
- **Convertitore, foto scelte una per una**: due o più immagini scelte o trascinate sono esattamente quelle, in ordine di nome. Prima foto numerate come IMG_1234 e IMG_1240 diventavano la sequenza di tutta la cartella. Accettati anche .jfif e .avif.
- **Più immagini insieme**: l'app chiede ogni volta se farne **un'unica animazione** o **immagini separate** (clip ferme o file immagine, secondo il formato di uscita). Nelle animazioni di immagini le **immagini al secondo** si scelgono nella riga, a parte dagli FPS del video (con FPS «Originale» il video resta a «FPS delle sequenze», GIF/WebP/APNG animati seguono le immagini).
- **Link nel convertitore**: i link diretti a un'immagine (anche senza estensione, riconosciuti dopo «Unsupported URL») si scaricano con curl e diventano immagini singole.
- **Lingue**: tradotte le frasi che iniziavano con testo in grassetto (istruzioni dell'estensione), i gruppi del menu dei formati e i titoli delle finestre di scelta file e cartelle (Windows e Mac).
- **Convertitore, correzioni dalla revisione** (provate con ffmpeg reale):
  - sequenze EXR di nuovo funzionanti (ffmpeg ha tolto `-apply_trc`: ora la conversione da lineare a sRGB la fa `zscale`, colori verificati sul grigio 128);
  - animazioni di immagini scelte una per una salvate **accanto agli originali** con «Nella stessa cartella» (prima finivano nella copia temporanea, cancellata al riavvio);
  - alfa delle animazioni decisa da **tutte** le immagini, non solo dalla prima (JPG opaco seguito da PNG trasparenti);
  - **HEVC con alfa** di Apple riconosciuto anche se ffprobe lo dice opaco;
  - WebP animati in ingresso trattati come video; GIF di un solo fotogramma e AVIF diventano clip ferme; AVIF e JFIF accettati nelle animazioni;
  - tela con bordi nel formato giusto: PNG/Animazione/APNG restano senza perdita, ProRes e CineForm a 12 bit, EXR in virgola mobile;
  - foto numerate di misure diverse (verticali e orizzontali) con bordi e centrate, non più stirate;
  - avanti-indietro senza fotogrammi ripetuti alla svolta e alla giunzione del loop;
  - GIF con trasparenza senza «fantasma» (fotogrammi interi); GIF e APNG a 10 fps restano a 10 fps;
  - cambio contenitore bloccato sulle animazioni di immagini (il MOV risultava rotto);
  - selezionare tutti i fotogrammi di una sequenza e trascinarli dà la sequenza (senza domanda e senza copie);
  - nomi con `%2B` trascinati dal ricevitore non più decodificati; fotogrammi rinominati con la cartella («X (2)_png»); l'errore di un'animazione non creata resta visibile.
- **Logo e invio dall'estensione**: se DownConvertron è già aperta viene riportata in primo piano (anche se ridotta a icona) invece di aprirne un'altra. Il collegamento `downconvertron://` passa da un piccolo lanciatore invisibile (`apri.js` in `%APPDATA%\DownConvertron`). Prima, con l'HTA aperta col doppio clic (mshta a 32 bit) e il collegamento su mshta a 64 bit, si aprivano due app che leggevano gli stessi appunti.
- **Dall'estensione all'app** (dalla revisione):
  - un invio mentre l'app scarica non si perde più: viene preso subito dagli appunti (che tornano link semplici) e aggiunto a fine lavoro;
  - un solo messaggio riassuntivo per invio; reinviare link già in lista ma non scaricati non dà più errore, e «Scarica subito» li avvia;
  - versioni confrontate come numeri (la 10.0 non risulta più vecchia della 7.0);
  - URL con `'`, `|` o parentesi non più tagliati.
- **Estensione Chrome** (dalla revisione):
  - canali, schede di un canale, dirette (Twitch e `/@nome/live`), ricerche e pagine come impostazioni o podcast **partono non spuntate**, con l'etichetta arancione «canale / diretta / pagina» e un avviso: un canale scarica tutti i suoi video, una diretta registra finché non la fermi;
  - immagini non ancora caricate (`data-src`, `data-srcset`) e immagini di sfondo raccolte nella versione più grande; le pagine `/wiki/File:` non contano più come immagini;
  - il pulsante delle immagini si chiama **Salva nei Download** (non più «Scarica subito», uguale a quello dei video); nomi dei file sempre validi (niente `~`, caratteri invisibili, nomi riservati di Windows) e resoconto «N in download, M non riuscite»;
  - avviso «Mostrate le prime 200 di N immagini»; le scelte restano quando la lista si aggiorna;
  - pulsanti e messaggi sempre visibili in fondo al popup anche quando scorre; testo alternativo sulle anteprime.
- **Download**:
  - fermare una **diretta** tiene la parte registrata come «nome (interrotta).ts» invece di cancellarla;
  - errore 403 di Twitch spiegato (VOD per abbonati, privato o rimosso);
  - una pagina HTML salvata come immagine viene riconosciuta e scartata;
  - controllo del tipo di un link più rapido (al massimo 8 secondi) e senza scaricare il file intero quando il server ignora la richiesta parziale.
- **Download delle immagini su Windows**: corretto «Impossibile trovare il percorso specificato» con l'app aperta in mshta a 32 bit (curl veniva cercato in `Sysnative` da un cmd a 64 bit).
- **Cartella dell'estensione**: il pulsante Estensione Chrome e la spia COMPONENTI aprono la cartella che la contiene, con `chrome-extension` già selezionata da trascinare intera.
- **Trascinamento**: il ricevitore tiene un registro (`ricevitore.log`) incluso nel Report debug; le richieste non vengono più riscritte prima di essere lette.
- **Dalla revisione finale**:
  - dirette di più di 2 GB interrotte: ora la parte registrata viene salvata (prima il controllo leggeva tutto il file e finiva in «Out of memory»);
  - «link|nome» scritto senza spazi e due link uniti da `|` di nuovo divisi bene;
  - animazioni di PNG opachi (green screen): l'alfa si decide dai pixel, non dall'estensione, e il chroma key torna a funzionare;
  - controllo dell'HEVC con alfa più rapido (circa 0,7 s invece di oltre 4 s su un 4K);
  - fotogrammi rinominati con la cartella anche sul Mac;
  - appunti occupati: un invio dell'estensione non viene più messo in coda due volte;
  - logo dell'estensione: l'app già aperta viene portata subito in primo piano, il ripristino dall'icona arriva dopo.
- **Layout**: lo zoom del mecha non scende più sotto il minimo leggibile per colpa della barra di scorrimento misurata a zoom 1 (0,797 invece di 0,8 su uno schermo 1920×1080).
- **Lingue**: tradotti gli ultimi messaggi rimasti in italiano (scelta di yt-dlp.exe, yt-dlp troppo vecchio, Report debug).
- Build su Windows: file generati sempre con fine riga LF; `check.py` corretto per Windows PowerShell 5.1.

## 6.0 — DownConvertron (interna, mai pubblicata)
- Nuovo nome **DownConvertron** su Windows, Mac, installer ed estensione; migrazione automatica di impostazioni, preset e archivio da DownLTransFMecchazzi, Mecchazzi e Scarica Video.
- **Lingue**: italiano, inglese, cinese semplificato; selettore nello slot sotto le fessure del casco; cambio immediato; l'estensione Chrome segue la lingua dell'app.
- **Schermo di stato** sotto i piedi: registro completo (app, estensione, strumenti), filtri, errori, copia e salvataggio. Più messaggi di stato nel display del casco, alternati alle frasi del mecha.
- **Spie** REATTORE (yt-dlp, rosso oltre 60 giorni), LINK (Deno + connessione), ENCODER (ffmpeg e codec), COMPONENTI (riassunto); clic = installa/aggiorna quella parte. Tolta la spia ALFA.
- **Estensione Chrome 6.0**: impostazioni rapide Video (qualità, file) / Solo audio (MP3, M4A, WAV, FLAC) / come nell'app; logo che apre l'app con `downconvertron://`; registro dell'estensione inviato all'app; testi in tre lingue.
- **Trascinamento**: ricevitore nativo di Windows (WinForms) con tutti i file e cartelle, anteprima della shell sotto il puntatore e descrizione «Copia in DownConvertron»; anello luminoso che segue il puntatore; rotazione del mecha a pochi fotogrammi dal fronte al retro e ritorno.
- Pulsante grande che resta su una riga anche con nomi lunghi; preset e menu tradotti.
- **Spia COMPONENTI** = estensione Chrome davvero installata (letta dalle preferenze dei profili di Chrome); clic = installa. La cartella dell'estensione è sempre pronta, anche usando solo l'HTA.
- **Immagini**: download dei link diretti a immagini (curl); nel convertitore immagini singole in ordine → video o GIF, un fotogramma ciascuna; l'estensione elenca le immagini della pagina con anteprima e download rapido.
- Rotazione del mecha fluida (animazione continua); intestazione del registro che non si sovrappone più ai pulsanti.
- Repository pubblico: build riproducibile (`build.sh`), controlli automatici (`tools/check.py`), release automatica con GitHub Actions.

## 5.0 — DownLTransFMecchazzi
- Sequenze PNG/TIFF/EXR con alfa in entrata e in uscita, WebP animato e APNG, HAP Alpha/Q/HAP, CineForm con alfa.
- Taglio da/a, ripetizioni, avanti-indietro; tela con bordi trasparenti; anteprima su scacchiera; preset con nome.
- Audio a 24 bit, tutte le tracce, layout multicanale corretti, normalizzazione EBU R128.
- Accelerazione GPU NVIDIA/Intel/AMD rilevata in automatico; HEVC con alfa sul Mac.
- Prima estensione Chrome; trascinamento con overlay; 16 correzioni dal debug dei download.

## 4.x — Mecchazzi
- Interfaccia mecha in un'altezza di schermo; versione Mac Apple Silicon (Electron) generata dalla stessa sorgente; convertitore WebM/MOV con alfa.

## 1.x–3.x — Scarica Video
- Prima interfaccia HTA per yt-dlp e ffmpeg.
