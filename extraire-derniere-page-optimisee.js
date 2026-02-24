const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extraireDernierePageOptimisee() {
    console.log('🎯 EXTRACTION OPTIMISÉE DE LA DERNIÈRE PAGE');
    console.log('📋 Objectif: Récupérer les 34 codes manquants (numéros 288-321)');
    console.log('🔧 Utilisation de paramètres OCR spécialisés pour la page 5\n');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration ULTRA OPTIMISÉE pour la dernière page
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'page5_ultra',
            page: 5,  // Seulement la page 5
            density: 900,   // Résolution maximale
            width: 7650,    // Largeur maximale
            height: 9900    // Hauteur maximale
        };
        
        console.log('🖼️ Conversion page 5 en image haute résolution...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('page5_ultra'));
        console.log(`📸 Image générée: ${tempFiles[0]}\n`);
        
        if (tempFiles.length === 0) {
            throw new Error('Aucune image générée pour la page 5');
        }
        
        const imagePath = path.join('./temp/', tempFiles[0]);
        
        // Tester plusieurs configurations OCR
        const configurations = [
            {
                nom: 'Config 1: Moteur 2, Table Mode',
                params: {
                    apiKey: API_KEY_OCR,
                    language: 'eng',
                    isOverlayRequired: false,
                    detectOrientation: true,
                    scale: true,
                    isTable: true,  // Mode tableau
                    OCREngine: 2
                }
            },
            {
                nom: 'Config 2: Moteur 1, Standard',
                params: {
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
                nom: 'Config 3: Moteur 3, Haute précision',
                params: {
                    apiKey: API_KEY_OCR,
                    language: 'eng',
                    isOverlayRequired: false,
                    detectOrientation: true,
                    scale: true,
                    isTable: false,
                    OCREngine: 3
                }
            }
        ];
        
        let meilleurResultat = null;
        let maxCodes = 0;
        
        for (let i = 0; i < configurations.length; i++) {
            const config = configurations[i];
            console.log(`🔍 TEST ${i + 1}: ${config.nom}`);
            
            try {
                const ocrResult = await ocrSpace(imagePath, config.params);
                
                if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
                    const text = ocrResult.ParsedResults[0].ParsedText;
                    const lignes = text.split('\n');
                    
                    // Extraire tous les codes
                    const codes = [];
                    const numerosDetectes = [];
                    
                    lignes.forEach((ligne, lineIndex) => {
                        const ligneClean = ligne.trim();
                        
                        // Codes 30m1G
                        const codesMatch = ligneClean.match(/30m1G[A-Za-z0-9]{4}\b/g);
                        if (codesMatch) {
                            codesMatch.forEach(code => {
                                codes.push({
                                    code: code,
                                    ligne: lineIndex + 1,
                                    contexte: ligneClean
                                });
                            });
                        }
                        
                        // Numéros 288-321
                        const numerosMatch = ligneClean.match(/\b(28[8-9]|29[0-9]|3[0-1][0-9]|32[01])\b/g);
                        if (numerosMatch) {
                            numerosMatch.forEach(numStr => {
                                const num = parseInt(numStr);
                                if (num >= 288 && num <= 321) {
                                    numerosDetectes.push({
                                        numero: num,
                                        ligne: lineIndex + 1,
                                        contexte: ligneClean
                                    });
                                }
                            });
                        }
                    });
                    
                    console.log(`   📱 ${codes.length} codes détectés`);
                    console.log(`   🔢 ${numerosDetectes.length} numéros 288-321 détectés`);
                    
                    if (codes.length > maxCodes) {
                        maxCodes = codes.length;
                        meilleurResultat = {
                            config: config.nom,
                            codes: codes,
                            numeros: numerosDetectes,
                            texteComplet: text
                        };
                    }
                    
                    // Afficher quelques codes trouvés
                    if (codes.length > 0) {
                        const echantillon = codes.slice(0, 5).map(c => c.code).join(', ');
                        console.log(`   📋 Échantillon: ${echantillon}`);
                    }
                    
                } else {
                    console.log('   ❌ Aucun texte extrait');
                }
                
                // Pause entre tests
                if (i < configurations.length - 1) {
                    console.log('   ⏳ Pause de 3 secondes...\n');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                
            } catch (ocrError) {
                console.log(`   ❌ Erreur: ${ocrError.message}`);
            }
        }
        
        // Analyse du meilleur résultat
        if (meilleurResultat) {
            console.log(`\n🏆 MEILLEUR RÉSULTAT: ${meilleurResultat.config}`);
            console.log(`📱 ${meilleurResultat.codes.length} codes extraits de la page 5`);
            console.log(`🔢 ${meilleurResultat.numeros.length} numéros 288-321 détectés\n`);
            
            // Lister tous les codes trouvés
            if (meilleurResultat.codes.length > 0) {
                console.log('📋 TOUS LES CODES EXTRAITS DE LA PAGE 5:');
                meilleurResultat.codes.forEach((codeInfo, index) => {
                    const numero = 288 + index; // Supposer ordre séquentiel
                    console.log(`   ${numero} → ${codeInfo.code}`);
                });
            }
            
            // Créer la liste complète des 34 codes manquants
            const codesManquants = [];
            for (let i = 0; i < Math.min(meilleurResultat.codes.length, 34); i++) {
                const numero = 288 + i;
                const code = meilleurResultat.codes[i].code;
                codesManquants.push({ numero, code });
            }
            
            console.log(`\n🎯 CODES RÉCUPÉRÉS POUR COMPLÉTER L'EXTRACTION:`);
            console.log(`✅ ${codesManquants.length} codes sur 34 nécessaires`);
            
            if (codesManquants.length < 34) {
                console.log(`⚠️ Encore ${34 - codesManquants.length} codes manquants`);
            } else {
                console.log(`🎉 EXTRACTION COMPLÈTE ! Tous les codes 288-321 récupérés`);
            }
            
            // Sauvegarder les codes en format JSON
            const resultats = {
                source: 'Page 5 - Extraction optimisée',
                methode: meilleurResultat.config,
                codesRecuperes: codesManquants,
                totalCodes: codesManquants.length,
                numerosCouverts: {
                    debut: 288,
                    fin: 287 + codesManquants.length
                }
            };
            
            fs.writeFileSync('codes-page5-recuperes.json', JSON.stringify(resultats, null, 2));
            console.log(`\n💾 Résultats sauvegardés dans: codes-page5-recuperes.json`);
            
            // Afficher les codes au format d'importation
            console.log(`\n📤 CODES AU FORMAT D'IMPORTATION:`);
            const codesArray = codesManquants.map(item => item.code);
            console.log(`[`);
            codesArray.forEach((code, index) => {
                const virgule = index < codesArray.length - 1 ? ',' : '';
                console.log(`  '${code}'${virgule}`);
            });
            console.log(`]`);
            
        } else {
            console.log('\n❌ Aucune configuration OCR n\'a réussi à extraire des codes');
        }
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return meilleurResultat;
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return null;
    }
}

// Lancement de l'extraction optimisée
extraireDernierePageOptimisee()
    .then(resultat => {
        if (resultat) {
            console.log(`\n🏁 EXTRACTION OPTIMISÉE TERMINÉE`);
            console.log(`\n🎯 RÉSUMÉ:`);
            console.log(`✅ ${resultat.codes.length} codes récupérés de la page 5`);
            console.log(`🔧 Meilleure méthode: ${resultat.config}`);
            console.log(`📊 Taux global potentiel: ${((287 + resultat.codes.length) / 321 * 100).toFixed(1)}%`);
            
            if (resultat.codes.length >= 34) {
                console.log(`🎉 SUCCÈS COMPLET ! Tous les codes manquants récupérés`);
            } else {
                console.log(`⚠️ ${34 - resultat.codes.length} codes encore manquants`);
            }
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 