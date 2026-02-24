const fs = require('fs');
const path = require('path');
const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');

// Configuration OCR optimisée (identique à l'API)
const API_KEY_OCR = 'K86617027088957';

async function testExtractionTempsReel() {
  console.log('🧪 TEST EXTRACTION OCR EN TEMPS RÉEL');
  console.log('=====================================');
  
  const pdfPath = 'C:/Users/OiliDINY/Downloads/500Ar2.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF non trouvé:', pdfPath);
    return;
  }
  
  console.log('📄 PDF trouvé:', pdfPath);
  console.log('📊 Taille:', fs.statSync(pdfPath).size, 'bytes');
  
  try {
    // Créer le répertoire temporaire
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Configuration de conversion optimisée (identique à l'API)
    const options = {
      format: 'png',
      out_dir: tempDir,
      out_prefix: `test_extraction_${Date.now()}`,
      page: null,  // Toutes les pages
      density: 900,   // Résolution maximale
      width: 7650,    // Largeur optimale
      height: 9900    // Hauteur optimale
    };
    
    console.log('🖼️ Conversion PDF en images haute résolution...');
    await pdf.convert(pdfPath, options);
    
    // Trouver les images générées
    const tempFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(options.out_prefix));
    console.log(`📸 ${tempFiles.length} images générées`);
    
    const allCodes = [];
    const uniqueCodes = new Set();
    
    // Configuration OCR optimale (identique à l'API)
    const configOptimale = {
      apiKey: API_KEY_OCR,
      language: 'eng',
      isOverlayRequired: false,
      detectOrientation: true,
      scale: true,
      isTable: true,  // Mode tableau optimal
      OCREngine: 2    // Moteur 2 qui donne les meilleurs résultats
    };
    
    // Pattern pour tickets 500Ar (30m)
    const codePattern = /30m[A-Za-z0-9]{3,8}/g;
    console.log('🔍 Pattern utilisé:', codePattern);
    
    // OCR page par page avec configuration optimisée
    for (let i = 0; i < tempFiles.length; i++) {
      const imagePath = path.join(tempDir, tempFiles[i]);
      const pageNum = i + 1;
      
      console.log(`🔍 OCR Page ${pageNum}/${tempFiles.length}:`);
      
      try {
        const ocrResult = await ocrSpace(imagePath, configOptimale);
        
        if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
          const text = ocrResult.ParsedResults[0].ParsedText;
          
          // Extraire les codes avec le pattern adaptatif
          const codes = text.match(codePattern) || [];
          const validCodes = codes.filter(code => code.length >= 6);
          
          // Ajouter seulement les codes uniques
          validCodes.forEach(code => {
            if (!uniqueCodes.has(code)) {
              uniqueCodes.add(code);
              allCodes.push(code);
            }
          });
          
          console.log(`   📱 ${validCodes.length} codes extraits (${allCodes.length} total uniques)`);
          
          if (validCodes.length > 0) {
            console.log(`   📋 Échantillon: ${validCodes.slice(0, 3).join(', ')}`);
          }
        }
        
        // Pause entre les pages pour éviter les limitations de taux
        if (i < tempFiles.length - 1) {
          console.log('   ⏳ Pause 2s...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (ocrError) {
        console.error(`   ❌ Erreur OCR page ${pageNum}:`, ocrError.message);
      }
      
      // Nettoyer l'image immédiatement après traitement
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.warn(`   ⚠️ Nettoyage impossible: ${imagePath}`);
      }
    }
    
    console.log('\n🎯 RÉSULTATS FINAUX:');
    console.log('====================');
    console.log(`✅ ${allCodes.length} codes uniques extraits`);
    console.log(`📊 Taux de réussite estimé: ${((allCodes.length / 321) * 100).toFixed(1)}%`);
    
    if (allCodes.length > 0) {
      console.log(`📋 Premiers codes: ${allCodes.slice(0, 10).join(', ')}`);
      console.log(`📋 Derniers codes: ${allCodes.slice(-5).join(', ')}`);
      
      // Sauvegarder les codes extraits
      const outputFile = `codes_extraits_${Date.now()}.json`;
      fs.writeFileSync(outputFile, JSON.stringify({
        filename: '500Ar2.pdf',
        totalCodes: allCodes.length,
        extractedAt: new Date().toISOString(),
        codes: allCodes
      }, null, 2));
      
      console.log(`💾 Codes sauvegardés dans: ${outputFile}`);
    }
    
    console.log('\n✅ Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Lancer le test
testExtractionTempsReel().catch(console.error); 
 