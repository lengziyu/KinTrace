-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'family_admin');

-- CreateEnum
CREATE TYPE "FamilyMemberRole" AS ENUM ('admin', 'manager', 'member');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('draft', 'active', 'closed');

-- CreateEnum
CREATE TYPE "RecordActionType" AS ENUM ('visited', 'cleaned', 'offered', 'note');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,
    "phone" TEXT,
    "role" "FamilyMemberRole" NOT NULL DEFAULT 'member',
    "joinSource" TEXT NOT NULL DEFAULT 'invite',
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TombPoint" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "titleName" TEXT,
    "generation" TEXT,
    "branchName" TEXT,
    "lng" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "areaName" TEXT,
    "description" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TombPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorshipTask" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorshipTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorshipRecord" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "tombId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "actionType" "RecordActionType" NOT NULL DEFAULT 'visited',
    "remark" TEXT,
    "worshipTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorshipRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorialMessage" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "tombId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemorialMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutePlan" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tombIds" JSONB NOT NULL,
    "createdByMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyGroup_code_key" ON "FamilyGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyGroup_inviteCode_key" ON "FamilyGroup"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_familyId_nickname_key" ON "FamilyMember"("familyId", "nickname");

-- CreateIndex
CREATE UNIQUE INDEX "WorshipTask_familyId_year_key" ON "WorshipTask"("familyId", "year");

-- AddForeignKey
ALTER TABLE "FamilyGroup" ADD CONSTRAINT "FamilyGroup_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TombPoint" ADD CONSTRAINT "TombPoint_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipTask" ADD CONSTRAINT "WorshipTask_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipRecord" ADD CONSTRAINT "WorshipRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorshipTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipRecord" ADD CONSTRAINT "WorshipRecord_tombId_fkey" FOREIGN KEY ("tombId") REFERENCES "TombPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipRecord" ADD CONSTRAINT "WorshipRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialMessage" ADD CONSTRAINT "MemorialMessage_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialMessage" ADD CONSTRAINT "MemorialMessage_tombId_fkey" FOREIGN KEY ("tombId") REFERENCES "TombPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialMessage" ADD CONSTRAINT "MemorialMessage_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutePlan" ADD CONSTRAINT "RoutePlan_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutePlan" ADD CONSTRAINT "RoutePlan_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
