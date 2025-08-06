-- AlterTable
ALTER TABLE "public"."TestCase" ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "TestCase_questionId_isVisible_idx" ON "public"."TestCase"("questionId", "isVisible");
