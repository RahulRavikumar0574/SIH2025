-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('STUDENT', 'COUNSELLOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "degree" TEXT,
ADD COLUMN     "gender" "public"."Gender",
ADD COLUMN     "instituteName" TEXT,
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'STUDENT';
