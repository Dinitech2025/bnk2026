#!/bin/bash

# Supprimer les redirections dans la nouvelle structure
find app/\(admin\)/admin -type f -name "page.tsx" -exec sed -i 's/export default function Legacy.*Page()/export default function Page()/g' {} \;

# Créer les redirections manquantes dans l'ancienne structure
for section in platforms profiles offers accounts; do
  echo "import { redirect } from 'next/navigation'

export default function Legacy${section^}Page() {
  redirect('/admin/streaming/${section}')
}" > "app/admin/streaming/${section}/page.tsx"
done

# Corriger les redirections des settings
for section in general employees; do
  echo "import { redirect } from 'next/navigation'

export default function Legacy${section^}Page() {
  redirect('/admin/settings/${section}')
}" > "app/admin/settings/${section}/page.tsx"
done 