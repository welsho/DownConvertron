# DownConvertron - controlli automatici prima di una release (usati anche dal workflow di GitHub).
#  - sintassi JScript ES3 degli script dell'HTA (IE11/mshta non capisce JavaScript moderno)
#  - id HTML unici, file dell'estensione in ASCII, parti generate aggiornate
#  - installer: il pacchetto contiene esattamente la sorgente attuale; sintassi PowerShell (se c'e' pwsh)
#  - ricevitore del trascinamento: compilazione C# 5 (se c'e' mcs)
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
import os, re, sys, json, base64, subprocess, shutil, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTA = open(os.path.join(ROOT, 'src', 'DownConvertron.hta'), encoding='utf-8').read()
errors = []
def ok(msg): print('  ok  ' + msg)
def bad(msg): print('  NO  ' + msg); errors.append(msg)

# 1. ES3
node = shutil.which('node')
if node:
    js = r'''
let acorn; try { acorn = require('acorn'); } catch (e) { console.log('SKIP'); process.exit(0); }
const s = require('fs').readFileSync(process.argv[1], 'utf8');
const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi; let m, n = 0, bad = 0;
while ((m = re.exec(s))) { n++; try { acorn.parse(m[2], { ecmaVersion: 3, allowReserved: true }); } catch (e) { bad++; console.log('ERR ' + e.message); } }
console.log(bad ? 'BAD' : 'OK ' + n);'''
    r = subprocess.run([node, '-e', js, os.path.join(ROOT, 'src', 'DownConvertron.hta')], capture_output=True, text=True,
                       env=dict(os.environ, NODE_PATH=os.environ.get('NODE_PATH', '') + os.pathsep + os.path.join(ROOT, 'node_modules')))
    out = r.stdout.strip()
    if out.startswith('OK'): ok('JScript ES3 (' + out[3:] + ' script)')
    elif out == 'SKIP': print('  --  acorn non installato: controllo ES3 saltato (npm i acorn)')
    else: bad('JScript ES3: ' + out)
# 2. id unici
ids = {}
for m in re.finditer(r'\sid="([^"]+)"', HTA): ids[m.group(1)] = ids.get(m.group(1), 0) + 1
dup = [k for k, v in ids.items() if v > 1]
(bad('id duplicati: ' + ', '.join(dup)) if dup else ok('id HTML unici (%d)' % len(ids)))
# 3. estensione ASCII e incorporata
ext = os.path.join(ROOT, 'extension')
files = json.loads(re.search(r'var EXT_FILES = (\{.*?\});\n/\* EXT_FILES_FINE', HTA, re.S).group(1).replace('<\\/', '</'))
stale = []
for n in sorted(os.listdir(ext)):
    b = open(os.path.join(ext, n), 'rb').read()
    if not n.endswith('.png') and any(c > 127 for c in b): bad('estensione non ASCII: ' + n)
    emb = files.get(n)
    cur = 'b64:' + base64.b64encode(b).decode() if n.endswith('.png') else b.decode()
    if emb != cur: stale.append(n)
(bad('estensione incorporata non aggiornata (python3 tools/embed.py): ' + ', '.join(stale)) if stale else ok('estensione incorporata aggiornata (%d file)' % len(files)))
# 4. installer
bat = os.path.join(ROOT, 'dist', 'DownConvertron-Setup.bat')
if os.path.exists(bat):
    t = open(bat, encoding='utf-8').read()
    b64 = re.search(r"\$HTA_B64 = @'\n(.*?)\n'@", t, re.S).group(1)
    dec = base64.b64decode(re.sub(r'\s', '', b64)).decode('utf-8')
    (ok('installer: contiene la sorgente attuale') if dec.replace('\r\n', '\n') == HTA else bad('installer non aggiornato (python3 windows/build_installer.py)'))
    pw = shutil.which('pwsh') or shutil.which('powershell')
    if pw:
        ps = t[t.index('#PSSTART#') + 9:]
        # utf-8-sig: senza BOM Windows PowerShell 5.1 legge il file come ANSI e rompe le stringhe in cinese
        f = tempfile.NamedTemporaryFile('w', suffix='.ps1', delete=False, encoding='utf-8-sig'); f.write(ps); f.close()
        r = subprocess.run([pw, '-NoProfile', '-Command', '$e=$null;$t=$null;[void][System.Management.Automation.Language.Parser]::ParseFile("%s",[ref]$t,[ref]$e); $e.Count' % f.name], capture_output=True, text=True)
        (ok('installer: sintassi PowerShell') if r.stdout.strip() == '0' else bad('installer: errori PowerShell ' + r.stdout + r.stderr))
        os.unlink(f.name)
    else: print('  --  pwsh non trovato: sintassi dell\'installer non controllata')
