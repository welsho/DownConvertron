# DownConvertron - genera l'app Mac (Electron) dalla STESSA sorgente dell'app Windows (src/DownConvertron.hta).
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
# Uso: python3 mac/build_mac.py   ->  build/mac-app/ (poi electron-packager, vedi build.sh)
import re, os, shutil, json, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'DownConvertron.hta')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'build', 'mac-app')
s = open(SRC, encoding='utf-8').read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, ('NON TROVATO', a[:100], s.count(a)); s = s.replace(a, b)
ver = re.search(r'version="([\d.]+)"', s).group(1)
# intestazione: via i tag di IE/HTA, dentro la politica di sicurezza
s = re.sub(r'<hta:application[^>]*>\s*', '', s, count=1, flags=re.S)
rep('<meta http-equiv="X-UA-Compatible" content="IE=edge">\n',
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\' \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: file:; font-src data:">\n')
# script: livello Mac prima, sostituzioni dopo, avvio rinviato
rep('<script>\n', '<script>window.DCVT_DEFER_INIT = true;</script>\n<script src="shim.js"></script>\n<script>\n')
rep('</script>\n</body>', '</script>\n<script src="mac.js"></script>\n</body>')
# testi Windows -> Mac
rep('" (winget codice " + hexCode(code) + ")"', '" (errore " + code + ")"')
rep('"  (presente, ma winget ha dato errore " + (code !== null && code !== undefined ? hexCode(code) : "") + ")"', '"  (presente, ma lo scaricamento ha dato errore " + (code !== null && code !== undefined ? code : "") + ")"')
rep('"Installazione interrotta dopo 15 minuti senza risposta da winget (forse \\u00e8 in corso un\'altra installazione o un aggiornamento di Windows).\\n"', '"Installazione interrotta dopo 15 minuti (connessione troppo lenta?).\\n"')
rep('ultima riga winget passo', 'ultima riga scaricamento passo')
# Ctrl+V -> Cmd+V nel codice e nelle traduzioni (la chiave italiana compare nel codice e nelle tabelle EN e ZH)
rep('incollalo nella chat con Ctrl+V.', 'incollalo nella chat con Cmd+V.', 3)
rep('paste it into the chat with Ctrl+V.', 'paste it into the chat with Cmd+V.')
rep('\\u7528 Ctrl+V \\u7c98\\u8d34\\u5230\\u804a', '\\u7528 Cmd+V \\u7c98\\u8d34\\u5230\\u804a')
rep('Il processo non è partito (bloccato da antivirus o criteri di sistema?).', 'Il processo non è partito.')
s = s.replace('Il percorso contiene il simbolo %', 'Il percorso contiene un carattere non ammesso (virgolette)')
rep('REPORT DEBUG DOWNCONVERTRON v' + ver, 'REPORT DEBUG DOWNCONVERTRON MAC v' + ver)
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(s)
for f in ('main.js', 'shim.js', 'mac.js', 'dcvt_host.js'): shutil.copy(os.path.join(ROOT, 'mac', 'src', f), os.path.join(OUT, f))
json.dump({"name": "downconvertron", "productName": "DownConvertron", "version": ver,
           "description": "DownConvertron - download e conversione video per creator (designed by Welsho)",
           "main": "main.js", "author": "Daniele Moretti (Welsho)", "license": "GPL-3.0-or-later"},
          open(os.path.join(OUT, 'package.json'), 'w'), indent=1)
print('mac-app', ver, len(s), OUT)
