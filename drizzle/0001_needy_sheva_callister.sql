CREATE TABLE `roster` (
	`exam` text NOT NULL,
	`key` text NOT NULL,
	`matric` text NOT NULL,
	`name` text NOT NULL,
	PRIMARY KEY(`exam`, `key`)
);
