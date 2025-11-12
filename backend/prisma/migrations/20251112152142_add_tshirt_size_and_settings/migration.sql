/*
  Warnings:

  - Added the required column `tshirt_size` to the `print_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `print_requests` ADD COLUMN `tshirt_size` ENUM('S', 'M', 'L', 'XL') NOT NULL;

-- CreateTable
CREATE TABLE `settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `is_paused` BOOLEAN NOT NULL DEFAULT false,
    `max_print_requests` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
