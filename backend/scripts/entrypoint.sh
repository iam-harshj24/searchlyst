#!/bin/bash
set -euo pipefail

echo "Waiting for Postgres..."
DEADLINE=$((SECONDS + 60))
while true; do
  if node --input-type=module -e "
    import pg from 'pg';
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    await c.end();
  " 2>/dev/null; then
    echo "Postgres is ready."
    break
  fi
  if [ "$SECONDS" -ge "$DEADLINE" ]; then
    echo "Postgres not ready in time. Exiting."
    exit 1
  fi
  echo "Postgres not ready yet... retrying in 1s"
  sleep 1
done

echo "Swapping Prisma provider to postgresql..."
sed 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma > prisma/schema.pg.prisma

echo "Generating Prisma client for Postgres..."
npx prisma generate --schema=prisma/schema.pg.prisma

echo "Pushing schema to Postgres (prisma db push)..."
npx prisma db push --schema=prisma/schema.pg.prisma --skip-generate --accept-data-loss

# Seed only when DEV_SEED_EMAIL is provided (integration tests, dev, staging — not production)
if [ -n "${DEV_SEED_EMAIL:-}" ]; then
  echo "Seeding database..."
  DATABASE_URL="${DATABASE_URL}" node prisma/seed.mjs || echo "Seed failed (non-fatal), continuing..."
fi

echo "Starting API..."
exec node src/server.js
