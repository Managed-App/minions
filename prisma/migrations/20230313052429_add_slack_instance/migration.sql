/*
  Warnings:

  - Added the required column `slackInstance` to the `CommandAudit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slackInstance` to the `DeploymentAudit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommandAudit" ADD COLUMN     "slackInstance" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DeploymentAudit" ADD COLUMN     "slackInstance" TEXT NOT NULL;
