#!/bin/bash
# Webhook receiver pour déploiement automatique depuis GitHub Actions

set -e

WEBHOOK_SECRET="${WEBHOOK_SECRET:-your-secret-key-change-this}"
PROJECT_DIR="${PROJECT_DIR:-/home/dinitech/bnk2026}"
LOG_FILE="${LOG_FILE:-/var/log/bnk2026-webhook.log}"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Lire le payload JSON depuis stdin
payload=$(cat)

# Vérifier le secret (optionnel mais recommandé)
# secret=$(echo "$payload" | jq -r '.secret // empty')
# if [ "$secret" != "$WEBHOOK_SECRET" ]; then
#     log "ERROR: Invalid secret"
#     exit 1
# fi

# Extraire les informations
image=$(echo "$payload" | jq -r '.image // empty')
sha=$(echo "$payload" | jq -r '.sha // empty')

# Utiliser l'image du payload ou celle de l'environnement
DOCKER_IMAGE="${image:-${DOCKER_IMAGE:-ghcr.io/dinitech2025/bnk2026:latest}}"

log "=== Déploiement déclenché ==="
log "Image: $DOCKER_IMAGE"
log "SHA: $sha"

# Aller dans le dossier du projet
cd "$PROJECT_DIR" || {
    log "ERROR: Cannot access $PROJECT_DIR"
    exit 1
}

# Pull la dernière version du code (pour docker-compose.yml)
log "Mise à jour du code..."
git pull origin main || {
    log "WARNING: git pull failed, continuing anyway"
}

# Login à GHCR (si nécessaire)
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_USERNAME" ]; then
    log "Connexion à GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin 2>/dev/null || {
        log "WARNING: GHCR login failed, trying without auth"
    }
fi

# Exporter l'image pour docker-compose
export DOCKER_IMAGE

# Pull la nouvelle image
log "Téléchargement de l'image: $DOCKER_IMAGE"
docker pull "$DOCKER_IMAGE" || {
    log "ERROR: Failed to pull image"
    exit 1
}

# Mettre à jour docker-compose.yml avec la nouvelle image
log "Mise à jour des services..."
docker compose pull app || true
docker compose up -d --no-deps app || {
    log "ERROR: Failed to start services"
    exit 1
}

# Nettoyer les anciennes images
log "Nettoyage des anciennes images..."
docker image prune -f || true

log "=== Déploiement terminé avec succès ==="
log "Services démarrés:"
docker compose ps

exit 0
