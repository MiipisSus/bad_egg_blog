-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StickyNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" TEXT NOT NULL,
    "posX" REAL NOT NULL DEFAULT 80,
    "posY" REAL NOT NULL DEFAULT 60,
    "zIndex" INTEGER NOT NULL DEFAULT 1,
    "page" INTEGER NOT NULL DEFAULT 0,
    "author" TEXT,
    "color" TEXT NOT NULL DEFAULT '#ffffff',
    "shape" TEXT NOT NULL DEFAULT 'square',
    "noteType" TEXT NOT NULL DEFAULT 'drawing',
    "text" TEXT,
    "visitorId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_StickyNote" ("author", "color", "createdAt", "id", "image", "ipAddress", "page", "posX", "posY", "visitorId", "zIndex") SELECT "author", "color", "createdAt", "id", "image", "ipAddress", "page", "posX", "posY", "visitorId", "zIndex" FROM "StickyNote";
DROP TABLE "StickyNote";
ALTER TABLE "new_StickyNote" RENAME TO "StickyNote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
