/*
  Warnings:

  - You are about to drop the column `success` on the `DeploymentAudit` table. All the data in the column will be lost.
  - Added the required column `status` to the `DeploymentAudit` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `environment` on the `DeploymentAudit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "DeploymentAudit" DROP COLUMN "success",
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "statusDescription" TEXT,
DROP COLUMN "environment",
ADD COLUMN     "environment" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Environment";
