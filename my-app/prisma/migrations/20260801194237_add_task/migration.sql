/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Task` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Task" ("archived", "createdAt", "description", "dueDate", "id", "status", "title", "topic") SELECT "archived", "createdAt", "description", "dueDate", "id", "status", "title", "topic" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_archived_status_idx" ON "Task"("archived", "status");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_topic_idx" ON "Task"("topic");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
