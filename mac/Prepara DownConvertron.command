#!/bin/bash
# DownConvertron 7.0 beta per Mac (designed by Welsho)
# Prepara l'app su questo Mac: toglie la quarantena del download e la firma ad-hoc (niente account Apple).
# Uso nel Terminale:  bash "<trascina qui questo file>"
cd "$(dirname "$0")" || exit 1
if [ -d "/Applications/DownConvertron.app" ]; then APP="/Applications/DownConvertron.app"
elif [ -d "DownConvertron.app" ]; then APP="$PWD/DownConvertron.app"
else echo "DownConvertron.app non trovata (ne' in Applicazioni ne' qui) / not found"; exit 1; fi
echo "App: $APP"
xattr -cr "$APP" || { echo "xattr non riuscito / failed"; exit 1; }
codesign --force --deep -s - "$APP" || { echo "codesign non riuscito / failed"; exit 1; }
codesign --verify --deep --strict "$APP" && echo "Firma ad-hoc OK / ad-hoc signature OK"
open "$APP"
