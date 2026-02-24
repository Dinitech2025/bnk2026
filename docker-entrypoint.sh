#!/bin/sh
set -e

echo "Exécution des migrations Prisma..."
npx prisma migrate deploy

echo "Démarrage de Next.js..."
exec node server.js
