-- CreateEnum
CREATE TYPE "LocationShareSessionStatus" AS ENUM ('active', 'closed');

-- AlterTable
ALTER TABLE "FamilyGroup" ADD COLUMN     "upcomingWorshipAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LocationShareSession" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT,
    "status" "LocationShareSessionStatus" NOT NULL DEFAULT 'active',
    "startedByMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "LocationShareSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationShareParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "nicknameSnapshot" TEXT NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationShareParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocationShareParticipant_sessionId_memberId_key" ON "LocationShareParticipant"("sessionId", "memberId");

-- AddForeignKey
ALTER TABLE "LocationShareSession" ADD CONSTRAINT "LocationShareSession_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationShareSession" ADD CONSTRAINT "LocationShareSession_startedByMemberId_fkey" FOREIGN KEY ("startedByMemberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationShareParticipant" ADD CONSTRAINT "LocationShareParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LocationShareSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationShareParticipant" ADD CONSTRAINT "LocationShareParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
