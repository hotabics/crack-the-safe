-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Vault" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codeLength" INTEGER NOT NULL DEFAULT 4,
    "codeHash" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "isCracked" BOOLEAN NOT NULL DEFAULT false,
    "crackedByUserId" TEXT,
    "crackedAt" DATETIME,
    CONSTRAINT "Vault_crackedByUserId_fkey" FOREIGN KEY ("crackedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vaultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guess" TEXT NOT NULL,
    "correctPositions" INTEGER NOT NULL,
    "correctDigits" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Guess_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Guess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GuessLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "taskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuessLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rewardGuesses" INTEGER NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "claimedDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Guess_vaultId_createdAt_idx" ON "Guess"("vaultId", "createdAt");

-- CreateIndex
CREATE INDEX "Guess_userId_vaultId_idx" ON "Guess"("userId", "vaultId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_userId_taskId_claimedDate_key" ON "TaskCompletion"("userId", "taskId", "claimedDate");
