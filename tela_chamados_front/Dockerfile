FROM node:20-bookworm-slim AS deps

ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app/tela_chamados_front

COPY tela_chamados_front/package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    NODE_PATH=/app/tela_chamados_front/node_modules

WORKDIR /app/tela_chamados_front

COPY --from=deps /app/tela_chamados_front/node_modules ./node_modules
COPY tela_chamados_front ./
COPY TelaChamadosBack/build /app/build

RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_TMP_DIR=/tmp/puppeteer-profiles \
    NODE_PATH=/app/tela_chamados_front/node_modules

WORKDIR /app/tela_chamados_front

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /tmp/puppeteer-profiles

COPY --from=builder /app/build /app/build
COPY --from=builder /app/tela_chamados_front/.next ./.next
COPY --from=builder /app/tela_chamados_front/scripts ./scripts
COPY --from=builder /app/tela_chamados_front/package*.json ./
COPY --from=builder /app/tela_chamados_front/node_modules ./node_modules
COPY --from=builder /app/tela_chamados_front/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "run", "start"]
