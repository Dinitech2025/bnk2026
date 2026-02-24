const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function analyserNumerosManquants() {
    console.log('🔍 ANALYSE DES NUMÉROS DE SÉQUENCE DT WIFI ZONE (1-321)');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration de conversion optimale
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'numeros500ar',
            page: null,
            density: 600,
            width: 5100,
            height: 6600
        };
        
        console.log('🖼️ Conversion PDF en images...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('numeros500ar'));
        console.log(`📸 ${tempFiles.length} images générées`);
        
        let numerosPresents = new Set();
        let tousLesTextes = [];
        
        // OCR sur toutes les pages avec le meilleur moteur (moteur 2)
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
                    OCREngine: 2  // Meilleur moteur
                });
                
                if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
                    const text = ocrResult.ParsedResults[0].ParsedText;
                    console.log(`📝 Texte extrait: ${text.length} caractères`);
                    
                    tousLesTextes.push(text);
                    
                    // 🎯 EXTRACTION DES NUMÉROS DE SÉQUENCE
                    // Chercher les patterns: [numéro] DT WIFI ZONE
                    const patterns = [
                        /(\d+)\s*DT\s*WIFI\s*ZONE/gi,
                        /(\d+)\s*OT\s*WIFI\s*ZONE/gi,  // OCR peut confondre D et O
                        /(\d+)\s*[DO]T\s*WIFI\s*ZONE/gi,
                        /DT\s*WIFI\s*ZONE.*?(\d+)/gi,
                        /(\d+).*?DT\s*WIFI\s*ZONE/gi,
                    ];
                    
                    patterns.forEach((pattern, idx) => {
                        let match;
                        while ((match = pattern.exec(text)) !== null) {
                            const numero = parseInt(match[1]);
                            if (numero >= 1 && numero <= 321) {
                                numerosPresents.add(numero);
                                console.log(`  🎯 Pattern ${idx + 1}: Numéro ${numero} trouvé`);
                            }
                        }
                    });
                    
                    // 📊 Analyse spécifique des lignes contenant des numéros
                    const lignes = text.split('\n');
                    lignes.forEach(ligne => {
                        if (ligne.includes('DT WIFI ZONE') || ligne.includes('OT WIFI ZONE')) {
                            // Extraire tous les numéros de cette ligne
                            const numeros = ligne.match(/\d+/g);
                            if (numeros) {
                                numeros.forEach(num => {
                                    const numero = parseInt(num);
                                    if (numero >= 1 && numero <= 321) {
                                        numerosPresents.add(numero);
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
        const numerosPresentsArray = Array.from(numerosPresents).sort((a, b) => a - b);
        const numerosManquants = [];
        
        for (let i = 1; i <= 321; i++) {
            if (!numerosPresents.has(i)) {
                numerosManquants.push(i);
            }
        }
        
        console.log(`\n📊 RÉSULTATS DE L'ANALYSE DES NUMÉROS:`);
        console.log(`✅ Numéros présents: ${numerosPresentsArray.length}/321`);
        console.log(`❌ Numéros manquants: ${numerosManquants.length}/321`);
        console.log(`📊 Taux de présence: ${((numerosPresentsArray.length / 321) * 100).toFixed(1)}%`);
        
        if (numerosPresentsArray.length > 0) {
            console.log(`\n🎯 PREMIERS NUMÉROS PRÉSENTS:`);
            console.log(numerosPresentsArray.slice(0, 20).join(', ') + 
                       (numerosPresentsArray.length > 20 ? '...' : ''));
            
            console.log(`\n🎯 DERNIERS NUMÉROS PRÉSENTS:`);
            console.log(numerosPresentsArray.slice(-10).join(', '));
        }
        
        if (numerosManquants.length > 0) {
            console.log(`\n❌ NUMÉROS MANQUANTS (${numerosManquants.length}):`);
            if (numerosManquants.length <= 50) {
                // Afficher tous si pas trop nombreux
                console.log(numerosManquants.join(', '));
            } else {
                // Afficher par groupes
                console.log('Premiers manquants:', numerosManquants.slice(0, 20).join(', ') + '...');
                console.log('Derniers manquants:', numerosManquants.slice(-20).join(', '));
            }
            
            // 🔍 ANALYSE DES PLAGES MANQUANTES
            console.log(`\n📈 ANALYSE DES PLAGES MANQUANTES:`);
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
            
            console.log(`🎯 Plages manquantes: ${plages.join(', ')}`);
        }
        
        // 📊 ÉCHANTILLON DU TEXTE OCR pour vérification
        console.log(`\n📖 ÉCHANTILLON DU TEXTE OCR (pour vérification):`);
        const texteComplet = tousLesTextes.join(' ');
        const lignesAvecNumeros = texteComplet.split(/[\n\r]/)
            .filter(ligne => ligne.includes('DT WIFI ZONE') || ligne.includes('OT WIFI ZONE'))
            .slice(0, 10);
        
        lignesAvecNumeros.forEach((ligne, i) => {
            console.log(`  ${i + 1}. ${ligne.trim()}`);
        });
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
        return {
            presentes: numerosPresentsArray,
            manquants: numerosManquants,
            total: 321
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return null;
    }
}

// Lancement de l'analyse
analyserNumerosManquants()
    .then(resultats => {
        if (resultats) {
            console.log(`\n🏁 ANALYSE TERMINÉE`);
            console.log(`✅ ${resultats.presentes.length} numéros présents`);
            console.log(`❌ ${resultats.manquants.length} numéros manquants`);
            console.log(`🎯 Codes manqués: ${resultats.manquants.join(', ')}`);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 
 