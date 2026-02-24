const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extractCodes500ArPrecis() {
    console.log('🎯 Extraction PRÉCISE du PDF 500Ar2.pdf');
    
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
            out_prefix: 'precis500ar',
            page: null
        };
        
        // Conversion PDF en images
        console.log('🖼️ Conversion PDF → images...');
        await pdf.convert(pdfPath, options);
        console.log(`✅ Conversion terminée`);
        
        // Lister les fichiers générés
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('precis500ar'));
        console.log(`📸 ${tempFiles.length} images générées`);
        
        let allCodes = [];
        
        // OCR sur toutes les pages
        const pagesToProcess = Math.min(tempFiles.length, 5);
        
        for (let i = 0; i < pagesToProcess; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            console.log(`\n🔍 OCR Page ${i + 1}/${pagesToProcess}: ${tempFiles[i]}...`);
            
            try {
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
                        // ✅ PATTERNS PRÉCIS pour codes 500Ar (30min)
                        const patterns = [
                            { 
                                name: 'Codes 30m1G + 4 caractères EXACT', 
                                regex: /30m1G[A-Za-z0-9]{4}\b/g  // 30m1G + exactement 4 caractères + frontière de mot
                            }
                        ];
                        
                        patterns.forEach((pattern) => {
                            const matches = text.match(pattern.regex);
                            if (matches && matches.length > 0) {
                                console.log(`🎯 ${pattern.name}: ${matches.length} trouvés`);
                                console.log('📋 Échantillon:', matches.slice(0, 5));
                                allCodes = [...allCodes, ...matches];
                            } else {
                                console.log(`❌ ${pattern.name}: 0 trouvé`);
                            }
                        });
                        
                        // Échantillon du texte pour vérification
                        console.log('📖 Échantillon du texte OCR:');
                        const sampleText = text.substring(0, 300).replace(/\n/g, ' ');
                        console.log(sampleText + '...');
                    }
                    
                } else {
                    console.log('❌ Pas de résultat OCR pour cette page');
                }
                
            } catch (ocrError) {
                console.log('❌ Erreur OCR:', ocrError.message);
            }
            
            // Pause entre les appels API
            if (i < pagesToProcess - 1) {
                console.log('⏳ Pause de 2 secondes...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Suppression des doublons STRICTS
        const uniqueCodes = [...new Set(allCodes)];
        
        // Validation supplémentaire - filtrer les codes qui ne correspondent pas exactement au format
        const validCodes = uniqueCodes.filter(code => {
            return code.match(/^30m1G[A-Za-z0-9]{4}$/); // Format exact : 30m1G + exactement 4 caractères
        });
        
        console.log(`\n📊 RÉSULTATS D'EXTRACTION PRÉCISE PDF 500Ar2.pdf:`);
        console.log(`🎫 Codes bruts trouvés: ${allCodes.length}`);
        console.log(`✨ Codes uniques: ${uniqueCodes.length}`);
        console.log(`✅ Codes valides (format exact): ${validCodes.length}`);
        
        if (validCodes.length > 0) {
            console.log('\n🎯 CODES VALIDES EXTRAITS:');
            validCodes.forEach((code, i) => {
                console.log(`  ${i + 1}. ${code}`);
            });
            
            // Analyse du format
            console.log('\n📈 ANALYSE DES CODES:');
            console.log(`🔢 Nombre attendu: 321`);
            console.log(`🔢 Nombre extrait: ${validCodes.length}`);
            console.log(`📊 Taux de détection: ${((validCodes.length / 321) * 100).toFixed(1)}%`);
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
        
        return validCodes;
        
    } catch (error) {
        console.error('❌ Erreur principale:', error.message);
        return [];
    }
}

// Lancement du test
extractCodes500ArPrecis()
    .then(codes => {
        console.log(`\n🏁 EXTRACTION PRÉCISE TERMINÉE: ${codes?.length || 0} codes valides extraits du PDF 500Ar2.pdf`);
        console.log(`🎯 Objectif: 321 codes → Résultat: ${codes?.length || 0} codes`);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 