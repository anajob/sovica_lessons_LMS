/*
  Warnings:

  - Added the required column `nickName` to the `adminUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Lekcija` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_adminUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickName" TEXT NOT NULL
);
INSERT INTO "new_adminUser" ("email", "id", "password") SELECT "email", "id", "password" FROM "adminUser";
DROP TABLE "adminUser";
ALTER TABLE "new_adminUser" RENAME TO "adminUser";
CREATE TABLE "new_Lekcija" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoLink" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lekcija_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lekcija" ("content", "createdAt", "id", "title", "updatedAt", "videoLink") SELECT "content", "createdAt", "id", "title", "updatedAt", "videoLink" FROM "Lekcija";
DROP TABLE "Lekcija";
ALTER TABLE "new_Lekcija" RENAME TO "Lekcija";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
