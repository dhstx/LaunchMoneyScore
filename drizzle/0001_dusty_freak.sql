CREATE TABLE `api_keys` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`key` varchar(64) NOT NULL,
	`name` varchar(255),
	`requestsPerDay` int DEFAULT 100,
	`requestsUsedToday` int DEFAULT 0,
	`lastResetAt` timestamp DEFAULT (now()),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`lastUsedAt` timestamp,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_runs` (
	`id` varchar(64) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`userId` varchar(64),
	`lms` int,
	`rri` int,
	`pmi` int,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`error` text,
	`categories` json,
	`gates` json,
	`topFixes` json,
	`pageSpeedData` json,
	`cruxData` json,
	`playwrightData` json,
	`createdAt` timestamp DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `audit_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` varchar(64) NOT NULL,
	`auditRunId` varchar(64) NOT NULL,
	`userId` varchar(64),
	`stripePaymentIntentId` varchar(255),
	`amountPaid` int,
	`currency` varchar(3) DEFAULT 'usd',
	`pdfUrl` varchar(2048),
	`jsonUrl` varchar(2048),
	`badgeCode` text,
	`isPaid` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`paidAt` timestamp,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
