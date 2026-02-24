#!/bin/sh
set -e

echo "Exécution des migrations Prisma..."
node node_modules/prisma/build/index.js migrate deploy

echo "Démarrage de Next.js..."
exec node server.js
