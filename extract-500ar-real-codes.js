const fs = require('fs');
const path = require('path');
const pdf2pic = require('pdf2pic');
const ocrSpaceApi = require('ocr-space-api-wrapper');

// Configuration
const PDF_FILE = 'pdfs/500Ar2.pdf'; // Changez le chemin selon votre PDF
const OUTPUT_FILE = 'extracted-500ar-codes.json';
const TEMP_DIR = 'temp';

// Patterns de codes basés uniquement sur la durée (plus flexible)
const CODE_PATTERNS = {
  1000: /1h[A-Za-z0-9]{3,8}/g,        // 1h + 3-8 caractères (capte 1h2G, 1h3G, 1h4G, etc.)
  500: /30m[A-Za-z0-9]{3,8}/g,        // 30m + 3-8 caractères (capte 30m1G, 30m2G, etc.)
  2000: /2h[A-Za-z0-9]{3,8}/g,        // 2h + 3-8 caractères (capte 2h3G, 2h4G, etc.)
  3000: /3h[A-Za-z0-9]{3,8}/g,        // 3h + 3-8 caractères
  4000: /4h[A-Za-z0-9]{3,8}/g,        // 4h + 3-8 caractères
  300: /20m[A-Za-z0-9]{3,8}/g,        // 20m + 3-8 caractères
  250: /15m[A-Za-z0-9]{3,8}/g,        // 15m + 3-8 caractères
  generic: /[A-Za-z0-9]{6,12}/g       // Pattern générique pour codes inconnus
};

async function extractCodesFromPDF(pdfPath, expectedPrice = 500) {
  console.log('🚀 Démarrage de l\'extraction OCR générique');
  console.log(`📄 Fichier PDF: ${pdfPath}`);
  console.log(`💰 Prix attendu: ${expectedPrice}Ar`);
  
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`❌ Fichier PDF non trouvé: ${pdfPath}`);
  }
  
  // Créer le dossier temporaire
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  
  try {
    // Étape 1: Convertir PDF en images
    console.log('🖼️ Conversion du PDF en images...');
    
    const convert = pdf2pic.fromPath(pdfPath, {
      density: 300,           // DPI pour la qualité
      saveFilename: `page`,
      savePath: TEMP_DIR,
      format: 'png',
      width: 2000,
      height: 2000
    });
    
    const results = await convert.bulk(-1); // Convertir toutes les pages
    console.log(`📸 ${results.length} images créées`);
    
    // Étape 2: OCR sur chaque image
    console.log('🔍 Extraction du texte par OCR...');
    
    const allCodes = [];
    const allText = [];
    const codePattern = CODE_PATTERNS[expectedPrice] || CODE_PATTERNS.generic;
    
    for (let i = 0; i < results.length; i++) {
      const imagePath = results[i].path;
      console.log(`\n📄 Page ${i + 1}/${results.length}: ${path.basename(imagePath)}`);
      
      try {
        // OCR avec OCR Space API
        const ocrResult = await ocrSpaceApi.ocrSpace(imagePath, {
          apiKey: process.env.OCR_SPACE_API_KEY || 'helloworld', // Clé gratuite
          language: 'eng',
          isOverlayRequired: false,
          detectOrientation: true,
          scale: true,
          isTable: false,
          OCREngine: 2
        });
        
        if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
          const pageText = ocrResult.ParsedResults[0].ParsedText;
          allText.push(`=== PAGE ${i + 1} ===\n${pageText}\n`);
          
          // Rechercher les codes avec le pattern spécifique
          const specificCodes = pageText.match(codePattern) || [];
          
          // Rechercher aussi avec des patterns alternatifs
          const alternativePatterns = [
            /[A-Za-z0-9]{8}/g,  // Codes de 8 caractères
            /[A-Za-z0-9]{6}/g,  // Codes de 6 caractères
            /[A-Z0-9]{6,10}/g   // Codes majuscules/chiffres
          ];
          
          let allMatches = [...specificCodes];
          for (const pattern of alternativePatterns) {
            const matches = pageText.match(pattern) || [];
            allMatches.push(...matches);
          }
          
          // Filtrer et nettoyer les codes
          const cleanCodes = allMatches
            .filter(code => code.length >= 5 && code.length <= 12)
            .filter(code => /[A-Za-z]/.test(code) && /[0-9]/.test(code)) // Au moins 1 lettre et 1 chiffre
            .map(code => code.trim())
            .filter(code => code.length > 0);
          
          if (cleanCodes.length > 0) {
            console.log(`✅ ${cleanCodes.length} codes potentiels trouvés`);
            console.log(`📋 Échantillon: ${cleanCodes.slice(0, 3).join(', ')}`);
            allCodes.push(...cleanCodes);
          } else {
            console.log('⚠️ Aucun code trouvé sur cette page');
          }
          
          // Afficher un échantillon du texte extrait
          console.log(`📝 Échantillon texte: ${pageText.substring(0, 100).replace(/\n/g, ' ')}...`);
          
        } else {
          console.log('❌ Échec OCR sur cette page');
        }
        
      } catch (ocrError) {
        console.error(`❌ Erreur OCR page ${i + 1}:`, ocrError.message);
      }
      
      // Nettoyer l'image temporaire
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.log(`⚠️ Impossible de supprimer: ${imagePath}`);
      }
      
      // Petite pause pour éviter la surcharge de l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Étape 3: Traitement des résultats
    console.log('\n🎯 Traitement des résultats...');
    
    // Dédupliquer les codes
    const uniqueCodes = [...new Set(allCodes)];
    
    // Analyser et filtrer les codes selon leur qualité
    const analyzedCodes = uniqueCodes.map(code => ({
      code,
      length: code.length,
      hasLetters: /[A-Za-z]/.test(code),
      hasNumbers: /[0-9]/.test(code),
      score: calculateCodeQuality(code, expectedPrice)
    }));
    
    // Trier par score de qualité
    analyzedCodes.sort((a, b) => b.score - a.score);
    
    // Filtrer les meilleurs codes
    const bestCodes = analyzedCodes
      .filter(item => item.score > 3)
      .map(item => item.code);
    
    console.log(`\n📊 Résultats d'extraction:`);
    console.log(`📄 Pages traitées: ${results.length}`);
    console.log(`🔍 Codes bruts trouvés: ${allCodes.length}`);
    console.log(`✨ Codes uniques: ${uniqueCodes.length}`);
    console.log(`🎯 Codes de qualité: ${bestCodes.length}`);
    
    // Sauvegarder les résultats
    const output = {
      metadata: {
        pdfFile: pdfPath,
        extractionDate: new Date().toISOString(),
        expectedPrice: expectedPrice,
        pagesProcessed: results.length,
        totalCodesFound: allCodes.length,
        uniqueCodes: uniqueCodes.length,
        qualityCodes: bestCodes.length
      },
      codes: bestCodes,
      allCodes: uniqueCodes,
      analyzedCodes: analyzedCodes.slice(0, 50), // Top 50 pour analyse
      extractedText: allText.join('\n')
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`💾 Résultats sauvegardés dans: ${OUTPUT_FILE}`);
    
    // Afficher les meilleurs codes
    console.log('\n🏆 Top 10 des meilleurs codes:');
    bestCodes.slice(0, 10).forEach((code, index) => {
      const analysis = analyzedCodes.find(item => item.code === code);
      console.log(`  ${index + 1}. ${code} (score: ${analysis.score})`);
    });
    
    return bestCodes;
    
  } catch (error) {
    console.error('❌ Erreur durant l\'extraction:', error);
    throw error;
  } finally {
    // Nettoyer le dossier temporaire
    try {
      if (fs.existsSync(TEMP_DIR)) {
        const files = fs.readdirSync(TEMP_DIR);
        files.forEach(file => {
          try {
            fs.unlinkSync(path.join(TEMP_DIR, file));
          } catch (err) {
            console.log(`⚠️ Impossible de supprimer: ${file}`);
          }
        });
      }
    } catch (cleanupError) {
      console.log('⚠️ Erreur lors du nettoyage:', cleanupError.message);
    }
  }
}

