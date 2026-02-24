#!/bin/bash

echo "🛒 TEST COMMANDE AVEC VRAIES DONNÉES"
echo "===================================="
echo ""

# Données réalistes (sans productId spécifique pour éviter les contraintes)
REAL_DATA='{
  "items": [
    {
      "id": "cart-item-1",
      "name": "Abonnement Netflix Premium",
      "price": 25000,
      "quantity": 1,
      "type": "service",
      "metadata": {
        "platform": "Netflix",
        "duration": "1 mois",
        "quality": "4K"
      }
    },
    {
      "id": "cart-item-2", 
      "name": "Recharge Mobile Telma",
      "price": 5000,
      "quantity": 2,
      "type": "product",
      "metadata": {
        "operator": "Telma",
        "amount": "5000 Ar"
      }
    }
  ],
  "total": 35000,
  "currency": "Ar",
  "shippingAddress": {
    "street": "Lot II M 15 Andravoahangy",
    "city": "Antananarivo",
    "zipCode": "101",
    "country": "Madagascar",
    "phone": "+261 34 12 345 67"
  },
  "billingAddress": {
    "street": "Lot II M 15 Andravoahangy", 
    "city": "Antananarivo",
    "zipCode": "101",
    "country": "Madagascar",
    "phone": "+261 34 12 345 67"
  },
  "email": "client@boutik-naka.com",
  "phone": "+261 34 12 345 67",
  "firstName": "Jean",
  "lastName": "Rakoto",
  "paymentData": {
    "method": "paypal",
    "status": "completed",
    "transactionId": "PAYPAL_'$(date +%s)'",
    "paypalOrderId": "PAYPAL_ORDER_'$(date +%s)'",
    "amount": {
      "value": "7.00",
      "currency_code": "EUR"
    },
    "details": {
      "conversion": "35000 Ar → 7.00 EUR",
      "paypal_fee": "0.35 EUR"
    }
  },
  "notes": "Livraison rapide souhaitée"
}'

echo "📤 Création commande réaliste..."
echo "Total: 35,000 Ar (Netflix + 2x Recharge Telma)"
echo ""

# Faire la requête
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$REAL_DATA" \
  -w "\n\n📊 RÉSULTAT:\nStatus: %{http_code} | Temps: %{time_total}s\n" \
  http://localhost:3000/api/orders/create

echo ""
echo "✅ Test commande réaliste terminé!"

