-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'guys',
    "age" INTEGER NOT NULL DEFAULT 18,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
