-- Run this SQL script on your live server to fix the missing security_events table
-- This will resolve the authentication login issues

-- Create security_events table
CREATE TABLE IF NOT EXISTS `security_events` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) unsigned DEFAULT NULL,
    `event_type` varchar(100) NOT NULL,
    `severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
    `ip_address` varchar(45) NOT NULL,
    `user_agent` text DEFAULT NULL,
    `metadata` json DEFAULT NULL,
    `risk_score` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
    `investigated` tinyint(1) NOT NULL DEFAULT 0,
    `investigated_at` timestamp NULL DEFAULT NULL,
    `investigation_notes` text DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `security_events_user_id_created_at_index` (`user_id`,`created_at`),
    KEY `security_events_event_type_created_at_index` (`event_type`,`created_at`),
    KEY `security_events_severity_investigated_index` (`severity`,`investigated`),
    KEY `security_events_ip_address_index` (`ip_address`),
    CONSTRAINT `security_events_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Check if authentication_events table exists, create if not
CREATE TABLE IF NOT EXISTS `authentication_events` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) unsigned DEFAULT NULL,
    `event_type` varchar(100) NOT NULL,
    `ip_address` varchar(45) NOT NULL,
    `user_agent` text DEFAULT NULL,
    `metadata` json DEFAULT NULL,
    `status` varchar(50) NOT NULL,
    `risk_level` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
    `occurred_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `authentication_events_user_id_created_at_index` (`user_id`,`created_at`),
    KEY `authentication_events_event_type_index` (`event_type`),
    KEY `authentication_events_ip_address_index` (`ip_address`),
    KEY `authentication_events_status_index` (`status`),
    CONSTRAINT `authentication_events_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Check if user_sessions_tracking table exists, create if not
CREATE TABLE IF NOT EXISTS `user_sessions_tracking` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `session_id` varchar(255) NOT NULL,
    `user_id` bigint(20) unsigned NOT NULL,
    `ip_address` varchar(45) NOT NULL,
    `user_agent` text DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `last_activity` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_sessions_tracking_session_id_unique` (`session_id`),
    KEY `user_sessions_tracking_user_id_index` (`user_id`),
    KEY `user_sessions_tracking_is_active_index` (`is_active`),
    CONSTRAINT `user_sessions_tracking_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Check if failed_login_attempts table exists, create if not
CREATE TABLE IF NOT EXISTS `failed_login_attempts` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `email` varchar(255) NOT NULL,
    `ip_address` varchar(45) NOT NULL,
    `user_agent` text DEFAULT NULL,
    `failure_reason` varchar(255) NOT NULL,
    `metadata` json DEFAULT NULL,
    `attempted_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `failed_login_attempts_email_attempted_at_index` (`email`,`attempted_at`),
    KEY `failed_login_attempts_ip_address_index` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert completion message
SELECT 'Database tables created successfully. Authentication should now work.' as 'Status';
