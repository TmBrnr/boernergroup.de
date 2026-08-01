#!/bin/bash
# Double click this file to view the site.
# It starts a small local server and opens your browser.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js ist nicht installiert."
  echo "Alternative ohne Node, falls Python vorhanden ist:"
  echo "  cd out && python3 -m http.server 4321"
  echo "  danach http://localhost:4321 im Browser oeffnen"
  read -r -p "Enter zum Schliessen "
  exit 1
fi

node scripts/serve.mjs
