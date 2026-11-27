#!/usr/bin/env bash
# Prueba la biblioteca en modo nube contra los EMULADORES de Firebase (auth, firestore, storage).
# No toca el proyecto real: usa el proyecto ficticio «demo-biblioteca».
# Requisitos: Java y firebase-tools (npx firebase…). Uso: bash tests/nube/correr.sh
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
BIB="$(cd "$AQUI/../.." && pwd)"
TMP="$(mktemp -d)"
cp "$BIB/../firestore.rules" "$TMP/firestore.rules"          # reglas reales de GIS
sed 's/UID_DE_CESAR/cesar123/' "$BIB/storage.rules" > "$TMP/storage.rules"
cat > "$TMP/firebase.json" <<JSON
{ "firestore": { "rules": "firestore.rules" }, "storage": { "rules": "storage.rules" },
  "emulators": { "auth": { "port": 9099 }, "firestore": { "port": 8080 }, "storage": { "port": 9199 }, "ui": { "enabled": false } } }
JSON
cp "$AQUI/reglas-storage.mjs" "$TMP/"
cd "$TMP"
# Dependencias de prueba (fuera del repo): BIB_DEPS=carpeta con node_modules, o se instalan aquí.
if [ -n "${BIB_DEPS:-}" ]; then ln -s "$BIB_DEPS/node_modules" node_modules
else npm init -y >/dev/null && npm i --no-audit --no-fund firebase-tools@15.1.0 @firebase/rules-unit-testing@4 firebase@11 >/dev/null; fi
FIREBASE="./node_modules/.bin/firebase"
$FIREBASE emulators:exec --only auth,firestore,storage --project demo-biblioteca \
  "node reglas-storage.mjs && node '$AQUI/e2e-nube.mjs'"
