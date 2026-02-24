const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function extractionCompleteOptimisee() {
    console.log('🎯 EXTRACTION COMPLÈTE OPTIMISÉE - TOUTES LES PAGES');
    console.log('📋 Utilisation de la méthode qui a réussi : Moteur 2 + Mode Table');
    console.log('🔧 Objectif: Extraire tous les 321 codes avec 100% de réussite\n');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration OPTIMALE basée sur le succès de la page 5
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'extraction_complete',
            page: null,  // Toutes les pages
            density: 900,   // Résolution maximale
            width: 7650,    // Largeur maximale
            height: 9900    // Hauteur maximale
        };
        
        console.log('🖼️ Conversion PDF complet en images haute résolution...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('extraction_complete'));
        console.log(`📸 ${tempFiles.length} images générées\n`);
        
        let tousLesCodesOrdonnes = [];  // Tous les codes dans l'ordre d'apparition
        let associationsReussies = new Map();  // Numéro → Code
        let codesParPage = [];  // Détails par page
        
        // Configuration OCR optimale
        const configOptimale = {
            apiKey: API_KEY_OCR,
            language: 'eng',
            isOverlayRequired: false,
            detectOrientation: true,
            scale: true,
            isTable: true,  // Mode tableau qui a réussi !
            OCREngine: 2    // Moteur 2 optimal
        };
        
        // OCR page par page avec la configuration optimale
        for (let i = 0; i < tempFiles.length; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            const pageNum = i + 1;
            
            console.log(`🔍 EXTRACTION Page ${pageNum}/${tempFiles.length}:`);
            
            try {
                const ocrResult = await ocrSpace(imagePath, configOptimale);
                
                if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
                    const text = ocrResult.ParsedResults[0].ParsedText;
                    const lignes = text.split('\n');
                    
                    // Extraire tous les codes dans l'ordre d'apparition
                    const codesPage = [];
                    const numerosPage = [];
                    
                    lignes.forEach((ligne, lineIndex) => {
                        const ligneClean = ligne.trim();
                        
                        // 📱 EXTRAIRE LES CODES 30m1G
                        const codesMatch = ligneClean.match(/30m1G[A-Za-z0-9]{4}\b/g);
                        if (codesMatch) {
                            codesMatch.forEach(code => {
                                const ordreGlobal = tousLesCodesOrdonnes.length;
                                codesPage.push({
                                    code: code,
                                    page: pageNum,
                                    ligne: lineIndex + 1,
                                    ordreGlobal: ordreGlobal,
                                    numeroAssocie: ordreGlobal + 1  // Numéro séquentiel 1, 2, 3...
                                });
                                tousLesCodesOrdonnes.push(code);
                            });
                        }
                        
                        // 🔢 DÉTECTER LES NUMÉROS (pour vérification)
                        const numerosMatch = ligneClean.match(/\b([1-9]|[1-9][0-9]|[1-2][0-9][0-9]|3[0-1][0-9]|32[01])\b/g);
                        if (numerosMatch) {
                            numerosMatch.forEach(numStr => {
                                const num = parseInt(numStr);
                                if (num >= 1 && num <= 321) {
                                    numerosPage.push({
                                        numero: num,
                                        page: pageNum,
                                        ligne: lineIndex + 1,
                                        contexte: ligneClean
                                    });
                                }
                            });
                        }
                    });
                    
                    codesParPage.push({
                        page: pageNum,
                        codes: codesPage,
                        numeros: numerosPage,
                        totalCodes: codesPage.length,
                        totalNumeros: numerosPage.length
                    });
                    
                    console.log(`   📱 ${codesPage.length} codes extraits`);
                    console.log(`   🔢 ${numerosPage.length} numéros détectés`);
                    
                    // Afficher quelques codes de cette page
                    if (codesPage.length > 0) {
                        const echantillon = codesPage.slice(0, 3).map(c => `${c.numeroAssocie}→${c.code}`).join(', ');
                        console.log(`   📋 Échantillon: ${echantillon}`);
                    }
                }
                
                // Pause entre pages
                if (i < tempFiles.length - 1) {
                    console.log('   ⏳ Pause de 2 secondes...\n');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (ocrError) {
                console.log(`   ❌ Erreur OCR page ${pageNum}:`, ocrError.message);
            }
        }
        
        // 📊 CRÉATION DES ASSOCIATIONS FINALES
        console.log('\n📊 COMPILATION DES RÉSULTATS:');
        
        // Créer les associations numéro → code
        tousLesCodesOrdonnes.forEach((code, index) => {
            const numeroAssocie = index + 1;
            if (numeroAssocie <= 321) {
                associationsReussies.set(numeroAssocie, code);
            }
        });
        
        console.log(`📱 Total codes extraits: ${tousLesCodesOrdonnes.length}`);
        console.log(`🔗 Associations créées: ${associationsReussies.size}`);
        console.log(`🎯 Taux de réussite: ${((associationsReussies.size / 321) * 100).toFixed(1)}%`);
        
        // Identifier les numéros manquants
        const numerosManquants = [];
        for (let i = 1; i <= 321; i++) {
            if (!associationsReussies.has(i)) {
                numerosManquants.push(i);
            }
        }
        
        if (numerosManquants.length > 0) {
            console.log(`\n❌ NUMÉROS ENCORE MANQUANTS: ${numerosManquants.length}`);
            console.log(`🎯 Numéros: ${numerosManquants.join(', ')}`);
        } else {
            console.log(`\n🎉 EXTRACTION PARFAITE ! Tous les 321 codes récupérés !`);
        }
        
        // 📊 STATISTIQUES PAR PAGE
        console.log(`\n📊 DÉTAIL PAR PAGE:`);
        let totalCodesParPage = 0;
        codesParPage.forEach(pageInfo => {
            totalCodesParPage += pageInfo.totalCodes;
            const plageDebut = totalCodesParPage - pageInfo.totalCodes + 1;
            const plageFin = totalCodesParPage;
            console.log(`   Page ${pageInfo.page}: ${pageInfo.totalCodes} codes (numéros ${plageDebut}-${plageFin})`);
        });
        
        // 📖 ÉCHANTILLON D'ASSOCIATIONS
        console.log(`\n📖 ÉCHANTILLON D'ASSOCIATIONS (15 premiers):`);
        Array.from(associationsReussies.entries())
            .slice(0, 15)
            .forEach(([numero, code]) => {
                console.log(`   ${numero} → ${code}`);
            });
        
        // 💾 SAUVEGARDER LA LISTE COMPLÈTE
        const resultatsComplets = {
            source: 'Extraction complète optimisée - Toutes pages',
            methode: 'Moteur OCR 2 + Mode Table + 900 DPI',
            dateExtraction: new Date().toISOString(),
            statistiques: {
                totalCodes: tousLesCodesOrdonnes.length,
                totalAssociations: associationsReussies.size,
                tauxReussite: ((associationsReussies.size / 321) * 100).toFixed(1) + '%',
                numerosManquants: numerosManquants
            },
            codesComplets: Array.from(associationsReussies.entries()).map(([numero, code]) => ({
                numero: numero,
                code: code
            })),
            detailParPage: codesParPage
        };
        
        fs.writeFileSync('extraction-complete-321-codes.json', JSON.stringify(resultatsComplets, null, 2));
        console.log(`\n💾 Extraction complète sauvegardée: extraction-complete-321-codes.json`);
        
        // 📤 FORMAT POUR IMPORT DANS L'API
        console.log(`\n📤 CODES AU FORMAT API (${associationsReussies.size} codes):`);
        const codesArray = Array.from(associationsReussies.values());
        
        // Diviser en groupes pour l'affichage
        const taille = 20;
        for (let i = 0; i < codesArray.length; i += taille) {
            const groupe = codesArray.slice(i, i + taille);
            const debut = i + 1;
            const fin = Math.min(i + taille, codesArray.length);
            console.log(`\n// Codes ${debut}-${fin}:`);
            console.log('[');
            groupe.forEach((code, index) => {
                const virgule = index < groupe.length - 1 ? ',' : '';
                console.log(`  '${code}'${virgule}`);
            });
            console.log(']');
        }
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return {
            associations: associationsReussies,
            numerosManquants: numerosManquants,
            totalCodes: tousLesCodesOrdonnes.length,
            codesParPage: codesParPage
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return null;
    }
}

// Lancement de l'extraction complète optimisée
extractionCompleteOptimisee()
    .then(resultats => {
        if (resultats) {
            console.log(`\n🏁 EXTRACTION COMPLÈTE TERMINÉE`);
            console.log(`\n🎯 RÉSULTATS FINAUX:`);
            console.log(`✅ Codes extraits: ${resultats.totalCodes}`);
            console.log(`🔗 Associations: ${resultats.associations.size}/321`);
            console.log(`📊 Taux de réussite: ${((resultats.associations.size / 321) * 100).toFixed(1)}%`);
            
            if (resultats.numerosManquants.length === 0) {
                console.log(`🎉 SUCCÈS PARFAIT ! Tous les 321 codes récupérés !`);
            } else {
                console.log(`⚠️ ${resultats.numerosManquants.length} codes encore manquants`);
            }
            
            console.log(`\n💾 Fichier généré: extraction-complete-321-codes.json`);
            console.log(`📤 Codes prêts pour import dans l'API !`);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 