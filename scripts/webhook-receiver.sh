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

# Extraire les informations avec Python (jq pas toujours disponible)
image=$(echo "$payload" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('image', ''))" 2>/dev/null || echo "")
sha=$(echo "$payload" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('sha', ''))" 2>/dev/null || echo "")

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

# Utiliser docker depuis l'hôte via le socket
DOCKER_CMD="docker"
if [ -S /var/run/docker.sock ]; then
    DOCKER_CMD="docker"
else
    log "WARNING: Docker socket not found, commands may fail"
fi

# Pull la dernière version du code (pour docker-compose.yml)
log "Mise à jour du code..."
cd "$PROJECT_DIR" || exit 1
$DOCKER_CMD run --rm -v "$PROJECT_DIR:/workspace" -w /workspace alpine/git:latest pull origin main || {
    log "WARNING: git pull failed, continuing anyway"
}

# Login à GHCR (si nécessaire)
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_USERNAME" ]; then
    log "Connexion à GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | $DOCKER_CMD login ghcr.io -u "$GITHUB_USERNAME" --password-stdin 2>/dev/null || {
        log "WARNING: GHCR login failed, trying without auth"
    }
fi

# Exporter l'image pour docker-compose
export DOCKER_IMAGE

# Pull la nouvelle image
log "Téléchargement de l'image: $DOCKER_IMAGE"
$DOCKER_CMD pull "$DOCKER_IMAGE" || {
    log "ERROR: Failed to pull image"
    exit 1
}

# Mettre à jour docker-compose.yml avec la nouvelle image
log "Mise à jour des services..."
cd "$PROJECT_DIR" || exit 1
$DOCKER_CMD compose pull app || true
$DOCKER_CMD compose up -d --no-deps app || {
    log "ERROR: Failed to start services"
    exit 1
}

# Nettoyer les anciennes images
log "Nettoyage des anciennes images..."
$DOCKER_CMD image prune -f || true

log "=== Déploiement terminé avec succès ==="
log "Services démarrés:"
docker compose ps

exit 0
