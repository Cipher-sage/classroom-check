CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`exam` text NOT NULL,
	`name` text NOT NULL,
	`matric` text NOT NULL,
	`department` text NOT NULL,
	`paper` text NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`flags` text DEFAULT '[]' NOT NULL,
	`start` integer NOT NULL,
	`deadline` integer NOT NULL,
	`submitted` integer,
	`score` integer,
	`total` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_attempt` ON `attempts` (`exam`,`matric`);--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`course` text NOT NULL,
	`minutes` integer NOT NULL,
	`code` text NOT NULL,
	`questions` text NOT NULL,
	`open` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exams_code_unique` ON `exams` (`code`);