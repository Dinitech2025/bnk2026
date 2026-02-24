#!/bin/bash

# Liste des fichiers à mettre à jour
files=(
  "app/api/profile/addresses/[id]/route.ts"
  "app/api/upload/route.ts"
  "app/api/profile/addresses/route.ts"
  "app/api/admin/upload/route.ts"
  "app/api/admin/settings/general/route.ts"
  "app/api/admin/streaming/platforms/[id]/route.ts"
  "app/api/admin/streaming/offers/[id]/route.ts"
  "app/api/admin/streaming/platforms/route.ts"
  "app/api/admin/employees/route.ts"
  "app/api/admin/employees/[id]/route.ts"
  "app/api/admin/clients/route.ts"
  "app/api/admin/clients/[id]/route.ts"
  "app/api/admin/clients/[id]/addresses/route.ts"
  "app/api/admin/clients/[id]/addresses/[addressId]/route.ts"
)

# Pour chaque fichier
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Remplacer l'ancien import par le nouveau
    sed -i 's|import { authOptions } from '"'"'@/app/api/auth/\[...nextauth\]/route'"'"'|import { authOptions } from '"'"'@/lib/auth'"'"'|g' "$file"
    echo "Updated $file"
  fi
done 