# Système de Messagerie Client - BoutikNaka

## 📋 Vue d'ensemble

Le système de messagerie permet aux clients de communiquer avec l'administration via plusieurs canaux :
- **Widget de chat** sur le site web
- **Formulaire de contact** public
- **Interface admin** pour gérer les conversations

## 🎯 Fonctionnalités

### 1. Widget de Chat (Site Web)
- **Emplacement** : Bouton flottant en bas à droite de toutes les pages
- **Fonctionnalités** :
  - Envoi automatique après 3 secondes d'inactivité
  - Envoi manuel avec le bouton ou la touche Enter
  - Historique des messages
  - Indicateur visuel du temps restant avant envoi automatique
  - Minimisation/Maximisation
  - Compteur de messages non lus

**Fichier** : `components/chat/chat-widget.tsx`

### 2. Formulaire de Contact Public
- **URL** : `/contact`
- **Champs** :
  - Nom
  - Email
  - Sujet
  - Message
  - Type de message (Support, Commande, Abonnement, etc.)
  - Priorité (Normale, Urgente)

**Fichiers** :
- `app/(site)/contact/page.tsx`
- `components/contact/contact-form.tsx`
- `components/contact/contact-info.tsx`

### 3. Interface Admin
- **URL** : `/admin/messages`
- **Fonctionnalités** :
  - Liste des messages avec filtres (statut, type, priorité)
  - Recherche par nom, email, sujet ou contenu
  - Statistiques en temps réel
  - Marquage comme lu/non lu
  - Réponse directe aux messages
  - Groupement par client

**Fichiers** :
- `app/(admin)/admin/messages/page.tsx`
- `app/(admin)/admin/messages/[id]/page.tsx`
- `app/(admin)/admin/messages/new/page.tsx`

### 4. Notifications en Temps Réel
- **Emplacement** : Header admin
- **Fonctionnalités** :
  - Badge avec nombre de messages non lus
  - Dropdown interactif avec aperçu des messages
  - Navigation rapide vers les messages
  - Rafraîchissement automatique toutes les 30 secondes

**Fichier** : `components/admin/header.tsx`

## 🗄️ Structure de la Base de Données

### Modèle Message
```prisma
model Message {
  id              String    @id @default(cuid())
  subject         String    // Sujet du message
  content         String    // Contenu du message
  type            String    @default("GENERAL") // Type de message
  priority        String    @default("NORMAL") // Priorité
  status          String    @default("UNREAD") // Statut
  
  // Relations utilisateurs
  fromUserId      String    // Expéditeur
  toUserId        String    // Destinataire
  
  // Informations client (pour messages anonymes)
  clientEmail     String?   // Email du client
  clientName      String?   // Nom du client
  
  // Conversation
  conversationId  String?   // ID de la conversation
  parentMessageId String?   // Message parent (réponses)
  
  // Métadonnées
  metadata        Json?     // Données supplémentaires
  
  // Timestamps
  sentAt          DateTime  @default(now())
  readAt          DateTime? // Date de lecture
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations Prisma
  fromUser        User      @relation("SentMessages", fields: [fromUserId], references: [id])
  toUser          User      @relation("ReceivedMessages", fields: [toUserId], references: [id])
  replies         Message[] @relation("MessageReplies")
  replyTo         Message?  @relation("MessageReplies", fields: [parentMessageId], references: [id])
  
  @@index([status])
  @@index([type])
  @@index([priority])
  @@index([fromUserId])
  @@index([toUserId])
}
```

## 🔌 API Endpoints

### API Admin

#### GET `/api/admin/messages`
Liste tous les messages avec filtres optionnels.

**Query Parameters** :
- `status` : Filtrer par statut (UNREAD, READ, REPLIED, etc.)
- `type` : Filtrer par type (GENERAL, SUPPORT, ORDER, etc.)
- `priority` : Filtrer par priorité (LOW, NORMAL, HIGH, URGENT)
- `userId` : Filtrer par utilisateur
- `limit` : Nombre de résultats (défaut: 50)

**Réponse** :
```json
{
  "messages": [
    {
      "id": "...",
      "subject": "Question sur une commande",
      "content": "...",
      "type": "SUPPORT",
      "priority": "NORMAL",
      "status": "UNREAD",
      "clientName": "Client Test",
      "clientEmail": "client@test.com",
      "sentAt": "2025-10-23T17:18:18.000Z",
      "createdAt": "2025-10-23T17:18:18.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 50
}
```

#### POST `/api/admin/messages`
Créer un nouveau message (admin vers client).

**Body** :
```json
{
  "subject": "Réponse à votre question",
  "content": "Bonjour, voici la réponse...",
  "toUserId": "client-id",
  "type": "SUPPORT",
  "priority": "NORMAL"
}
```

#### GET `/api/admin/messages/[id]`
Récupérer un message spécifique.

#### PATCH `/api/admin/messages/[id]`
Mettre à jour un message.

#### DELETE `/api/admin/messages/[id]`
Supprimer un message.

#### PATCH `/api/admin/messages/[id]/read`
Marquer un message comme lu.

