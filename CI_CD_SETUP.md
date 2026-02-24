# Configuration CI/CD : Build sur GitHub, Déploiement sur Raspberry Pi

Ce système permet de :
1. **Build l'image Docker ARM64 sur GitHub Actions** (rapide, ~5-10 min)
2. **Push vers GitHub Container Registry (GHCR)**
3. **Webhook automatique** vers le Raspberry Pi
4. **Déploiement en ~30 secondes** (pull + restart)

## 🚀 Configuration GitHub Actions

### 1. Activer GitHub Container Registry

Le workflow utilise automatiquement `GITHUB_TOKEN` pour push vers GHCR. Aucune configuration supplémentaire n'est nécessaire.

### 2. Configurer les variables et secrets

Sur GitHub, allez dans **Settings > Secrets and variables > Actions** :

**Variables** (onglet "Variables") :
- **Name**: `RASPBERRY_WEBHOOK_URL`
- **Value**: `http://100.70.249.11:9002` (ou votre IP Tailscale + port webhook)

**Secrets** (onglet "Secrets") :
- **Name**: `WEBHOOK_SECRET`
- **Value**: Le même secret que celui configuré dans `.env` sur le Pi (ex: `votre-secret-super-securise-changez-moi`)

## 🍓 Configuration Raspberry Pi

### 1. Installer les dépendances

```bash
ssh pi
cd ~/bnk2026

# Rendre les scripts exécutables
chmod +x scripts/webhook-receiver.sh
chmod +x scripts/webhook-server.py
```

### 2. Créer le fichier `.env` pour le webhook

Ajoutez dans `.env` :

```env
# Webhook
WEBHOOK_SECRET=votre-secret-super-securise-changez-moi
GITHUB_TOKEN=ghp_votre_token_github_personal_access_token
GITHUB_USERNAME=dinitech2025

# Docker Image (optionnel, par défaut utilise GHCR)
DOCKER_IMAGE=ghcr.io/dinitech2025/bnk2026:latest
```

**Pour créer un GitHub Personal Access Token** :
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Générer un nouveau token avec scope `read:packages`
3. Copier le token dans `GITHUB_TOKEN`

### 3. Démarrer le serveur webhook

```bash
# Option 1: Avec Docker Compose (recommandé)
docker compose -f docker-compose.webhook.yml up -d

# Option 2: Directement avec Python
python3 scripts/webhook-server.py
```

### 4. Vérifier que le webhook fonctionne

```bash
# Test health check
curl http://localhost:9002

# Test webhook (depuis votre PC)
curl -X POST http://100.70.249.11:9002 \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: votre-secret" \
  -d '{"image": "ghcr.io/dinitech2025/bnk2026:latest", "sha": "test"}'
```

### 5. Configurer le firewall (si nécessaire)

```bash
# Autoriser le port 9002
sudo ufw allow 9002/tcp
```

## 📦 Premier déploiement

### 1. Build initial sur GitHub

Poussez votre code sur `main` :

```bash
git push origin main
```

GitHub Actions va automatiquement :
- Build l'image ARM64
- Push vers `ghcr.io/dinitech2025/bnk2026:latest`
- Envoyer un webhook au Pi

### 2. Sur le Raspberry Pi

Le webhook va automatiquement :
- Pull la nouvelle image
- Redémarrer le service `app`

### 3. Vérifier le déploiement

```bash
ssh pi
cd ~/bnk2026
docker compose ps
docker compose logs app --tail 50
```

## 🔧 Dépannage

### Le webhook ne fonctionne pas

1. Vérifier que le serveur webhook est démarré :
   ```bash
   docker compose -f docker-compose.webhook.yml ps
   ```

2. Vérifier les logs :
   ```bash
   docker compose -f docker-compose.webhook.yml logs webhook
   tail -f /var/log/bnk2026-webhook.log
   ```

3. Vérifier la connectivité :
   ```bash
   curl http://100.70.249.11:9002
   ```

### L'image n'est pas trouvée

1. Vérifier que vous êtes connecté à GHCR :
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
   ```

2. Vérifier que l'image existe :
   ```bash
   docker pull ghcr.io/dinitech2025/bnk2026:latest
   ```

### Build échoue sur GitHub Actions

1. Vérifier les logs dans l'onglet "Actions" de GitHub
2. Vérifier que le Dockerfile fonctionne localement
3. Vérifier que toutes les dépendances sont dans `package.json`

## 📊 Workflow complet

```
┌─────────────┐
│   Git Push  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  GitHub Actions     │
│  - Build ARM64      │
│  - Push to GHCR     │
└──────┬──────────────┘
       │
       │ Webhook
       ▼
┌─────────────────────┐
│  Raspberry Pi       │
│  - Pull image       │
│  - Restart app      │
│  (~30 secondes)     │
└─────────────────────┘
```

## 🎯 Avantages

- ✅ **Build rapide** : GitHub Actions est beaucoup plus rapide que le Pi
- ✅ **Déploiement instantané** : ~30 secondes au lieu de 15-20 minutes
- ✅ **Pas de charge sur le Pi** : Le Pi ne fait que pull et restart
- ✅ **Historique** : Toutes les images sont disponibles sur GHCR
- ✅ **Rollback facile** : Pull d'une ancienne version en quelques secondes

## 🔐 Sécurité

- Le webhook utilise un secret pour authentifier les requêtes
- Le Pi doit être accessible uniquement via Tailscale (réseau privé)
- Le token GitHub a des permissions limitées (`read:packages`)
