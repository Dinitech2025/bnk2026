# 📋 PLAN - WORKFLOW PROPOSITIONS → DEVIS → VALIDATION ADMIN

## 🎯 OBJECTIF

Modifier le système pour que les **propositions de prix** passent par le **système de devis** avec **validation admin** avant d'être ajoutées au panier avec le prix confirmé.

---

## 🔄 **WORKFLOW ACTUEL VS NOUVEAU**

### **❌ Workflow Actuel (Problématique)**
```
1. Client propose un prix sur produit NEGOTIABLE
2. Proposition envoyée directement au panier (en attente)
3. Pas de validation admin claire
4. Pas de suivi structuré
```

### **✅ Nouveau Workflow (Solution)**
```
1. Client propose un prix sur produit NEGOTIABLE
2. Création automatique d'un DEVIS avec le produit et prix proposé
3. Admin reçoit le devis pour validation
4. Admin accepte/refuse/contre-propose
5. Si accepté → Client peut ajouter au panier avec prix validé
6. Si refusé → Client informé avec raison
7. Si contre-proposition → Négociation continue
```

---

## 🏗️ **MODIFICATIONS À APPORTER**

### **1. Modèle de Données** 📊

#### **Étendre le modèle Quote**
```prisma
model Quote {
  // ... champs existants
  
  // Nouveaux champs pour propositions produits
  productId     String?           // ID du produit (si proposition sur produit)
  proposedPrice Decimal?          // Prix proposé par le client
  adminResponse String?           // Réponse de l'admin
  negotiationType String?         // 'SERVICE' | 'PRODUCT_PRICE'
  
  // Relations
  product       Product?          @relation(fields: [productId], references: [id])
}
```

#### **Nouveau modèle PriceNegotiation (Alternative)**
```prisma
model PriceNegotiation {
  id            String            @id @default(cuid())
  userId        String
  productId     String
  proposedPrice Decimal
  status        NegotiationStatus
  clientMessage String?
  adminResponse String?
  finalPrice    Decimal?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  
  user          User              @relation(fields: [userId], references: [id])
  product       Product           @relation(fields: [productId], references: [id])
}

enum NegotiationStatus {
  PENDING
  ACCEPTED
  REJECTED
  COUNTER_OFFER
  COMPLETED
}
```

### **2. Composant ProductPricingSelector** 🎨

#### **Modifier la fonction handleNegotiation**
```typescript
const handleNegotiation = async () => {
  // Au lieu d'ajouter au panier, créer un devis
  const quoteData = {
    productId: product.id,
    proposedPrice: proposedPrice,
    description: `Proposition de prix pour ${product.name}`,
    clientMessage: clientMessage,
    negotiationType: 'PRODUCT_PRICE'
  }
  
  await onRequestQuote(quoteData)
  
  toast({
    title: "Proposition envoyée",
    description: "Votre proposition de prix a été envoyée pour validation admin"
  })
}
```

### **3. API Routes** 🔌

#### **Nouvelle API pour propositions**
```typescript
// app/api/quotes/product-proposal/route.ts
export async function POST(request: NextRequest) {
  // Créer un devis spécial pour proposition de prix produit
  const quote = await prisma.quote.create({
    data: {
      userId: session.user.id,
      productId: productId,
      proposedPrice: proposedPrice,
      description: `Proposition de prix pour ${productName}`,
      status: 'PENDING',
      negotiationType: 'PRODUCT_PRICE'
    }
  })
}
```

#### **API pour validation admin**
```typescript
// app/api/admin/quotes/[id]/validate-price/route.ts
export async function POST(request: NextRequest) {
  // Admin accepte/refuse la proposition
  // Si accepté, permettre l'ajout au panier avec prix validé
}
```

### **4. Interface Admin** 👨‍💼

#### **Améliorer la page admin/quotes**
- ✅ Distinguer les devis services vs propositions produits
- ✅ Actions spécifiques pour propositions de prix
- ✅ Boutons "Accepter prix" / "Refuser" / "Contre-proposer"

#### **Nouvelle section dans admin/quotes**
```typescript
// Onglet "Propositions de Prix"
- Liste des propositions en attente
- Informations produit + prix proposé
- Actions de validation
- Historique des négociations
```

### **5. Interface Client** 👥

#### **Page profil - Mes Propositions**
```typescript
// app/(site)/profile/my-proposals/page.tsx
- Historique des propositions de prix
- Statut de chaque proposition
- Réponses admin
- Actions selon le statut
```

#### **Notifications**
- ✅ Email quand proposition acceptée/refusée
- ✅ Notification dans le profil
- ✅ Possibilité d'ajouter au panier si accepté

---

## 🎯 **ÉTAPES D'IMPLÉMENTATION**

### **Phase 1 - Base de Données** 📊
1. ✅ Étendre le modèle Quote avec champs produit
2. ✅ Migration de base de données
3. ✅ Mise à jour des types TypeScript

### **Phase 2 - APIs** 🔌
1. ✅ API création proposition (POST /api/quotes/product-proposal)
2. ✅ API validation admin (POST /api/admin/quotes/[id]/validate)
3. ✅ API ajout panier avec prix validé

### **Phase 3 - Interface Client** 👥
1. ✅ Modifier ProductPricingSelector
2. ✅ Créer page "Mes Propositions"
3. ✅ Intégrer dans le profil client

### **Phase 4 - Interface Admin** 👨‍💼
1. ✅ Améliorer page admin/quotes
2. ✅ Ajouter actions validation
3. ✅ Dashboard propositions

### **Phase 5 - Notifications** 📧
1. ✅ Emails automatiques
2. ✅ Notifications in-app
3. ✅ Workflow complet

---

## 🎊 **AVANTAGES DU NOUVEAU SYSTÈME**

### **Pour l'Admin** 👨‍💼
- ✅ **Contrôle total** : Validation de chaque proposition
- ✅ **Suivi centralisé** : Tout dans la section devis
- ✅ **Négociation structurée** : Workflow clair
- ✅ **Historique complet** : Traçabilité des échanges

### **Pour le Client** 👥
- ✅ **Transparence** : Suivi du statut de la proposition
- ✅ **Communication** : Échanges avec l'admin
- ✅ **Sécurité** : Prix validé avant achat
- ✅ **Expérience** : Workflow professionnel

### **Pour le Business** 💼
- ✅ **Contrôle des marges** : Validation des prix
- ✅ **Relation client** : Communication personnalisée
- ✅ **Flexibilité** : Négociation possible
- ✅ **Traçabilité** : Historique des négociations

---

## 🚀 **PROCHAINES ÉTAPES**

**Voulez-vous que je commence par :**

1. 📊 **Étendre le modèle Quote** pour inclure les propositions produits ?
2. 🎨 **Modifier ProductPricingSelector** pour créer des devis ?
3. 👨‍💼 **Améliorer l'interface admin** pour valider les propositions ?
4. 👥 **Créer la page client** "Mes Propositions" ?

**Ou préférez-vous une approche spécifique ?**

---

**Développé le** : 1er Novembre 2025  
**Status** : 📋 Plan détaillé pour workflow propositions → devis  
**Objectif** : 🎯 Validation admin obligatoire avant ajout panier  
**Avantage** : ✅ Contrôle total des prix et négociations



