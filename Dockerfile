FROM node:20.18.0 AS builder

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

# Debug - listar arquivos gerados
RUN ls -la build/client

# Estágio final com nginx
FROM nginx:alpine

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build da aplicação
COPY --from=builder /app/build/client /usr/share/nginx/html/

# Expor porta
EXPOSE 80

# Configurar variáveis de ambiente padrão
ENV NODE_ENV=production \
    RUNNING_IN_DOCKER=true \
    WRANGLER_SEND_METRICS=false

# Comando para iniciar
CMD ["nginx", "-g", "daemon off;"]
