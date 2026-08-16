-- CreateEnum
CREATE TYPE "Trigger" AS ENUM ('MALWARE_DETECTED', 'LOGIN_ATTEMPT', 'PHISHING_ALERT');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('ISOLATE_HOST', 'NOTIFY_ADMIN', 'BLOCK_IP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "Trigger" NOT NULL,
    "actions" "Action"[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Playbook" ADD CONSTRAINT "Playbook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
