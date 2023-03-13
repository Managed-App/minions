-- CreateTable
CREATE TABLE "CommandAudit" (
    "id" SERIAL NOT NULL,
    "command" TEXT NOT NULL,
    "slackChannel" TEXT NOT NULL,
    "slackUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandAudit_pkey" PRIMARY KEY ("id")
);
