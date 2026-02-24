#!/bin/bash

# Liste des fichiers à mettre à jour
files=(
  "app/metadata.ts"
  "app/api/settings/route.ts"
  "app/admin/clients/page.tsx"
  "app/admin/clients/[id]/page.tsx"
  "app/api/auth/register/route.ts"
  "app/api/profile/addresses/[id]/route.ts"
  "app/api/admin/settings/general/route.ts"
  "app/api/admin/streaming/platforms/[id]/route.ts"
  "app/api/admin/streaming/offers/[id]/route.ts"
  "app/api/profile/addresses/route.ts"
  "app/api/admin/streaming/platforms/route.ts"
  "app/api/admin/offers/[id]/route.ts"
  "app/api/admin/employees/route.ts"
  "app/api/admin/offers/route.ts"
  "app/api/admin/employees/[id]/route.ts"
  "app/api/admin/clients/[id]/route.ts"
  "app/api/admin/clients/[id]/addresses/[addressId]/route.ts"
  "app/api/admin/clients/route.ts"
  "app/api/admin/clients/[id]/addresses/route.ts"
  "app/api/admin/streaming/offers/[id]/route.ts"
  "app/api/admin/streaming/platforms/route.ts"
)

# Pour chaque fichier
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Remplacer les importations
    sed -i 's|import { db } from '"'"'@/lib/db'"'"'|import { prisma } from '"'"'@/lib/prisma'"'"'|g' "$file"
    sed -i 's|import prisma from "@/lib/db"|import { prisma } from '"'"'@/lib/prisma'"'"'|g' "$file"
    
    # Remplacer les utilisations de db par prisma
    sed -i 's|db\.|prisma.|g' "$file"
  fi
done 