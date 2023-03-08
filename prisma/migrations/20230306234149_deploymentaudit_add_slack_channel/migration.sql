/*
  Warnings:

  - Added the required column `slackChannel` to the `DeploymentAudit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeploymentAudit" ADD COLUMN     "slackChannel" TEXT NOT NULL;
