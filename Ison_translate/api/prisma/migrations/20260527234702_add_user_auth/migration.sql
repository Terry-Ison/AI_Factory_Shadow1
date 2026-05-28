-- AlterTable
ALTER TABLE `participant` ADD COLUMN `accountUserId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `defaultSourceLang` VARCHAR(191) NOT NULL DEFAULT 'en',
    `defaultTargetLang` VARCHAR(191) NOT NULL DEFAULT 'es',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Participant_accountUserId_idx` ON `Participant`(`accountUserId`);

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_accountUserId_fkey` FOREIGN KEY (`accountUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
