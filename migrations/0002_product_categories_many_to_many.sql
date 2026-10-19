-- Persist (id, category_id) before dropping category_id from products.
CREATE TABLE `_product_category_backup` (
	`id` integer NOT NULL,
	`category_id` integer
);--> statement-breakpoint
INSERT INTO `_product_category_backup` ("id", "category_id")
	SELECT "id", "category_id" FROM `products`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`summary` text,
	`description` text,
	`price_cents` integer NOT NULL,
	`compare_at_price_cents` integer,
	`currency` text DEFAULT 'COP' NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`sku` text NOT NULL,
	`sizes` text,
	`color_palette` text,
	`is_visible` integer DEFAULT true NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "slug", "summary", "description", "price_cents", "compare_at_price_cents", "currency", "stock", "sku", "sizes", "color_palette", "is_visible", "is_featured", "metadata", "created_at", "updated_at") SELECT "id", "name", "slug", "summary", "description", "price_cents", "compare_at_price_cents", "currency", "stock", "sku", "sizes", "color_palette", "is_visible", "is_featured", "metadata", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE TABLE `__new_product_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`url` text NOT NULL,
	`alt` text,
	`width` integer,
	`height` integer,
	`sort_order` integer DEFAULT 0,
	`is_primary` integer DEFAULT false,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_product_images`("id", "product_id", "url", "alt", "width", "height", "sort_order", "is_primary") SELECT "id", "product_id", "url", "alt", "width", "height", "sort_order", "is_primary" FROM `product_images`;--> statement-breakpoint
DROP TABLE `product_images`;--> statement-breakpoint
ALTER TABLE `__new_product_images` RENAME TO `product_images`;--> statement-breakpoint
CREATE TABLE `product_categories` (
	`product_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	PRIMARY KEY(`product_id`, `category_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `product_categories` ("product_id", "category_id")
	SELECT "id", "category_id" FROM `_product_category_backup` WHERE "category_id" IS NOT NULL;--> statement-breakpoint
DROP TABLE `_product_category_backup`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
