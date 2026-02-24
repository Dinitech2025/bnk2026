#!/bin/bash

# Liste des sections à vérifier
sections=(
  "clients"
  "orders"
  "products/categories"
  "products/inventory"
  "products/imported"
  "services/categories"
  "streaming/platforms"
  "streaming/profiles"
  "streaming/offers"
  "streaming/accounts"
  "settings/general"
  "settings/employees"
)

# Supprimer les anciennes pages qui créent des conflits
for section in "${sections[@]}"; do
  old_page="app/admin/${section}/page.tsx"
  if [ -f "$old_page" ]; then
    echo "Suppression de $old_page"
    rm "$old_page"
  fi
done

# Vérifier que les nouvelles pages existent
for section in "${sections[@]}"; do
  new_page="app/(admin)/admin/${section}/page.tsx"
  if [ ! -f "$new_page" ]; then
    echo "ATTENTION: Page manquante dans la nouvelle structure: $new_page"
  fi
done 