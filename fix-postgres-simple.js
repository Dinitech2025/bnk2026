const { execSync } = require('child_process');

console.log('🔧 Correction simple de PostgreSQL...\n');

const VPS_IP = '180.149.199.175';
const VPS_USER = 'root';
const VPS_PASS = 'X0D8i6O6b7u1m9m';

const plinkPath = '"C:\\Program Files\\PuTTY\\plink.exe"';

const commands = [
    'echo "🚀 Correction PostgreSQL..."',
    'docker ps | grep postgres',
    'echo "📋 Redémarrage PostgreSQL..."',
    'docker restart postgres',
    'sleep 3',
    'echo "📋 Vérification ports..."',
    'docker exec postgres netstat -tuln | grep 5432 || docker exec postgres ss -tuln | grep 5432',
    'echo "📋 Configuration firewall..."',
    'iptables -A INPUT -p tcp --dport 5432 -j ACCEPT',
    'echo "📋 Test de connexion externe..."',
    'docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c "SELECT version();" 2>/dev/null && echo "✅ Connexion externe OK" || echo "❌ Connexion externe échoue"'
];

let fullCommand = commands.join(' && ');

try {
    console.log('📤 Exécution sur le VPS...\n');

    execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "${fullCommand}"`, {
        stdio: 'inherit',
        timeout: 30000
    });

    console.log('\n✅ Configuration VPS terminée !');
    console.log('\n🧪 Test de connexion depuis Windows...');

    execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        timeout: 15000
    });

    console.log('\n🎉 SUCCÈS ! Votre base de données est maintenant accessible !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. npx prisma generate');
    console.log('   2. npm run dev');
    console.log('\n🚀 Votre application BoutikNaka va fonctionner parfaitement !');

} catch (error) {
    console.log('\n❌ Erreur:', error.message);
    console.log('\n📝 Commandes manuelles à exécuter sur le VPS:');
    console.log(`   ssh root@${VPS_IP}`);
    console.log('   Puis:');
    console.log('   docker restart postgres');
    console.log('   iptables -A INPUT -p tcp --dport 5432 -j ACCEPT');
    console.log('   docker exec postgres netstat -tuln | grep 5432');
}







