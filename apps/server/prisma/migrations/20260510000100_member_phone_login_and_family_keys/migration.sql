-- Drop old nickname uniqueness so members can完善昵称而不绑定登录身份
DROP INDEX IF EXISTS "FamilyMember_familyId_nickname_key";

-- Add phone-based uniqueness inside each family
CREATE UNIQUE INDEX "FamilyMember_familyId_phone_key" ON "FamilyMember"("familyId", "phone");
