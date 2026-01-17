const fs = require('fs');

console.log('🔧 Correction de l\'encodage du mot de passe...\n');

// Le mot de passe contient @ qui doit être encodé différemment
const CORRECT_URL = 'postgresql://admin:dinyoili%40PJB24@localhost:5433/dinitech-base?schema=public';

const files = ['.env', '.env.local'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        
        if (content.includes('DATABASE_URL=')) {
            content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${CORRECT_URL}"`);
            fs.writeFileSync(file, content);
            console.log(`✅ ${file} corrigé`);
        }
    }
});

console.log('\n📋 URL corrigée:');
console.log('   postgresql://admin:dinyoili@PJB24@localhost:5433/dinitech-base');
console.log('\n✅ Mot de passe correctement encodé !');
console.log('\n🧪 Testez maintenant:');
console.log('   npx prisma db push');







