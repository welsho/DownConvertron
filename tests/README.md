# Prove automatiche

Le prove girano sull'app Mac (Electron) costruita da `python3 mac/build_mac.py`, anche su Linux con un display virtuale (Xvfb).

```bash
npm install                     # electron e playwright
python3 mac/build_mac.py
xvfb-run node tests/electron/lang.js      # tre lingue, screenshot in build/test-shots, testi italiani rimasti
xvfb-run node tests/electron/d1.js        # protocollo app <-> ricevitore del trascinamento (ricevitore simulato)
xvfb-run node tests/electron/d4.js        # trascinamento sul Mac: overlay, animazione, file in lista (serve ffmpeg)
xvfb-run node tests/electron/c3.js        # estensione Chrome: installazione e ricezione dei link
xvfb-run node tests/electron/rot.js       # fotogrammi della rotazione del mecha
xvfb-run node tests/electron/imgs.js      # immagini singole in ordine -> GIF e MP4 (serve ffmpeg)
xvfb-run node tests/electron/img_dl.js    # download di immagini con curl, anche un 404 (server locale incluso)
xvfb-run node tests/electron/comp.js      # spia COMPONENTI: Chrome assente, estensione mancante, installata
python3 tools/make_gif.py                 # GIF della rotazione (30 fps) per il README
DCVT_TEST_HOME=/percorso/demo xvfb-run node tests/electron/docs.js docs/img   # screenshot del README
```

Variabili utili: `DCVT_ELECTRON` (eseguibile di Electron), `DCVT_PLAYWRIGHT` (modulo playwright), `DCVT_TEST_HOME` (home finta).
Le parti solo Windows (mshta, winget, ricevitore nativo, registro) vanno provate su un PC Windows.
