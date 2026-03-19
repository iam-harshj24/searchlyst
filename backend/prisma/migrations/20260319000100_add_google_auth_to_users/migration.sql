-- Add Google auth support for users
ALTER TABLE "users"
  ADD COLUMN "auth_provider" TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN "google_id" TEXT;

-- Local users use password_hash, Google users may not
ALTER TABLE "users"
  ALTER COLUMN "password_hash" DROP NOT NULL;

CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
