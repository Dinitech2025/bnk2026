#!/bin/bash

# Fonction pour migrer un dossier et ses sous-dossiers
migrate_section() {
  local section=$1
  local base_path=$2
  echo "Migration de la section: $section"

  # Créer le dossier de base dans la nouvelle structure
  mkdir -p "app/(admin)/admin/$base_path"

  # Migrer la page principale si elle existe
  if [ -f "app/admin/$base_path/page.tsx" ]; then
    cp "app/admin/$base_path/page.tsx" "app/(admin)/admin/$base_path/"
    echo "✓ Page principale migrée: $base_path"
  fi

  # Migrer les sous-dossiers new et add
  for dir in new add; do
    if [ -d "app/admin/$base_path/$dir" ]; then
      mkdir -p "app/(admin)/admin/$base_path/$dir"
      cp -r "app/admin/$base_path/$dir/"* "app/(admin)/admin/$base_path/$dir/"
      echo "✓ Dossier $dir migré: $base_path/$dir"
    fi
  done

  # Migrer les pages dynamiques [id]
  if [ -d "app/admin/$base_path/[id]" ]; then
    mkdir -p "app/(admin)/admin/$base_path/[id]"
    cp -r "app/admin/$base_path/[id]/"* "app/(admin)/admin/$base_path/[id]/"
    echo "✓ Pages dynamiques [id] migrées: $base_path/[id]"

    # Migrer le dossier edit dans [id] s'il existe
    if [ -d "app/admin/$base_path/[id]/edit" ]; then
      mkdir -p "app/(admin)/admin/$base_path/[id]/edit"
      cp -r "app/admin/$base_path/[id]/edit/"* "app/(admin)/admin/$base_path/[id]/edit/"
      echo "✓ Pages d'édition migrées: $base_path/[id]/edit"
    fi
  fi

  # Migrer les autres sous-dossiers spéciaux (debug, etc.)
  for special_dir in debug import export stats; do
    if [ -d "app/admin/$base_path/$special_dir" ]; then
      mkdir -p "app/(admin)/admin/$base_path/$special_dir"
      cp -r "app/admin/$base_path/$special_dir/"* "app/(admin)/admin/$base_path/$special_dir/"
      echo "✓ Dossier spécial $special_dir migré: $base_path/$special_dir"
    fi
  done
}

echo "Début de la migration complète..."

# Sections principales
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
  "streaming/subscriptions"
  "settings/general"
  "settings/employees"
)

# Migrer chaque section
for section in "${sections[@]}"; do
  migrate_section "$section" "$section"
done

echo "Migration terminée !"

# Vérification finale
echo -e "\nVérification des dossiers migrés :"
for section in "${sections[@]}"; do
  if [ -d "app/(admin)/admin/$section" ]; then
    echo "✓ $section"
  else
    echo "⚠ $section non trouvé dans la nouvelle structure"
  fi
done 