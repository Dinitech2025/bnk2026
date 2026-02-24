const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function testPage1Maximum() {
    console.log('🔬 TEST MAXIMUM Page 1 du PDF 500Ar2.pdf');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // RÉSOLUTION MAXIMALE
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'maxtest',
            page: 1, // SEULEMENT PAGE 1
            density: 900,        // RÉSOLUTION MAXIMALE
            width: 7650,         // 3x largeur
            height: 9900         // 3x hauteur
        };
        
        console.log('🖼️ Conversion Page 1 → résolution MAXIMALE (900 DPI)...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('maxtest'));
        console.log(`📸 ${tempFiles.length} image générée`);
        
        const imagePath = path.join('./temp/', tempFiles[0]);
        let allCodes = new Set();
        
        // TOUS LES MOTEURS OCR DISPONIBLES
        const ocrConfigs = [
            { name: 'Moteur 1', engine: 1, orientation: true, scale: true, table: false },
            { name: 'Moteur 2', engine: 2, orientation: true, scale: true, table: false },
            { name: 'Moteur 3', engine: 3, orientation: true, scale: true, table: false },
            { name: 'Moteur 1 Alt', engine: 1, orientation: false, scale: false, table: true },
            { name: 'Moteur 2 Alt', engine: 2, orientation: false, scale: false, table: true },
            { name: 'Moteur 3 Alt', engine: 3, orientation: false, scale: false, table: true },
        ];
        
        for (const config of ocrConfigs) {
            try {
                console.log(`\n🔄 Test ${config.name}...`);
                
                const ocrResult = await ocrSpace(imagePath, {
                    apiKey: API_KEY_OCR,
                    language: 'eng',
                    isOverlayRequired: false,
                    detectOrientation: config.orientation,
                    scale: config.scale,
                    isTable: config.table,
                    OCREngine: config.engine
                });
                
                if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
                    const text = ocrResult.ParsedResults[0].ParsedText;
                    console.log(`  📝 ${text.length} caractères extraits`);
                    
                    // PATTERNS EXHAUSTIFS
                    const patterns = [
                        /30m1G[A-Za-z0-9]{4}\b/g,
                        /3[0O]m[1Il]G[A-Za-z0-9]{4}\b/g,
                        /30m[1Il][G6Q][A-Za-z0-9]{4}\b/g,
                        /[3B]0m1[G6Q][A-Za-z0-9]{4}\b/g,
                        /30m1[GCQ6][A-Za-z0-9]{4}\b/g,
                        /30m[1Il][GCQ][A-Za-z0-9]{4}\b/g,
                        /[38]0m1G[A-Za-z0-9]{4}\b/g,
                    ];
                    
                    let foundInThisPass = 0;
                    patterns.forEach((pattern) => {
                        const matches = text.match(pattern);
                        if (matches) {
                            matches.forEach(match => {
                                let normalizedCode = match
                                    .replace(/[0O]/g, '0')
                                    .replace(/[1Il]/g, '1')
                                    .replace(/[6Q]/g, 'G')
                                    .replace(/[3B8]/g, '3')
                                    .replace(/[C]/g, 'G');
                                    
                                if (normalizedCode.match(/^30m1G[A-Za-z0-9]{4}$/)) {
                                    if (!allCodes.has(normalizedCode)) {
                                        foundInThisPass++;
                                    }
                                    allCodes.add(normalizedCode);
                                }
                            });
                        }
                    });
                    
                    console.log(`  🎯 ${foundInThisPass} nouveaux codes trouvés`);
                    console.log(`  📊 Total codes page 1: ${allCodes.size}`);
                    
                    // Afficher échantillon du texte
                    console.log(`  📖 Échantillon: ${text.substring(0, 100)}...`);
                }
                
                // Pause entre tests
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.log(`  ❌ Erreur ${config.name}:`, error.message);
            }
        }
        
        const finalCodes = Array.from(allCodes).sort();
        
        console.log(`\n📊 RÉSULTATS TEST MAXIMUM PAGE 1:`);
        console.log(`✨ Codes trouvés: ${finalCodes.length}`);
        console.log(`🎯 Attendu page 1: ~64 codes (estimation)`);
        console.log(`📊 Taux: ${((finalCodes.length / 64) * 100).toFixed(1)}%`);
        
        if (finalCodes.length > 0) {
            console.log('\n🎯 TOUS LES CODES PAGE 1:');
            finalCodes.forEach((code, i) => {
                console.log(`  ${i + 1}. ${code}`);
            });
        }
        
        // 📊 ANALYSE DU POTENTIEL
        console.log('\n📈 ANALYSE DU POTENTIEL D\'AMÉLIORATION:');
        if (finalCodes.length > 64) {
            console.log('🔥 EXCELLENT ! Plus de codes trouvés qu\'attendu');
            console.log('💡 L\'amélioration est possible avec cette méthode');
        } else if (finalCodes.length === 64) {
            console.log('✅ PARFAIT ! Tous les codes page 1 trouvés');
            console.log('🚀 100% possible en appliquant à toutes les pages');
        } else {
            console.log('⚠️ Encore des codes manqués même avec résolution max');
            console.log('💭 Limite technologique atteinte pour ce PDF');
        }
        
        // Nettoyage
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return finalCodes;
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return [];
    }
}

// Lancement du test
testPage1Maximum()
    .then(codes => {
        console.log(`\n🏁 TEST TERMINÉ: ${codes?.length || 0} codes page 1`);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 