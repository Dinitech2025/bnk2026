#!/bin/bash

# Créer les dossiers nécessaires dans la nouvelle structure
mkdir -p app/\(admin\)/admin/clients/new
mkdir -p app/\(admin\)/admin/clients/\[id\]/edit

# Copier les fichiers
echo "Migration des fichiers clients..."

# Page nouveau client
if [ -d "app/admin/clients/new" ]; then
  cp -r app/admin/clients/new/* app/\(admin\)/admin/clients/new/
  echo "✓ Page nouveau client migrée"
fi

# Page détails client
if [ -f "app/admin/clients/[id]/page.tsx" ]; then
  cp app/admin/clients/\[id\]/page.tsx app/\(admin\)/admin/clients/\[id\]/
  echo "✓ Page détails client migrée"
fi

# Page édition client
if [ -d "app/admin/clients/[id]/edit" ]; then
  cp -r app/admin/clients/\[id\]/edit/* app/\(admin\)/admin/clients/\[id\]/edit/
  echo "✓ Page édition client migrée"
fi

echo "Migration terminée !" 