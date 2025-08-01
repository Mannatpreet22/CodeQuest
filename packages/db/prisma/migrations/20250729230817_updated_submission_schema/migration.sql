/*
  Warnings:

  - You are about to drop the column `programmingLanguageId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the `ProgrammingLanguage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `submissionId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Submission" DROP CONSTRAINT "Submission_programmingLanguageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TemplateCode" DROP CONSTRAINT "TemplateCode_programmingLanguageId_fkey";

-- AlterTable
ALTER TABLE "public"."Submission" DROP COLUMN "programmingLanguageId",
ADD COLUMN     "submissionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."ProgrammingLanguage";
