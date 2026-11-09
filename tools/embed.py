# DownConvertron - inserisce nella sorgente src/DownConvertron.hta le parti generate:
#   1. i file dell'estensione Chrome (cartella extension/) tra EXT_FILES_INIZIO / EXT_FILES_FINE
#   2. il ricevitore del trascinamento per Windows (windows/ricevitore.ps1.in + windows/Ricevitore.cs) in DROP_PS
#   3. il mecha dell'overlay (fronte e retro) con tools/gen_mecha.py
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
# Uso: python3 tools/embed.py
import json, base64, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTA = os.path.join(ROOT, 'src', 'DownConvertron.hta')
EXT = os.path.join(ROOT, 'extension')

# 1. estensione (i file di testo devono essere ASCII: l'app li scrive con un writer ASCII)
subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools', 'ext_texts.py')])
files = {}
for n in sorted(os.listdir(EXT)):
    b = open(os.path.join(EXT, n), 'rb').read()
    if n.endswith('.png'): files[n] = 'b64:' + base64.b64encode(b).decode()
    else:
        t = b.decode('utf-8'); assert all(ord(c) < 128 for c in t), n + ' non ASCII'
        files[n] = t
s = open(HTA, encoding='utf-8').read()
blk = '/* EXT_FILES_INIZIO (generato da tools/embed.py) */\nvar EXT_FILES = ' + json.dumps(files, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/') + ';\n/* EXT_FILES_FINE */'
s, n = re.subn(r'/\* EXT_FILES_INIZIO.*?/\* EXT_FILES_FINE \*/', lambda m: blk, s, flags=re.S)
assert n == 1, n

# 2. ricevitore del trascinamento
cs = open(os.path.join(ROOT, 'windows', 'Ricevitore.cs'), encoding='utf-8').read()
ps = open(os.path.join(ROOT, 'windows', 'ricevitore.ps1.in'), encoding='utf-8').read().replace('__CSHARP__', cs)
assert all(ord(c) < 128 for c in ps), 'ricevitore non ASCII'
s, n = re.subn(r'var DROP_PS = ".*?";\n', lambda m: 'var DROP_PS = ' + json.dumps(ps) + ';\n', s, flags=re.S)
assert n == 1, n
# 3. traduzioni (i18n/strings.json: frase italiana -> en, zh)
db = json.load(open(os.path.join(ROOT, 'i18n', 'strings.json'), encoding='utf-8'))
tr = {'en': {}, 'zh': {}}
for k, v in db.items():
    for l in ('en', 'zh'):
        if v.get(l): tr[l][k] = v[l]
blk = '/* I18N_INIZIO (generato da tools/embed.py da i18n/strings.json) */\nvar I18N = ' + json.dumps(tr, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/') + ';\n/* I18N_FINE */'
s, n = re.subn(r'/\* I18N_INIZIO.*?/\* I18N_FINE \*/', lambda m: blk, s, flags=re.S)
assert n == 1, n
open(HTA, 'w', encoding='utf-8').write(s)
print('traduzioni:', len(tr['en']), 'en,', len(tr['zh']), 'zh')

# 4. mecha dell'overlay
subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools', 'gen_mecha.py')])
print('estensione:', ', '.join(files), '| ricevitore', len(ps), 'caratteri')
