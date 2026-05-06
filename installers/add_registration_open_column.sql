-- Migration: Add registration_open column to events table
-- Run this SQL in your MySQL database (tournament_db) to enable
-- per-event registration open/close control.

ALTER TABLE `events`
  ADD COLUMN `registration_open` TINYINT(1) NOT NULL DEFAULT 1
  COMMENT '1 = registration open, 0 = registration closed'
  AFTER `status`;