else: print('  --  dist/DownConvertron-Setup.bat assente: installer non controllato')
# 4b. script PowerShell del ricevitore del trascinamento (dentro l'app)
pw = shutil.which('pwsh') or shutil.which('powershell')
if pw:
    ps = json.loads(re.search(r'var DROP_PS = (".*?");\n', HTA, re.S).group(1))
    f = tempfile.NamedTemporaryFile('w', suffix='.ps1', delete=False, encoding='utf-8-sig'); f.write(ps); f.close()
    r = subprocess.run([pw, '-NoProfile', '-Command', '$e=$null;$t=$null;[void][System.Management.Automation.Language.Parser]::ParseFile("%s",[ref]$t,[ref]$e); $e.Count' % f.name], capture_output=True, text=True)
    (ok('ricevitore: sintassi PowerShell') if r.stdout.strip() == '0' else bad('ricevitore: errori PowerShell ' + r.stdout + r.stderr))
    os.unlink(f.name)
    cs = open(os.path.join(ROOT, 'windows', 'Ricevitore.cs'), encoding='utf-8').read()
    (ok('ricevitore incorporato aggiornato') if cs in ps else bad('ricevitore incorporato non aggiornato (python3 tools/embed.py)'))
# 4c. lanciatore di downconvertron:// (windows/apri.js): incorporato nell'app e nell'installer
apri = open(os.path.join(ROOT, 'windows', 'apri.js'), encoding='utf-8').read()
m = re.search(r'var APRI_JS = (".*?");\n', HTA, re.S)
(ok('lanciatore incorporato aggiornato') if m and json.loads(m.group(1).replace('<\\/', '</')) == apri else bad('lanciatore incorporato non aggiornato (python3 tools/embed.py)'))
if os.path.exists(bat):
    mb = re.search(r"\$APRI_B64 = @'\n(.*?)\n'@", open(bat, encoding='utf-8').read(), re.S)
    (ok('installer: contiene il lanciatore attuale') if mb and base64.b64decode(re.sub(r'\s', '', mb.group(1))).decode() == apri else bad('installer: lanciatore assente o vecchio'))
if node:
    r = subprocess.run([node, '-e', "const a=require('acorn');a.parse(require('fs').readFileSync(process.argv[1],'utf8'),{ecmaVersion:3,allowReserved:true});console.log('OK')",
                        os.path.join(ROOT, 'windows', 'apri.js')], capture_output=True, text=True,
                       env=dict(os.environ, NODE_PATH=os.environ.get('NODE_PATH', '') + os.pathsep + os.path.join(ROOT, 'node_modules')))
    (ok('lanciatore: JScript ES3') if r.stdout.strip() == 'OK' else bad('lanciatore: ' + (r.stdout + r.stderr).strip()[:200]))
# 5. ricevitore C#
mcs = shutil.which('mcs')
# su Windows: il csc.exe del .NET Framework 4 (C# 5, lo stesso che usa l'app sul PC)
if not mcs and os.name == 'nt':
    c = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe')
    if os.path.exists(c): mcs = c
if mcs:
    d = tempfile.mkdtemp()
    r = subprocess.run([mcs] + ([] if mcs.lower().endswith('csc.exe') else ['-langversion:5']) + ['-target:library', '-r:System.Windows.Forms.dll', '-r:System.Drawing.dll', '-out:' + os.path.join(d, 'r.dll'),
                        os.path.join(ROOT, 'windows', 'Ricevitore.cs')], capture_output=True, text=True)
    (ok('ricevitore C# 5 compilato') if r.returncode == 0 else bad('ricevitore C#: ' + r.stdout[-400:]))
else: print('  --  mcs (Mono) / csc.exe non trovato: compilazione del ricevitore non controllata')
print('\nRISULTATO: ' + ('TUTTO OK' if not errors else '%d PROBLEMI' % len(errors)))
sys.exit(1 if errors else 0)
