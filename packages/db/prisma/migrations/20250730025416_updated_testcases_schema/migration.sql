/*
  Warnings:

  - You are about to drop the column `expectedOutput` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `inputData` on the `TestCase` table. All the data in the column will be lost.
  - Added the required column `expected` to the `TestCase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputs` to the `TestCase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TestCase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."TestCase" DROP COLUMN "expectedOutput",
DROP COLUMN "inputData",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expected" JSONB NOT NULL,
ADD COLUMN     "inputs" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."TestCaseInput" (
    "id" SERIAL NOT NULL,
    "testCaseId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT,
    "value" JSONB NOT NULL,

    CONSTRAINT "TestCaseInput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestCaseInput_testCaseId_position_idx" ON "public"."TestCaseInput"("testCaseId", "position");

-- CreateIndex
CREATE INDEX "TestCase_questionId_idx" ON "public"."TestCase"("questionId");

-- AddForeignKey
ALTER TABLE "public"."TestCaseInput" ADD CONSTRAINT "TestCaseInput_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "public"."TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
