# Améliorations recommandées pour le schéma Order

## Analyse de la structure actuelle

Le modèle `Order` actuel est défini comme suit :

```prisma
model Order {
  id              String         @id @default(cuid())
  userId          String
  status          String         @default("PENDING")
  total           Decimal
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  addressId       String?
  shippingAddress Address?       @relation("shippingAddress", fields: [addressId], references: [id])
  user            User           @relation(fields: [userId], references: [id])
  items           OrderItem[]
  subscriptions   Subscription[]

  @@index([userId])
  @@index([status])
}
```

## Problèmes identifiés

1. **Manque d'informations sur le paiement** : Aucun statut de paiement ni méthode de paiement.
2. **Absence de numéro de commande lisible** : Pas de référence facile à communiquer aux clients.
3. **Pas de distinction entre adresse de livraison et facturation** : Important pour la comptabilité.
4. **Pas de champs pour les taxes et réductions** : Nécessaires pour le détail des factures.
5. **Pas de champ pour les notes ou commentaires** : Utile pour la communication interne ou avec les clients.
6. **Absence de date de finalisation** : Important pour les statistiques et le suivi.

## Améliorations proposées

Voici la structure améliorée recommandée pour le modèle `Order` :

```prisma
model Order {
  id                String         @id @default(cuid())
  userId            String
  orderNumber       String?        @unique // Numéro de commande lisible (ex: CMD-2023-001)
  status            String         @default("PENDING")
  paymentStatus     String         @default("UNPAID") // UNPAID, PAID, PARTIALLY_PAID, REFUNDED
  paymentMethod     String?        // Méthode de paiement utilisée
  subtotal          Decimal        // Montant avant taxes et réductions
  taxAmount         Decimal?       // Montant des taxes
  discountAmount    Decimal?       // Montant des réductions
  total             Decimal        // Montant total final
  notes             String?        // Notes internes ou commentaires du client
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  completedAt       DateTime?      // Date de finalisation de la commande
  addressId         String?        // Adresse de livraison
  billingAddressId  String?        // Adresse de facturation différente si nécessaire
  shippingAddress   Address?       @relation("shippingAddress", fields: [addressId], references: [id])
  billingAddress    Address?       @relation("billingAddress", fields: [billingAddressId], references: [id])
  user              User           @relation(fields: [userId], references: [id])
  items             OrderItem[]
  subscriptions     Subscription[]

  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])
  @@index([orderNumber])
}
```

## Migration Prisma

Pour mettre à jour votre schéma, vous devrez créer une migration Prisma. Voici les étapes :

1. Modifiez votre fichier `schema.prisma` avec le modèle amélioré ci-dessus
2. Ajoutez la relation manquante dans le modèle `Address` :

```prisma
model Address {
  // Champs existants...
  
  // Ajouter cette relation
  billingOrders Order[] @relation("billingAddress")
}
```

3. Créez et appliquez la migration :

```bash
npx prisma migrate dev --name enhance_order_model
```

4. Mettez à jour le client Prisma :

```bash
npx prisma generate
```

## Mise à jour des API

Assurez-vous de mettre à jour vos API pour prendre en compte ces nouveaux champs:

1. Ajoutez les nouveaux champs dans les DTOs de création/mise à jour des commandes
2. Mettez à jour les fonctions pour calculer correctement le sous-total, les taxes et les réductions
3. Implémentez la logique pour générer des numéros de commande (orderNumber)
4. Ajoutez la gestion des adresses de facturation distinctes

## Modifications des composants Frontend

1. Mettez à jour les formulaires de commande pour inclure les nouveaux champs
2. Ajoutez des options pour sélectionner une adresse de facturation différente
3. Affichez le statut du paiement et la méthode de paiement dans les détails de la commande
4. Intégrez l'affichage des taxes et des réductions

## Modifications de la vue OrderItem

Le modèle `OrderItem` peut également être amélioré pour mieux gérer les différents types d'articles :

```prisma
model OrderItem {
  id           String   @id @default(cuid())
  orderId      String
  quantity     Int      @default(1)
  unitPrice    Decimal
  totalPrice   Decimal
  itemType     String   // PRODUCT, SERVICE, OFFER, SUBSCRIPTION
  discountType String?  // PERCENTAGE, FIXED_AMOUNT, NONE
  discountValue Decimal? // Valeur de la réduction appliquée à cet article
  taxRate      Decimal? // Taux de taxe appliqué à cet article
  taxAmount    Decimal? // Montant de la taxe sur cet article
  productId    String?
  serviceId    String?
  offerId      String?
  sku          String?  // Référence du produit au moment de la commande
  name         String?  // Nom du produit au moment de la commande
  description  String?  // Description au moment de la commande
  offer        Offer?   @relation(fields: [offerId], references: [id])
  order        Order    @relation(fields: [orderId], references: [id])
  product      Product? @relation(fields: [productId], references: [id])
  service      Service? @relation(fields: [serviceId], references: [id])
}
```

Cela permettra de :
- Stocker les informations du produit au moment de la commande (même si le produit change plus tard)
- Gérer correctement les taxes et réductions au niveau des articles
- Mieux identifier les types d'articles
