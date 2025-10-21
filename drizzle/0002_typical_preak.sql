ALTER TABLE `audit_runs` ADD `ipAddress` varchar(45);--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `userAgent` text;--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `referrer` text;--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `utmSource` varchar(100);--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `utmMedium` varchar(100);--> statement-breakpoint
ALTER TABLE `audit_runs` ADD `utmCampaign` varchar(100);