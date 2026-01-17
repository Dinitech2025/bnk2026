const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Configuration automatique du VPS PostgreSQL\n');

const VPS_IP = '180.149.199.175';
const VPS_USER = 'root';
const VPS_PASS = 'X0D8i6O6b7u1m9m';

// Script à exécuter sur le VPS
const vpsScript = `
echo "1️⃣ Recherche du conteneur PostgreSQL..."
CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)

if [ -z "$CONTAINER" ]; then
  echo "❌ Aucun conteneur PostgreSQL trouvé"
  docker ps -a | grep postgres
  exit 1
fi

echo "✅ Conteneur trouvé: $CONTAINER"
echo ""

echo "2️⃣ Vérification/Création de la base de données..."
docker exec $CONTAINER psql -U postgres -lqt | cut -d \\| -f 1 | grep -qw dinitech-base
if [ $? -ne 0 ]; then
  docker exec $CONTAINER psql -U postgres -c "CREATE DATABASE \\"dinitech-base\\";"
  echo "✅ Base de données créée"
else
  echo "✅ Base de données existe déjà"
fi
echo ""

echo "3️⃣ Configuration de l'accès distant..."
docker exec $CONTAINER bash -c "grep -q \\"listen_addresses = '\\*'\\" /var/lib/postgresql/data/postgresql.conf || echo \\"listen_addresses = '*'\\" >> /var/lib/postgresql/data/postgresql.conf"
docker exec $CONTAINER bash -c "grep -q \\"host.*all.*all.*0.0.0.0/0.*md5\\" /var/lib/postgresql/data/pg_hba.conf || echo \\"host all all 0.0.0.0/0 md5\\" >> /var/lib/postgresql/data/pg_hba.conf"
echo "✅ Configuration PostgreSQL mise à jour"
echo ""

echo "4️⃣ Redémarrage de PostgreSQL..."
docker restart $CONTAINER
sleep 3
echo "✅ PostgreSQL redémarré"
echo ""

echo "5️⃣ Configuration du firewall..."
if command -v ufw &> /dev/null; then
  ufw allow 5432/tcp 2>&1 || echo "ufw déjà configuré"
  echo "✅ Port 5432 ouvert avec ufw"
elif command -v iptables &> /dev/null; then
  iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2>&1 || echo "iptables déjà configuré"
  echo "✅ Port 5432 ouvert avec iptables"
fi
echo ""

echo "6️⃣ Vérification du port..."
netstat -tuln | grep 5432 || ss -tuln | grep 5432
echo ""

echo "✅ Configuration terminée!"
`;

// Sauvegarder le script temporairement
fs.writeFileSync('temp-vps-setup.sh', vpsScript);

console.log('📝 Script créé\n');
console.log('📋 Pour exécuter la configuration, copiez et collez ces commandes:\n');
console.log('1️⃣ Connectez-vous au VPS:');
console.log(`   ssh root@${VPS_IP}`);
console.log(`   Mot de passe: ${VPS_PASS}\n`);

console.log('2️⃣ Puis exécutez ces commandes:\n');
console.log('```bash');
console.log(vpsScript);
console.log('```\n');

console.log('OU utilisez cette commande unique:\n');
console.log(`ssh root@${VPS_IP} << 'ENDSSH'`);
console.log(vpsScript);
console.log('ENDSSH\n');

console.log('📝 Le script a été sauvegardé dans: temp-vps-setup.sh');
console.log('   Vous pouvez le copier manuellement sur le VPS\n');

console.log('⚠️  Note: SSH nécessite une saisie interactive du mot de passe');
console.log('   Utilisez Git Bash ou WSL pour une exécution automatique\n');







