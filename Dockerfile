FROM node:22-alpine AS base

# ─── Étape 1 : dépendances ───────────────────────────────────────────────────
FROM base AS deps
# Installer les dépendances système nécessaires pour les modules natifs (canvas, sharp, sqlite3, etc.)
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    vips-dev \
    poppler-dev \
    sqlite-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# ─── Étape 2 : build ─────────────────────────────────────────────────────────
FROM base AS builder
# Installer les dépendances système pour la compilation des modules natifs
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    vips-dev \
    poppler-dev \
    sqlite-dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Allouer 4 Go à Node.js pour le build (profite des 8 Go du Pi)
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build
# Nettoyer les dépendances de développement et caches après le build
RUN rm -rf node_modules/.cache \
    && npm prune --production \
    && rm -rf /tmp/* /var/cache/apk/*

# ─── Étape 3 : image finale (légère) ─────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Installer seulement les bibliothèques runtime nécessaires (pas les dev tools)
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    vips \
    poppler \
    sqlite-libs

# Fichiers nécessaires au mode standalone (inclut déjà la plupart des dépendances)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Schéma Prisma + migrations nécessaires au runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Script de démarrage (migrations + Next.js)
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown nextjs:nodejs docker-entrypoint.sh

# Nettoyer les caches npm et fichiers temporaires
RUN rm -rf /tmp/* /var/cache/apk/*

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
