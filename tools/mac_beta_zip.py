# DownConvertron - app Mac (Apple Silicon) di prova costruita anche da Windows o Linux, senza Mac e senza electron-packager.
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
#
# Parte dallo zip ufficiale di Electron per darwin-arm64 (SHA-256 controllata con SHASUMS256.txt della release) e lo
# trasforma in un altro zip SENZA estrarlo su disco: i link simbolici di Electron.framework e i permessi Unix restano
# quelli originali fatti su Mac (su Windows non si potrebbero ricreare). Eseguibile e helper restano "Electron"
# (Electron cerca prima "Electron Helper*.app"): cambiano solo Info.plist, icona e app.asar.
# Modificare Info.plist rompe la firma di Electron: la firma ad-hoc la fa il tester sul Mac con
# "Prepara DownConvertron.command" (xattr -cr + codesign --force --deep -s -).
# La build ufficiale resta quella di build.sh sul Mac o di GitHub Actions.
#
# Uso: python tools/mac_beta_zip.py   ->  dist/DownConvertron-<versione>-beta-Mac-AppleSilicon.zip
# Serve: npm install (per asar) e la rete la prima volta (lo zip di Electron resta in build/cache).
import hashlib, io, json, os, plistlib, re, stat, subprocess, sys, time, urllib.request, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_SH = open(os.path.join(ROOT, 'build.sh'), encoding='utf-8').read()
ELECTRON = re.search(r'^ELECTRON=([0-9.]+)', BUILD_SH, re.M).group(1)          # stessa versione della build ufficiale
VER = re.search(r'version="([0-9.]+)"', open(os.path.join(ROOT, 'src', 'DownConvertron.hta'), encoding='utf-8').read()).group(1)
CACHE = os.path.join(ROOT, 'build', 'cache')
APPDIR = os.path.join(ROOT, 'build', 'mac-app')
OUT = os.path.join(ROOT, 'dist', 'DownConvertron-%s-beta-Mac-AppleSilicon.zip' % VER)
TOP = 'DownConvertron-%s-beta/' % VER
APP = TOP + 'DownConvertron.app/'
REL = 'https://github.com/electron/electron/releases/download/v%s/' % ELECTRON
NAME = 'electron-v%s-darwin-arm64.zip' % ELECTRON

def fetch(url):
    with urllib.request.urlopen(url, timeout=120) as r: return r.read()

# 1. Electron ufficiale, controllato
os.makedirs(CACHE, exist_ok=True)
ez = os.path.join(CACHE, NAME)
sums = fetch(REL + 'SHASUMS256.txt').decode()
want = re.search(r'^([0-9a-f]{64}) \*?' + re.escape(NAME) + r'$', sums, re.M).group(1)
if not os.path.exists(ez) or hashlib.sha256(open(ez, 'rb').read()).hexdigest() != want:
    print('scarico', NAME); open(ez, 'wb').write(fetch(REL + NAME))
got = hashlib.sha256(open(ez, 'rb').read()).hexdigest()
assert got == want, 'SHA-256 di Electron diversa: ' + got
print('Electron', ELECTRON, 'SHA-256 ok')

# 2. interfaccia dell'app (come build.sh) e app.asar
subprocess.check_call([sys.executable, os.path.join(ROOT, 'mac', 'build_mac.py'), APPDIR])
asar = os.path.join(CACHE, 'app.asar')
subprocess.check_call('npx asar pack "%s" "%s"' % (APPDIR, asar), shell=True, cwd=ROOT)

# 3. zip dell'app
SRC = zipfile.ZipFile(ez)
now = time.localtime()[:6]
def add(z, name, data, mode, src=None):
    zi = zipfile.ZipInfo(name, date_time=src.date_time if src else now)
    zi.create_system = 3                                   # Unix: permessi e link simbolici in external_attr
    zi.external_attr = (mode << 16) | (0x10 if name.endswith('/') else 0)
    zi.compress_type = zipfile.ZIP_STORED if stat.S_ISLNK(mode) or name.endswith('/') else zipfile.ZIP_DEFLATED
    z.writestr(zi, data)
