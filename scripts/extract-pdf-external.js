const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extractPDFCodes(pdfPath, price = 1000) {
  console.log(`🔍 Extraction des codes depuis: ${pdfPath}`);
  console.log(`💰 Prix détecté: ${price}Ar`);

  try {
    // Configuration pdf-poppler
    const options = {
      format: 'png',
      out_dir: path.dirname(pdfPath),
      out_prefix: `page_${Date.now()}`,
      page: null // Toutes les pages
    };

    // Convertir PDF en images
    console.log('🖼️ Conversion PDF en images...');
    const imageFiles = await pdf.convert(pdfPath, options);
    console.log(`📸 ${imageFiles.length} images générées`);

    // Configuration OCR
    const configOCR = {
      apiKey: API_KEY_OCR,
      language: 'eng',
      isOverlayRequired: false,
      detectOrientation: true,
      scale: true,
      isTable: true,
      OCREngine: "2"
    };

    // Pattern adaptatif selon le prix
    const codePattern = getCodePatternForPrice(price);
    console.log(`🔍 Pattern utilisé: ${codePattern}`);

    const allCodes = [];
    const uniqueCodes = new Set();

    // Traiter chaque image
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      const pageNum = i + 1;
      
      console.log(`🔍 OCR Page ${pageNum}/${imageFiles.length}:`);
      
      try {
        const imagePath = path.join(path.dirname(pdfPath), imageFile.name);
        
        // Vérifier la taille
        const stats = fs.statSync(imagePath);
        const fileSizeKB = stats.size / 1024;
        console.log(`   📄 Taille: ${fileSizeKB.toFixed(0)} KB`);
        
        if (fileSizeKB > 1000) {
          console.log(`   ⚠️ Image trop grande, ignorée`);
          continue;
        }
        
        // OCR de cette image
        const ocrResult = await ocrSpace(imagePath, configOCR);
        
        if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
          const text = ocrResult.ParsedResults[0].ParsedText;
          
          // Extraire les codes
          const codes = extractCodesFromText(text, codePattern);
          
          // Ajouter seulement les codes uniques
          codes.forEach(code => {
            if (!uniqueCodes.has(code)) {
              uniqueCodes.add(code);
              allCodes.push(code);
            }
          });
          
          console.log(`   📱 ${codes.length} codes (${allCodes.length} total)`);
        } else {
          console.log(`   ⚠️ Aucun texte page ${pageNum}`);
        }
        
        // Nettoyage image
        try {
          fs.unlinkSync(imagePath);
        } catch (cleanupError) {
          console.warn(`   ⚠️ Nettoyage ${imageFile.name} impossible`);
        }
        
        // Pause entre pages
        if (i < imageFiles.length - 1) {
          console.log('   ⏳ Pause 2s...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (pageError) {
        console.error(`   ❌ Erreur page ${pageNum}:`, pageError.message);
      }
    }

    console.log(`🎯 EXTRACTION TERMINÉE:`);
    console.log(`✅ ${allCodes.length} codes uniques extraits`);
    
    if (allCodes.length > 0) {
      console.log(`📋 Échantillon: ${allCodes.slice(0, 5).join(', ')}...`);
    }
    
    return allCodes;
    
  } catch (error) {
    console.error('❌ Erreur extraction:', error);
    throw error;
  }
}

function getCodePatternForPrice(price) {
  switch (price) {
    case 1000:
      return /1h[A-Za-z0-9]{3,8}/g;
    case 500:
      return /30m[A-Za-z0-9]{3,8}/g;
    case 2000:
      return /2h[A-Za-z0-9]{3,8}/g;
    case 3000:
      return /3h[A-Za-z0-9]{3,8}/g;
    case 4000:
      return /4h[A-Za-z0-9]{3,8}/g;
    case 300:
      return /20m[A-Za-z0-9]{3,8}/g;
    case 250:
      return /15m[A-Za-z0-9]{3,8}/g;
    default:
      return /\b[A-Za-z0-9]{4,10}\b/g;
  }
}

function extractCodesFromText(text, pattern) {
  if (!text || !pattern) return [];
  
  const matches = text.match(pattern);
  return matches ? matches.filter(code => code.length >= 4) : [];
}

// Export pour utilisation en module ou direct
if (require.main === module) {
  // Utilisation directe depuis ligne de commande
  const pdfPath = process.argv[2];
  const price = parseInt(process.argv[3]) || 1000;
  
  if (!pdfPath) {
    console.error('Usage: node extract-pdf-external.js <pdf_path> [price]');
    process.exit(1);
  }
  
  extractPDFCodes(pdfPath, price)
    .then(codes => {
      console.log('\n🎯 RÉSULTATS FINAUX:');
      console.log(`Total: ${codes.length} codes`);
      console.log('Codes:', JSON.stringify(codes, null, 2));
    })
    .catch(error => {
      console.error('❌ Erreur:', error.message);
      process.exit(1);
    });
} else {
  // Export pour utilisation en module
  module.exports = { extractPDFCodes };
} 
 