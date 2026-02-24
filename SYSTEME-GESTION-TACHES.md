# 📋 Système de Gestion de Tâches - BoutikNaka

## Vue d'ensemble

Le système de gestion de tâches permet aux administrateurs et au staff de gérer efficacement les actions à effectuer, avec génération automatique de tâches basées sur des événements métier.

## 🎯 Types de Tâches

### 1. **SUBSCRIPTION_EXPIRY** - Expiration d'abonnement
- **Déclencheur**: Abonnement expirant dans les 7 prochains jours
- **Priorité**: HIGH (si ≤ 3 jours) ou MEDIUM
- **Action**: Contacter le client pour renouvellement
- **Génération**: Automatique quotidienne

### 2. **ACCOUNT_RECHARGE** - Recharge de compte streaming
- **Déclencheur**: Compte streaming expirant dans les 5 prochains jours
- **Priorité**: URGENT (si ≤ 2 jours) ou HIGH
- **Action**: Recharger le compte avant expiration
- **Génération**: Automatique quotidienne

### 3. **PAYMENT_REMINDER** - Rappel de paiement
- **Déclencheur**: Abonnement en statut PENDING depuis plus de 2 jours
- **Priorité**: MEDIUM
- **Action**: Contacter le client pour paiement
- **Génération**: Automatique quotidienne

### 4. **PROSPECTION** - Prospection commerciale
- **Déclencheur**: Jours ouvrables (Lundi à Vendredi)
- **Priorité**: LOW
- **Action**: Chercher de nouveaux clients sur les réseaux sociaux
- **Génération**: 2 tâches par jour ouvrable
- **Objectif**: Contacter au moins 10 prospects par tâche

### 5. **REMOVE_CLIENT** - Retrait de client
- **Déclencheur**: Abonnement expiré avec profils encore assignés
- **Priorité**: HIGH
- **Action**: Retirer le client du compte streaming
- **Génération**: Automatique quotidienne

### 6. **CUSTOM** - Tâche personnalisée
- **Déclencheur**: Création manuelle
- **Priorité**: Configurable
- **Action**: Définie par l'utilisateur

## 📊 Priorités

| Priorité | Couleur | Utilisation |
|----------|---------|-------------|
| **LOW** | Gris | Tâches non urgentes (prospection) |
| **MEDIUM** | Bleu | Tâches standard (rappels) |
| **HIGH** | Orange | Tâches importantes (expirations proches) |
| **URGENT** | Rouge | Tâches critiques (comptes expirant dans 2 jours) |

## 🔄 Statuts

| Statut | Couleur | Description |
|--------|---------|-------------|
| **PENDING** | Jaune | Tâche en attente de traitement |
| **IN_PROGRESS** | Bleu | Tâche en cours d'exécution |
| **COMPLETED** | Vert | Tâche terminée |
| **CANCELLED** | Gris | Tâche annulée |

## 🤖 Génération Automatique

### Configuration du Cron Job

Pour activer la génération automatique quotidienne, configurez un cron job pour exécuter le script:

```bash
# Exécuter tous les jours à 8h00
0 8 * * * cd /path/to/bnk && node scripts/generate-tasks-cron.js
```

### Génération Manuelle

Vous pouvez également générer les tâches manuellement depuis l'interface admin:
1. Aller sur `/admin/tasks`
2. Cliquer sur "Générer tâches auto"

Ou via l'API:
```bash
POST /api/admin/tasks/generate
```

## 📱 Interface Utilisateur

### Page Principale (`/admin/tasks`)

**Statistiques en temps réel:**
- Tâches en attente
- Tâches en cours
- Tâches terminées
- Tâches urgentes

**Filtres disponibles:**
- Recherche par texte
- Filtrage par statut
- Filtrage par type
- Filtrage par priorité

**Actions rapides:**
- Démarrer une tâche (PENDING → IN_PROGRESS)
- Terminer une tâche (IN_PROGRESS → COMPLETED)
- Voir les détails d'une tâche

### Création de Tâche Manuelle

Champs disponibles:
- **Titre** (requis)
- **Description**
- **Type** (requis)
- **Priorité** (défaut: MEDIUM)
- **Date d'échéance**
- **Assigné à** (admin/staff)
- **Client concerné**
- **Abonnement concerné**
- **Compte concerné**
- **Récurrence** (pour tâches répétitives)
- **Notes internes**

## 🔔 Notifications

Les tâches sont intégrées dans le système de notifications:

### Tâches Urgentes
- Type: Erreur (rouge)
- Icône: 🔥
- Affichage: Top 5 des tâches urgentes

### Tâches Prioritaires (HIGH)
- Type: Avertissement (orange)
- Icône: ⚠️
- Affichage: Top 5 des tâches prioritaires

### Tâches Normales (MEDIUM)
- Type: Info (bleu)
- Icône: 📋
- Affichage: Top 5 des tâches en attente

## 🔗 API Endpoints

### GET `/api/admin/tasks`
Récupérer la liste des tâches avec filtres