def lf(p): return open(p, 'rb').read().replace(b'\r\n', b'\n')

pl = plistlib.loads(SRC.read('Electron.app/Contents/Info.plist'))
pl.update({'CFBundleDisplayName': 'DownConvertron', 'CFBundleName': 'DownConvertron', 'CFBundleIdentifier': 'it.welsho.downconvertron',
           'CFBundleShortVersionString': VER, 'CFBundleVersion': VER, 'CFBundleIconFile': 'DownConvertron.icns',
           'LSApplicationCategoryType': 'public.app-category.video',
           'NSHumanReadableCopyright': 'designed by Welsho - (C) 2026 Daniele Moretti - GPL-3.0',
           'CFBundleURLTypes': [{'CFBundleURLName': 'DownConvertron', 'CFBundleURLSchemes': ['downconvertron']}]})
pl.update(plistlib.load(open(os.path.join(ROOT, 'mac', 'Info.extra.plist'), 'rb')))
for k in ('NSCameraUsageDescription', 'NSMicrophoneUsageDescription', 'NSAudioCaptureUsageDescription',
          'NSBluetoothAlwaysUsageDescription', 'NSBluetoothPeripheralUsageDescription'):
    pl.pop(k, None)                                        # permessi che l'app non usa

SKIP = ('Contents/Info.plist', 'Contents/Resources/default_app.asar', 'Contents/Resources/electron.icns')
n = {'link': 0, 'exe': 0, 'file': 0}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    add(z, TOP, b'', 0o40755)
    for i in SRC.infolist():
        if not i.filename.startswith('Electron.app/'): continue
        rel = i.filename[len('Electron.app/'):]
        if rel in SKIP: continue
        mode = i.external_attr >> 16
        if stat.S_ISLNK(mode): n['link'] += 1
        elif mode & 0o111 and not i.is_dir(): n['exe'] += 1
        else: n['file'] += 1
        add(z, APP + rel, b'' if i.is_dir() else SRC.read(i), mode or (0o40755 if i.is_dir() else 0o100644), i)
    add(z, APP + 'Contents/Info.plist', plistlib.dumps(pl, fmt=plistlib.FMT_XML), 0o100644)
    add(z, APP + 'Contents/Resources/DownConvertron.icns', open(os.path.join(ROOT, 'mac', 'DownConvertron.icns'), 'rb').read(), 0o100644)
    add(z, APP + 'Contents/Resources/app.asar', open(asar, 'rb').read(), 0o100644)
    add(z, TOP + 'Prepara DownConvertron.command', lf(os.path.join(ROOT, 'mac', 'Prepara DownConvertron.command')), 0o100755)
    add(z, TOP + 'LEGGIMI-BETA-MAC.txt', open(os.path.join(ROOT, 'mac', 'LEGGIMI-BETA-MAC.txt'), 'rb').read(), 0o100644)
    add(z, TOP + 'LICENSE.txt', open(os.path.join(ROOT, 'LICENSE'), 'rb').read(), 0o100644)
    for f in ('LICENSE', 'LICENSES.chromium.html'):
        add(z, TOP + 'electron-' + f, SRC.read(f), 0o100644)

# 4. controlli: Electron identico (contenuto e permessi), 14+ link simbolici, Info.plist leggibile
z, bad = zipfile.ZipFile(OUT), 0
assert z.testzip() is None
for i in SRC.infolist():
    if i.filename.startswith('Electron.app/') and i.filename[len('Electron.app/'):] not in SKIP:
        j = z.getinfo(APP + i.filename[len('Electron.app/'):])
        bad += j.CRC != i.CRC or j.external_attr >> 16 != i.external_attr >> 16
assert bad == 0 and n['link'] > 0, (bad, n)
assert plistlib.loads(z.read(APP + 'Contents/Info.plist'))['CFBundleIdentifier'] == 'it.welsho.downconvertron'
print('ok', n, os.path.relpath(OUT, ROOT), os.path.getsize(OUT) // 1048576, 'MB (da firmare sul Mac con Prepara DownConvertron.command)')
