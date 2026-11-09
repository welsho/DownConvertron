#!/usr/bin/env bash
# DownConvertron - costruisce tutto quello che va nella release:
#   dist/DownConvertron-Setup.bat               installer Windows (con l'app dentro)
#   dist/DownConvertron.hta                      app Windows in un solo file (senza installer)
#   dist/DownConvertron-Mac-AppleSilicon.zip     app Mac (Apple Silicon), firmata ad-hoc
#   dist/DownConvertron-ChromeExtension.zip      estensione Chrome (e' anche dentro l'app)
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
set -euo pipefail
cd "$(dirname "$0")"
VER=$(grep -o 'version="[0-9.]*"' src/DownConvertron.hta | head -1 | grep -o '[0-9.]*')
ELECTRON=33.4.11
# su Windows (Git Bash) python3 spesso e' solo l'alias dello Store: usa python
PY=python3; $PY -c "" 2>/dev/null || PY=python
echo "== DownConvertron $VER"
$PY tools/embed.py
mkdir -p dist build
$PY windows/build_installer.py dist
cp src/DownConvertron.hta dist/DownConvertron.hta
rm -f dist/DownConvertron-ChromeExtension.zip
if command -v zip >/dev/null 2>&1; then (cd extension && zip -qr9 ../dist/DownConvertron-ChromeExtension.zip .)
else $PY -c "import shutil; shutil.make_archive('dist/DownConvertron-ChromeExtension', 'zip', 'extension')"; fi

# SKIP_MAC=1 salta l'app Mac (la costruisce GitHub Actions sul tag, o il Mac)
if [ "${SKIP_MAC:-0}" != "1" ]; then
  $PY mac/build_mac.py build/mac-app
  rm -rf build/DownConvertron-darwin-arm64
  npx electron-packager build/mac-app DownConvertron --platform=darwin --arch=arm64 --electron-version=$ELECTRON \
    --icon=mac/DownConvertron.icns --app-bundle-id=it.welsho.downconvertron --app-version=$VER --build-version=$VER \
    --app-copyright="designed by Welsho - (C) 2026 Daniele Moretti - GPL-3.0" --app-category-type=public.app-category.video \
    --extend-info=mac/Info.extra.plist --protocol=downconvertron --protocol-name=DownConvertron --asar --out=build --overwrite
  APP=build/DownConvertron-darwin-arm64/DownConvertron.app
  # firma ad-hoc (niente account sviluppatore Apple): sul Mac con codesign, altrove con rcodesign se c'e'
  if command -v codesign >/dev/null 2>&1; then codesign --force --deep -s - "$APP"
  elif command -v rcodesign >/dev/null 2>&1; then rcodesign sign "$APP"
  else echo "ATTENZIONE: app Mac non firmata (manca codesign/rcodesign)"; fi
  cp mac/LEGGIMI.txt build/DownConvertron-darwin-arm64/LEGGIMI-README.txt
  rm -f dist/DownConvertron-Mac-AppleSilicon.zip
  if command -v ditto >/dev/null 2>&1; then
    ditto -c -k --keepParent "$APP" dist/DownConvertron-Mac-AppleSilicon.zip
    (cd build/DownConvertron-darwin-arm64 && zip -q ../../dist/DownConvertron-Mac-AppleSilicon.zip LEGGIMI-README.txt)
  else
    (cd build/DownConvertron-darwin-arm64 && zip -qry -9 ../../dist/DownConvertron-Mac-AppleSilicon.zip DownConvertron.app LEGGIMI-README.txt)
  fi
fi
$PY tools/check.py
ls -la dist
