<<<<<<< HEAD
# Bnk2026 — App React

Application React (Vite) pour déploiement sur Coolify.

## Développement en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

## Déploiement sur Coolify

Voir **[COOLIFY.md](./COOLIFY.md)** pour les paramètres à renseigner dans Coolify (site statique, répertoire `dist`, etc.).

## Utilisation avec Cursor

- Éditez le code dans ce dossier : Cursor modifie directement les fichiers du projet.
- Après chaque modification, commitez et poussez vers votre dépôt Git ; Coolify peut redéployer automatiquement.
=======
# BoutikNaka

BoutikNaka est une plateforme e-commerce complète développée avec Next.js, TypeScript et Prisma. Le système comprend une gestion de produits, services, abonnements aux plateformes de streaming, et un panneau d'administration complet.

## 🌟 Fonctionnalités

- **Authentification complète** - Inscription, connexion, gestion de profil
- **Gestion de produits** - Catalogue, catégories, variations, attributs, inventaire
- **Gestion de services** - Services disponibles par catégories
- **Plateforme d'abonnements** - Gestion des abonnements aux services de streaming (Netflix, Disney+, etc.)
- **Gestion des profils** - Attribution de profils utilisateurs aux comptes de plateformes
- **Système de commandes** - Panier, checkout, historique de commandes
- **Panneau d'administration** - Interface complète pour gérer tous les aspects de la plateforme
- **Interface responsive** - Expérience utilisateur optimisée sur tous les appareils

## 🛠️ Technologies

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** API Routes Next.js, Prisma ORM
- **Base de données:** PostgreSQL
- **UI Components:** Radix UI, Tailwind CSS, Shadcn UI
- **Authentification:** Next-Auth
- **Gestion de formulaires:** React Hook Form, Zod
- **Gestion de médias:** Cloudinary
- **Déploiement:** Configuration pour Netlify

## 🚀 Installation

1. Clonez le dépôt
   ```bash
   git clone <url-du-depot>
   cd boutiknaka
   ```

2. Installez les dépendances
   ```bash
   npm install
   ```

3. Configurez les variables d'environnement
   ```bash
   # Créez un fichier .env avec les variables suivantes:
   DATABASE_URL="postgresql://user:password@localhost:5432/boutiknaka"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="votre-secret-ici"
   CLOUDINARY_CLOUD_NAME="votre-cloud-name"
   CLOUDINARY_API_KEY="votre-api-key"
   CLOUDINARY_API_SECRET="votre-api-secret"
   ```

4. Initialisez la base de données
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Lancez l'application en mode développement
   ```bash
   npm run dev
   ```

## 📊 Structure du projet

```
├── app/                   # Routes et pages de l'application Next.js
│   ├── (admin)/          # Zone d'administration (route groupée)
│   ├── (site)/           # Interface utilisateur du site (route groupée)
│   ├── api/              # Points d'API REST
│   ├── auth/             # Pages d'authentification
│   ├── products/         # Pages des produits
│   ├── services/         # Pages des services
│   ├── profiles/         # Gestion des profils
│   └── ...
├── components/           # Composants React réutilisables
├── lib/                  # Utilitaires et fonctions partagées
├── prisma/              # Schéma de base de données et migrations
├── public/              # Fichiers statiques
└── scripts/             # Scripts utilitaires et de migration
```

## 🛡️ Schéma de base de données

Le système utilise un schéma Prisma complet gérant:
- Utilisateurs et authentification
- Produits, variations et attributs
- Services et catégories
- Plateformes et abonnements
- Profils utilisateurs
- Commandes et éléments de commande
- Médias et paramètres système

## 🔄 Scripts disponibles

```bash
# Développement
npm run dev              # Lancer le serveur de développement

# Base de données
npm run prisma:studio    # Interface Prisma Studio
npm run prisma:migrate   # Exécuter les migrations
npm run prisma:seed      # Remplir la base de données avec des données de test

# Production
npm run build            # Construire pour la production
npm run start            # Démarrer en production

# Utilitaires
npm run update-subscriptions  # Mettre à jour les statuts d'abonnement
npm run scheduler             # Exécuter les tâches planifiées
```

## 🧑‍💻 Développement

### Ajout de nouveaux produits/services

1. Utilisez l'interface d'administration `/admin/products` ou `/admin/services`
2. Ou utilisez l'API via les endpoints `/api/products` et `/api/services`

### Gestion des abonnements

Le système gère automatiquement les abonnements aux plateformes avec:
- Attribution de profils
- Renouvellement des abonnements
- Notifications aux utilisateurs

### Système de paiement

Le projet est configuré pour s'intégrer avec différentes passerelles de paiement via l'API payments.

## 📱 Capture d'écran

*Screenshots à ajouter*

## 📄 Licence

Tous droits réservés. 
>>>>>>> bnk/master

## CI/CD Test - 2026-02-24 17:35:50
