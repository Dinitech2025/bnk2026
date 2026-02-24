#!/bin/sh
set -e

echo "Exécution des migrations Prisma..."
node node_modules/prisma/build/index.js migrate deploy || echo "Migrations ignorées (DB non accessible ou pas de migrations)"

echo "Démarrage de Next.js..."
exec node server.js
