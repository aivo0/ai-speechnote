CREATE TABLE `speech_segment` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`text` text NOT NULL,
	`partial_text` text,
	`confidence` real,
	`duration` real,
	`language` text,
	`alternatives` text,
	`is_edited` integer DEFAULT false NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `speech_session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `speech_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`language` text DEFAULT 'et',
	`status` text DEFAULT 'active' NOT NULL,
	`total_duration` integer DEFAULT 0,
	`segment_count` integer DEFAULT 0,
	`ws_url` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `speech_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`default_language` text DEFAULT 'et',
	`ws_url` text DEFAULT 'wss://tekstiks.ee/asr/ws/asr',
	`n_best` integer DEFAULT 1,
	`auto_save` integer DEFAULT true NOT NULL,
	`auto_export` integer DEFAULT false NOT NULL,
	`export_format` text DEFAULT 'txt',
	`buffer_size` integer DEFAULT 1024,
	`max_segment_length` integer DEFAULT 300,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `speech_settings_user_id_unique` ON `speech_settings` (`user_id`);