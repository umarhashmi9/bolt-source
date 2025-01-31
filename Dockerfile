FROM node:20.18.0 AS base

WORKDIR /app

# Instalar pnpm
RUN corepack enable pnpm

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

#RUN npm install -g corepack@latest

#RUN corepack enable pnpm && pnpm install
RUN npm install -g pnpm && pnpm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm run build

# Expor porta
EXPOSE 5173

# Configurar variáveis de ambiente padrão
ENV NODE_ENV=production \
    RUNNING_IN_DOCKER=true \
    WRANGLER_SEND_METRICS=false

# Comando para iniciar
CMD ["pnpm", "run", "dockerstart"]
