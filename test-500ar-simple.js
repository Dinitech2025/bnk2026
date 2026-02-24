const fs = require('fs');
const pdfParse = require('pdf-parse');

async function analyzeAndExtract500ArPDF() {
    console.log('🧪 Analyse directe du PDF 500Ar2.pdf');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Fichier PDF non trouvé:', pdfPath);
        return;
    }
    
    console.log('📄 Fichier trouvé:', pdfPath);
    const stats = fs.statSync(pdfPath);
    console.log('📊 Taille:', stats.size, 'bytes');
    
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        console.log('🔄 Parsing PDF...');
        
        const data = await pdfParse(dataBuffer);
        
        console.log('📄 Pages:', data.numpages);
        console.log('📝 Texte extrait:', data.text.length, 'caractères');
        
        if (data.text.length === 0) {
            console.log('⚠️  PDF basé sur des images - pas de texte extractible');
            console.log('🧠 Pour ce type de PDF, l\'OCR est nécessaire');
            return;
        }
        
        // Test des patterns pour tickets 500Ar (30min)
        console.log('\n🔍 Recherche de codes avec patterns adaptatifs...');
        
        const patterns = [
            { name: '30m + codes', regex: /30m[A-Za-z0-9]{3,8}/g },
            { name: '30min + codes', regex: /30min[A-Za-z0-9]{3,8}/g },
            { name: '500 + codes', regex: /500[A-Za-z0-9]{4,8}/g },
            { name: 'Codes génériques', regex: /[A-Za-z0-9]{8,12}/g }
        ];
        
        let allCodes = [];
        
        patterns.forEach((pattern, idx) => {
            const matches = data.text.match(pattern.regex);
            if (matches && matches.length > 0) {
                console.log(`🎯 ${pattern.name}: ${matches.length} trouvés`);
                console.log('📋 Exemples:', matches.slice(0, 5));
                allCodes = [...allCodes, ...matches];
            } else {
                console.log(`❌ ${pattern.name}: 0 trouvé`);
            }
        });
        
        // Suppression des doublons
        const uniqueCodes = [...new Set(allCodes)];
        
        console.log(`\n📊 RÉSULTATS:`);
        console.log(`🎫 Total codes bruts: ${allCodes.length}`);
        console.log(`✨ Codes uniques: ${uniqueCodes.length}`);
        
        if (uniqueCodes.length > 0) {
            console.log('\n🎯 Tous les codes extraits:');
            uniqueCodes.forEach((code, i) => {
                console.log(`  ${i + 1}. ${code}`);
            });
        }
        
        return uniqueCodes;
        
    } catch (error) {
        console.error('❌ Erreur lors du parsing:', error.message);
        console.log('🔧 Ce PDF nécessite probablement l\'OCR');
        return [];
    }
}

// Lancement du test
analyzeAndExtract500ArPDF()
    .then(codes => {
        console.log(`\n🏁 EXTRACTION TERMINÉE: ${codes?.length || 0} codes extraits du PDF 500Ar2.pdf`);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 