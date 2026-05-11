-- CreateEnum
CREATE TYPE "GenealogyGender" AS ENUM ('male', 'female', 'unknown');

-- CreateEnum
CREATE TYPE "GenealogyStatus" AS ENUM ('living', 'deceased');

-- CreateTable
CREATE TABLE "GenealogyPerson" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "GenealogyGender" NOT NULL DEFAULT 'unknown',
    "generationLevel" INTEGER NOT NULL DEFAULT 1,
    "generationLabel" TEXT NOT NULL,
    "branchName" TEXT,
    "parentId" TEXT,
    "spouseName" TEXT,
    "status" "GenealogyStatus" NOT NULL DEFAULT 'living',
    "bio" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenealogyPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenealogyPerson_familyId_generationLevel_sortOrder_idx" ON "GenealogyPerson"("familyId", "generationLevel", "sortOrder");

-- AddForeignKey
ALTER TABLE "GenealogyPerson" ADD CONSTRAINT "GenealogyPerson_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenealogyPerson" ADD CONSTRAINT "GenealogyPerson_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GenealogyPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
