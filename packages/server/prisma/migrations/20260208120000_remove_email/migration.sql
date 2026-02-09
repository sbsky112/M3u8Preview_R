-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- RedefineTables
-- SQLite does not fully support ALTER TABLE DROP COLUMN in all versions,
-- so we use the "12-step" approach: create new table, copy data, drop old, rename.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_users" ("id", "username", "passwordHash", "role", "avatar", "isActive", "createdAt", "updatedAt")
SELECT "id", "username", "passwordHash", "role", "avatar", "isActive", "createdAt", "updatedAt" FROM "users";

DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
