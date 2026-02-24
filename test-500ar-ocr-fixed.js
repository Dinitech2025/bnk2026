const OCRSpaceApi = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extractCodes500ArFixed() {
    console.log('🧪 Test extraction PDF 500Ar2.pdf avec OCR corrigé');
    
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
            out_prefix: 'test500ar-fixed',
            page: null // Toutes les pages
        };
        
        // Conversion PDF en images
        console.log('🖼️ Conversion PDF → images...');
        await pdf.convert(pdfPath, options);
        console.log(`✅ Conversion terminée`);
        
        // Lister les fichiers générés
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('test500ar-fixed'));
        console.log(`📸 ${tempFiles.length} images générées`);
        
        let allCodes = [];
        
        // OCR sur les premières pages
        const pagesToProcess = Math.min(tempFiles.length, 3);
        
        for (let i = 0; i < pagesToProcess; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            console.log(`\n🔍 OCR sur ${tempFiles[i]}...`);
            
            try {
                // Syntaxe correcte pour ocr-space-api-wrapper v2.4.0
                const ocrResult = await OCRSpaceApi({
                    apikey: API_KEY_OCR,
                    imageFile: fs.createReadStream(imagePath),
                    language: 'eng',
                    isOverlayRequired: false,
                    detectOrientation: true,
                    scale: true,
                    isTable: false,
                    OCREngine: 2
                });
                
                if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
                    const text = ocrResult.ParsedResults[0].ParsedText;
                    console.log(`📝 Texte OCR: ${text.length} caractères`);
                    
                    // Patterns flexibles pour 500Ar (30min)
                    const patterns = [
                        { name: '30m + codes', regex: /30m[A-Za-z0-9]{3,8}/gi },
                        { name: '30min + codes', regex: /30min[A-Za-z0-9]{3,8}/gi },
                        { name: 'Codes complets', regex: /[A-Za-z0-9]{6,12}/g }
                    ];
                    
                    patterns.forEach((pattern) => {
                        const matches = text.match(pattern.regex);
                        if (matches && matches.length > 0) {
                            console.log(`🎯 ${pattern.name}: ${matches.length} trouvés`);
                            console.log('📋 Échantillon:', matches.slice(0, 5));
                            allCodes = [...allCodes, ...matches];
                        }
                    });
                    
                    // Afficher échantillon du texte OCR
                    console.log('📖 Échantillon texte OCR:');
                    console.log(text.substring(0, 300));
                    console.log('...');
                    
                } else {
                    console.log('❌ Pas de résultat OCR pour cette page');
                }
                
            } catch (ocrError) {
                console.log('❌ Erreur OCR:', ocrError.message);
            }
        }
        
        // Suppression des doublons
        const uniqueCodes = [...new Set(allCodes)];
        
        console.log(`\n📊 RÉSULTATS D'EXTRACTION:`);
        console.log(`🎫 Codes bruts: ${allCodes.length}`);
        console.log(`✨ Codes uniques: ${uniqueCodes.length}`);
        
        if (uniqueCodes.length > 0) {
            console.log('\n🎯 Codes extraits:');
            uniqueCodes.slice(0, 20).forEach((code, i) => {
                console.log(`  ${i + 1}. ${code}`);
            });
            
            if (uniqueCodes.length > 20) {
                console.log(`  ... et ${uniqueCodes.length - 20} autres codes`);
            }
        }
        
        // Nettoyage
        console.log('\n🧹 Nettoyage des fichiers temporaires...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {
                // Ignore les erreurs
            }
        });
        
        return uniqueCodes;
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return [];
    }
}

// Lancement du test
extractCodes500ArFixed()
    .then(codes => {
        console.log(`\n🏁 RÉSULTAT FINAL: ${codes?.length || 0} codes extraits du PDF 500Ar2.pdf`);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 