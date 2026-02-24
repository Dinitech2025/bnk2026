const ocrSpaceApi = require('ocr-space-api-wrapper');
const pdf2pic = require("pdf2pic");
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extractCodes500Ar() {
    console.log('🧪 Test d\'extraction PDF 500Ar2.pdf');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Fichier PDF non trouvé:', pdfPath);
        return;
    }
    
    console.log('📄 Fichier trouvé:', pdfPath);
    const stats = fs.statSync(pdfPath);
    console.log('📊 Taille:', stats.size, 'bytes');
    
    try {
        // Conversion PDF en images
        console.log('🖼️ Conversion PDF → images...');
        const convert = pdf2pic.fromPath(pdfPath, {
            density: 300,
            saveFilename: "test-500ar",
            savePath: "./temp/",
            format: "png",
            width: 2550,
            height: 3300
        });
        
        const results = await convert.bulk(-1, { responseType: "image" });
        console.log(`✅ ${results.length} pages converties`);
        
        let allCodes = [];
        
        // OCR sur chaque page
        for (let i = 0; i < Math.min(results.length, 3); i++) { // Limiter à 3 pages pour test
            console.log(`\n🔍 OCR Page ${i + 1}/${results.length}...`);
            
            const imagePath = results[i].path;
            
            const ocrResult = await ocrSpaceApi.parseImageFromLocalFile({
                apikey: API_KEY_OCR,
                localFile: imagePath,
                language: 'eng',
                isOverlayRequired: false,
                detectOrientation: true,
                scale: true,
                isTable: false,
                OCREngine: 2
            });
            
            if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
                const text = ocrResult.ParsedResults[0].ParsedText;
                console.log(`📝 Texte extrait (${text.length} caractères)`);
                
                // Patterns flexibles pour 500Ar (30min)
                const patterns = [
                    /30m[A-Za-z0-9]{3,8}/g,    // 30m + codes flexibles
                    /30min[A-Za-z0-9]{3,8}/g,  // 30min + codes flexibles  
                    /500[A-Za-z0-9]{4,8}/g,    // 500 + codes
                ];
                
                patterns.forEach((pattern, idx) => {
                    const matches = text.match(pattern);
                    if (matches) {
                        console.log(`🎯 Pattern ${idx + 1} trouvé: ${matches.length} codes`);
                        console.log('📋 Exemples:', matches.slice(0, 5));
                        allCodes = [...allCodes, ...matches];
                    }
                });
            }
        }
        
        // Suppression des doublons
        const uniqueCodes = [...new Set(allCodes)];
        
        console.log(`\n📊 RÉSULTATS D'EXTRACTION:`);
        console.log(`🎫 Codes bruts trouvés: ${allCodes.length}`);
        console.log(`✨ Codes uniques: ${uniqueCodes.length}`);
        
        if (uniqueCodes.length > 0) {
            console.log('\n🎯 Échantillon de codes extraits:');
            uniqueCodes.slice(0, 10).forEach((code, i) => {
                console.log(`  ${i + 1}. ${code}`);
            });
        }
        
        // Nettoyage des fichiers temporaires
        console.log('\n🧹 Nettoyage des fichiers temporaires...');
        if (fs.existsSync('./temp/')) {
            const tempFiles = fs.readdirSync('./temp/');
            tempFiles.forEach(file => {
                if (file.startsWith('test-500ar')) {
                    fs.unlinkSync(path.join('./temp/', file));
                }
            });
        }
        
        return uniqueCodes;
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return [];
    }
}

// Lancement du test
extractCodes500Ar()
    .then(codes => {
        console.log(`\n🏁 EXTRACTION TERMINÉE: ${codes?.length || 0} codes extraits`);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 