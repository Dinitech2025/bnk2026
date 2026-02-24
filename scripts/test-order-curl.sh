#!/bin/bash

echo "🧪 TEST CRÉATION COMMANDE AVEC CURL"
echo "==================================="
echo ""

# Données de test
TEST_DATA='{
  "items": [
    {
      "id": "test-product-1",
      "productId": "test-product-1",
      "name": "Produit Test",
      "price": 10000,
      "quantity": 1,
      "type": "product"
    }
  ],
  "total": 10000,
  "currency": "Ar",
  "shippingAddress": {
    "street": "123 Rue Test",
    "city": "Antananarivo",
    "zipCode": "101",
    "country": "Madagascar",
    "phone": "+261 34 12 345 67"
  },
  "billingAddress": {
    "street": "123 Rue Test",
    "city": "Antananarivo",
    "zipCode": "101",
    "country": "Madagascar",
    "phone": "+261 34 12 345 67"
  },
  "email": "test@example.com",
  "phone": "+261 34 12 345 67",
  "firstName": "Test",
  "lastName": "User",
  "paymentData": {
    "method": "paypal",
    "status": "completed",
    "transactionId": "TEST_PAYPAL_'$(date +%s)'",
    "paypalOrderId": "PAYPAL_ORDER_TEST",
    "details": {
      "test": true
    }
  },
  "notes": "Commande de test"
}'

echo "📤 Envoi de la requête à l'API..."
echo "URL: http://localhost:3000/api/orders/create"
echo ""

# Faire la requête
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\n\n📊 STATISTIQUES:\nStatus Code: %{http_code}\nTime Total: %{time_total}s\nSize Downloaded: %{size_download} bytes\n" \
  http://localhost:3000/api/orders/create

echo ""
echo "✅ Test terminé!"

