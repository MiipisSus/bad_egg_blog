-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "rank" TEXT,
    "image" TEXT,
    "nameCard" TEXT,
    "type" TEXT NOT NULL DEFAULT 'community',
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Member" ("bio", "createdAt", "id", "image", "name", "nameCard", "rank", "role", "title", "type", "updatedAt") SELECT "bio", "createdAt", "id", "image", "name", "nameCard", "rank", "role", "title", "type", "updatedAt" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