#### GET `/api/admin/messages/unread-count`
Obtenir le nombre de messages non lus.

### API Publique

#### GET `/api/public/messages`
Récupérer les messages d'un client.

**Query Parameters** :
- `userId` : ID de l'utilisateur connecté
- `clientEmail` : Email du client (pour clients non connectés)
- `conversationId` : ID de la conversation

#### POST `/api/public/messages`
Envoyer un nouveau message.

**Body** :
```json
{
  "subject": "Question",
  "content": "Bonjour, j'ai une question...",
  "type": "SUPPORT",
  "clientEmail": "client@example.com",
  "clientName": "Jean Dupont"
}
```

## 📊 Types de Messages

| Type | Description |
|------|-------------|
| `GENERAL` | Message général |
| `SUPPORT` | Demande de support |
| `ORDER` | Question sur une commande |
| `SUBSCRIPTION` | Question sur un abonnement |
| `PAYMENT` | Question sur un paiement |
| `CUSTOM` | Message personnalisé |

## 🎨 Priorités

| Priorité | Couleur | Badge |
|----------|---------|-------|
| `LOW` | Gris | Basse |
| `NORMAL` | Bleu | Normal |
| `HIGH` | Orange | Haute |
| `URGENT` | Rouge | Urgente |

## 📈 Statuts

| Statut | Description | Couleur |
|--------|-------------|---------|
| `UNREAD` | Non lu | Rouge |
| `READ` | Lu | Vert |
| `REPLIED` | Répondu | Bleu |
| `ARCHIVED` | Archivé | Gris |
| `DELETED` | Supprimé | Gris |

## 🧪 Tests

### Créer des utilisateurs de test
```bash
node scripts/create-test-users.js
```

Crée :
- **Admin** : `admin@boutiknaka.com` / `Admin@2024`
- **Client** : `client@test.com` / `Client@2024`

### Tester le système complet
```bash
node scripts/test-message-complete.js
```

Teste :
- Création de messages
- Marquage comme lu
- Filtres et recherche
- Statistiques

## 🚀 Utilisation

### 1. Pour les Clients

#### Via le Widget de Chat
1. Cliquer sur le bouton de chat en bas à droite
2. Taper un message
3. Attendre 3 secondes pour l'envoi automatique OU appuyer sur Enter OU cliquer sur "Envoyer"

#### Via le Formulaire de Contact
1. Aller sur `/contact`
2. Remplir le formulaire
3. Cliquer sur "Envoyer"

### 2. Pour les Admins

#### Consulter les Messages
1. Aller sur `/admin/messages`
2. Utiliser les filtres pour trouver des messages spécifiques
3. Cliquer sur un message pour voir les détails

#### Répondre à un Message
1. Sélectionner un message
2. Cliquer sur "Répondre"
3. Rédiger la réponse
4. Envoyer

#### Marquer comme Lu
1. Sélectionner un message non lu
2. Cliquer sur "Marquer lu"

## 🔔 Intégration avec les Notifications

Le système de messagerie est intégré au système de notifications :
- Les nouveaux messages apparaissent dans le dropdown de notifications
- Badge avec compteur de messages non lus
- Navigation directe vers les messages depuis les notifications

## 📝 Notes Importantes

1. **Envoi Automatique** : Les messages sont envoyés automatiquement après 3 secondes d'inactivité dans le widget de chat.

2. **Messages Anonymes** : Les clients non connectés peuvent envoyer des messages via le formulaire de contact. Leurs informations sont stockées dans `clientEmail` et `clientName`.

3. **Groupement** : Les messages sont groupés par client dans l'interface admin pour faciliter le suivi des conversations.

4. **Temps Réel** : Les notifications sont rafraîchies automatiquement toutes les 30 secondes.

5. **Sécurité** : Seuls les admins et le staff peuvent accéder aux messages via l'interface admin.

## 🎯 Améliorations Futures

- [ ] Système de conversations avec fil de discussion
- [ ] Pièces jointes
- [ ] Réponses automatiques
- [ ] Templates de réponses
- [ ] Assignation de messages à des agents spécifiques
- [ ] Statistiques avancées (temps de réponse, satisfaction, etc.)
- [ ] Notifications push en temps réel (WebSocket)
- [ ] Intégration avec email (notifications par email)
- [ ] Chat en direct (live chat)
- [ ] Chatbot IA pour réponses automatiques

## 🆘 Dépannage

### Les messages ne s'affichent pas
1. Vérifier que la base de données est synchronisée : `npx prisma db push`
2. Vérifier les logs de la console
3. Vérifier que les utilisateurs existent

### L'envoi automatique ne fonctionne pas
1. Vérifier que le `useEffect` dans `chat-widget.tsx` est actif
2. Vérifier les logs de la console
3. Vérifier que l'API `/api/public/messages` fonctionne

### Les notifications ne se rafraîchissent pas
1. Vérifier l'intervalle dans `components/admin/header.tsx`
2. Vérifier l'API `/api/admin/notifications`
3. Vérifier les logs de la console

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/docs)

