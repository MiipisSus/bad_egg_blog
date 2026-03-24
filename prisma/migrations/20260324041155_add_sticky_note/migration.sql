-- CreateTable
CREATE TABLE "StickyNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" TEXT NOT NULL,
    "posX" REAL NOT NULL DEFAULT 80,
    "posY" REAL NOT NULL DEFAULT 60,
    "zIndex" INTEGER NOT NULL DEFAULT 1,
    "page" INTEGER NOT NULL DEFAULT 0,
    "author" TEXT,
    "color" TEXT NOT NULL DEFAULT '#ffffff',
    "visitorId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
