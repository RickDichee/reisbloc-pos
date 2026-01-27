#!/bin/bash

echo "🔧 Compilando Cloud Functions..."
cd /home/r1ck/TPV_solutions/functions && npm run build && cd ..

echo "🚀 Iniciando emuladores de Firebase..."
firebase emulators:start --only functions,auth,firestore
