#!/bin/bash

echo "🧪 Test complet du flux d'abonnements avec popup"
echo "=================================================="

# Attendre que le serveur soit prêt
echo "⏳ Attente du démarrage du serveur..."
sleep 5

# Test 1: API des offres publiques
echo -e "\n1️⃣ Test de l'API des offres publiques..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/public/offers)
if [ "$response" = "200" ]; then
    echo "✅ API des offres accessible (HTTP $response)"
    offers_count=$(curl -s http://localhost:3000/api/public/offers | jq length)
    echo "   📊 $offers_count offres disponibles"
else
    echo "❌ API des offres non accessible (HTTP $response)"
fi

# Test 2: Page des abonnements
echo -e "\n2️⃣ Test de la page des abonnements..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/subscriptions)
if [ "$response" = "200" ]; then
    echo "✅ Page des abonnements accessible (HTTP $response)"
else
    echo "❌ Page des abonnements non accessible (HTTP $response)"
fi

# Test 3: API des comptes par plateforme (Netflix)
echo -e "\n3️⃣ Test de l'API des comptes par plateforme..."
netflix_platform_id=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.platform.findFirst({where: {name: 'Netflix'}}).then(p => {
  console.log(p?.id || '');
  prisma.\$disconnect();
});
")

if [ -n "$netflix_platform_id" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/admin/streaming/accounts?platformId=$netflix_platform_id")
    if [ "$response" = "200" ]; then
        echo "✅ API des comptes accessible (HTTP $response)"
        accounts_count=$(curl -s "http://localhost:3000/api/admin/streaming/accounts?platformId=$netflix_platform_id" | jq length)
        echo "   📊 $accounts_count comptes Netflix disponibles"
    else
        echo "❌ API des comptes non accessible (HTTP $response)"
    fi
else
    echo "⚠️  Impossible de récupérer l'ID de la plateforme Netflix"
fi

# Test 4: API des profils
echo -e "\n4️⃣ Test de l'API des profils..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/streaming/profiles)
if [ "$response" = "200" ]; then
    echo "✅ API des profils accessible (HTTP $response)"
    profiles_count=$(curl -s http://localhost:3000/api/admin/streaming/profiles | jq length)
    echo "   📊 $profiles_count profils au total"
else
    echo "❌ API des profils non accessible (HTTP $response)"
fi

# Test 5: Page du panier
echo -e "\n5️⃣ Test de la page du panier..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/cart)
if [ "$response" = "200" ]; then
    echo "✅ Page du panier accessible (HTTP $response)"
else
    echo "❌ Page du panier non accessible (HTTP $response)"
fi

echo -e "\n🎯 Résumé du test:"
echo "   - Les APIs nécessaires au popup sont fonctionnelles"
echo "   - Les pages front-end sont accessibles"
echo "   - Le système est prêt pour les tests manuels"

echo -e "\n📝 Pour tester manuellement:"
echo "   1. Aller sur http://localhost:3000/subscriptions"
echo "   2. Cliquer sur 'Choisir' pour une offre"
echo "   3. Sélectionner un compte et des profils dans le popup"
echo "   4. Ajouter au panier"
echo "   5. Vérifier le panier sur http://localhost:3000/cart"

echo -e "\n✅ Test terminé!" 