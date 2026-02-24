const fs = require('fs');
const { ocrSpace } = require('ocr-space-api-wrapper');

async function testOCRDirect() {
  console.log('🧪 TEST OCR DIRECT');
  console.log('==================');
  
  const pdfPath = 'C:/Users/OiliDINY/Downloads/500Ar2.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF non trouvé:', pdfPath);
    return;
  }
  
  console.log('📄 PDF trouvé:', pdfPath);
  
  try {
    // Configuration OCR.space simple
    const config = {
      apiKey: 'K86617027088957',
      language: 'eng',
      isOverlayRequired: false,
      detectOrientation: true,
      scale: true,
      isTable: false,
      OCREngine: 2
    };
    
    console.log('🌐 Envoi du PDF à OCR.space...');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const result = await ocrSpace(pdfBuffer, config);
    
    if (result && result.ParsedResults && result.ParsedResults[0]) {
      const text = result.ParsedResults[0].ParsedText;
      console.log('✅ Texte extrait. Longueur:', text.length);
      console.log('📋 Échantillon (100 premiers caractères):');
      console.log(text.substring(0, 100));
      
      // Pattern pour tickets 500Ar (30m)
      const codePattern = /30m[A-Za-z0-9]{3,8}/g;
      const codes = text.match(codePattern) || [];
      const validCodes = codes.filter(code => code.length >= 6);
      
      console.log(`🎯 ${validCodes.length} codes trouvés`);
      if (validCodes.length > 0) {
        console.log('📋 Premiers codes:', validCodes.slice(0, 10).join(', '));
      }
      
      // Essayer aussi des patterns plus larges
      console.log('\n🔍 Recherche patterns larges...');
      const allPatterns = [
        /30m[A-Za-z0-9]+/g,
        /[0-9]+m[A-Za-z0-9]+/g,
        /[A-Za-z0-9]{6,}/g
      ];
      
      allPatterns.forEach((pattern, i) => {
        const matches = text.match(pattern) || [];
        console.log(`Pattern ${i+1}: ${matches.length} matches`);
        if (matches.length > 0 && matches.length < 50) {
          console.log(`  Échantillon: ${matches.slice(0, 5).join(', ')}`);
        }
      });
      
      return validCodes;
      
    } else {
      console.log('❌ Aucun texte extrait');
      console.log('Réponse complète:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur OCR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test avec PDF 1000Ar pour comparaison
async function testPDF1000Direct() {
  console.log('\n🧪 TEST PDF 1000Ar DIRECT');
  console.log('==========================');
  
  const pdfPath = 'C:/Users/OiliDINY/Downloads/1000ar.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.log('⚠️ PDF 1000ar.pdf non trouvé');
    return;
  }
  
  try {
    const config = {
      apiKey: 'K86617027088957',
      language: 'eng',
      isOverlayRequired: false,
      detectOrientation: true,
      scale: true,
      isTable: false,
      OCREngine: 2
    };
    
    console.log('🌐 Envoi PDF 1000Ar à OCR.space...');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const result = await ocrSpace(pdfBuffer, config);
    
    if (result && result.ParsedResults && result.ParsedResults[0]) {
      const text = result.ParsedResults[0].ParsedText;
      console.log('✅ Texte 1000Ar extrait. Longueur:', text.length);
      
      // Pattern pour tickets 1000Ar (1h)
      const codePattern = /1h[A-Za-z0-9]{3,8}/g;
      const codes = text.match(codePattern) || [];
      const validCodes = codes.filter(code => code.length >= 5);
      
      console.log(`🎯 ${validCodes.length} codes 1000Ar trouvés`);
      if (validCodes.length > 0) {
        console.log('📋 Premiers codes 1000Ar:', validCodes.slice(0, 10).join(', '));
      }
      
      return validCodes;
      
    } else {
      console.log('❌ Aucun texte 1000Ar extrait');
    }
    
  } catch (error) {
    console.error('❌ Erreur OCR 1000Ar:', error.message);
  }
}

async function main() {
  try {
    await testOCRDirect();     // Test 500Ar
    await testPDF1000Direct(); // Test 1000Ar
    
    console.log('\n✅ Tests OCR directs terminés');
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

main(); 