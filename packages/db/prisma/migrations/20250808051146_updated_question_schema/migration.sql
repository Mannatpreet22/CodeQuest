-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "difficulty" TEXT DEFAULT 'Easy',
ADD COLUMN     "dislikes" INTEGER DEFAULT 0,
ADD COLUMN     "likes" INTEGER DEFAULT 0,
ADD COLUMN     "stars" INTEGER DEFAULT 0;