// Fonction pour calculer la qualité d'un code
function calculateCodeQuality(code, expectedPrice) {
  let score = 0;
  
  // Longueur appropriée
  if (code.length >= 6 && code.length <= 10) score += 2;
  else if (code.length >= 5 && code.length <= 12) score += 1;
  
  // Contient lettres et chiffres
  if (/[A-Za-z]/.test(code)) score += 1;
  if (/[0-9]/.test(code)) score += 1;
  
  // Patterns spécifiques basés sur la durée (plus flexible)
  switch (expectedPrice) {
    case 1000:
      if (code.startsWith('1h')) score += 2;
      break;
    case 500:
      if (code.startsWith('30m')) score += 2;
      break;
    case 2000:
      if (code.startsWith('2h')) score += 2;
      break;
    case 3000:
      if (code.startsWith('3h')) score += 2;
      break;
    case 4000:
      if (code.startsWith('4h')) score += 2;
      break;
    case 300:
      if (code.startsWith('20m')) score += 2;
      break;
    case 250:
      if (code.startsWith('15m')) score += 2;
      break;
  }
  
  // Bonus pour les patterns de données courantes (mais pas obligatoire)
  if (code.includes('1G') || code.includes('2G') || code.includes('3G') || 
      code.includes('4G') || code.includes('5G')) score += 1;
  
  // Éviter les codes trop répétitifs
  if (!/(.)\1{3,}/.test(code)) score += 1; // Pas plus de 3 caractères identiques consécutifs
  
  // Bonus pour la diversité des caractères
  const uniqueChars = new Set(code.split('')).size;
  if (uniqueChars >= code.length * 0.6) score += 1;
  
  return score;
}

// Exécution principale
async function main() {
  try {
    console.log('🔧 Extracteur OCR générique pour tickets PDF');
    console.log('='* 50);
    
    // Vérifier les dépendances
    console.log('📦 Vérification des dépendances...');
    
    if (!fs.existsSync('node_modules/pdf2pic')) {
      console.log('⚠️ pdf2pic non installé. Installation...');
      console.log('   npm install pdf2pic');
    }
    
    if (!fs.existsSync('node_modules/ocr-space-api-wrapper')) {
      console.log('⚠️ ocr-space-api-wrapper non installé. Installation...');
      console.log('   npm install ocr-space-api-wrapper');
    }
    
    // Lancer l'extraction
    const codes = await extractCodesFromPDF(PDF_FILE, 500);
    
    console.log('\n🎉 Extraction terminée avec succès!');
    console.log(`✅ ${codes.length} codes de qualité extraits`);
    
    if (codes.length > 0) {
      console.log('\n💡 Prochaines étapes:');
      console.log('1. Vérifiez les codes dans le fichier JSON généré');
      console.log('2. Intégrez les codes valides dans votre API');
      console.log('3. Testez l\'import avec ces codes réels');
    }
    
  } catch (error) {
    console.error('\n💥 Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Lancer le script si exécuté directement
if (require.main === module) {
  main();
}

module.exports = { extractCodesFromPDF, calculateCodeQuality };