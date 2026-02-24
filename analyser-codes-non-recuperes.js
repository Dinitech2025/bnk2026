const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function analyserCodesNonRecuperes() {
    console.log('🔍 ANALYSE DES CODES NON RÉCUPÉRÉS (numéros manqués dans l\'extraction)');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration optimale
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'analyse500ar',
            page: null,
            density: 600,
            width: 5100,
            height: 6600
        };
        
        console.log('🖼️ Conversion PDF en images...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('analyse500ar'));
        console.log(`📸 ${tempFiles.length} images générées`);
        
        let codesExtracted = new Set();  // Codes extraits avec succès
        let numerosAvecCodes = new Map(); // Numéro → Code extrait
        let numerosInText = new Set();   // Tous les numéros trouvés dans le texte
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
                    
                    // 🎯 EXTRACTION DES CODES (même méthode que notre extraction réussie)
                    const codesPattern = /30m1G[A-Za-z0-9]{4}\b/g;
                    const codes = text.match(codesPattern) || [];
                    codes.forEach(code => codesExtracted.add(code));
                    
                    console.log(`  🎯 ${codes.length} codes extraits sur cette page`);
                    
                    // 📊 ANALYSE DES LIGNES AVEC NUMÉROS ET CODES
                    const lignes = text.split('\n');
                    lignes.forEach(ligne => {
                        if (ligne.includes('DT WIFI ZONE') || ligne.includes('OT WIFI ZONE')) {
                            // Extraire le numéro de cette ligne
                            const numerosMatch = ligne.match(/(\d+)/g);
                            const codesMatch = ligne.match(/30m1G[A-Za-z0-9]{4}/g);
                            
                            if (numerosMatch) {
                                numerosMatch.forEach(numStr => {
                                    const num = parseInt(numStr);
                                    if (num >= 1 && num <= 321) {
                                        numerosInText.add(num);
                                        
                                        // Si on a un code sur la même ligne, l'associer au numéro
                                        if (codesMatch && codesMatch.length > 0) {
                                            // Associer le premier code trouvé au numéro
                                            if (!numerosAvecCodes.has(num)) {
                                                numerosAvecCodes.set(num, codesMatch[0]);
                                            }
                                        }
                                    }
                                });
                            }
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
        const codesExtractedArray = Array.from(codesExtracted);
        const numerosAvecCodesArray = Array.from(numerosAvecCodes.keys()).sort((a, b) => a - b);
        const numerosInTextArray = Array.from(numerosInText).sort((a, b) => a - b);
        
        // Trouver les numéros sans codes extraits
        const numerosNonRecuperes = [];
        for (let i = 1; i <= 321; i++) {
            if (numerosInText.has(i) && !numerosAvecCodes.has(i)) {
                numerosNonRecuperes.push(i);
            }
        }
        
        // Trouver les numéros complètement absents du texte
        const numerosAbsents = [];
        for (let i = 1; i <= 321; i++) {
            if (!numerosInText.has(i)) {
                numerosAbsents.push(i);
            }
        }
        
        console.log(`\n📊 RÉSULTATS DE L'ANALYSE:`);
        console.log(`✅ Codes extraits avec succès: ${codesExtractedArray.length}`);
        console.log(`🔢 Numéros avec codes récupérés: ${numerosAvecCodesArray.length}`);
        console.log(`🔢 Numéros détectés dans le texte: ${numerosInTextArray.length}`);
        console.log(`❌ Numéros avec codes NON récupérés: ${numerosNonRecuperes.length}`);
        console.log(`❌ Numéros complètement absents: ${numerosAbsents.length}`);
        
        if (numerosNonRecuperes.length > 0) {
            console.log(`\n❌ NUMÉROS AVEC CODES NON RÉCUPÉRÉS (${numerosNonRecuperes.length}):`);
            console.log(numerosNonRecuperes.join(', '));
            
            // Analyse des plages non récupérées
            console.log(`\n📈 PLAGES DE NUMÉROS NON RÉCUPÉRÉS:`);
            let plages = [];
            let debut = numerosNonRecuperes[0];
            let fin = numerosNonRecuperes[0];
            
            for (let i = 1; i < numerosNonRecuperes.length; i++) {
                if (numerosNonRecuperes[i] === fin + 1) {
                    fin = numerosNonRecuperes[i];
                } else {
                    if (debut === fin) {
                        plages.push(`${debut}`);
                    } else {
                        plages.push(`${debut}-${fin}`);
                    }
                    debut = fin = numerosNonRecuperes[i];
                }
            }
            
            if (debut === fin) {
                plages.push(`${debut}`);
            } else {
                plages.push(`${debut}-${fin}`);
            }
            
            console.log(`🎯 Plages: ${plages.join(', ')}`);
        }
        
        if (numerosAbsents.length > 0) {
            console.log(`\n⚠️ NUMÉROS COMPLÈTEMENT ABSENTS DU TEXTE (${numerosAbsents.length}):`);
            if (numerosAbsents.length <= 20) {
                console.log(numerosAbsents.join(', '));
            } else {
                console.log('Premiers:', numerosAbsents.slice(0, 10).join(', '));
                console.log('Derniers:', numerosAbsents.slice(-10).join(', '));
            }
        }
        
        // 📖 ÉCHANTILLON DES LIGNES PROBLÉMATIQUES
        console.log(`\n📖 ÉCHANTILLON DE LIGNES AVEC NUMÉROS SANS CODES RÉCUPÉRÉS:`);
        const texteComplet = tousLesTextes.join('\n');
        const lignesProblematiques = texteComplet.split('\n')
            .filter(ligne => {
                if (!ligne.includes('DT WIFI ZONE') && !ligne.includes('OT WIFI ZONE')) return false;
                
                const numeros = ligne.match(/\d+/g);
                if (!numeros) return false;
                
                return numeros.some(numStr => {
                    const num = parseInt(numStr);
                    return num >= 1 && num <= 321 && numerosNonRecuperes.includes(num);
                });
            })
            .slice(0, 10);
        
        lignesProblematiques.forEach((ligne, i) => {
            console.log(`  ${i + 1}. ${ligne.trim()}`);
        });
        
        // 🎯 STATISTIQUES FINALES
        console.log(`\n📊 STATISTIQUES DÉTAILLÉES:`);
        console.log(`🎯 Total attendu: 321 codes`);
        console.log(`✅ Codes extraits: ${codesExtractedArray.length} (${((codesExtractedArray.length / 321) * 100).toFixed(1)}%)`);
        console.log(`❌ Codes non récupérés: ${321 - codesExtractedArray.length}`);
        console.log(`🔍 Numéros identifiés comme non récupérés: ${numerosNonRecuperes.length}`);
        console.log(`⚠️ Numéros totalement absents: ${numerosAbsents.length}`);
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return {
            codesExtraits: codesExtractedArray,
            numerosNonRecuperes: numerosNonRecuperes,
            numerosAbsents: numerosAbsents,
            numerosAvecCodes: numerosAvecCodesArray
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return null;
    }
}

// Lancement de l'analyse
analyserCodesNonRecuperes()
    .then(resultats => {
        if (resultats) {
            console.log(`\n🏁 ANALYSE TERMINÉE`);
            console.log(`🎯 NUMÉROS DONT LES CODES N'ONT PAS ÉTÉ RÉCUPÉRÉS:`);
            console.log(`${resultats.numerosNonRecuperes.join(', ')}`);
            
            if (resultats.numerosAbsents.length > 0) {
                console.log(`\n⚠️ NUMÉROS COMPLÈTEMENT ABSENTS:`);
                console.log(`${resultats.numerosAbsents.join(', ')}`);
            }
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 