#!/bin/bash

# Fonction pour normaliser le nom de la fonction dans un fichier
normalize_function_name() {
  local file=$1
  local section=$2
  local type=$3

  # Déterminer le nom de la fonction
  local function_name
  case $type in
    "main")
      function_name="${section^}Page"
      ;;
    "add")
      function_name="Add${section^}Page"
      ;;
    "edit")
      function_name="Edit${section^}Page"
      ;;
    "detail")
      function_name="${section^}DetailPage"
      ;;
    *)
      function_name="${type^}${section^}Page"
      ;;
  esac

  # Remplacer le nom de la fonction
  sed -i "s/export default function Page()/export default function $function_name()/g" "$file"
  sed -i "s/export default function Legacy.*Page()/export default function $function_name()/g" "$file"
}

echo "Correction des noms de fonctions..."

# Sections principales
declare -A sections=(
  ["clients"]="Client"
  ["orders"]="Order"
  ["products/categories"]="ProductCategory"
  ["products/inventory"]="ProductInventory"
  ["products/imported"]="ImportedProduct"
  ["services/categories"]="ServiceCategory"
  ["streaming/platforms"]="Platform"
  ["streaming/profiles"]="Profile"
  ["streaming/offers"]="Offer"
  ["streaming/accounts"]="Account"
  ["streaming/subscriptions"]="Subscription"
  ["settings/general"]="GeneralSetting"
  ["settings/employees"]="Employee"
)

# Parcourir toutes les sections
for section_path in "${!sections[@]}"; do
  section=${sections[$section_path]}
  base_path="app/(admin)/admin/$section_path"

  # Page principale
  if [ -f "$base_path/page.tsx" ]; then
    normalize_function_name "$base_path/page.tsx" "$section" "main"
  fi

  # Pages d'ajout
  if [ -f "$base_path/add/page.tsx" ]; then
    normalize_function_name "$base_path/add/page.tsx" "$section" "add"
  fi
  if [ -f "$base_path/new/page.tsx" ]; then
    normalize_function_name "$base_path/new/page.tsx" "$section" "add"
  fi

  # Pages de détail et d'édition
  if [ -f "$base_path/[id]/page.tsx" ]; then
    normalize_function_name "$base_path/[id]/page.tsx" "$section" "detail"
  fi
  if [ -f "$base_path/[id]/edit/page.tsx" ]; then
    normalize_function_name "$base_path/[id]/edit/page.tsx" "$section" "edit"
  fi
done

echo "Correction terminée !" 