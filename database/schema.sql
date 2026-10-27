-- ============================================================================
-- AI Timetable Generator - MySQL Database Schema (XAMPP)
-- Database: ai_timetable_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `ai_timetable_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `ai_timetable_db`;

-- 1. Users Table (Admin & Student RBAC Authentication)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL UNIQUE,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student',
    `section` VARCHAR(50) DEFAULT '',
    `group_id` VARCHAR(20) DEFAULT '',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_group` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS `students` (
    `student_id` VARCHAR(50) PRIMARY KEY,
    `student_name` VARCHAR(150) NOT NULL,
    `section` VARCHAR(50) NOT NULL,
    `group_id` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_students_section` (`section`),
    INDEX `idx_students_group` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS `subjects` (
    `subject_id` VARCHAR(50) PRIMARY KEY,
    `subject_code` VARCHAR(50) NOT NULL,
    `subject_name` VARCHAR(200) NOT NULL,
    `periods_per_week` INT NOT NULL DEFAULT 4,
    `subject_type` VARCHAR(50) NOT NULL DEFAULT 'Lecture',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_subjects_code` (`subject_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Rooms Table
CREATE TABLE IF NOT EXISTS `rooms` (
    `room_id` VARCHAR(50) PRIMARY KEY,
    `room_name` VARCHAR(100) NOT NULL,
    `room_type` VARCHAR(50) NOT NULL DEFAULT 'Lecture',
    `capacity` INT NOT NULL DEFAULT 60,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Faculty Table
CREATE TABLE IF NOT EXISTS `faculty` (
    `faculty_id` VARCHAR(50) PRIMARY KEY,
    `faculty_name` VARCHAR(150) NOT NULL,
    `subject_id` VARCHAR(50) NOT NULL,
    `group_id` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_faculty_subject` (`subject_id`),
    INDEX `idx_faculty_group` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Teacher Groups Table
CREATE TABLE IF NOT EXISTS `teacher_groups` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `group_id` VARCHAR(20) NOT NULL,
    `subject_id` VARCHAR(50) NOT NULL,
    `faculty_id` VARCHAR(50) NOT NULL,
    `room_id` VARCHAR(50) NOT NULL,
    `max_capacity` INT NOT NULL DEFAULT 60,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_tg_group` (`group_id`),
    INDEX `idx_tg_subject` (`subject_id`),
    INDEX `idx_tg_faculty` (`faculty_id`),
    INDEX `idx_tg_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Time Slots Table
CREATE TABLE IF NOT EXISTS `time_slots` (
    `slot_id` VARCHAR(50) PRIMARY KEY,
    `day` VARCHAR(20) NOT NULL,
    `period` INT NOT NULL,
    `start_time` VARCHAR(20) NOT NULL,
    `end_time` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_slots_day_period` (`day`, `period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Faculty Availability Table
CREATE TABLE IF NOT EXISTS `availability` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `faculty_id` VARCHAR(50) NOT NULL,
    `day` VARCHAR(20) NOT NULL,
    `period` INT NOT NULL,
    `available` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_avail_lookup` (`faculty_id`, `day`, `period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Generation Runs Metadata Table
CREATE TABLE IF NOT EXISTS `generation_runs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Generated',
    `total_tasks` INT NOT NULL DEFAULT 0,
    `assigned_classes` INT NOT NULL DEFAULT 0,
    `total_entries` INT NOT NULL DEFAULT 0,
    `unassigned_count` INT NOT NULL DEFAULT 0,
    `conflict_count` INT NOT NULL DEFAULT 0,
    `message` TEXT,
    `active_file_name` VARCHAR(255) DEFAULT 'sample_timetable.xlsx',
    `generated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Generated Timetable Entries Table
CREATE TABLE IF NOT EXISTS `timetable_entries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `run_id` INT NOT NULL,
    `timetable_id` VARCHAR(50) NOT NULL,
    `subject_id` VARCHAR(50) NOT NULL,
    `subject_code` VARCHAR(50) NOT NULL,
    `subject_name` VARCHAR(200) NOT NULL,
    `group_id` VARCHAR(20) NOT NULL,
    `section` VARCHAR(50) NOT NULL,
    `faculty_id` VARCHAR(50) NOT NULL,
    `faculty_name` VARCHAR(150) NOT NULL,
    `room_id` VARCHAR(50) NOT NULL,
    `room_name` VARCHAR(100) NOT NULL,
    `day` VARCHAR(20) NOT NULL,
    `period` INT NOT NULL,
    `start_time` VARCHAR(20) NOT NULL,
    `end_time` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Class',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_tt_run` (`run_id`),
    INDEX `idx_tt_group` (`group_id`),
    INDEX `idx_tt_section` (`section`),
    INDEX `idx_tt_day_period` (`day`, `period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Timetable Conflicts Table
CREATE TABLE IF NOT EXISTS `timetable_conflicts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `run_id` INT NOT NULL,
    `conflict_id` INT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `subject` VARCHAR(200) DEFAULT '',
    `faculty` VARCHAR(150) DEFAULT '',
    `room` VARCHAR(100) DEFAULT '',
    `group_id` VARCHAR(20) DEFAULT '',
    `day` VARCHAR(20) DEFAULT '',
    `period` INT DEFAULT 0,
    `issue` TEXT,
    `action` VARCHAR(150) DEFAULT '',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_conf_run` (`run_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
