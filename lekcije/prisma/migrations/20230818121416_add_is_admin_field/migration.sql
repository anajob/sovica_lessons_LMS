/*
  Warnings:

  - Added the required column `isAdmin` to the `adminUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_adminUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickName" TEXT NOT NULL,
    "role" TEXT NOT NULL
);
INSERT INTO "new_adminUser" ("email", "id", "nickName", "password") SELECT "email", "id", "nickName", "password" FROM "adminUser";
DROP TABLE "adminUser";
ALTER TABLE "new_adminUser" RENAME TO "adminUser";
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Category" ("id", "name") SELECT "id", "name" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE TABLE "new_Lekcija" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoLink" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lekcija_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lekcija" ("categoryId", "content", "createdAt", "id", "title", "updatedAt", "videoLink") SELECT "categoryId", "content", "createdAt", "id", "title", "updatedAt", "videoLink" FROM "Lekcija";
DROP TABLE "Lekcija";
ALTER TABLE "new_Lekcija" RENAME TO "Lekcija";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
