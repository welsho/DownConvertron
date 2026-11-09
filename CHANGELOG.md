# Changelog

## 6.0 — DownConvertron
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
- **Estensione**: due pulsanti, «Metti in lista» e «Scarica subito» (con Video o Solo audio l'app avvia il download da sola). Le impostazioni rapide azzerano codec, audio, frequenza e canali alle scelte automatiche: non resta più, per esempio, un «Nessun audio» scelto prima nell'app.
- **Immagini dall'estensione**: arrivano all'app marcate come immagini e si scaricano anche quando l'URL non ha estensione (X, Unsplash, Google…). L'estensione del file viene dal contenuto (un .jpg che in realtà è WebP diventa .webp); una pagina web al posto dell'immagine dà un errore chiaro. Raccolte anche le immagini non ancora caricate (lazy).
- **Link incollati a mano**: se yt-dlp risponde «Unsupported URL» e il server dice che è un'immagine, l'app la scarica direttamente.
- Build su Windows: file generati sempre con fine riga LF; `check.py` corretto per Windows PowerShell 5.1.
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
