const ocrSpaceApi = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extractCodes500ArWithPoppler() {
    console.log('🧪 Test d\'extraction PDF 500Ar2.pdf avec pdf-poppler');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Fichier PDF non trouvé:', pdfPath);
        return;
    }
    
    console.log('📄 Fichier trouvé:', pdfPath);
    const stats = fs.statSync(pdfPath);
    console.log('📊 Taille:', stats.size, 'bytes');
    
    try {
        // Configuration de conversion
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'test500ar',
            page: null // Toutes les pages
        };
        
        // Conversion PDF en images avec pdf-poppler
        console.log('🖼️ Conversion PDF → images avec pdf-poppler...');
        const results = await pdf.convert(pdfPath, options);
        console.log(`✅ Conversion réussie`);
        
        // Lister les fichiers générés
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('test500ar'));
        console.log(`📸 ${tempFiles.length} images générées`);
        
        let allCodes = [];
        
        // OCR sur les premières pages (limiter pour test)
        const pagesToProcess = Math.min(tempFiles.length, 3);
        
        for (let i = 0; i < pagesToProcess; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            console.log(`\n🔍 OCR sur ${tempFiles[i]}...`);
            
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
                console.log(`📝 Texte extrait: ${text.length} caractères`);
                
                // Patterns flexibles pour 500Ar (30min)
                const patterns = [
                    { name: '30m flexible', regex: /30m[A-Za-z0-9]{3,8}/g },
                    { name: '30min flexible', regex: /30min[A-Za-z0-9]{3,8}/g },
                    { name: '500 + codes', regex: /500[A-Za-z0-9]{4,8}/g },
                    { name: 'Codes alphanumériques', regex: /[A-Za-z0-9]{8,12}/g }
                ];
                
                patterns.forEach((pattern) => {
                    const matches = text.match(pattern.regex);
                    if (matches && matches.length > 0) {
                        console.log(`🎯 ${pattern.name}: ${matches.length} trouvés`);
                        console.log('📋 Échantillon:', matches.slice(0, 3));
                        allCodes = [...allCodes, ...matches];
                    }
                });
                
                // Afficher un échantillon du texte OCR pour débogage
                if (text.length > 0) {
                    console.log('📖 Échantillon OCR:', text.substring(0, 200) + '...');
                }
            } else {
                console.log('❌ Échec OCR sur cette page');
            }
        }
        
        // Suppression des doublons
        const uniqueCodes = [...new Set(allCodes)];
        
        console.log(`\n📊 RÉSULTATS D'EXTRACTION:`);
        console.log(`🎫 Codes bruts trouvés: ${allCodes.length}`);
        console.log(`✨ Codes uniques: ${uniqueCodes.length}`);
        
        if (uniqueCodes.length > 0) {
            console.log('\n🎯 Codes extraits:');
            uniqueCodes.slice(0, 15).forEach((code, i) => {
                console.log(`  ${i + 1}. ${code}`);
            });
            
            if (uniqueCodes.length > 15) {
                console.log(`  ... et ${uniqueCodes.length - 15} autres codes`);
            }
        }
        
        // Nettoyage des fichiers temporaires
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {
                // Ignore les erreurs de suppression
            }
        });
        
        return uniqueCodes;
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return [];
    }
}

// Lancement du test
extractCodes500ArWithPoppler()
    .then(codes => {
        console.log(`\n🏁 EXTRACTION TERMINÉE: ${codes?.length || 0} codes extraits du PDF 500Ar2.pdf`);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 