const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function trouverNumerosManquantsPrecis() {
    console.log('🎯 IDENTIFICATION PRÉCISE DES 34 NUMÉROS MANQUANTS');
    console.log('📊 Nous avons extrait 287 codes sur 321 attendus');
    console.log('🔍 Cherchons les 34 numéros correspondant aux codes manquants...\n');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration optimale pour OCR maximum
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'precise_analysis',
            page: null,
            density: 900,  // Résolution maximale
            width: 7650,   // Plus grande largeur
            height: 9900   // Plus grande hauteur
        };
        
        console.log('🖼️ Conversion PDF en images haute résolution...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('precise_analysis'));
        console.log(`📸 ${tempFiles.length} images générées en haute résolution\n`);
        
        let codesParPage = new Map();      // Page → codes extraits
        let numerosParPage = new Map();    // Page → numéros détectés  
        let associationsPage = new Map();  // Page → associations numéro→code
        let lignesCompletes = [];          // Toutes les lignes avec contexte
        
        // OCR page par page avec analyse détaillée
        for (let i = 0; i < tempFiles.length; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            const pageNum = i + 1;
            
            console.log(`🔍 ANALYSE DÉTAILLÉE - Page ${pageNum}/${tempFiles.length}:`);
            
            try {
                const ocrResult = await ocrSpace(imagePath, {
                    apiKey: API_KEY_OCR,
                    language: 'eng',
                    isOverlayRequired: false,
                    detectOrientation: true,
                    scale: true,
                    isTable: false,
                    OCREngine: 2  // Moteur le plus performant
                });
                
                if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
                    const text = ocrResult.ParsedResults[0].ParsedText;
                    
                    // 🎯 EXTRACTION DES CODES
                    const codes = text.match(/30m1G[A-Za-z0-9]{4}\b/g) || [];
                    codesParPage.set(pageNum, codes);
                    console.log(`   📱 ${codes.length} codes extraits`);
                    
                    // 🔢 RECHERCHE SYSTÉMATIQUE DES NUMÉROS DE SÉQUENCE
                    const lignes = text.split('\n');
                    const numerosPage = new Set();
                    const associationsPageActuelle = new Map();
                    
                    // Analyser chaque ligne individuellement
                    for (let j = 0; j < lignes.length; j++) {
                        const ligne = lignes[j].trim();
                        if (ligne.length === 0) continue;
                        
                        // Chercher des numéros 1-321 dans cette ligne
                        const numeros = ligne.match(/\b([1-9]|[1-9][0-9]|[1-2][0-9][0-9]|3[0-1][0-9]|32[01])\b/g);
                        const codesLigne = ligne.match(/30m1G[A-Za-z0-9]{4}\b/g);
                        
                        if (numeros) {
                            numeros.forEach(numStr => {
                                const num = parseInt(numStr);
                                if (num >= 1 && num <= 321) {
                                    numerosPage.add(num);
                                    
                                    // Essayer d'associer avec un code sur la même ligne ou lignes voisines
                                    let codeAssocie = null;
                                    
                                    // 1. Code sur la même ligne
                                    if (codesLigne && codesLigne.length > 0) {
                                        codeAssocie = codesLigne[0];
                                    }
                                    // 2. Code sur la ligne suivante
                                    else if (j + 1 < lignes.length) {
                                        const ligneSuivante = lignes[j + 1].trim();
                                        const codesSuivants = ligneSuivante.match(/30m1G[A-Za-z0-9]{4}\b/g);
                                        if (codesSuivants && codesSuivants.length > 0) {
                                            codeAssocie = codesSuivants[0];
                                        }
                                    }
                                    // 3. Code sur la ligne précédente
                                    else if (j > 0) {
                                        const lignePrecedente = lignes[j - 1].trim();
                                        const codesPrecedents = lignePrecedente.match(/30m1G[A-Za-z0-9]{4}\b/g);
                                        if (codesPrecedents && codesPrecedents.length > 0) {
                                            codeAssocie = codesPrecedents[0];
                                        }
                                    }
                                    
                                    if (codeAssocie) {
                                        associationsPageActuelle.set(num, codeAssocie);
                                    }
                                    
                                    // Enregistrer la ligne complète pour debug
                                    lignesCompletes.push({
                                        page: pageNum,
                                        ligne: j + 1,
                                        numero: num,
                                        code: codeAssocie,
                                        texte: ligne,
                                        context: [
                                            j > 0 ? lignes[j-1].trim() : '',
                                            ligne,
                                            j + 1 < lignes.length ? lignes[j+1].trim() : ''
                                        ].filter(l => l.length > 0)
                                    });
                                }
                            });
                        }
                    }
                    
                    numerosParPage.set(pageNum, Array.from(numerosPage));
                    associationsPage.set(pageNum, associationsPageActuelle);
                    
                    console.log(`   🔢 ${numerosPage.size} numéros détectés`);
                    console.log(`   🔗 ${associationsPageActuelle.size} associations numéro→code`);
                    
                    // Montrer quelques associations trouvées
                    if (associationsPageActuelle.size > 0) {
                        const echantillonAssociations = Array.from(associationsPageActuelle.entries()).slice(0, 3);
                        console.log(`   📋 Échantillon: ${echantillonAssociations.map(([n, c]) => `${n}→${c}`).join(', ')}`);
                    }
                    
                    console.log('');
                }
                
                // Pause entre pages
                if (i < tempFiles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (ocrError) {
                console.log(`❌ Erreur OCR page ${pageNum}:`, ocrError.message);
            }
        }
        
        // 📊 COMPILATION DES RÉSULTATS
        console.log('📊 COMPILATION DES RÉSULTATS:\n');
        
        const tousLesCodes = new Set();
        const tousLesNumeros = new Set();
        const toutesLesAssociations = new Map();
        
        // Compiler toutes les données
        codesParPage.forEach((codes, page) => {
            codes.forEach(code => tousLesCodes.add(code));
        });
        
        numerosParPage.forEach((numeros, page) => {
            numeros.forEach(num => tousLesNumeros.add(num));
        });
        
        associationsPage.forEach((associations, page) => {
            associations.forEach((code, numero) => {
                if (!toutesLesAssociations.has(numero)) {
                    toutesLesAssociations.set(numero, code);
                }
            });
        });
        
        console.log(`✅ Total codes extraits: ${tousLesCodes.size}`);
        console.log(`🔢 Total numéros détectés: ${tousLesNumeros.size}`);
        console.log(`🔗 Total associations: ${toutesLesAssociations.size}\n`);
        
        // 🎯 IDENTIFIER LES NUMÉROS MANQUANTS
        const numerosAvecCodes = Array.from(toutesLesAssociations.keys()).sort((a, b) => a - b);
        const numerosManquants = [];
        
        for (let i = 1; i <= 321; i++) {
            if (!toutesLesAssociations.has(i)) {
                numerosManquants.push(i);
            }
        }
        
        console.log(`🎯 RÉSULTATS FINAUX:`);
        console.log(`✅ Numéros avec codes récupérés: ${numerosAvecCodes.length}`);
        console.log(`❌ Numéros sans codes: ${numerosManquants.length}`);
        console.log(`🎯 Écart: ${321 - numerosAvecCodes.length} (attendu: 34)\n`);
        
        // Afficher les numéros manquants
        if (numerosManquants.length > 0) {
            console.log(`❌ NUMÉROS DONT LES CODES N'ONT PAS ÉTÉ RÉCUPÉRÉS:`);
            
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
            
            console.log(`🎯 Numéros: ${numerosManquants.join(', ')}`);
            console.log(`📈 Plages: ${plages.join(', ')}\n`);
        }
        
        // Échantillon des associations réussies
        console.log(`📖 ÉCHANTILLON D'ASSOCIATIONS RÉUSSIES:`);
        Array.from(toutesLesAssociations.entries())
            .sort(([a], [b]) => a - b)
            .slice(0, 10)
            .forEach(([numero, code]) => {
                console.log(`   ${numero} → ${code}`);
            });
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return {
            numerosManquants: numerosManquants,
            numerosAvecCodes: numerosAvecCodes,
            totalCodes: tousLesCodes.size,
            totalAssociations: toutesLesAssociations.size
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return null;
    }
}

// Lancement de l'analyse
trouverNumerosManquantsPrecis()
    .then(resultats => {
        if (resultats) {
            console.log(`\n🏁 ANALYSE TERMINÉE`);
            console.log(`\n🎯 LES ${resultats.numerosManquants.length} NUMÉROS DONT LES CODES N'ONT PAS ÉTÉ RÉCUPÉRÉS:`);
            console.log(`${resultats.numerosManquants.join(', ')}`);
            
            console.log(`\n📊 STATISTIQUES:`);
            console.log(`✅ Associations réussies: ${resultats.numerosAvecCodes.length}/321`);
            console.log(`❌ Associations manquées: ${resultats.numerosManquants.length}/321`);
            console.log(`📱 Codes extraits: ${resultats.totalCodes}`);
            console.log(`🎯 Taux de réussite: ${((resultats.numerosAvecCodes.length / 321) * 100).toFixed(1)}%`);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 