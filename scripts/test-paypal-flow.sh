#!/bin/bash

echo "🧪 TEST NOUVEAU FLUX PAYPAL"
echo "==========================="
echo ""

# Test création commande PayPal avec nouvelles URLs
echo "1️⃣ Test création commande PayPal..."

ORDER_DATA='{
  "amount": "5.00",
  "currency": "EUR",
  "orderData": {
    "items": [
      {
        "id": "test-flow-1",
        "name": "Test Nouveau Flux PayPal",
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
    
    # Extraire les informations importantes
    ORDER_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    RETURN_URL=$(echo "$RESPONSE_BODY" | grep -o '"returnUrl":"[^"]*"' | cut -d'"' -f4)
    CANCEL_URL=$(echo "$RESPONSE_BODY" | grep -o '"cancelUrl":"[^"]*"' | cut -d'"' -f4)
    
    echo ""
    echo "📋 INFORMATIONS EXTRAITES:"
    echo "   Order ID: $ORDER_ID"
    echo "   Return URL: $RETURN_URL"
    echo "   Cancel URL: $CANCEL_URL"
    
    # Vérifier que les URLs contiennent l'orderID
    if [[ "$RETURN_URL" == *"$ORDER_ID"* ]]; then
        echo "   ✅ Return URL contient l'orderID"
    else
        echo "   ❌ Return URL ne contient pas l'orderID"
    fi
    
    if [[ "$CANCEL_URL" == *"$ORDER_ID"* ]]; then
        echo "   ✅ Cancel URL contient l'orderID"
    else
        echo "   ❌ Cancel URL ne contient pas l'orderID"
    fi
    
else
    echo "❌ Erreur création commande"
    echo "Réponse: $RESPONSE_BODY"
fi

echo ""

# Test de la page de retour PayPal (simulation)
echo "2️⃣ Test page de retour PayPal..."

if [ ! -z "$ORDER_ID" ]; then
    echo "📤 Test URL de retour avec succès..."
    RETURN_TEST=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      "http://localhost:3000/paypal-return?orderID=$ORDER_ID&success=true")
    
    RETURN_HTTP_STATUS=$(echo "$RETURN_TEST" | grep "HTTP_STATUS:" | cut -d: -f2)
    echo "Status page de retour: $RETURN_HTTP_STATUS"
    
    if [ "$RETURN_HTTP_STATUS" = "200" ]; then
        echo "✅ Page de retour accessible"
    else
        echo "❌ Erreur page de retour"
    fi
    
    echo ""
    echo "📤 Test URL d'annulation..."
    CANCEL_TEST=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      "http://localhost:3000/paypal-return?orderID=$ORDER_ID&success=false")
    
    CANCEL_HTTP_STATUS=$(echo "$CANCEL_TEST" | grep "HTTP_STATUS:" | cut -d: -f2)
    echo "Status page d'annulation: $CANCEL_HTTP_STATUS"
    
    if [ "$CANCEL_HTTP_STATUS" = "200" ]; then
        echo "✅ Page d'annulation accessible"
    else
        echo "❌ Erreur page d'annulation"
    fi
else
    echo "⚠️ Pas d'orderID pour tester les pages de retour"
fi

echo ""
echo "📊 RÉSUMÉ DU TEST:"
echo "=================="

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ API PayPal create-order: FONCTIONNE"
else
    echo "❌ API PayPal create-order: ERREUR"
fi

if [ "$RETURN_HTTP_STATUS" = "200" ]; then
    echo "✅ Page de retour PayPal: ACCESSIBLE"
else
    echo "❌ Page de retour PayPal: ERREUR"
fi

echo ""
echo "🎯 NOUVEAU FLUX PAYPAL:"
echo "1. Création commande PayPal avec URLs personnalisées"
echo "2. Ouverture popup PayPal"
echo "3. Après paiement → redirection vers /paypal-return"
echo "4. Page /paypal-return envoie message à la fenêtre parent"
echo "5. Fenêtre parent capture le paiement et ferme la popup"
echo "6. Confirmation s'affiche dans la fenêtre principale"

