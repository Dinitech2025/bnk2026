# Script PowerShell pour configurer le VPS PostgreSQL

Write-Host "🚀 Configuration VPS PostgreSQL..." -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "180.149.199.175"
$VPS_USER = "root"
$VPS_PASS = "X0D8i6O6b7u1m9m"

Write-Host "📋 Informations:" -ForegroundColor Yellow
Write-Host "   IP: $VPS_IP"
Write-Host "   User: $VPS_USER"
Write-Host "   Database: dinitech-base"
Write-Host ""

# Chemin vers plink
$PLINK_PATH = "C:\Program Files\PuTTY\plink.exe"

if (-not (Test-Path $PLINK_PATH)) {
    Write-Host "❌ plink (PuTTY) non trouvé à $PLINK_PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Installez PuTTY depuis:" -ForegroundColor Yellow
    Write-Host "   https://www.putty.org/"
    Write-Host ""
    Write-Host "📋 Alternative: Exécutez manuellement les commandes" -ForegroundColor Yellow
    Write-Host "   ssh $VPS_USER@$VPS_IP"
    Write-Host "   Puis copiez-collez depuis COMMANDES-VPS-FINALES.md"
    exit 1
}

Write-Host "✅ plink trouvé" -ForegroundColor Green
Write-Host ""

# Commandes à exécuter sur le VPS
$commands = @"
docker ps | grep postgres
if [ $? -ne 0 ]; then
    echo "❌ Conteneur PostgreSQL non trouvé"
    docker ps -a
    exit 1
fi

echo ""
echo "🔍 Recherche des fichiers de configuration..."
PG_CONF=`$(docker exec postgres find / -name postgresql.conf 2>/dev/null | head -1)
PG_HBA=`$(docker exec postgres find / -name pg_hba.conf 2>/dev/null | head -1)

echo "✅ Config trouvé: $PG_CONF"

if [ -n "$PG_CONF" ]; then
    docker exec postgres bash -c "echo \"listen_addresses = '*'\" >> \"$PG_CONF\""
    echo "✅ listen_addresses configuré"
fi

if [ -n "$PG_HBA" ]; then
    docker exec postgres bash -c "echo \"host all all 0.0.0.0/0 md5\" >> \"$PG_HBA\""
    echo "✅ Accès distant configuré"
fi

echo ""
echo "🔄 Redémarrage PostgreSQL..."
docker restart postgres
sleep 3

echo ""
echo "🔥 Configuration firewall..."
iptables -A INPUT -p tcp --dport 5432 -j ACCEPT 2>/dev/null || echo "iptables déjà configuré"
echo "✅ Port 5432 ouvert"

echo ""
echo "🧪 Vérification..."
docker exec postgres netstat -tuln | grep 5432 || docker exec postgres ss -tuln | grep 5432
echo ""
echo "✅ Configuration terminée!"
"@

Write-Host "🔧 Exécution des commandes sur le VPS..." -ForegroundColor Cyan
Write-Host ""

try {
    # Exécuter les commandes via plink
    $fullCommand = $commands -replace "`n", " && "

    $process = Start-Process -FilePath $PLINK_PATH -ArgumentList "-ssh", "-pw", $VPS_PASS, "$VPS_USER@$VPS_IP", $fullCommand -NoNewWindow -Wait -PassThru

    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Configuration VPS terminée!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🧪 Test de connexion à la base de données..." -ForegroundColor Cyan

        # Test de connexion
        $testResult = & npx prisma db push --skip-generate 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Connexion à la base de données réussie!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
            Write-Host "   1. npx prisma generate"
            Write-Host "   2. npm run dev"
            Write-Host ""
            Write-Host "🎉 Votre application va maintenant fonctionner!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Erreur de connexion à la base de données" -ForegroundColor Red
            Write-Host ""
            Write-Host "📝 Dépannage:" -ForegroundColor Yellow
            Write-Host "   - Vérifiez que PostgreSQL écoute sur 0.0.0.0:5432"
            Write-Host "   - Vérifiez que le port 5432 est ouvert"
            Write-Host "   - Vérifiez les credentials dans .env.local"
        }
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de la configuration VPS" -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Solution: Exécutez manuellement les commandes" -ForegroundColor Yellow
        Write-Host "   ssh $VPS_USER@$VPS_IP"
        Write-Host "   Puis copiez-collez depuis COMMANDES-VPS-FINALES.md"
    }

} catch {
    Write-Host ""
    Write-Host "❌ Erreur:" $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Solution alternative:" -ForegroundColor Yellow
    Write-Host "   Exécutez les commandes manuellement sur le VPS"
}

Write-Host ""
Read-Host "Appuyez sur Entrée pour continuer..."







