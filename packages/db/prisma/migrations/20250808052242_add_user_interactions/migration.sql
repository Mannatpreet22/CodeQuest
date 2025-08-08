/*
  Warnings:

  - You are about to drop the column `dislikes` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `stars` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the `UserQuestionInteraction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserQuestionInteraction" DROP CONSTRAINT "UserQuestionInteraction_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserQuestionInteraction" DROP CONSTRAINT "UserQuestionInteraction_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Question" DROP COLUMN "dislikes",
DROP COLUMN "likes",
DROP COLUMN "stars";

-- DropTable
DROP TABLE "public"."UserQuestionInteraction";

-- CreateTable
CREATE TABLE "public"."UserInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "disliked" BOOLEAN NOT NULL DEFAULT false,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserInteraction_userId_idx" ON "public"."UserInteraction"("userId");

-- CreateIndex
CREATE INDEX "UserInteraction_questionId_idx" ON "public"."UserInteraction"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInteraction_userId_questionId_key" ON "public"."UserInteraction"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "public"."UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInteraction" ADD CONSTRAINT "UserInteraction_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
