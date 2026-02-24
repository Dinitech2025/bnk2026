# Migration : Coolify → Docker Compose pur

Ce guide permet de supprimer Coolify et garder uniquement Immich + bnk2026 en Docker Compose.

---

## Étape 1 — Sauvegarder les données Immich (optionnel mais recommandé)

```bash
ssh pi
sudo docker run --rm -v n0gsck8gw8cg8wwggw4g4oco_immich-uploads:/data -v ~/backups:/backup alpine tar czf /backup/immich-uploads.tar.gz -C /data .
sudo docker run --rm -v n0gsck8gw8cg8wwggw4g4oco_immich-postgres-data:/data -v ~/backups:/backup alpine tar czf /backup/immich-db.tar.gz -C /data .
```

---

## Étape 2 — Arrêter tous les conteneurs Coolify

```bash
ssh pi "docker stop \$(docker ps -q) && docker ps -a"
```

---

## Étape 3 — Déployer Immich sans Coolify

```bash
# Copier le docker-compose Immich sur le Pi
scp docker-compose.immich.yml pi:~/immich-compose.yml

# Sur le Pi
ssh pi
cd ~
mv immich-compose.yml docker-compose.yml
nano .env  # Copier les variables depuis .env.raspberry (section Immich)

# Démarrer Immich
docker compose up -d
```

Immich sera accessible sur `http://100.70.249.11:2283`

---

## Étape 4 — Déployer bnk2026

```bash
ssh pi "cd ~ && git clone https://github.com/Dinitech2025/bnk2026.git && cd bnk2026"
ssh pi "cd bnk2026 && cp .env.raspberry .env && nano .env"  # Remplir les valeurs
ssh pi "cd bnk2026 && docker compose up -d --build"
```

bnk2026 sera accessible sur `http://100.70.249.11:3000`

---

## Étape 5 — Supprimer Coolify (optionnel)

**Attention** : cela supprime Coolify, Traefik, Portainer, n8n, et tous leurs conteneurs.

```bash
ssh pi "docker stop coolify coolify-db coolify-redis coolify-realtime coolify-proxy coolify-sentinel portainer n8n-d484swk8c4g088wc8k48s4co postgresql-d484swk8c4g088wc8k48s4co"

ssh pi "docker rm coolify coolify-db coolify-redis coolify-realtime coolify-proxy coolify-sentinel portainer n8n-d484swk8c4g088wc8k48s4co postgresql-d484swk8c4g088wc8k48s4co"

# Supprimer les volumes Coolify (libère de l'espace)
ssh pi "docker volume prune -f"
```

---

## Résultat final

```
Raspberry Pi (sans Coolify)
├── Immich (port 2283)
│   ├── immich-server
│   ├── immich-db (PostgreSQL)
│   ├── immich-redis
│   └── immich-ml
└── bnk2026 (port 3000)
    ├── bnk2026-app (Next.js)
    ├── bnk2026-db (PostgreSQL)
    └── bnk2026-minio (MinIO)
```

**Avantages** :
- ✅ Plus rapide (pas d'interface web lourde)
- ✅ Moins de RAM (~1 Go libéré)
- ✅ Tout géré depuis Cursor via SSH
