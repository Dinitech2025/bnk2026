const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extractCodes500ArFinal() {
    console.log('🧪 Extraction finale du PDF 500Ar2.pdf');
    
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
            out_prefix: 'final500ar',
            page: null
        };
        
        // Conversion PDF en images
        console.log('🖼️ Conversion PDF → images...');
        await pdf.convert(pdfPath, options);
        console.log(`✅ Conversion terminée`);
        
        // Lister les fichiers générés
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('final500ar'));
        console.log(`📸 ${tempFiles.length} images générées`);
        
        let allCodes = [];
        
        // OCR sur toutes les pages (limiter à 5 pour éviter quota API)
        const pagesToProcess = Math.min(tempFiles.length, 5);
        
        for (let i = 0; i < pagesToProcess; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            console.log(`\n🔍 OCR Page ${i + 1}/${pagesToProcess}: ${tempFiles[i]}...`);
            
            try {
                // Syntaxe correcte pour ocr-space-api-wrapper v2.4.0
                const ocrResult = await ocrSpace(imagePath, {
                    apiKey: API_KEY_OCR,
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
                    
                    if (text.length > 0) {
                        // Patterns flexibles pour 500Ar (30min)
                        const patterns = [
                            { name: '30m + codes flexibles', regex: /30m[A-Za-z0-9]{3,8}/gi },
                            { name: '30min + codes flexibles', regex: /30min[A-Za-z0-9]{3,8}/gi },
                            { name: 'Codes alphanumériques courts', regex: /[A-Za-z0-9]{6,8}/g },
                            { name: 'Codes alphanumériques longs', regex: /[A-Za-z0-9]{9,12}/g }
                        ];
                        
                        patterns.forEach((pattern) => {
                            const matches = text.match(pattern.regex);
                            if (matches && matches.length > 0) {
                                console.log(`🎯 ${pattern.name}: ${matches.length} trouvés`);
                                console.log('📋 Échantillon:', matches.slice(0, 3));
                                allCodes = [...allCodes, ...matches];
                            }
                        });
                        
                        // Afficher échantillon du texte OCR pour débogage
                        console.log('📖 Échantillon du texte OCR:');
                        const sampleText = text.substring(0, 400).replace(/\n/g, ' ');
                        console.log(sampleText + '...');
                    }
                    
                } else {
                    console.log('❌ Pas de résultat OCR pour cette page');
                }
                
            } catch (ocrError) {
                console.log('❌ Erreur OCR:', ocrError.message);
            }
            
            // Pause entre les appels API pour éviter rate limiting
            if (i < pagesToProcess - 1) {
                console.log('⏳ Pause de 2 secondes...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Suppression des doublons et filtrage
        const uniqueCodes = [...new Set(allCodes)];
        
        console.log(`\n📊 RÉSULTATS D'EXTRACTION PDF 500Ar2.pdf:`);
        console.log(`🎫 Codes bruts trouvés: ${allCodes.length}`);
        console.log(`✨ Codes uniques: ${uniqueCodes.length}`);
        
        if (uniqueCodes.length > 0) {
            console.log('\n🎯 CODES EXTRAITS:');
            uniqueCodes.forEach((code, i) => {
                console.log(`  ${i + 1}. ${code}`);
            });
        }
        
        // Nettoyage
        console.log('\n🧹 Nettoyage des fichiers temporaires...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {
                // Ignore
            }
        });
        
        return uniqueCodes;
        
    } catch (error) {
        console.error('❌ Erreur principale:', error.message);
        return [];
    }
}

// Lancement du test
extractCodes500ArFinal()
    .then(codes => {
        console.log(`\n🏁 EXTRACTION TERMINÉE: ${codes?.length || 0} codes extraits du PDF 500Ar2.pdf`);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 