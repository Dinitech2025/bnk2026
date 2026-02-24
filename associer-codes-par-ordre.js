const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function associerCodesParOrdre() {
    console.log('🎯 ASSOCIATION DES CODES PAR ORDRE SÉQUENTIEL');
    console.log('📋 Logique: Les codes apparaissent dans l\'ordre 1, 2, 3... même si les numéros ne sont pas détectés');
    console.log('🔍 Nous allons extraire tous les codes dans l\'ordre et les associer aux numéros 1-321\n');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration standard
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'ordre_analysis',
            page: null,
            density: 600,
            width: 5100,
            height: 6600
        };
        
        console.log('🖼️ Conversion PDF en images...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('ordre_analysis'));
        console.log(`📸 ${tempFiles.length} images générées\n`);
        
        let tousLesCodesOrdonnes = [];  // Tous les codes dans l'ordre d'apparition
        let numerosDetectes = [];       // Numéros séparés détectés
        
        // OCR page par page pour extraire tous les codes
        for (let i = 0; i < tempFiles.length; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            const pageNum = i + 1;
            
            console.log(`🔍 EXTRACTION Page ${pageNum}/${tempFiles.length}:`);
            
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
                    const lignes = text.split('\n');
                    
                    // Extraire tous les codes dans l'ordre d'apparition
                    const codesPage = [];
                    const numerosPage = [];
                    
                    lignes.forEach((ligne, lineIndex) => {
                        const ligneClean = ligne.trim();
                        
                        // 📱 EXTRAIRE LES CODES
                        const codesMatch = ligneClean.match(/30m1G[A-Za-z0-9]{4}\b/g);
                        if (codesMatch) {
                            codesMatch.forEach(code => {
                                codesPage.push({
                                    code: code,
                                    page: pageNum,
                                    ligne: lineIndex + 1,
                                    ordreGlobal: tousLesCodesOrdonnes.length + codesPage.length
                                });
                            });
                        }
                        
                        // 🔢 EXTRAIRE LES NUMÉROS SÉPARÉS (pour vérification)
                        if (ligneClean.match(/^\d+$/)) {
                            const num = parseInt(ligneClean);
                            if (num >= 1 && num <= 321) {
                                numerosPage.push({
                                    numero: num,
                                    page: pageNum,
                                    ligne: lineIndex + 1
                                });
                            }
                        }
                    });
                    
                    tousLesCodesOrdonnes.push(...codesPage);
                    numerosDetectes.push(...numerosPage);
                    
                    console.log(`   📱 ${codesPage.length} codes extraits`);
                    console.log(`   🔢 ${numerosPage.length} numéros séparés détectés`);
                    
                    // Afficher quelques codes de cette page
                    if (codesPage.length > 0) {
                        const echantillon = codesPage.slice(0, 3).map(c => c.code).join(', ');
                        console.log(`   📋 Échantillon: ${echantillon}`);
                    }
                }
                
                // Pause entre pages
                if (i < tempFiles.length - 1) {
                    console.log('   ⏳ Pause de 2 secondes...\n');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (ocrError) {
                console.log(`❌ Erreur OCR page ${pageNum}:`, ocrError.message);
            }
        }
        
        // 📊 ASSOCIATION PAR ORDRE
        console.log('\n📊 RÉSULTATS DE L\'EXTRACTION:');
        console.log(`📱 Total codes extraits: ${tousLesCodesOrdonnes.length}`);
        console.log(`🔢 Total numéros détectés: ${numerosDetectes.length}`);
        
        // Créer les associations en supposant que les codes sont dans l'ordre 1, 2, 3...
        const associations = new Map();
        const codesRecuperes = [];
        const numerosManquants = [];
        
        // Associer chaque code à son numéro séquentiel
        tousLesCodesOrdonnes.forEach((codeInfo, index) => {
            const numeroAssocie = index + 1; // Numéro 1, 2, 3, etc.
            if (numeroAssocie <= 321) {
                associations.set(numeroAssocie, codeInfo.code);
                codesRecuperes.push(numeroAssocie);
            }
        });
        
        // Identifier les numéros manquants
        for (let i = 1; i <= 321; i++) {
            if (!associations.has(i)) {
                numerosManquants.push(i);
            }
        }
        
        console.log(`\n🎯 ASSOCIATIONS CRÉÉES:`);
        console.log(`✅ Codes associés: ${associations.size}`);
        console.log(`❌ Numéros manquants: ${numerosManquants.length}`);
        console.log(`🎯 Taux de réussite: ${((associations.size / 321) * 100).toFixed(1)}%`);
        
        // Afficher les associations créées
        if (associations.size > 0) {
            console.log(`\n📖 ÉCHANTILLON D'ASSOCIATIONS (10 premiers):`);
            Array.from(associations.entries())
                .slice(0, 10)
                .forEach(([numero, code]) => {
                    console.log(`   ${numero} → ${code}`);
                });
        }
        
        // Afficher les numéros manquants
        if (numerosManquants.length > 0) {
            console.log(`\n❌ NUMÉROS MANQUANTS (${numerosManquants.length}):`);
            
            // Grouper par plages
            let plages = [];
            let debut = numerosManquants[0];
            let fin = numerosManquants[0];
            
            for (let i = 1; i < numerosManquants.length; i++) {
                if (numerosManquants[i] === fin + 1) {
                    fin = numerosManquants[i];
                } else {
                    if (debut === fin) {
                        plages.push(`${debut}`);
                    } else {
                        plages.push(`${debut}-${fin}`);
                    }
                    debut = fin = numerosManquants[i];
                }
            }
            
            if (debut === fin) {
                plages.push(`${debut}`);
            } else {
                plages.push(`${debut}-${fin}`);
            }
            
            if (numerosManquants.length <= 50) {
                console.log(`🎯 Numéros: ${numerosManquants.join(', ')}`);
            } else {
                console.log(`🎯 Premiers 25: ${numerosManquants.slice(0, 25).join(', ')}`);
                console.log(`🎯 Derniers 25: ${numerosManquants.slice(-25).join(', ')}`);
            }
            console.log(`📈 Plages: ${plages.join(', ')}`);
        }
        
        // 📊 VÉRIFICATION avec les numéros détectés séparément
        if (numerosDetectes.length > 0) {
            console.log(`\n🔍 VÉRIFICATION avec numéros détectés séparément:`);
            const numerosDetectesUniques = [...new Set(numerosDetectes.map(n => n.numero))].sort((a, b) => a - b);
            console.log(`🔢 Numéros uniques détectés: ${numerosDetectesUniques.length}`);
            console.log(`📋 Échantillon: ${numerosDetectesUniques.slice(0, 20).join(', ')}`);
            
            // Voir si l'ordre correspond
            console.log(`\n🎯 Comparaison ordre vs numéros détectés:`);
            console.log(`   Codes extraits: ${tousLesCodesOrdonnes.length}`);
            console.log(`   Numéros détectés: ${numerosDetectesUniques.length}`);
            console.log(`   Différence: ${Math.abs(tousLesCodesOrdonnes.length - numerosDetectesUniques.length)}`);
        }
        
        // 🎯 STATISTIQUES FINALES
        console.log(`\n📊 STATISTIQUES FINALES:`);
        console.log(`🎯 Total tickets attendus: 321`);
        console.log(`✅ Codes extraits et associés: ${associations.size} (${((associations.size / 321) * 100).toFixed(1)}%)`);
        console.log(`❌ Codes non récupérés: ${321 - associations.size}`);
        console.log(`📱 Total codes bruts extraits: ${tousLesCodesOrdonnes.length}`);
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return {
            associations: associations,
            numerosManquants: numerosManquants,
            totalCodesExtraits: tousLesCodesOrdonnes.length,
            codesDetails: tousLesCodesOrdonnes
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return null;
    }
}

// Lancement de l'analyse
associerCodesParOrdre()
    .then(resultats => {
        if (resultats) {
            console.log(`\n🏁 ANALYSE TERMINÉE`);
            console.log(`\n🎯 RÉPONSE À VOTRE QUESTION:`);
            console.log(`"Quels numéros n'ont pas été récupérés dans l'extraction ?"`);
            console.log(`\n❌ LES ${resultats.numerosManquants.length} NUMÉROS DONT LES CODES N'ONT PAS ÉTÉ RÉCUPÉRÉS:`);
            
            if (resultats.numerosManquants.length <= 50) {
                console.log(`${resultats.numerosManquants.join(', ')}`);
            } else {
                console.log(`Premiers 25: ${resultats.numerosManquants.slice(0, 25).join(', ')}`);
                console.log(`Derniers 25: ${resultats.numerosManquants.slice(-25).join(', ')}`);
            }
            
            console.log(`\n📊 RÉSUMÉ:`);
            console.log(`✅ Récupérés: ${resultats.associations.size}/321 (${((resultats.associations.size / 321) * 100).toFixed(1)}%)`);
            console.log(`❌ Non récupérés: ${resultats.numerosManquants.length}/321`);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 