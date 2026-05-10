-- Add password support for family member login
ALTER TABLE "FamilyMember" ADD COLUMN "passwordHash" TEXT;

-- One phone can bind only one family member account
DROP INDEX IF EXISTS "FamilyMember_familyId_phone_key";
CREATE UNIQUE INDEX "FamilyMember_phone_key" ON "FamilyMember"("phone");
