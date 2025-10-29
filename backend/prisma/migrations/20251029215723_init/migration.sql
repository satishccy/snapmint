-- CreateTable
CREATE TABLE `print_requests` (
    `id` VARCHAR(191) NOT NULL,
    `wallet_address` VARCHAR(255) NOT NULL,
    `asset_id` VARCHAR(255) NOT NULL,
    `status` ENUM('pending', 'in_progress', 'completed', 'collected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `print_requests_wallet_address_idx`(`wallet_address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
