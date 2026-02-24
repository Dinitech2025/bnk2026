#!/bin/bash

# Fonction pour créer un fichier de redirection
create_redirect() {
  local old_path=$1
  local new_path=$2
  echo "import { redirect } from 'next/navigation'

export default function Legacy${3}Page() {
  redirect('${new_path}')
}" > "$old_path"
}

# Streaming
for section in platforms profiles offers accounts; do
  # Pages principales
  mkdir -p "app/(admin)/admin/streaming/$section"
  cp -r "app/admin/streaming/$section/"* "app/(admin)/admin/streaming/$section/"
  
  # Pages dynamiques [id]
  if [ -d "app/admin/streaming/$section/[id]" ]; then
    mkdir -p "app/(admin)/admin/streaming/$section/[id]"
    cp -r "app/admin/streaming/$section/[id]/"* "app/(admin)/admin/streaming/$section/[id]/"
  fi
  
  # Pages d'ajout
  if [ -d "app/admin/streaming/$section/add" ]; then
    mkdir -p "app/(admin)/admin/streaming/$section/add"
    cp -r "app/admin/streaming/$section/add/"* "app/(admin)/admin/streaming/$section/add/"
  fi
  
  # Pages d'édition
  if [ -d "app/admin/streaming/$section/edit" ]; then
    mkdir -p "app/(admin)/admin/streaming/$section/edit"
    cp -r "app/admin/streaming/$section/edit/"* "app/(admin)/admin/streaming/$section/edit/"
  fi
done

# Settings
for section in general employees; do
  mkdir -p "app/(admin)/admin/settings/$section"
  cp -r "app/admin/settings/$section/"* "app/(admin)/admin/settings/$section/"
  create_redirect "app/admin/settings/$section/page.tsx" "/admin/settings/$section" "${section^}"
done

# Services
mkdir -p "app/(admin)/admin/services/categories"
cp -r "app/admin/services/categories/"* "app/(admin)/admin/services/categories/"
create_redirect "app/admin/services/categories/page.tsx" "/admin/services/categories" "ServiceCategories" 