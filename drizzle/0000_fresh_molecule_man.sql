CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`player` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
