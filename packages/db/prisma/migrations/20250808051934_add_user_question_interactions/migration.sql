-- CreateTable
CREATE TABLE "public"."UserQuestionInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "disliked" BOOLEAN NOT NULL DEFAULT false,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuestionInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserQuestionInteraction_userId_idx" ON "public"."UserQuestionInteraction"("userId");

-- CreateIndex
CREATE INDEX "UserQuestionInteraction_questionId_idx" ON "public"."UserQuestionInteraction"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuestionInteraction_userId_questionId_key" ON "public"."UserQuestionInteraction"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "public"."UserQuestionInteraction" ADD CONSTRAINT "UserQuestionInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserQuestionInteraction" ADD CONSTRAINT "UserQuestionInteraction_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