**Query params:**
- `status`: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
- `type`: SUBSCRIPTION_EXPIRY | ACCOUNT_RECHARGE | etc.
- `priority`: LOW | MEDIUM | HIGH | URGENT
- `assignedToId`: ID de l'utilisateur assigné
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre par page (défaut: 50)

### POST `/api/admin/tasks`
Créer une nouvelle tâche

**Body:**
```json
{
  "title": "Titre de la tâche",
  "description": "Description détaillée",
  "type": "CUSTOM",
  "priority": "MEDIUM",
  "dueDate": "2025-10-30T00:00:00Z",
  "assignedToId": "user_id",
  "relatedUserId": "client_id",
  "notes": "Notes internes"
}
```

### GET `/api/admin/tasks/[id]`
Récupérer les détails d'une tâche

### PATCH `/api/admin/tasks/[id]`
Mettre à jour une tâche

**Body:** Mêmes champs que POST (tous optionnels)

### DELETE `/api/admin/tasks/[id]`
Supprimer une tâche (admin uniquement)

### POST `/api/admin/tasks/generate`
Générer toutes les tâches automatiques (admin uniquement)

**Response:**
```json
{
  "success": true,
  "totalCreated": 15,
  "details": {
    "subscriptionExpiry": 5,
    "accountRecharge": 3,
    "paymentReminder": 4,
    "prospection": 2,
    "removeExpiredClients": 1
  },
  "errors": []
}
```

## 📊 Modèle de Données

```prisma
model Task {
  id                    String    @id @default(cuid())
  title                 String
  description           String?
  type                  String    // Type de tâche
  priority              String    @default("MEDIUM")
  status                String    @default("PENDING")
  dueDate               DateTime?
  completedAt           DateTime?
  
  // Relations
  assignedToId          String?
  createdById           String?
  relatedUserId         String?
  relatedSubscriptionId String?
  relatedAccountId      String?
  
  // Récurrence
  isRecurring           Boolean   @default(false)
  recurrenceType        String?   // DAILY, WEEKLY, MONTHLY
  recurrenceValue       Int?
  lastGenerated         DateTime?
  
  // Métadonnées
  metadata              Json?
  notes                 String?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

## 🔧 Configuration

### Variables d'environnement

Aucune variable supplémentaire n'est requise. Le système utilise la connexion Prisma existante.

### Migration de la base de données

Pour créer la table Task:

```bash
# Option 1: Migration SQL directe
psql $DATABASE_URL -f prisma/migrations/add_task_model.sql

# Option 2: Prisma migrate (si pas de drift)
npx prisma migrate dev --name add_task_model
```

## 📈 Cycle de Vie d'une Tâche

```
┌─────────────────────────────────────────────────────────┐
│                    CRÉATION                              │
│  - Automatique (cron/événement)                         │
│  - Manuelle (admin/staff)                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │   PENDING     │ ◄──── Tâche créée
         └───────┬───────┘
                 │
                 │ [Démarrer]
                 ▼
         ┌───────────────┐
         │ IN_PROGRESS   │ ◄──── Travail en cours
         └───────┬───────┘
                 │
                 │ [Terminer]
                 ▼
         ┌───────────────┐
         │  COMPLETED    │ ◄──── Tâche terminée
         └───────────────┘
                 
         ┌───────────────┐
         │  CANCELLED    │ ◄──── Tâche annulée (depuis n'importe quel statut)
         └───────────────┘
```

## 💡 Bonnes Pratiques

### Pour les Administrateurs

1. **Vérifier les tâches urgentes chaque matin**
   - Consulter le tableau de bord
   - Traiter les tâches URGENT en priorité

2. **Générer les tâches automatiques quotidiennement**
   - Configurer le cron job
   - Ou générer manuellement chaque jour

3. **Assigner les tâches au bon personnel**
   - Répartir la charge de travail
   - Suivre l'avancement

4. **Compléter les tâches avec des notes**
   - Documenter les actions effectuées
   - Faciliter le suivi

### Pour le Staff

1. **Consulter ses tâches assignées régulièrement**
2. **Mettre à jour le statut des tâches**
3. **Ajouter des notes pour le suivi**
4. **Signaler les problèmes aux admins**

## 🐛 Dépannage

### Les tâches ne se génèrent pas automatiquement

1. Vérifier que le cron job est configuré
2. Vérifier les logs: `scripts/generate-tasks-cron.js`
3. Tester la génération manuelle via l'API

### Erreurs dans les notifications

1. Vérifier que la table Task existe
2. Vérifier les permissions de l'utilisateur
3. Consulter les logs serveur

### Tâches dupliquées

Le système vérifie automatiquement l'existence de tâches similaires avant d'en créer de nouvelles. Si des doublons apparaissent, vérifier la logique de détection dans `lib/task-generator.ts`.

## 📞 Support

Pour toute question ou problème, consulter:
- La documentation technique dans le code
- Les logs du serveur
- L'équipe de développement

---

**Version:** 1.0.0  
**Dernière mise à jour:** 23 octobre 2025  
**Auteur:** BoutikNaka Development Team

