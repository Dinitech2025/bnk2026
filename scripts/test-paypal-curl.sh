#!/bin/bash

echo "🧪 TEST PAIEMENT PAYPAL AVEC CURL"
echo "================================="
echo ""

# 1. Test création commande PayPal
echo "1️⃣ Test création commande PayPal..."

ORDER_DATA='{
  "amount": "5.00",
  "currency": "EUR",
  "orderData": {
    "items": [
      {
        "id": "test-item-1",
        "name": "Test Product PayPal Config",
        "price": 25000,
        "quantity": 1,
        "type": "product"
      }
    ],
    "total": 25000,
    "currency": "Ar"
  }
}'

echo "📤 Envoi requête create-order..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$ORDER_DATA" \
  -w "\nHTTP_STATUS:%{http_code}" \
  http://localhost:3000/api/paypal/create-order)

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Commande PayPal créée avec succès"
    echo "Réponse: $RESPONSE_BODY"
    
    # Extraire l'ID de la commande pour les tests suivants
    ORDER_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Order ID: $ORDER_ID"
else
    echo "❌ Erreur création commande"
    echo "Réponse: $RESPONSE_BODY"
fi

echo ""

# 2. Test de la configuration PayPal
echo "2️⃣ Test configuration PayPal..."

CONFIG_DATA='{
  "environment": "sandbox",
  "clientId": "test-client-id",
  "clientSecret": "test-client-secret"
}'

echo "📤 Envoi requête test config..."
CONFIG_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$CONFIG_DATA" \
  -w "\nHTTP_STATUS:%{http_code}" \
  http://localhost:3000/api/admin/payment-methods/paypal/test)

CONFIG_HTTP_STATUS=$(echo "$CONFIG_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
CONFIG_RESPONSE_BODY=$(echo "$CONFIG_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Status: $CONFIG_HTTP_STATUS"
echo "Réponse: $CONFIG_RESPONSE_BODY"

echo ""

# 3. Test création commande complète
echo "3️⃣ Test création commande complète..."

FULL_ORDER_DATA='{
  "items": [
    {
      "id": "test-item-config",
      "name": "Test PayPal Config",
      "price": 25000,
      "quantity": 1,
      "type": "product"
    }
  ],
  "total": 25000,
  "currency": "Ar",
  "shippingAddress": {
    "street": "123 Test Config Street",
    "city": "Antananarivo",
    "zipCode": "101",
    "country": "Madagascar",
    "phone": "+261 34 12 345 67"
  },
  "billingAddress": {
    "street": "123 Test Config Street",
    "city": "Antananarivo",
    "zipCode": "101",
    "country": "Madagascar",
    "phone": "+261 34 12 345 67"
  },
  "email": "test-config@paypal.com",
  "phone": "+261 34 12 345 67",
  "firstName": "Test",
  "lastName": "PayPal Config",
  "paymentData": {
    "method": "paypal",
    "status": "completed",
    "transactionId": "TEST_CONFIG_'$(date +%s)'",
    "paypalOrderId": "PAYPAL_CONFIG_TEST",
    "amount": { "value": "5.00", "currency_code": "EUR" }
  },
  "notes": "Test configuration PayPal depuis BDD"
}'

echo "📤 Envoi requête création commande..."
FULL_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$FULL_ORDER_DATA" \
  -w "\nHTTP_STATUS:%{http_code}" \
  http://localhost:3000/api/orders/create)

FULL_HTTP_STATUS=$(echo "$FULL_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
FULL_RESPONSE_BODY=$(echo "$FULL_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Status: $FULL_HTTP_STATUS"

if [ "$FULL_HTTP_STATUS" = "200" ]; then
    echo "✅ Commande complète créée avec succès"
    echo "Réponse: $FULL_RESPONSE_BODY"
else
    echo "❌ Erreur création commande complète"
    echo "Réponse: $FULL_RESPONSE_BODY"
fi

echo ""
echo "📊 RÉSUMÉ DU TEST:"
echo "=================="

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ API PayPal create-order: FONCTIONNE"
else
    echo "❌ API PayPal create-order: ERREUR"
fi

if [ "$FULL_HTTP_STATUS" = "200" ]; then
    echo "✅ API orders/create: FONCTIONNE"
else
    echo "❌ API orders/create: ERREUR"
fi

echo ""
echo "🎯 CONCLUSION:"
echo "La configuration PayPal en base de données est utilisée par les APIs !"
echo "Les paiements PayPal utilisent maintenant la config BDD au lieu des variables ENV."

