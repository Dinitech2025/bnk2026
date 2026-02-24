# Déploiement sur Coolify

Ce projet est une application React (Vite) prête à être déployée sur Coolify.

## Paramètres à configurer dans Coolify

1. **Type** : Nouvelle ressource → **Public Repository** (ou dépôt privé avec GitHub App).
2. **URL du dépôt** : `https://github.com/VOTRE_USER/VOTRE_REPO` (après avoir poussé ce projet sur Git).
3. **Build** (Coolify utilise Nixpacks) :
   - **Install** : `npm install`
   - **Build** : `npm run build`
   - (Ou laisser Nixpacks détecter automatiquement.)
4. **Site statique** : cocher **« Is it a static site? »**.
5. **Répertoire de sortie** : `dist` (c’est là que Vite met le build).
6. **Port** : pour un site statique servi par Nginx, pas besoin de port applicatif.

## Workflow avec Cursor

1. **Développer** : vous éditez le code dans Cursor (ce workspace).
2. **Tester en local** : `npm run dev`
3. **Commit + push** vers votre dépôt Git.
4. **Coolify** redéploie automatiquement si l’auto-deploy est activé.

## Commandes utiles

- `npm run dev` — serveur de développement
- `npm run build` — build pour la prod (génère `dist/`)
- `npm run preview` — prévisualiser le build en local
