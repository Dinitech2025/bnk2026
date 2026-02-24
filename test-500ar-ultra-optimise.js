const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extractCodes500ArUltraOptimise() {
    console.log('🚀 Extraction ULTRA-OPTIMISÉE du PDF 500Ar2.pdf');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Fichier PDF non trouvé:', pdfPath);
        return;
    }
    
    console.log('📄 Fichier trouvé:', pdfPath);
    const stats = fs.statSync(pdfPath);
    console.log('📊 Taille:', stats.size, 'bytes');
    
    try {
        // ✅ CONFIGURATION HAUTE QUALITÉ
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'ultra500ar',
            page: null,
            // 🔥 RÉSOLUTION ULTRA-HAUTE pour meilleure OCR
            density: 600,        // Double résolution (300→600 DPI)
            width: 5100,         // Double largeur  
            height: 6600         // Double hauteur
        };
        
        // Conversion PDF en images HAUTE QUALITÉ
        console.log('🖼️ Conversion PDF → images HAUTE QUALITÉ (600 DPI)...');
        await pdf.convert(pdfPath, options);
        console.log(`✅ Conversion haute qualité terminée`);
        
        // Lister les fichiers générés
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('ultra500ar'));
        console.log(`📸 ${tempFiles.length} images haute qualité générées`);
        
        let allCodes = new Set(); // Utiliser Set pour éviter doublons automatiquement
        
        // OCR MULTI-PASSES avec différents paramètres
        const pagesToProcess = Math.min(tempFiles.length, 5);
        
        for (let i = 0; i < pagesToProcess; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            console.log(`\n🔍 OCR MULTI-PASSES Page ${i + 1}/${pagesToProcess}: ${tempFiles[i]}...`);
            
            // 🎯 MULTI-PASSES OCR avec différents moteurs et paramètres
            const ocrConfigs = [
                {
                    name: 'Moteur 2 (Standard)',
                    config: {
                        apiKey: API_KEY_OCR,
                        language: 'eng',
                        isOverlayRequired: false,
                        detectOrientation: true,
                        scale: true,
                        isTable: false,
                        OCREngine: 2
                    }
                },
                {
                    name: 'Moteur 1 (Alternatif)',
                    config: {
                        apiKey: API_KEY_OCR,
                        language: 'eng',
                        isOverlayRequired: false,
                        detectOrientation: true,
                        scale: true,
                        isTable: false,
                        OCREngine: 1
                    }
                },
                {
                    name: 'Moteur 3 (Beta)',
                    config: {
                        apiKey: API_KEY_OCR,
                        language: 'eng',
                        isOverlayRequired: false,
                        detectOrientation: false, // Différent paramètre
                        scale: false,
                        isTable: true, // Essayer mode tableau
                        OCREngine: 3
                    }
                }
            ];
            
            for (const ocrConfig of ocrConfigs) {
                try {
                    console.log(`  🔄 ${ocrConfig.name}...`);
                    
                    const ocrResult = await ocrSpace(imagePath, ocrConfig.config);
                    
                    if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
                        const text = ocrResult.ParsedResults[0].ParsedText;
                        console.log(`    📝 Texte: ${text.length} caractères`);
                        
                        if (text.length > 0) {
                            // 🎯 PATTERNS ULTRA-ROBUSTES avec gestion erreurs OCR
                            const patterns = [
                                // Pattern principal strict
                                /30m1G[A-Za-z0-9]{4}\b/g,
                                
                                // 🔥 PATTERNS ROBUSTES pour erreurs OCR courantes
                                /3[0O]m[1Il]G[A-Za-z0-9]{4}\b/g,  // 0→O, 1→I/l
                                /30m[1Il][G6][A-Za-z0-9]{4}\b/g,  // 1→I/l, G→6
                                /[3B]0m1[G6][A-Za-z0-9]{4}\b/g,   // 3→B, G→6
                                /30m1[GC][A-Za-z0-9]{4}\b/g,      // G→C
                                /30m[1I]G[A-Za-z0-9]{4}\b/g,      // 1→I
                            ];
                            
                            patterns.forEach((pattern) => {
                                const matches = text.match(pattern);
                                if (matches && matches.length > 0) {
                                    matches.forEach(match => {
                                        // 🧹 NORMALISATION des codes mal reconnus
                                        let normalizedCode = match
                                            .replace(/[0O]/g, '0')      // O → 0
                                            .replace(/[1Il]/g, '1')     // I,l → 1  
                                            .replace(/[6]/g, 'G')       // 6 → G
                                            .replace(/[3B]/g, '3')      // B → 3
                                            .replace(/[C]/g, 'G');      // C → G
                                            
                                        // Vérifier le format final
                                        if (normalizedCode.match(/^30m1G[A-Za-z0-9]{4}$/)) {
                                            allCodes.add(normalizedCode);
                                        }
                                    });
                                }
                            });
                        }
                    }
                    
                    // Pause entre moteurs OCR
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (ocrError) {
                    console.log(`    ❌ Erreur ${ocrConfig.name}:`, ocrError.message);
                }
            }
            
            console.log(`  ✅ Page ${i + 1} terminée - ${allCodes.size} codes uniques trouvés`);
            
            // Pause entre les pages
            if (i < pagesToProcess - 1) {
                console.log('⏳ Pause de 3 secondes entre pages...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        // Conversion Set → Array et tri
        const finalCodes = Array.from(allCodes).sort();
        
        console.log(`\n📊 RÉSULTATS ULTRA-OPTIMISÉS PDF 500Ar2.pdf:`);
        console.log(`✨ Codes uniques extraits: ${finalCodes.length}`);
        console.log(`🎯 Objectif: 321 codes`);
        console.log(`📊 Taux de réussite: ${((finalCodes.length / 321) * 100).toFixed(1)}%`);
        
        if (finalCodes.length > 0) {
            console.log('\n🎯 ÉCHANTILLON DES CODES EXTRAITS:');
            finalCodes.slice(0, 20).forEach((code, i) => {
                console.log(`  ${i + 1}. ${code}`);
            });
            
            if (finalCodes.length > 20) {
                console.log(`  ... et ${finalCodes.length - 20} autres codes`);
            }
            
            // 🎯 ANALYSE QUALITATIVE
            console.log('\n📈 ANALYSE DÉTAILLÉE:');
            console.log(`🔢 Codes manqués: ${321 - finalCodes.length}`);
            console.log(`✅ Amélioration: +${finalCodes.length - 287} codes vs extraction précédente`);
            
            if (finalCodes.length >= 321) {
                console.log('🎉 OBJECTIF 100% ATTEINT ! 🎉');
            } else if (finalCodes.length >= 310) {
                console.log('🔥 EXCELLENT ! Plus de 96% de réussite');
            } else if (finalCodes.length >= 300) {
                console.log('✅ TRÈS BON ! Plus de 93% de réussite');
            }
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
        
        return finalCodes;
        
    } catch (error) {
        console.error('❌ Erreur principale:', error.message);
        return [];
    }
}

// Lancement du test ULTRA-OPTIMISÉ
extractCodes500ArUltraOptimise()
    .then(codes => {
        console.log(`\n🏁 EXTRACTION ULTRA-OPTIMISÉE TERMINÉE: ${codes?.length || 0} codes extraits`);
        console.log(`🚀 Objectif: 321 codes → Résultat: ${codes?.length || 0} codes`);
        
        if (codes?.length >= 321) {
            console.log('🎊 FÉLICITATIONS ! 100% D\'EXTRACTION ATTEINTE ! 🎊');
        } else {
            console.log(`📊 Taux final: ${((codes?.length || 0) / 321 * 100).toFixed(1)}%`);
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 