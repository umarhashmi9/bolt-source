#!/bin/bash

log() {
    local COLOR=$1
    shift
    echo -e "${COLOR}$*${NC}"
}

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$(command -v nvm)" ]; then
    log $GREEN "NVM não encontrado. Instalando o NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
else
    log $GREEN "NVM já está instalado."
fi

if ! nvm ls 18.18.0 >/dev/null 2>&1; then
    log $GREEN "Instalando Node.js 18.18.0..."
    nvm install 18.18.0
else
    log $GREEN "Node.js 18.18.0 já está instalado."
fi

nvm alias default 18.18.0
nvm use 18.18.0

if [ -z "$(command -v pnpm)" ]; then
    log $GREEN "Instalando pnpm..."
    npm install -g pnpm
else
    log $GREEN "pnpm já está instalado."
fi

log $GREEN "Instalando dependências do projeto com pnpm..."
pnpm install

log $GREEN "Iniciando o servidor de desenvolvimento..."
pnpm run dev
