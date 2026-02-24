const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function analyserCodesNonRecuperesV2() {
    console.log('🔍 ANALYSE APPROFONDIE DES CODES NON RÉCUPÉRÉS');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration optimale
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'analyse500ar_v2',
            page: null,
            density: 600,
            width: 5100,
            height: 6600
        };
        
        console.log('🖼️ Conversion PDF en images...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('analyse500ar_v2'));
        console.log(`📸 ${tempFiles.length} images générées`);
        
        let codesExtracted = new Set();  // Codes extraits avec succès
        let numerosDetectes = new Map(); // Numéro → contexte où trouvé
        let lignesAvecCodes = [];        // Lignes contenant des codes
        let lignesAvecNumeros = [];      // Lignes contenant des numéros 1-321
        let tousLesTextes = [];
        
        // OCR sur toutes les pages
        for (let i = 0; i < tempFiles.length; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            console.log(`\n🔍 Analyse page ${i + 1}/${tempFiles.length}: ${tempFiles[i]}...`);
            
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
                    console.log(`📝 Texte extrait: ${text.length} caractères`);
                    
                    tousLesTextes.push(text);
                    
                    // 🎯 EXTRACTION DES CODES
                    const codesPattern = /30m1G[A-Za-z0-9]{4}\b/g;
                    const codes = text.match(codesPattern) || [];
                    codes.forEach(code => codesExtracted.add(code));
                    
                    console.log(`  🎯 ${codes.length} codes extraits sur cette page`);
                    
                    // 📊 ANALYSE LIGNE PAR LIGNE
                    const lignes = text.split('\n');
                    lignes.forEach((ligne, lineIndex) => {
                        const ligneClean = ligne.trim();
                        if (ligneClean.length === 0) return;
                        
                        // Chercher des codes dans cette ligne
                        const codesInLigne = ligneClean.match(/30m1G[A-Za-z0-9]{4}/g);
                        if (codesInLigne) {
                            lignesAvecCodes.push({
                                page: i + 1,
                                ligne: lineIndex + 1,
                                texte: ligneClean,
                                codes: codesInLigne
                            });
                        }
                        
                        // Chercher TOUS les numéros dans cette ligne
                        const tousNumeros = ligneClean.match(/\d+/g);
                        if (tousNumeros) {
                            tousNumeros.forEach(numStr => {
                                const num = parseInt(numStr);
                                if (num >= 1 && num <= 321) {
                                    if (!numerosDetectes.has(num)) {
                                        numerosDetectes.set(num, []);
                                    }
                                    numerosDetectes.get(num).push({
                                        page: i + 1,
                                        ligne: lineIndex + 1,
                                        contexte: ligneClean,
                                        aCodes: codesInLigne ? codesInLigne.length : 0
                                    });
                                    
                                    lignesAvecNumeros.push({
                                        page: i + 1,
                                        ligne: lineIndex + 1,
                                        numero: num,
                                        texte: ligneClean,
                                        aCodes: codesInLigne ? codesInLigne.length : 0
                                    });
                                }
                            });
                        }
                    });
                }
                
                // Pause entre pages
                if (i < tempFiles.length - 1) {
                    console.log('⏳ Pause de 2 secondes...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (ocrError) {
                console.log(`❌ Erreur OCR page ${i + 1}:`, ocrError.message);
            }
        }
        
        // 📊 ANALYSE DES RÉSULTATS
        const codesArray = Array.from(codesExtracted);
        const numerosDetectesArray = Array.from(numerosDetectes.keys()).sort((a, b) => a - b);
        
        console.log(`\n📊 RÉSULTATS DE L'ANALYSE DÉTAILLÉE:`);
        console.log(`✅ Codes extraits avec succès: ${codesArray.length}`);
        console.log(`🔢 Numéros détectés dans le texte: ${numerosDetectesArray.length}`);
        console.log(`📄 Lignes avec codes: ${lignesAvecCodes.length}`);
        console.log(`📄 Lignes avec numéros: ${lignesAvecNumeros.length}`);
        
        // Trouver les numéros absents (1-321)
        const numerosAbsents = [];
        for (let i = 1; i <= 321; i++) {
            if (!numerosDetectes.has(i)) {
                numerosAbsents.push(i);
            }
        }
        
        console.log(`❌ Numéros NON détectés: ${numerosAbsents.length}`);
        
        // Analyser les numéros avec/sans codes
        const numerosAvecCodes = [];
        const numerosSansCodes = [];
        
        numerosDetectes.forEach((contextes, numero) => {
            const aUnCodeDansUnContexte = contextes.some(ctx => ctx.aCodes > 0);
            if (aUnCodeDansUnContexte) {
                numerosAvecCodes.push(numero);
            } else {
                numerosSansCodes.push(numero);
            }
        });
        
        console.log(`✅ Numéros avec codes sur même ligne: ${numerosAvecCodes.length}`);
        console.log(`⚠️ Numéros sans codes sur même ligne: ${numerosSansCodes.length}`);
        
        // 🎯 RAPPORT DÉTAILLÉ
        if (numerosAbsents.length > 0) {
            console.log(`\n❌ NUMÉROS TOTALEMENT ABSENTS (${numerosAbsents.length}):`);
            
            // Grouper par plages
            let plages = [];
            let debut = numerosAbsents[0];
            let fin = numerosAbsents[0];
            
            for (let i = 1; i < numerosAbsents.length; i++) {
                if (numerosAbsents[i] === fin + 1) {
                    fin = numerosAbsents[i];
                } else {
                    if (debut === fin) {
                        plages.push(`${debut}`);
                    } else {
                        plages.push(`${debut}-${fin}`);
                    }
                    debut = fin = numerosAbsents[i];
                }
            }
            
            if (debut === fin) {
                plages.push(`${debut}`);
            } else {
                plages.push(`${debut}-${fin}`);
            }
            
            console.log(`🎯 Plages absentes: ${plages.join(', ')}`);
        }
        
        if (numerosSansCodes.length > 0) {
            console.log(`\n⚠️ NUMÉROS DÉTECTÉS MAIS SANS CODES (${numerosSansCodes.length}):`);
            if (numerosSansCodes.length <= 50) {
                console.log(numerosSansCodes.join(', '));
            } else {
                console.log('Premiers 25:', numerosSansCodes.slice(0, 25).join(', '));
                console.log('Derniers 25:', numerosSansCodes.slice(-25).join(', '));
            }
            
            // Échantillon de contextes sans codes
            console.log(`\n📖 ÉCHANTILLON DE CONTEXTES SANS CODES:`);
            numerosSansCodes.slice(0, 10).forEach(num => {
                const contextes = numerosDetectes.get(num);
                console.log(`  📍 Numéro ${num}:`);
                contextes.slice(0, 2).forEach(ctx => {
                    console.log(`    Page ${ctx.page}: "${ctx.contexte}"`);
                });
            });
        }
        
        // 📖 ÉCHANTILLON DES LIGNES AVEC CODES
        console.log(`\n📖 ÉCHANTILLON DE LIGNES WITH CODES (${Math.min(10, lignesAvecCodes.length)}):`);
        lignesAvecCodes.slice(0, 10).forEach((item, i) => {
            console.log(`  ${i + 1}. P${item.page}: "${item.texte}" [${item.codes.join(', ')}]`);
        });
        
        // 🎯 STATISTIQUES FINALES
        console.log(`\n📊 STATISTIQUES FINALES:`);
        console.log(`🎯 Total tickets attendus: 321`);
        console.log(`✅ Codes extraits: ${codesArray.length} (${((codesArray.length / 321) * 100).toFixed(1)}%)`);
        console.log(`🔢 Numéros détectés: ${numerosDetectesArray.length} (${((numerosDetectesArray.length / 321) * 100).toFixed(1)}%)`);
        console.log(`❌ Écart codes/numéros: ${Math.abs(codesArray.length - numerosDetectesArray.length)}`);
        console.log(`💔 Numéros totalement perdus: ${numerosAbsents.length}`);
        console.log(`⚠️ Numéros sans codes associés: ${numerosSansCodes.length}`);
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return {
            codesExtraits: codesArray,
            numerosAbsents: numerosAbsents,
            numerosSansCodes: numerosSansCodes,
            numerosAvecCodes: numerosAvecCodes,
            totalNumerosDetectes: numerosDetectesArray.length
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return null;
    }
}

// Lancement de l'analyse
analyserCodesNonRecuperesV2()
    .then(resultats => {
        if (resultats) {
            console.log(`\n🏁 ANALYSE TERMINÉE`);
            console.log(`\n🎯 RÉSUMÉ DES NUMÉROS NON RÉCUPÉRÉS:`);
            
            if (resultats.numerosAbsents.length > 0) {
                console.log(`❌ Complètement absents: ${resultats.numerosAbsents.length} numéros`);
                console.log(`   ${resultats.numerosAbsents.slice(0, 20).join(', ')}${resultats.numerosAbsents.length > 20 ? '...' : ''}`);
            }
            
            if (resultats.numerosSansCodes.length > 0) {
                console.log(`⚠️ Détectés mais sans codes: ${resultats.numerosSansCodes.length} numéros`);
                console.log(`   ${resultats.numerosSansCodes.slice(0, 20).join(', ')}${resultats.numerosSansCodes.length > 20 ? '...' : ''}`);
            }
            
            const totalProblematiques = resultats.numerosAbsents.length + resultats.numerosSansCodes.length;
            console.log(`\n💡 TOTAL NUMÉROS PROBLÉMATIQUES: ${totalProblematiques}/321`);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 