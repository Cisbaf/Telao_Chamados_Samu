FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_TMP_DIR=/tmp/puppeteer-profiles

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /tmp/puppeteer-profiles

COPY package*.json ./
RUN npm ci --omit=dev

COPY build ./build

EXPOSE 9080

CMD ["node", "./build/server.js"]
