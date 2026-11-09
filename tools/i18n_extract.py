# DownConvertron - estrae dalla sorgente i testi italiani da tradurre (pagina + script).
# Scrive i18n/_da_tradurre.json con le frasi che mancano in i18n/strings.json.
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
import re, os, json, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, 'src', 'DownConvertron.hta'), encoding='utf-8').read()
s = re.sub(r'/\* EXT_FILES_INIZIO.*?EXT_FILES_FINE \*/', '', s, flags=re.S)
s = re.sub(r'var DROP_PS = ".*?";\n', '', s, flags=re.S)
s = re.sub(r'/\* I18N_INIZIO.*?/\* I18N_FINE \*/', '', s, flags=re.S)
s = re.sub(r'<!-- MECHA_\w+_INIZIO -->.*?<!-- MECHA_\w+_FINE -->', '', s, flags=re.S)
body = s[s.index('<body>'):s.index('<script>\n')]
js = s[s.index('<script>\n'):] + '\n' + open(os.path.join(ROOT, 'mac', 'src', 'mac.js'), encoding='utf-8').read()
# niente report di debug (resta in italiano), niente frasi meme, niente righe di DEBUG_ERRORS
js = re.sub(r'function debugReport\(\) \{.*?\n\}\n', '', js, flags=re.S)
js = re.sub(r'var PHRASES = \[.*?\];', '', js, flags=re.S)
js = '\n'.join(l for l in js.split('\n') if 'DEBUG_ERRORS.push' not in l)
def norm(t, is_html):
    # pagina: il testo arriva decodificato e con gli spazi compattati; script: la stringa com'e' (senza spazi ai bordi)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip() if is_html else t.strip()
found = {}
def add(t, where):
    t = norm(t, where in ('html', 'attr'))
    if len(t) < 2 or not re.search(r'[A-Za-zÀ-ÿ]{2}', t): return
    if re.fullmatch(r'[\w.\-/\\%:]+', t) and not re.search(r'[a-z]{3}', t): return
    found.setdefault(t, where)
# pagina: testi e attributi
b2 = re.sub(r'<svg.*?</svg>', '', body, flags=re.S)
b2 = re.sub(r'<(script|style)\b.*?</\1>', '', b2, flags=re.S)
for m in re.finditer(r'>([^<>]+)<', b2): add(m.group(1), 'html')
for m in re.finditer(r'\b(title|placeholder|label)="([^"]+)"', b2): add(m.group(2), 'attr')   # label: gruppi dei menu
# script: stringhe con lettere (escluse quelle che sembrano codice; le frasi che iniziano con <b>, <i>, <br> sono testo)
CODE = re.compile(r'^(-|\[|\^|\\\\|\.|#|%|\$|/|<(?!b>|i>|br)|\{|[a-z_]+\(|[a-z0-9_]+$|[a-z]+:[a-z]|https?:|file:|chrome:|[A-Z_]+$)')
for m in re.finditer(r'"((?:[^"\\\n]|\\.)*)"', js):
    raw = m.group(1)
    try: t = json.loads('"' + raw + '"')
    except Exception: continue
    if not re.search(r'[A-Za-zÀ-ÿ]{3}', t): continue
    if CODE.match(t) or re.search(r'(\\\\|\.exe|\.ini|\.txt|\.log|\.conf|\.hta|--|%\(|libx|pix_fmt|-c:|-vf|-map|-f |yuv|=\w)', t): continue
    if re.fullmatch(r'[a-z0-9_\-]+', t): continue           # chiavi interne
    if re.fullmatch(r'[a-z]+[A-Z][A-Za-z0-9]*', t) or re.search(r"(' ?\+|\+ ?'|^'|'$|=$|=\[|^\W+$|\\)", t): continue
    if re.search(r'(SVW|ActiveX|Scripting\.|WScript|Shell\.|MSXML|Wbem|HKCU|REG_SZ|ffmpeg_o|acodec|vcodec|bv\*|ba\[)', t): continue
    line = js[js.rfind('\n', 0, m.start()) + 1:js.find('\n', m.end())]
    add(t, line.strip()[:140])
db = {}
p = os.path.join(ROOT, 'i18n', 'strings.json')
if os.path.exists(p): db = json.load(open(p, encoding='utf-8'))
todo = {k: v for k, v in found.items() if k not in db}
json.dump(todo, open(os.path.join(ROOT, 'i18n', '_da_tradurre.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('testi trovati', len(found), '| gia tradotti', len(found) - len(todo), '| da tradurre', len(todo), '| caratteri', sum(len(k) for k in todo))
