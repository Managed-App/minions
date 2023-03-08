-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEV', 'UAT', 'PROD');

-- CreateTable
CREATE TABLE "DeploymentAudit" (
    "id" SERIAL NOT NULL,
    "environment" "Environment" NOT NULL,
    "slackUser" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "success" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentAudit_pkey" PRIMARY KEY ("id")
);
