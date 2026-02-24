const fs = require('fs');
const path = require('path');

function clearNextJSCache() {
  console.log('🧹 NETTOYAGE DU CACHE NEXT.JS');
  console.log('=============================');
  
  const cacheDir = path.join(__dirname, '..', '.next');
  
  try {
    if (fs.existsSync(cacheDir)) {
      console.log('📁 Dossier .next trouvé, suppression...');
      
      // Fonction récursive pour supprimer un dossier
      function deleteFolderRecursive(folderPath) {
        if (fs.existsSync(folderPath)) {
          fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              deleteFolderRecursive(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(folderPath);
        }
      }
      
      deleteFolderRecursive(cacheDir);
      console.log('✅ Cache Next.js supprimé avec succès');
    } else {
      console.log('ℹ️  Aucun cache Next.js trouvé');
    }
    
    console.log('');
    console.log('🔄 REDÉMARRAGE RECOMMANDÉ :');
    console.log('   1. Arrêtez le serveur Next.js (Ctrl+C)');
    console.log('   2. Relancez avec: npm run dev');
    console.log('   3. Les données seront maintenant en temps réel');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}

clearNextJSCache();

