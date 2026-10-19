DROP INDEX "categories_slug_unique";--> statement-breakpoint
DROP INDEX "products_slug_unique";--> statement-breakpoint
DROP INDEX "products_sku_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
UPDATE `products` SET `currency` = 'EUR' WHERE `currency` IN ('USD', 'COP');--> statement-breakpoint
ALTER TABLE `products` ALTER COLUMN "currency" TO "currency" text NOT NULL DEFAULT 'EUR';--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);