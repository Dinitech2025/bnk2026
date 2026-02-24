const fs = require('fs');
const tesseract = require('node-tesseract-ocr');

async function extractionSimple() {
  console.log('🧪 TEST EXTRACTION SIMPLE');
  console.log('=========================');
  
  const pdfPath = 'C:/Users/OiliDINY/Downloads/500Ar2.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF non trouvé:', pdfPath);
    return;
  }
  
  console.log('📄 PDF trouvé:', pdfPath);
  
  try {
    // Configuration Tesseract simple
    const config = {
      lang: 'eng',
      oem: 1,
      psm: 6, // Uniform block of text
    };
    
    console.log('📖 Extraction de texte avec Tesseract...');
    const text = await tesseract.recognize(pdfPath, config);
    
    console.log('✅ Texte extrait. Longueur:', text.length);
    console.log('📋 Échantillon:', text.substring(0, 500));
    
    // Pattern pour tickets 500Ar (30m)
    const codePattern = /30m[A-Za-z0-9]{3,8}/g;
    const codes = text.match(codePattern) || [];
    const validCodes = codes.filter(code => code.length >= 6);
    
    console.log(`🎯 ${validCodes.length} codes trouvés`);
    if (validCodes.length > 0) {
      console.log('📋 Premiers codes:', validCodes.slice(0, 10).join(', '));
    }
    
    return validCodes;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Test avec PDF 1000Ar
async function testPDF1000() {
  console.log('\n🧪 TEST PDF 1000Ar');
  console.log('===================');
  
  const pdfPath = 'C:/Users/OiliDINY/Downloads/1000ar.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.log('⚠️ PDF 1000ar.pdf non trouvé, ignoré');
    return;
  }
  
  try {
    const config = {
      lang: 'eng',
      oem: 1,
      psm: 6,
    };
    
    console.log('📖 Extraction 1000Ar...');
    const text = await tesseract.recognize(pdfPath, config);
    
    // Pattern pour tickets 1000Ar (1h)
    const codePattern = /1h[A-Za-z0-9]{3,8}/g;
    const codes = text.match(codePattern) || [];
    const validCodes = codes.filter(code => code.length >= 5);
    
    console.log(`🎯 ${validCodes.length} codes 1000Ar trouvés`);
    if (validCodes.length > 0) {
      console.log('📋 Premiers codes 1000Ar:', validCodes.slice(0, 10).join(', '));
    }
    
    return validCodes;
    
  } catch (error) {
    console.error('❌ Erreur 1000Ar:', error.message);
  }
}

// Lancer les tests
async function main() {
  try {
    await extractionSimple(); // Test 500Ar
    await testPDF1000();      // Test 1000Ar
    
    console.log('\n✅ Tests terminés');
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

main(); 
 