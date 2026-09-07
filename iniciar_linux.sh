#!/usr/bin/env bash
# =====================================================================
# ✦ HIKARI SUITE — LANZADOR Y ASISTENTE PARA LINUX (Ubuntu, Mint, Debian, Arch)
# Versión: 1.0.2
# =====================================================================

set -e

echo ""
echo "====================================================="
echo "   ✦ HIKARI SUITE v1.0.2 — INICIANDO EN LINUX"
echo "====================================================="
echo ""

# 1. Comprobar Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Error: Node.js no está instalado en este equipo Linux."
    echo "👉 Puedes instalarlo rápidamente abriendo una terminal y ejecutando:"
    echo "   Ubuntu / Debian / Mint:  sudo apt update && sudo apt install -y nodejs npm"
    echo "   Fedora:                  sudo dnf install -y nodejs npm"
    echo "   Arch Linux:              sudo pacman -S nodejs npm"
    echo ""
    read -p "Presiona Enter para salir..."
    exit 1
fi

echo "✔ Node.js detectado: $(node -v)"
echo "✔ NPM detectado: $(npm -v)"
echo ""

# 2. Reconstruir better-sqlite3 si es necesario para la arquitectura de Linux
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias por primera vez..."
    npm install
else
    # Si la biblioteca nativa better-sqlite3 fue copiada desde Windows, recompilarla para Linux
    if ! node -e "require('better-sqlite3')" >/dev/null 2>&1; then
        echo "⚙ Recompilando módulo nativo de base de datos SQLite para Linux..."
        npm rebuild better-sqlite3
    fi
fi

# 3. Compilar frontend si dist no existe
if [ ! -d "dist" ]; then
    echo "🔨 Compilando interfaz gráfica de Hikari Suite..."
    npm run build
fi

echo ""
echo "🚀 Iniciando servidor Hikari Suite..."
echo "💻 Podrás acceder desde cualquier navegador en: http://localhost:3100"
echo ""

# 4. Lanzar servidor y abrir navegador
npm run server &
SERVER_PID=$!

sleep 2

# Abrir navegador del sistema
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3100" >/dev/null 2>&1 &
elif command -v google-chrome >/dev/null 2>&1; then
    google-chrome "http://localhost:3100" >/dev/null 2>&1 &
elif command -v firefox >/dev/null 2>&1; then
    firefox "http://localhost:3100" >/dev/null 2>&1 &
fi

echo "Presiona Ctrl+C en esta terminal cuando desees cerrar Hikari Suite."
wait $SERVER_PID
