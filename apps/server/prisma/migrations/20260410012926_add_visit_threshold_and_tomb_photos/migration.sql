-- AlterTable
ALTER TABLE "FamilyGroup" ADD COLUMN     "visitRangeMeters" INTEGER NOT NULL DEFAULT 300;

-- AlterTable
ALTER TABLE "WorshipRecord" ADD COLUMN     "checkInAccuracy" DOUBLE PRECISION,
ADD COLUMN     "checkInLat" DOUBLE PRECISION,
ADD COLUMN     "checkInLng" DOUBLE PRECISION,
ADD COLUMN     "distanceMeters" INTEGER;

-- CreateTable
CREATE TABLE "TombPhoto" (
    "id" TEXT NOT NULL,
    "tombId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TombPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TombPhoto" ADD CONSTRAINT "TombPhoto_tombId_fkey" FOREIGN KEY ("tombId") REFERENCES "TombPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TombPhoto" ADD CONSTRAINT "TombPhoto_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
