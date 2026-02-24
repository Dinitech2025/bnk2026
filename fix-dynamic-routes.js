#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Liste des routes à corriger
const routes = [
  'app/api/admin/services/route.ts',
  'app/api/admin/quotes/route.ts', 
  'app/api/admin/products/route.ts',
  'app/api/admin/streaming/accounts/available/route.ts',
  'app/api/admin/streaming/profiles/route.ts',
  'app/api/cybercafe/codes/route.ts',
  'app/api/debug/auth-test/route.ts',
  'app/api/public/products/route.ts',
  'app/api/public/services/route.ts'
];

function addDynamicExport(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier si déjà présent
  if (content.includes('export const dynamic')) {
    console.log(`✅ Déjà configuré: ${filePath}`);
    return;
  }

  // Trouver la dernière ligne d'import
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith('} from ')) {
      lastImportIndex = i;
    }
  }

  // Insérer après les imports
  const insertIndex = lastImportIndex + 1;
  lines.splice(insertIndex, 0, '', '// Force dynamic rendering for authentication routes', 'export const dynamic = \'force-dynamic\'');
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  console.log(`✅ Corrigé: ${filePath}`);
}

console.log('🔧 Correction des routes API pour le build...\n');

// Corriger les routes spécifiques qui causent des erreurs
routes.forEach(route => {
  addDynamicExport(route);
});

console.log('\n✅ Correction terminée !');
