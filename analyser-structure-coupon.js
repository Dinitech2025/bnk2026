const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function analyserStructureCoupon() {
    console.log('🎯 ANALYSE STRUCTURE COUPON : Numéro → "Coupon" → Code');
    console.log('📋 Structure attendue:');
    console.log('   1. DT WIFI ZONE + numéro');
    console.log('   2. Coupon');
    console.log('   3. Code du ticket');
    console.log('   4. 30m 1 GiB 500Ar\n');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration optimale
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'structure_analysis',
            page: null,
            density: 600,
            width: 5100,
            height: 6600
        };
        
        console.log('🖼️ Conversion PDF en images...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('structure_analysis'));
        console.log(`📸 ${tempFiles.length} images générées\n`);
        
        let associationsReussies = new Map();  // Numéro → Code
        let numerosDetectes = new Set();       // Tous les numéros trouvés
        let codesDetectes = new Set();         // Tous les codes trouvés
        let detailsAnalyse = [];               // Détails pour debug
        
        // OCR page par page
        for (let i = 0; i < tempFiles.length; i++) {
            const imagePath = path.join('./temp/', tempFiles[i]);
            const pageNum = i + 1;
            
            console.log(`🔍 ANALYSE Page ${pageNum}/${tempFiles.length}:`);
            
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
                    const lignes = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    
                    console.log(`   📝 ${lignes.length} lignes de texte extraites`);
                    
                    // Analyser ligne par ligne selon la structure
                    for (let j = 0; j < lignes.length; j++) {
                        const ligne = lignes[j];
                        
                        // 🔍 CHERCHER "DT WIFI ZONE" + numéro
                        if (ligne.includes('DT WIFI ZONE') || ligne.includes('OT WIFI ZONE')) {
                            // Extraire le numéro
                            const numeroMatch = ligne.match(/\b([1-9]|[1-9][0-9]|[1-2][0-9][0-9]|3[0-1][0-9]|32[01])\b/);
                            
                            if (numeroMatch) {
                                const numero = parseInt(numeroMatch[1]);
                                if (numero >= 1 && numero <= 321) {
                                    numerosDetectes.add(numero);
                                    
                                    // 🔍 CHERCHER "Coupon" dans les lignes suivantes
                                    let ligneCode = null;
                                    
                                    // Chercher "Coupon" dans les 5 lignes suivantes
                                    for (let k = j + 1; k <= Math.min(j + 5, lignes.length - 1); k++) {
                                        if (lignes[k].toLowerCase().includes('coupon')) {
                                            // 🎯 CHERCHER LE CODE dans les lignes suivantes du "Coupon"
                                            for (let l = k + 1; l <= Math.min(k + 3, lignes.length - 1); l++) {
                                                const codeMatch = lignes[l].match(/30m1G[A-Za-z0-9]{4}\b/);
                                                if (codeMatch) {
                                                    ligneCode = codeMatch[0];
                                                    break;
                                                }
                                            }
                                            break;
                                        }
                                    }
                                    
                                    if (ligneCode) {
                                        associationsReussies.set(numero, ligneCode);
                                        codesDetectes.add(ligneCode);
                                        
                                        detailsAnalyse.push({
                                            page: pageNum,
                                            numero: numero,
                                            code: ligneCode,
                                            contexte: {
                                                ligneNumero: ligne,
                                                lignesCoupon: lignes.slice(j + 1, Math.min(j + 6, lignes.length))
                                            }
                                        });
                                    } else {
                                        // Numéro trouvé mais pas de code associé
                                        detailsAnalyse.push({
                                            page: pageNum,
                                            numero: numero,
                                            code: null,
                                            contexte: {
                                                ligneNumero: ligne,
                                                lignesSuivantes: lignes.slice(j + 1, Math.min(j + 6, lignes.length))
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        
                        // 📱 COMPTER TOUS LES CODES (pour vérification)
                        const codesLigne = ligne.match(/30m1G[A-Za-z0-9]{4}\b/g);
                        if (codesLigne) {
                            codesLigne.forEach(code => codesDetectes.add(code));
                        }
                    }
                    
                    console.log(`   🔢 Numéros détectés sur cette page: ${Array.from(numerosDetectes).filter(n => detailsAnalyse.some(d => d.page === pageNum && d.numero === n)).length}`);
                    console.log(`   🎯 Associations réussies sur cette page: ${Array.from(associationsReussies.entries()).filter(([n, c]) => detailsAnalyse.some(d => d.page === pageNum && d.numero === n && d.code === c)).length}`);
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
        
        // 📊 ANALYSE DES RÉSULTATS
        console.log('\n📊 RÉSULTATS DE L\'ANALYSE:');
        console.log(`🔢 Total numéros détectés: ${numerosDetectes.size}`);
        console.log(`📱 Total codes détectés: ${codesDetectes.size}`);
        console.log(`🔗 Associations réussies: ${associationsReussies.size}`);
        console.log(`🎯 Taux d'association: ${((associationsReussies.size / numerosDetectes.size) * 100).toFixed(1)}%`);
        
        // 🎯 IDENTIFIER LES NUMÉROS MANQUANTS
        const numerosManquants = [];
        for (let i = 1; i <= 321; i++) {
            if (!associationsReussies.has(i)) {
                numerosManquants.push(i);
            }
        }
        
        console.log(`\n❌ NUMÉROS SANS CODES ASSOCIÉS: ${numerosManquants.length}/321`);
        
        if (numerosManquants.length > 0) {
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
            
            console.log(`🎯 Numéros manquants: ${numerosManquants.slice(0, 50).join(', ')}${numerosManquants.length > 50 ? '...' : ''}`);
            console.log(`📈 Plages manquantes: ${plages.join(', ')}`);
        }
        
        // 📖 ÉCHANTILLON D'ASSOCIATIONS RÉUSSIES
        console.log(`\n📖 ÉCHANTILLON D'ASSOCIATIONS RÉUSSIES (${Math.min(10, associationsReussies.size)}):`);
        Array.from(associationsReussies.entries())
            .sort(([a], [b]) => a - b)
            .slice(0, 10)
            .forEach(([numero, code]) => {
                console.log(`   ${numero} → ${code}`);
            });
        
        // 🔍 ÉCHANTILLON DE NUMÉROS SANS CODES
        const numerosSansCodes = Array.from(numerosDetectes).filter(n => !associationsReussies.has(n));
        if (numerosSansCodes.length > 0) {
            console.log(`\n⚠️ ÉCHANTILLON DE NUMÉROS DÉTECTÉS MAIS SANS CODES (${Math.min(5, numerosSansCodes.length)}):`);
            numerosSansCodes.slice(0, 5).forEach(numero => {
                const detail = detailsAnalyse.find(d => d.numero === numero && !d.code);
                if (detail) {
                    console.log(`   ${numero}: "${detail.contexte.ligneNumero}"`);
                    console.log(`      Lignes suivantes: ${detail.contexte.lignesSuivantes.slice(0, 3).join(' | ')}`);
                }
            });
        }
        
        // 🎯 STATISTIQUES FINALES
        console.log(`\n📊 STATISTIQUES FINALES:`);
        console.log(`🎯 Total tickets attendus: 321`);
        console.log(`✅ Associations trouvées: ${associationsReussies.size} (${((associationsReussies.size / 321) * 100).toFixed(1)}%)`);
        console.log(`❌ Codes non récupérés: ${321 - associationsReussies.size}`);
        console.log(`📱 Codes totaux extraits: ${codesDetectes.size}`);
        console.log(`🔢 Numéros totaux détectés: ${numerosDetectes.size}`);
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return {
            associationsReussies: associationsReussies,
            numerosManquants: numerosManquants,
            totalCodes: codesDetectes.size,
            totalNumeros: numerosDetectes.size
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return null;
    }
}

// Lancement de l'analyse
analyserStructureCoupon()
    .then(resultats => {
        if (resultats) {
            console.log(`\n🏁 ANALYSE TERMINÉE`);
            console.log(`\n🎯 LES ${resultats.numerosManquants.length} NUMÉROS DONT LES CODES N'ONT PAS ÉTÉ RÉCUPÉRÉS:`);
            
            if (resultats.numerosManquants.length <= 50) {
                console.log(`${resultats.numerosManquants.join(', ')}`);
            } else {
                console.log(`Premiers 25: ${resultats.numerosManquants.slice(0, 25).join(', ')}`);
                console.log(`Derniers 25: ${resultats.numerosManquants.slice(-25).join(', ')}`);
            }
            
            console.log(`\n📊 RÉSUMÉ:`);
            console.log(`✅ Taux de réussite: ${((resultats.associationsReussies.size / 321) * 100).toFixed(1)}%`);
            console.log(`📱 ${resultats.totalCodes} codes au total extraits`);
            console.log(`🔢 ${resultats.totalNumeros} numéros au total détectés`);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 