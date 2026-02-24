#!/bin/bash

echo "🧪 Test simple de la page des abonnements"
echo ""

echo "1️⃣ Test de l'API /api/public/offers"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/public/offers")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ API accessible (HTTP $RESPONSE)"
    
    # Compter le nombre d'offres
    OFFERS_COUNT=$(curl -s "http://localhost:3000/api/public/offers" | grep -o '"id":' | wc -l)
    echo "✅ Nombre d'offres: $OFFERS_COUNT"
    
    # Afficher quelques noms d'offres
    echo ""
    echo "📊 Aperçu des offres:"
    curl -s "http://localhost:3000/api/public/offers" | grep -o '"name":"[^"]*"' | head -5 | sed 's/"name":"//g' | sed 's/"$//g' | while read name; do
        echo "  • $name"
    done
    
else
    echo "❌ API inaccessible (HTTP $RESPONSE)"
    exit 1
fi

echo ""
echo "2️⃣ Test de la page /subscriptions"
PAGE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/subscriptions")

if [ "$PAGE_RESPONSE" = "200" ]; then
    echo "✅ Page accessible (HTTP $PAGE_RESPONSE)"
    
    # Vérifier si le titre est présent
    if curl -s "http://localhost:3000/subscriptions" | grep -q "Nos Abonnements Streaming"; then
        echo "✅ Titre trouvé: 'Nos Abonnements Streaming'"
    else
        echo "⚠️  Titre non trouvé"
    fi
    
    # Vérifier la structure de la grille
    if curl -s "http://localhost:3000/subscriptions" | grep -q "grid-cols"; then
        echo "✅ Structure de grille trouvée"
    else
        echo "⚠️  Structure de grille non trouvée"
    fi
    
else
    echo "❌ Page inaccessible (HTTP $PAGE_RESPONSE)"
fi

echo ""
echo "🎉 Tests terminés !" 