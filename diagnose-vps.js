const { execSync } = require('child_process');

console.log('🔍 Diagnostic complet du VPS PostgreSQL...\n');

const VPS_IP = '180.149.199.175';
const VPS_USER = 'root';
const VPS_PASS = 'X0D8i6O6b7u1m9m';

const plinkPath = '"C:\\Program Files\\PuTTY\\plink.exe"';

try {
    console.log('📋 Vérification du conteneur...');
    const containerCheck = execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "docker ps | grep postgres"`, {
        encoding: 'utf8',
        timeout: 10000
    });
    console.log('✅ Conteneur PostgreSQL trouvé');
    console.log('📋 Détails:', containerCheck.trim());

    console.log('\n📋 Vérification des ports...');
    const portCheck = execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "docker exec postgres netstat -tuln | grep 5432 || docker exec postgres ss -tuln | grep 5432"`, {
        encoding: 'utf8',
        timeout: 10000
    });
    console.log('📋 Ports PostgreSQL:', portCheck.trim() || '❌ Aucun port 5432 trouvé');

    console.log('\n📋 Vérification des fichiers de configuration...');
    const configCheck = execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "docker exec postgres find / -name postgresql.conf -o -name pg_hba.conf 2>/dev/null"`, {
        encoding: 'utf8',
        timeout: 10000
    });
    console.log('📋 Fichiers config:', configCheck.trim());

    console.log('\n📋 Vérification du firewall...');
    const firewallCheck = execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "iptables -L | grep 5432 || ufw status | grep 5432"`, {
        encoding: 'utf8',
        timeout: 10000
    });
    console.log('📋 Firewall:', firewallCheck.trim() || '❌ Port 5432 non ouvert');

    console.log('\n📋 Test de connexion local...');
    const localTest = execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "docker exec postgres psql -U postgres -h localhost -p 5432 -c \"SELECT version();\" 2>/dev/null && echo \"✅ Connexion locale OK\" || echo \"❌ Connexion locale échoue\""`, {
        encoding: 'utf8',
        timeout: 10000
    });
    console.log('📋 Test local:', localTest.trim());

    console.log('\n📋 Test de connexion externe...');
    const externalTest = execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "docker exec postgres psql -U postgres -h 0.0.0.0 -p 5432 -c \"SELECT 1;\" 2>/dev/null && echo \"✅ Connexion externe OK\" || echo \"❌ Connexion externe échoue\""`, {
        encoding: 'utf8',
        timeout: 10000
    });
    console.log('📋 Test externe:', externalTest.trim());

    console.log('\n📋 Configuration actuelle...');
    const configContent = execSync(`${plinkPath} -ssh -pw ${VPS_PASS} ${VPS_USER}@${VPS_IP} "docker exec postgres find / -name postgresql.conf 2>/dev/null | head -1 | xargs -I {} docker exec postgres grep \"listen_addresses\" {} 2>/dev/null || echo \"Non configuré\""`, {
        encoding: 'utf8',
        timeout: 10000
    });
    console.log('📋 listen_addresses:', configContent.trim());

} catch (error) {
    console.log('\n❌ Erreur lors du diagnostic:', error.message);
    console.log('\n📝 Solutions:');
    console.log('   1. Connectez-vous manuellement: ssh root@180.149.199.175');
    console.log('   2. Exécutez les commandes de diagnostic');
    console.log('   3. Vérifiez la configuration PostgreSQL');
}







