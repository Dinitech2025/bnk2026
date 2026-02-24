FROM node:22-alpine AS base

# ─── Étape 1 : dépendances ───────────────────────────────────────────────────
FROM base AS deps
# Installer les dépendances système nécessaires pour les modules natifs (canvas, sharp, sqlite3, etc.)
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    py3-pip \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    vips-dev \
    poppler-dev \
    sqlite-dev \
    pkgconfig

WORKDIR /app
COPY package.json package-lock.json ./

# Configurer npm et node-gyp pour ARM64
ENV npm_config_build_from_source=false
ENV npm_config_cache=/tmp/.npm

# Installer node-gyp globalement pour une meilleure compatibilité
RUN npm install -g node-gyp@latest

# Installer les dépendances avec gestion d'erreur pour modules natifs
# Sur ARM64/QEMU, certains modules peuvent échouer - on continue quand même
RUN npm install --legacy-peer-deps --no-audit --no-fund || \
    (echo "npm install with legacy-peer-deps failed, trying without..." && \
     npm install --no-audit --no-fund --ignore-scripts) || \
    (echo "npm install failed, trying minimal install..." && \
     npm install --no-audit --no-fund --ignore-scripts --no-optional || true)

# Essayer de rebuild les modules natifs critiques (sharp a des binaires précompilés)
RUN npm rebuild sharp --legacy-peer-deps 2>&1 || echo "sharp rebuild failed, continuing..."

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

# Allouer plus de mémoire pour le build (GitHub Actions a plus de RAM)
ENV NODE_OPTIONS="--max-old-space-size=6144"
ENV NEXT_TELEMETRY_DISABLED=1

# Générer le client Prisma (séparé pour mieux isoler les erreurs)
RUN npx prisma generate --no-engine || \
    (echo "Prisma generate failed, trying without --no-engine..." && \
     npx prisma generate)

# Build Next.js avec gestion d'erreur améliorée
# Note: Sur ARM64/QEMU, certains modules natifs peuvent causer des warnings
RUN npm run build || \
    (echo "Build failed, checking for specific errors..." && \
     npm run build 2>&1 | head -50 && \
     exit 1)

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
