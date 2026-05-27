-- MySQL dump 10.13  Distrib 9.7.0, for Win64 (x86_64)
--
-- Host: localhost    Database: otm_db
-- ------------------------------------------------------
-- Server version	9.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '30ec25c4-43f5-11f1-bf5e-00059a3c7a00:1-1792';

--
-- Current Database: `otm_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `otm_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `otm_db`;

--
-- Table structure for table `about_page_content`
--

DROP TABLE IF EXISTS `about_page_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `about_page_content` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `organization_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `mission` text COLLATE utf8mb4_unicode_ci,
  `vision` text COLLATE utf8mb4_unicode_ci,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_about_content_updated_by` (`updated_by`),
  CONSTRAINT `fk_about_content_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `about_page_content`
--

LOCK TABLES `about_page_content` WRITE;
/*!40000 ALTER TABLE `about_page_content` DISABLE KEYS */;
INSERT INTO `about_page_content` VALUES (1,'Cavite State University – Bacoor City Campus','Section 2 of Republic Act No. 8468 “An Act Converting the Don Severino Agricultural College in the Municipality of Indang, Province of Cavite into a State University, to be Known as the Cavite State University” states that,\n\n“The University shall primarily provide advance instruction and professional training in agriculture, science and technology, education and other related fields, undertake research and extension services, and provide progressive leadership in these areas.”','Cavite State University shall provide excellent, equitable and relevant educational opportunities in the arts, sciences and technology through quality instruction and responsive research and development activities. It shall produce professional, skilled and morally upright individuals for global competitiveness.\n\n\n“Ang Cavite State university ay makapagbigay ng mahusay, pantay at makabuluhang edukasyon sa sining, agham at teknolohiya sa pamamagitan ng may kalidad na pagtuturo at tumutugon sa pangangailangang pananaliksik at mga gawaing pangkaunlaran. Makalikha ito ng mga indibidwal ng dalubhasa, may kasaysayan at kagandahan-asal sa pandaigdigang kakayahan.”','The premier university in historic Cavite globally recognized for excellence in character development, academics, research, innovation and sustainable community engagement.\n\n\n“Ang nangungunang pamantasan sa makasaysayang Kabite na kinikilala sa kahusayan sa paghubog ng mga indibidwal na may pandaigdigang kakayahan at kagandahang asal.”','src/images/about/org_photo_1777902346_711876ba.png',2,'2026-05-04 14:16:14');
/*!40000 ALTER TABLE `about_page_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `about_team_members`
--

DROP TABLE IF EXISTS `about_team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `about_team_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_about_team_active_order` (`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `about_team_members`
--

LOCK TABLES `about_team_members` WRITE;
/*!40000 ALTER TABLE `about_team_members` DISABLE KEYS */;
INSERT INTO `about_team_members` VALUES (1,'Juan Dela Cruz','Sports Head','Test bio','src/images/about/org_photo_1777993004_a8b4cb7b.png',1,'2026-05-01 03:23:53','2026-05-05 14:56:44'),(7,'Jose P. Rizal','Captain','Test bio','src/images/about/org_photo_1777993085_fc748278.png',2,'2026-05-01 04:10:42','2026-05-05 14:58:06');
/*!40000 ALTER TABLE `about_team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement_templates`
--

DROP TABLE IF EXISTS `announcement_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_name` (`template_name`),
  KEY `idx_templates_created_at` (`created_at`),
  KEY `fk_templates_created_by` (`created_by`),
  CONSTRAINT `fk_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_templates`
--

LOCK TABLES `announcement_templates` WRITE;
/*!40000 ALTER TABLE `announcement_templates` DISABLE KEYS */;
INSERT INTO `announcement_templates` VALUES (1,'Winner Message','Congrats Winner!','Congratulations {winner} for winning against {loser} in {event}.',NULL,'2026-05-07 18:09:42','2026-05-11 09:34:53'),(2,'Reminder Message','Reminder','Hello {team}!, your match for {event} vs {opponent} will begin {date}, {time} at {location}. See you there! #CvSUSports',NULL,'2026-05-08 15:56:55','2026-05-11 09:32:38');
/*!40000 ALTER TABLE `announcement_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `public_id` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sms_sent` tinyint(1) NOT NULL DEFAULT '0',
  `sms_status` enum('Not Sent','Queued','Sent','Failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Not Sent',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_announcements_public_id` (`public_id`),
  KEY `idx_announcements_created_at` (`created_at`),
  KEY `fk_announcements_created_by` (`created_by`),
  CONSTRAINT `fk_announcements_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,NULL,'📣 Exciting News: Upcoming Sportfest 2026! 🎉🏆','Get ready for our Upcoming Sportfest on May 1, 2026 at GYM! Join us for exciting games, teamwork, and lots of fun.\n\nMore details coming soon—see you there! 💪🎉\n\n#GameOn #StingrayStrong #CvSUSports',0,'Not Sent',NULL,'2026-05-08 15:57:37','2026-05-08 16:07:49');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_read` (`is_read`),
  KEY `idx_contact_submitted` (`submitted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'test','test@a.com','test','testasdasdasd',1,'2026-05-01 08:33:05'),(3,'test','test@a.com','tesadf','adsfasdva dfasdfads fasd  adf',1,'2026-05-01 08:38:11'),(4,'test','test@a.com','test','inquiry testing',1,'2026-05-01 08:44:34'),(5,'test','test@a.com','test','testtsetsetsetsets',1,'2026-05-07 18:15:00');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_page_info`
--

DROP TABLE IF EXISTS `contact_page_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_page_info` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_info_updated_by` (`updated_by`),
  CONSTRAINT `fk_contact_info_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_page_info`
--

LOCK TABLES `contact_page_info` WRITE;
/*!40000 ALTER TABLE `contact_page_info` DISABLE KEYS */;
INSERT INTO `contact_page_info` VALUES (1,'Phase II Soldiers Hills IV, Molino VI, 4102 \nBacoor, Philippines','(046) 476-5029','cvsubacoor.csg@gmail.com','https://www.facebook.com/share/1CgkQSPBQS/',2,'2026-05-04 13:58:24');
/*!40000 ALTER TABLE `contact_page_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `course_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_courses_name` (`course_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'BSIT','2026-05-01 17:41:20','2026-05-01 17:41:20'),(2,'BSCS','2026-05-01 17:42:47','2026-05-01 17:42:47'),(3,'BSCRIM','2026-05-01 17:43:28','2026-05-01 17:43:28'),(4,'HRM','2026-05-01 17:44:05','2026-05-01 17:44:05'),(5,'BSM','2026-05-01 17:44:09','2026-05-01 17:44:09'),(6,'BSEDUC','2026-05-01 17:44:20','2026-05-01 17:44:20'),(7,'BSPSYCH','2026-05-01 17:44:47','2026-05-01 17:44:47');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `public_id` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sports_id` bigint unsigned NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_start_date` datetime NOT NULL,
  `event_end_date` datetime NOT NULL,
  `location` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teams_count` int unsigned DEFAULT NULL,
  `tournament_type` enum('single_elimination','double_elimination','round_robin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single_elimination',
  `round_robin_format` enum('once') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'once',
  `has_third_place_match` tinyint(1) NOT NULL DEFAULT '1',
  `auto_sms_reminder_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `auto_sms_winner_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `sms_reminder_template_id` bigint unsigned DEFAULT NULL,
  `sms_winner_template_id` bigint unsigned DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('Upcoming','Ongoing','Completed','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Upcoming',
  `registration_open` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_events_public_id` (`public_id`),
  KEY `idx_events_sports_id` (`sports_id`),
  KEY `idx_events_created_by` (`created_by`),
  KEY `idx_events_start_date` (`event_start_date`),
  KEY `idx_events_end_date` (`event_end_date`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_sms_reminder_template` (`sms_reminder_template_id`),
  KEY `idx_events_sms_winner_template` (`sms_winner_template_id`),
  CONSTRAINT `fk_events_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_events_sms_reminder_template` FOREIGN KEY (`sms_reminder_template_id`) REFERENCES `announcement_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_events_sms_winner_template` FOREIGN KEY (`sms_winner_template_id`) REFERENCES `announcement_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_events_sports` FOREIGN KEY (`sports_id`) REFERENCES `sports` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_events_date_order` CHECK ((`event_end_date` >= `event_start_date`))
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (4,'ev1777994346320','SportFest 2k25',2,'Mens','2025-05-01 08:00:00','2025-05-10 15:00:00','GYM',0,'single_elimination','once',1,0,0,NULL,NULL,NULL,'Completed',1,NULL,'2026-05-05 15:19:06','2026-05-05 15:19:06'),(5,'ev1777994411541','SportFest 2k25',2,'Womens','2025-05-01 08:00:00','2025-05-10 15:00:00','GYM',0,'single_elimination','once',1,0,0,NULL,NULL,NULL,'Completed',1,NULL,'2026-05-05 15:20:11','2026-05-06 17:44:16'),(6,'ev1777994757629','SportFest 2k25',3,'Mens','2025-05-01 08:00:00','2025-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Completed',1,NULL,'2026-05-05 15:25:57','2026-05-05 15:25:57'),(7,'ev1777994757983','SportFest 2k25',3,'Womens','2025-05-01 08:00:00','2025-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Completed',1,NULL,'2026-05-05 15:25:57','2026-05-05 15:25:57'),(8,'ev1777994757678','SportFest 2k25',5,'Mens','2025-05-01 08:00:00','2025-05-10 15:00:00','GYM',0,'double_elimination','once',0,0,0,NULL,NULL,NULL,'Completed',1,NULL,'2026-05-05 15:25:57','2026-05-05 15:25:57'),(9,'ev1777994757570','SportFest 2k25',5,'Womens','2025-05-01 08:00:00','2025-05-10 15:00:00','GYM',0,'double_elimination','once',0,0,0,NULL,NULL,NULL,'Completed',1,NULL,'2026-05-05 15:25:57','2026-05-05 15:25:57'),(10,'ev1777994757619','SportFest 2k25',4,'Mens','2025-05-01 08:00:00','2025-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Completed',1,NULL,'2026-05-05 15:25:57','2026-05-05 15:25:57'),(11,'ev1777994757260','SportFest 2k25',4,'Womens','2025-05-01 08:00:00','2025-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Completed',1,NULL,'2026-05-05 15:25:57','2026-05-05 15:25:57'),(18,'ev1777995178878','SportFest 2k26',2,'Mens','2026-05-01 08:00:00','2026-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Ongoing',1,NULL,'2026-05-05 15:32:58','2026-05-05 15:32:58'),(19,'ev1777995178218','SportFest 2k26',2,'Womens','2026-05-01 08:00:00','2026-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Ongoing',1,NULL,'2026-05-05 15:32:58','2026-05-05 15:32:58'),(20,'ev1777995178737','SportFest 2k26',3,'Mens','2026-05-11 20:30:00','2026-05-12 15:00:00','GYM',0,'double_elimination','once',1,1,1,2,1,NULL,'Ongoing',1,NULL,'2026-05-05 15:32:58','2026-05-12 03:15:02'),(21,'ev1777995178671','SportFest 2k26',3,'Womens','2026-05-01 08:00:00','2026-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Ongoing',1,NULL,'2026-05-05 15:32:58','2026-05-05 15:32:58'),(22,'ev1777995178610','SportFest 2k26',5,'Mens','2026-05-01 08:00:00','2026-05-10 15:00:00','GYM',0,'double_elimination','once',0,0,0,NULL,NULL,NULL,'Ongoing',1,NULL,'2026-05-05 15:32:58','2026-05-05 15:32:58'),(23,'ev1777995178655','SportFest 2k26',5,'Womens','2026-05-01 08:00:00','2026-05-10 15:00:00','GYM',0,'double_elimination','once',0,0,0,NULL,NULL,NULL,'Ongoing',1,NULL,'2026-05-05 15:32:58','2026-05-05 15:32:58'),(24,'ev1777995178373','SportFest 2k26',4,'Mens','2026-05-01 08:00:00','2026-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Ongoing',1,NULL,'2026-05-05 15:32:58','2026-05-05 15:32:58'),(25,'ev1777995178747','SportFest 2k26',4,'Womens','2026-05-01 08:00:00','2026-05-10 15:00:00','GYM',0,'single_elimination','once',0,0,0,NULL,NULL,NULL,'Ongoing',1,NULL,'2026-05-05 15:32:58','2026-05-05 15:32:58');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news_articles`
--

DROP TABLE IF EXISTS `news_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news_articles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `excerpt` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `publish_date` date NOT NULL,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_news_publish_date` (`publish_date`),
  KEY `idx_news_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_articles`
--

LOCK TABLES `news_articles` WRITE;
/*!40000 ALTER TABLE `news_articles` DISABLE KEYS */;
INSERT INTO `news_articles` VALUES (1,'Article Test 1','General','Lorem ipsum dolor sit amet, consectetur adipiscing','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer consequat magna nec vulputate aliquet. Nunc eu libero vitae quam eleifend tempor eget ac velit. Nulla dapibus, felis a porttitor accumsan, purus lacus finibus est, eget dapibus justo nibh vel lectus. Aliquam erat volutpat. Sed sit amet purus quis diam lobortis commodo nec non risus. Sed sem nunc, sagittis a feugiat quis, accumsan ut nulla. Curabitur porta finibus sem, nec dictum purus facilisis eu. Quisque convallis metus sed diam blandit molestie. Donec fringilla eget nisi eget scelerisque. Nullam lobortis lectus ut pretium ullamcorper. Vestibulum a congue massa. Quisque dapibus cursus fringilla.','2026-05-01','[\"src/images/news/news_1777628762_0_0a5877.jpg\",\"src/images/news/news_1777628762_1_4bbc3e.jpg\",\"src/images/news/news_1777628762_2_3a8912.jpg\"]','2026-05-01 09:46:02','2026-05-05 14:59:52'),(3,'Article Test 3','General','Lorem ipsum dolor sit amet, consectetur adipiscing','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer consequat magna nec vulputate aliquet. Nunc eu libero vitae quam eleifend tempor eget ac velit. Nulla dapibus, felis a porttitor accumsan, purus lacus finibus est, eget dapibus justo nibh vel lectus. Aliquam erat volutpat. Sed sit amet purus quis diam lobortis commodo nec non risus. Sed sem nunc, sagittis a feugiat quis, accumsan ut nulla. Curabitur porta finibus sem, nec dictum purus facilisis eu. Quisque convallis metus sed diam blandit molestie. Donec fringilla eget nisi eget scelerisque. Nullam lobortis lectus ut pretium ullamcorper. Vestibulum a congue massa. Quisque dapibus cursus fringilla.','2026-05-01','src/images/news/news_1777629503_0_fbe8fa.jpg','2026-05-01 09:58:23','2026-05-05 15:00:00');
/*!40000 ALTER TABLE `news_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_blast_logs`
--

DROP TABLE IF EXISTS `sms_blast_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_blast_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `provider` varchar(40) NOT NULL DEFAULT 'philsms',
  `message_text` varchar(160) NOT NULL,
  `sender_id` varchar(40) DEFAULT NULL,
  `total_recipients` int unsigned NOT NULL DEFAULT '0',
  `sent_count` int unsigned NOT NULL DEFAULT '0',
  `failed_count` int unsigned NOT NULL DEFAULT '0',
  `status` varchar(40) NOT NULL DEFAULT 'queued',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sms_blast_logs_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_blast_logs`
--

LOCK TABLES `sms_blast_logs` WRITE;
/*!40000 ALTER TABLE `sms_blast_logs` DISABLE KEYS */;
INSERT INTO `sms_blast_logs` VALUES (1,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:07:23'),(2,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:10:28'),(3,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:13:41'),(4,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:15:40'),(5,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:15:55'),(6,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:16:30'),(7,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:16:49'),(8,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:16:50'),(9,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:16:51'),(10,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:18:07'),(11,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:18:56'),(12,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:19:09'),(13,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:19:44'),(14,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:20:22'),(15,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:21:24'),(16,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:24:45'),(17,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:25:46'),(18,'philsms','test','CvSU Bacoor Sports Hub',1,0,1,'failed','2026-05-06 06:26:12'),(19,'philsms','test','CvSU Bacoor Sports Hub',1,1,0,'sent','2026-05-06 06:26:28'),(20,'philsms','this is a test','CvSU Bacoor Sports Hub',1,1,0,'sent','2026-05-06 06:27:39'),(21,'philsms','test sms','CvSU Bacoor Sports Hub',2,2,0,'sent','2026-05-06 06:28:52'),(22,'philsms','test','CvSU Bacoor Sports Hub',2,2,0,'sent','2026-05-06 06:32:50'),(23,'philsms','test','PhilSMS',2,2,0,'sent','2026-05-06 06:35:35'),(24,'philsms','test','PhilSMS',2,2,0,'sent','2026-05-06 06:53:52'),(25,'philsms','test','PhilSMS',2,2,0,'sent','2026-05-06 06:59:41'),(26,'philsms','test','PhilSMS',2,2,0,'sent','2026-05-06 07:05:10'),(27,'philsms','test','PhilSMS',2,2,0,'sent','2026-05-06 07:05:37'),(28,'philsms','test','PhilSMS',2,0,2,'failed','2026-05-06 07:06:41'),(29,'philsms','test','PhilSMS',2,2,0,'sent','2026-05-06 07:08:18'),(30,'philsms','test','PhilSMS',2,2,0,'sent','2026-05-06 07:10:21'),(31,'philsms','test','PhilSMS',2,2,0,'sent','2026-05-06 07:11:19'),(32,'philsms','test','PhilSMS',1,0,1,'failed','2026-05-06 07:11:41'),(33,'philsms','test','PhilSMS',1,1,0,'sent','2026-05-06 07:12:20'),(34,'philsms','this is only a test','PhilSMS',1,1,0,'sent','2026-05-06 07:13:06'),(35,'philsms','this is only a test','PhilSMS',1,1,0,'sent','2026-05-06 07:13:47'),(36,'philsms','This is only a test. Do not reply.','PhilSMS',4,4,0,'sent','2026-05-06 07:19:16'),(37,'philsms','Hoy! kilala kita at pamilya mo','PhilSMS',1,1,0,'sent','2026-05-06 07:32:21'),(38,'philsms','Congratulations to BSIT for winning the Mens Basketball in Sportfest2k25 #GameOn#StingrayStrong#CvSUSports','PhilSMS',1,1,0,'sent','2026-05-06 18:01:54'),(39,'philsms','kumain ka na?','PhilSMS',1,1,0,'sent','2026-05-07 04:03:04'),(40,'philsms','test','PhilSMS',1,1,0,'sent','2026-05-11 09:36:44'),(41,'philsms','Congratulations BSIT for winning against BSCRIM in SportFest 2k26.','PhilSMS',1,0,1,'failed','2026-05-11 10:39:23'),(42,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,0,1,'failed','2026-05-11 10:46:47'),(43,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,0,1,'failed','2026-05-11 10:46:47'),(44,'philsms','Congratulations BSEDUC for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 10:52:03'),(45,'philsms','Congratulations BSEDUC for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 10:52:07'),(46,'philsms','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 10:56:43'),(47,'philsms','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 10:56:45'),(48,'philsms','Congratulations BSCS for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 10:58:51'),(49,'philsms','Congratulations BSCS for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 10:58:54'),(50,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 11:02:45'),(51,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 11:02:48'),(52,'philsms','Congratulations BSCS for winning against BSCRIM in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 11:21:18'),(53,'philsms','Congratulations BSCS for winning against BSCRIM in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-11 11:21:21'),(54,'philsms','Congratulations BSEDUC for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:34:33'),(55,'philsms','Congratulations BSEDUC for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:34:36'),(56,'philsms','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:36:06'),(57,'philsms','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:36:10'),(58,'philsms','Congratulations BSEDUC for winning against  in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:36:13'),(59,'philsms','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:36:21'),(60,'philsms','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:36:23'),(61,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:37:43'),(62,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:37:45'),(63,'philsms','Congratulations BSIT for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:37:48'),(64,'philsms','Congratulations BSIT for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:37:50'),(65,'philsms','Congratulations BSIT for winning against BSCRIM in SportFest 2k26.','PhilSMS',1,0,1,'failed','2026-05-12 02:37:59'),(66,'philsms','Congratulations BSIT for winning against BSCRIM in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:38:02'),(67,'philsms','Congratulations BSCS for winning against  in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:38:05'),(68,'philsms','Congratulations BSIT for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:38:12'),(69,'philsms','Congratulations BSIT for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:38:14'),(70,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:57:30'),(71,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:57:33'),(72,'philsms','Congratulations BSIT for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:57:38'),(73,'philsms','Congratulations BSIT for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:57:40'),(74,'philsms','Congratulations BSCS for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:57:46'),(75,'philsms','Congratulations BSCS for winning against BSEDUC in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:57:48'),(76,'philsms','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:57:54'),(77,'philsms','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:57:56'),(78,'philsms','Congratulations BSCS for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:58:02'),(79,'philsms','Congratulations BSCS for winning against BSIT in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:58:06'),(80,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:58:08'),(81,'philsms','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','PhilSMS',1,1,0,'sent','2026-05-12 02:58:12');
/*!40000 ALTER TABLE `sms_blast_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_blast_recipients`
--

DROP TABLE IF EXISTS `sms_blast_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_blast_recipients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `blast_id` bigint unsigned NOT NULL,
  `recipient_phone` varchar(20) NOT NULL,
  `recipient_name` varchar(140) DEFAULT NULL,
  `recipient_source` varchar(40) DEFAULT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'pending',
  `provider_http_code` int DEFAULT NULL,
  `provider_response` text,
  `error_message` text,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sms_blast_recipients_blast` (`blast_id`),
  CONSTRAINT `fk_sms_blast_recipients_blast` FOREIGN KEY (`blast_id`) REFERENCES `sms_blast_logs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_blast_recipients`
--

LOCK TABLES `sms_blast_recipients` WRITE;
/*!40000 ALTER TABLE `sms_blast_recipients` DISABLE KEYS */;
INSERT INTO `sms_blast_recipients` VALUES (1,1,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API.',NULL,'2026-05-06 06:07:23'),(2,2,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API.',NULL,'2026-05-06 06:10:28'),(3,3,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API.',NULL,'2026-05-06 06:13:41'),(4,4,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://dashboard.philsms.com/api/v3/sms/send): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:15:40'),(5,5,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://dashboard.philsms.com/api/v3/): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:15:55'),(6,6,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://dashboard.philsms.com/api/v3/sms/send): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:16:30'),(7,7,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://dashboard.philsms.com/api/v3/sms/send/): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:16:49'),(8,8,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://dashboard.philsms.com/api/v3/sms/send/): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:16:50'),(9,9,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://dashboard.philsms.com/api/v3/sms/send/): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:16:51'),(10,10,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://app.philsms.com/api/v3/sms/send): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:18:07'),(11,11,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://app.philsms.com/api/v3/sms/send): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:18:56'),(12,12,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://app.philsms.com/api/v3/sms/send): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:19:09'),(13,13,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: file_get_contents(https://app.philsms.com/api/v3/sms/send): Failed to open stream: No such file or directory',NULL,'2026-05-06 06:19:44'),(14,14,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: Socket connect failed: Unable to find the socket transport \"ssl\" - did you forget to enable it when you configured PHP? (71388496)',NULL,'2026-05-06 06:20:22'),(15,15,'639217477024','John Doe Test','users','failed',NULL,NULL,'Failed to connect to PhilSMS API: HTTPS socket transport unavailable. Enable OpenSSL (ssl/tls) in PHP.',NULL,'2026-05-06 06:21:24'),(16,16,'639217477024','John Doe Test','users','failed',NULL,NULL,'SSL certificate OpenSSL verify result: unable to get local issuer certificate (20)',NULL,'2026-05-06 06:24:45'),(17,17,'639217477024','John Doe Test','users','failed',NULL,NULL,'Could not resolve host: dashbaord.philsms.com',NULL,'2026-05-06 06:25:46'),(18,18,'639217477024','John Doe Test','users','failed',NULL,NULL,'Could not resolve host: dashbaord.philsms.com',NULL,'2026-05-06 06:26:12'),(19,19,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:26:29','2026-05-06 06:26:29'),(20,20,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:27:41','2026-05-06 06:27:41'),(21,21,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:28:54','2026-05-06 06:28:54'),(22,21,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:28:55','2026-05-06 06:28:55'),(23,22,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:32:51','2026-05-06 06:32:51'),(24,22,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:32:53','2026-05-06 06:32:53'),(25,23,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:35:37','2026-05-06 06:35:37'),(26,23,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:35:38','2026-05-06 06:35:38'),(27,24,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:53:54','2026-05-06 06:53:54'),(28,24,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:53:55','2026-05-06 06:53:55'),(29,25,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:59:42','2026-05-06 06:59:42'),(30,25,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 06:59:44','2026-05-06 06:59:44'),(31,26,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 07:05:12','2026-05-06 07:05:12'),(32,26,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"error\",\"message\":\"Unauthenticated.\"}','','2026-05-06 07:05:13','2026-05-06 07:05:13'),(33,27,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae844ac49b\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:05:40','2026-05-06 07:05:40'),(34,27,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae84734487\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:05:43','2026-05-06 07:05:43'),(35,28,'639217477024','John Doe Test','users','failed',404,'{\"status\":\"error\",\"message\":\"Sender ID \\\"PhilSMS\\\" is not authorized to send this message.\"}','',NULL,'2026-05-06 07:06:42'),(36,28,'639369929251','John Doe Test 2','users','failed',404,'{\"status\":\"error\",\"message\":\"Sender ID \\\"PhilSMS\\\" is not authorized to send this message.\"}','',NULL,'2026-05-06 07:06:43'),(37,29,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae8e4aaf09\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:08:20','2026-05-06 07:08:20'),(38,29,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae8e7e85c5\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:08:24','2026-05-06 07:08:24'),(39,30,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae960ae445\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:10:24','2026-05-06 07:10:24'),(40,30,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae96312bca\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:10:27','2026-05-06 07:10:27'),(41,31,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae9998d887\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:11:21','2026-05-06 07:11:21'),(42,31,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae99bdfa61\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:11:24','2026-05-06 07:11:24'),(43,32,'639369929251','John Doe Test 2','users','failed',403,'{\"status\":\"error\",\"message\":\"Failed\"}','',NULL,'2026-05-06 07:11:43'),(44,33,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fae9d6aafcf\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:12:22','2026-05-06 07:12:22'),(45,34,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69faea042d4fb\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"this is only a test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:13:08','2026-05-06 07:13:08'),(46,35,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69faea2db5278\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"this is only a test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:13:49','2026-05-06 07:13:49'),(47,36,'639217477024','John Doe Test','users','sent',200,'{\"status\":\"success\",\"message\":\"Message is scheduled successfully.\",\"data\":[{\"uid\":\"69faeb774889b\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb7848857\",\"to\":\"639567195481\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb79428c4\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb7a44951\",\"to\":\"639946335570\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}]}','','2026-05-06 07:19:22','2026-05-06 07:19:22'),(48,36,'639567195481','John Doe Test','users','sent',200,'{\"status\":\"success\",\"message\":\"Message is scheduled successfully.\",\"data\":[{\"uid\":\"69faeb774889b\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb7848857\",\"to\":\"639567195481\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb79428c4\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb7a44951\",\"to\":\"639946335570\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}]}','','2026-05-06 07:19:22','2026-05-06 07:19:22'),(49,36,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Message is scheduled successfully.\",\"data\":[{\"uid\":\"69faeb774889b\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb7848857\",\"to\":\"639567195481\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb79428c4\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb7a44951\",\"to\":\"639946335570\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}]}','','2026-05-06 07:19:22','2026-05-06 07:19:22'),(50,36,'639946335570','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Message is scheduled successfully.\",\"data\":[{\"uid\":\"69faeb774889b\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb7848857\",\"to\":\"639567195481\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb79428c4\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1},{\"uid\":\"69faeb7a44951\",\"to\":\"639946335570\",\"from\":\"PhilSMS\",\"message\":\"This is only a test. Do not reply.\",\"customer_status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}]}','','2026-05-06 07:19:22','2026-05-06 07:19:22'),(51,37,'639070354719','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69faee887b452\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Hoy! kilala kita at pamilya mo\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 07:32:24','2026-05-06 07:32:24'),(52,38,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fb8215c3a78\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations to BSIT for winning the Mens Basketball in Sportfest2k25 #GameOn#StingrayStrong#CvSUSports\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-06 18:01:57','2026-05-06 18:01:57'),(53,39,'639070354719','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"69fc0efb686aa\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"kumain ka na?\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-07 04:03:07','2026-05-07 04:03:07'),(54,40,'639369929251','John Doe Test 2','users','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01a32f4e54a\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"test\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}','','2026-05-11 09:36:47','2026-05-11 09:36:47'),(55,41,'639369929251','BSCRIM','auto_winner','failed',0,'','cURL error: SSL certificate OpenSSL verify result: unable to get local issuer certificate (20)',NULL,'2026-05-11 10:39:23'),(56,42,'639369929251','BSCRIM','auto_winner','failed',0,'','cURL error: SSL certificate OpenSSL verify result: unable to get local issuer certificate (20)',NULL,'2026-05-11 10:46:47'),(57,43,'639462258807','BSCS','auto_winner','failed',0,'','cURL error: SSL certificate OpenSSL verify result: unable to get local issuer certificate (20)',NULL,'2026-05-11 10:46:47'),(58,44,'639217477024','BSEDUC','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01b4d695b91\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSEDUC for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 10:52:07','2026-05-11 10:52:03'),(59,45,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01b4d8ae0d8\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSEDUC for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 10:52:09','2026-05-11 10:52:07'),(60,46,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01b5ed8128b\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 10:56:45','2026-05-11 10:56:43'),(61,47,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01b5f040da6\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 10:56:48','2026-05-11 10:56:45'),(62,48,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01b66da3def\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 10:58:54','2026-05-11 10:58:51'),(63,49,'639217477024','BSEDUC','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01b66faa2b4\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 10:58:56','2026-05-11 10:58:54'),(64,50,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01b757ecd2a\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 11:02:48','2026-05-11 11:02:45'),(65,51,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01b759f1cd8\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 11:02:50','2026-05-11 11:02:48'),(66,52,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01bbb17b1c8\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against BSCRIM in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 11:21:21','2026-05-11 11:21:18'),(67,53,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a01bbb3b4a24\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against BSCRIM in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-11 11:21:24','2026-05-11 11:21:21'),(68,54,'639217477024','BSEDUC','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a0291bc6746c\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSEDUC for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:34:36','2026-05-12 02:34:33'),(69,55,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a0291be72b7e\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSEDUC for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:34:38','2026-05-12 02:34:36'),(70,56,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02921a861fd\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:36:10','2026-05-12 02:36:06'),(71,57,'639217477024','BSEDUC','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02921c8ed2a\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:36:12','2026-05-12 02:36:10'),(72,58,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02921f8d6eb\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSEDUC for winning against  in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:36:15','2026-05-12 02:36:13'),(73,59,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02922795346\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:36:23','2026-05-12 02:36:21'),(74,60,'639217477024','BSEDUC','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a0292299bcf9\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:36:25','2026-05-12 02:36:23'),(75,61,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a0292797ca59\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:37:45','2026-05-12 02:37:43'),(76,62,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02927c2fbb1\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:37:48','2026-05-12 02:37:45'),(77,63,'639217477024','BSEDUC','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02927e5925d\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSIT for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:37:50','2026-05-12 02:37:48'),(78,64,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02928069198\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSIT for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:37:52','2026-05-12 02:37:50'),(79,65,'639369929251','BSCRIM','auto_winner','failed',403,'{\"status\":\"error\",\"message\":\"Failed\"}','Failed',NULL,'2026-05-12 02:37:59'),(80,66,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02928da6e55\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSIT for winning against BSCRIM in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:38:05','2026-05-12 02:38:02'),(81,67,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02928fe1508\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against  in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:38:08','2026-05-12 02:38:05'),(82,68,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a029296578a1\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSIT for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:38:14','2026-05-12 02:38:12'),(83,69,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02929881c7e\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSIT for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:38:16','2026-05-12 02:38:14'),(84,70,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02971d2e492\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:57:33','2026-05-12 02:57:30'),(85,71,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02971f3247c\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:57:35','2026-05-12 02:57:33'),(86,72,'639217477024','BSEDUC','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02972405c36\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSIT for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:57:40','2026-05-12 02:57:38'),(87,73,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a029726211d8\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSIT for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:57:42','2026-05-12 02:57:40'),(88,74,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02972c2942d\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:57:48','2026-05-12 02:57:46'),(89,75,'639217477024','BSEDUC','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02972e33910\",\"to\":\"639217477024\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against BSEDUC in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:57:50','2026-05-12 02:57:48'),(90,76,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02973400ea7\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:57:56','2026-05-12 02:57:54'),(91,77,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02973614727\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:57:58','2026-05-12 02:57:56'),(92,78,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02973e325e2\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:58:06','2026-05-12 02:58:02'),(93,79,'639070354719','BSIT','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a02974046a84\",\"to\":\"639070354719\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCS for winning against BSIT in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:58:08','2026-05-12 02:58:06'),(94,80,'639369929251','BSCRIM','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a029743d7f30\",\"to\":\"639369929251\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:58:12','2026-05-12 02:58:08'),(95,81,'639462258807','BSCS','auto_winner','sent',200,'{\"status\":\"success\",\"message\":\"Your message was successfully delivered\",\"data\":{\"uid\":\"6a029745ea81c\",\"to\":\"639462258807\",\"from\":\"PhilSMS\",\"message\":\"Congratulations BSCRIM for winning against BSCS in SportFest 2k26.\",\"status\":\"Delivered\",\"cost\":\"1\",\"sms_count\":1}}',NULL,'2026-05-12 02:58:14','2026-05-12 02:58:12');
/*!40000 ALTER TABLE `sms_blast_recipients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_gateway_settings`
--

DROP TABLE IF EXISTS `sms_gateway_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_gateway_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `provider` varchar(40) NOT NULL DEFAULT 'philsms',
  `api_url` varchar(255) NOT NULL,
  `api_token` text NOT NULL,
  `sender_id` varchar(40) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sms_gateway_provider` (`provider`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_gateway_settings`
--

LOCK TABLES `sms_gateway_settings` WRITE;
/*!40000 ALTER TABLE `sms_gateway_settings` DISABLE KEYS */;
INSERT INTO `sms_gateway_settings` VALUES (1,'philsms','https://dashboard.philsms.com/api/v3/sms/send','2845|dErdcjgcmrxVUUHoTVK6qdAaNURqMC9LfiG99hTd88443e04','PhilSMS','2026-05-06 07:07:49');
/*!40000 ALTER TABLE `sms_gateway_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_match_notifications`
--

DROP TABLE IF EXISTS `sms_match_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_match_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `match_id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned NOT NULL,
  `team_id` bigint unsigned DEFAULT NULL,
  `recipient_phone` varchar(30) NOT NULL,
  `notification_type` enum('reminder','winner') NOT NULL,
  `message` text NOT NULL,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(30) NOT NULL DEFAULT 'Sent',
  `error_message` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_match_phone_type` (`match_id`,`recipient_phone`,`notification_type`),
  KEY `idx_sms_match_notif_event` (`event_id`),
  KEY `idx_sms_match_notif_match` (`match_id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_match_notifications`
--

LOCK TABLES `sms_match_notifications` WRITE;
/*!40000 ALTER TABLE `sms_match_notifications` DISABLE KEYS */;
INSERT INTO `sms_match_notifications` VALUES (1,179,20,93,'639070354719','winner','Congratulations BSIT for winning against BSCS in SportFest 2k26.','2026-05-11 10:11:22','Failed','No active SMS gateway configured.'),(2,179,20,91,'639462258807','winner','Congratulations BSIT for winning against BSCS in SportFest 2k26.','2026-05-11 10:11:23','Failed','No active SMS gateway configured.'),(3,180,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','2026-05-11 10:18:12','Queued',NULL),(4,181,20,93,'639070354719','winner','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','2026-05-11 10:34:02','Sent',NULL),(6,181,20,90,'639369929251','winner','Congratulations BSIT for winning against BSCRIM in SportFest 2k26.','2026-05-11 10:39:23','Failed','cURL error: SSL certificate OpenSSL verify result: unable to get local issuer certificate (20)'),(21,182,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-11 10:46:47','Failed','cURL error: SSL certificate OpenSSL verify result: unable to get local issuer certificate (20)'),(22,182,20,91,'639462258807','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-11 10:46:48','Failed','cURL error: SSL certificate OpenSSL verify result: unable to get local issuer certificate (20)'),(23,183,20,92,'639217477024','winner','Congratulations BSEDUC for winning against BSIT in SportFest 2k26.','2026-05-11 10:52:07','Sent',NULL),(24,183,20,93,'639070354719','winner','Congratulations BSEDUC for winning against BSIT in SportFest 2k26.','2026-05-11 10:52:09','Sent',NULL),(35,188,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','2026-05-11 10:56:45','Sent',NULL),(36,188,20,93,'639070354719','winner','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','2026-05-11 10:56:48','Sent',NULL),(37,189,20,91,'639462258807','winner','Congratulations BSCS for winning against BSEDUC in SportFest 2k26.','2026-05-11 10:58:54','Sent',NULL),(38,189,20,92,'639217477024','winner','Congratulations BSCS for winning against BSEDUC in SportFest 2k26.','2026-05-11 10:58:56','Sent',NULL),(39,190,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-11 11:02:48','Sent',NULL),(40,190,20,91,'639462258807','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-11 11:02:50','Sent',NULL),(45,191,20,90,'639369929251','winner','Congratulations BSCS for winning against BSCRIM in SportFest 2k26.','2026-05-11 11:21:21','Sent',NULL),(46,191,20,91,'639462258807','winner','Congratulations BSCS for winning against BSCRIM in SportFest 2k26.','2026-05-11 11:21:24','Sent',NULL),(47,192,20,92,'639217477024','winner','Congratulations BSEDUC for winning against BSIT in SportFest 2k26.','2026-05-12 02:34:36','Sent',NULL),(48,192,20,93,'639070354719','winner','Congratulations BSEDUC for winning against BSIT in SportFest 2k26.','2026-05-12 02:34:38','Sent',NULL),(51,193,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:36:10','Sent',NULL),(52,193,20,92,'639217477024','winner','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:36:12','Sent',NULL),(53,195,20,91,'639462258807','winner','Congratulations BSEDUC for winning against  in SportFest 2k26.','2026-05-12 02:36:15','Sent',NULL),(54,196,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:36:23','Sent',NULL),(55,196,20,92,'639217477024','winner','Congratulations BSCRIM for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:36:25','Sent',NULL),(56,197,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-12 02:37:45','Sent',NULL),(57,197,20,91,'639462258807','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-12 02:37:48','Sent',NULL),(58,198,20,92,'639217477024','winner','Congratulations BSIT for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:37:50','Sent',NULL),(59,198,20,93,'639070354719','winner','Congratulations BSIT for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:37:52','Sent',NULL),(60,199,20,90,'639369929251','winner','Congratulations BSIT for winning against BSCRIM in SportFest 2k26.','2026-05-12 02:38:02','Failed','Failed'),(61,199,20,93,'639070354719','winner','Congratulations BSIT for winning against BSCRIM in SportFest 2k26.','2026-05-12 02:38:05','Sent',NULL),(62,201,20,91,'639462258807','winner','Congratulations BSCS for winning against  in SportFest 2k26.','2026-05-12 02:38:08','Sent',NULL),(63,202,20,93,'639070354719','winner','Congratulations BSIT for winning against BSCS in SportFest 2k26.','2026-05-12 02:38:14','Sent',NULL),(64,202,20,91,'639462258807','winner','Congratulations BSIT for winning against BSCS in SportFest 2k26.','2026-05-12 02:38:16','Sent',NULL),(65,207,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-12 02:57:33','Sent',NULL),(66,207,20,91,'639462258807','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-12 02:57:35','Sent',NULL),(67,208,20,92,'639217477024','winner','Congratulations BSIT for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:57:40','Sent',NULL),(68,208,20,93,'639070354719','winner','Congratulations BSIT for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:57:42','Sent',NULL),(69,210,20,91,'639462258807','winner','Congratulations BSCS for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:57:48','Sent',NULL),(70,210,20,92,'639217477024','winner','Congratulations BSCS for winning against BSEDUC in SportFest 2k26.','2026-05-12 02:57:50','Sent',NULL),(71,209,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','2026-05-12 02:57:56','Sent',NULL),(72,209,20,93,'639070354719','winner','Congratulations BSCRIM for winning against BSIT in SportFest 2k26.','2026-05-12 02:57:58','Sent',NULL),(73,211,20,91,'639462258807','winner','Congratulations BSCS for winning against BSIT in SportFest 2k26.','2026-05-12 02:58:06','Sent',NULL),(74,211,20,93,'639070354719','winner','Congratulations BSCS for winning against BSIT in SportFest 2k26.','2026-05-12 02:58:08','Sent',NULL),(75,212,20,90,'639369929251','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-12 02:58:12','Sent',NULL),(76,212,20,91,'639462258807','winner','Congratulations BSCRIM for winning against BSCS in SportFest 2k26.','2026-05-12 02:58:14','Sent',NULL);
/*!40000 ALTER TABLE `sms_match_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sports`
--

DROP TABLE IF EXISTS `sports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sport_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sport_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sports_code` (`sport_code`),
  UNIQUE KEY `uq_sports_name` (`sport_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sports`
--

LOCK TABLES `sports` WRITE;
/*!40000 ALTER TABLE `sports` DISABLE KEYS */;
INSERT INTO `sports` VALUES (2,'BBL','Basketball','src/images/sports/sport_1777649376_df2f8369.png',1,'2026-05-01 15:29:36','2026-05-01 15:29:36'),(3,'VOL','Volleyball','src/images/sports/sport_1777649599_92a00db3.png',1,'2026-05-01 15:32:27','2026-05-01 15:33:20'),(4,'FUT','Futsal','src/images/sports/sport_1777649581_261c926b.png',1,'2026-05-01 15:33:01','2026-05-01 15:33:01'),(5,'BAD','Badminton','src/images/sports/sport_1777649623_43f5fde4.png',1,'2026-05-01 15:33:43','2026-05-01 15:33:43');
/*!40000 ALTER TABLE `sports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_registrations`
--

DROP TABLE IF EXISTS `team_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_registrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sports_id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned NOT NULL,
  `category` enum('Mens','Womens','Open') COLLATE utf8mb4_unicode_ci NOT NULL,
  `representative_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `representative_first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `representative_last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `representative_student_id` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `representative_course_id` bigint unsigned NOT NULL,
  `contact_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_address` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coach_first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coach_last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `players_json` json NOT NULL,
  `documents_json` json DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('Pending','Approved','Rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `submitted_by_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_by_role` enum('Administrator','Representative') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_id` bigint unsigned NOT NULL,
  `reviewed_by_name` varchar(180) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_team_registrations_status` (`status`),
  KEY `idx_team_registrations_created_by` (`created_by_id`),
  KEY `idx_team_registrations_sport_event` (`sports_id`,`event_id`),
  KEY `idx_team_registrations_submitted_at` (`submitted_at`),
  KEY `fk_team_registrations_events` (`event_id`),
  KEY `fk_team_registrations_courses` (`representative_course_id`),
  CONSTRAINT `fk_team_registrations_courses` FOREIGN KEY (`representative_course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_team_registrations_events` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_team_registrations_sports` FOREIGN KEY (`sports_id`) REFERENCES `sports` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_team_registrations_users` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_registrations`
--

LOCK TABLES `team_registrations` WRITE;
/*!40000 ALTER TABLE `team_registrations` DISABLE KEYS */;
INSERT INTO `team_registrations` VALUES (12,'BSCRIM',5,8,'Mens','John Doe Test 2','John','Doe Test 2','0000000',3,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085493388, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 16:41:36','2026-05-06 16:38:19','2026-05-06 16:38:19','2026-05-06 16:41:36'),(13,'BSCRIM',5,9,'Womens','John Doe Test 2','John','Doe Test 2','000000',3,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085576599, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"0000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 16:41:37','2026-05-06 16:39:40','2026-05-06 16:39:40','2026-05-06 16:41:37'),(14,'BSCRIM',4,10,'Mens','John Doe Test 2','John','Doe Test 2','0000',3,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778085792964, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 16:49:36','2026-05-06 16:43:18','2026-05-06 16:43:18','2026-05-06 16:49:36'),(15,'BSCRIM',4,11,'Womens','John Doe Test 2','John','Doe Test 2','00000',3,'00000','test@a.com','Jose','RIzal','[{\"id\": 1778085830995, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 16:49:35','2026-05-06 16:43:51','2026-05-06 16:43:51','2026-05-06 16:49:35'),(16,'BSCRIM',3,6,'Mens','John Doe Test 2','John','Doe Test 2','000000',3,'00000000','test@a.com','Jose','Rizal','[{\"id\": 1778085950396, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 16:49:31','2026-05-06 16:45:50','2026-05-06 16:45:50','2026-05-06 16:49:31'),(17,'BSCRIM',3,7,'Womens','John Doe Test 2','John','Doe Test 2','00000',3,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086097998, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 16:49:31','2026-05-06 16:48:19','2026-05-06 16:48:19','2026-05-06 16:49:31'),(18,'BSCRIM',2,4,'Mens','John Doe Test 2','John','Doe Test 2','000000',3,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086156659, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 16:49:29','2026-05-06 16:49:18','2026-05-06 16:49:18','2026-05-06 16:49:29'),(19,'BSCS',5,8,'Mens','John Doe Test 2','John','Doe Test 2','0000000',2,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085493388, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:34','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:34'),(20,'BSCS',5,9,'Womens','John Doe Test 2','John','Doe Test 2','000000',2,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085576599, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"0000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:35','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:35'),(21,'BSCS',4,10,'Mens','John Doe Test 2','John','Doe Test 2','0000',2,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778085792964, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:37','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:37'),(22,'BSCS',4,11,'Womens','John Doe Test 2','John','Doe Test 2','00000',2,'00000','test@a.com','Jose','RIzal','[{\"id\": 1778085830995, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:38','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:38'),(23,'BSCS',3,6,'Mens','John Doe Test 2','John','Doe Test 2','000000',2,'00000000','test@a.com','Jose','Rizal','[{\"id\": 1778085950396, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:39','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:39'),(24,'BSCS',3,7,'Womens','John Doe Test 2','John','Doe Test 2','00000',2,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086097998, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:00','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:00'),(25,'BSCS',2,4,'Mens','John Doe Test 2','John','Doe Test 2','000000',2,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086156659, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:40','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:40'),(26,'BSEDUC',5,8,'Mens','John Doe Test 2','John','Doe Test 2','0000000',6,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085493388, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:05','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:05'),(27,'BSEDUC',5,9,'Womens','John Doe Test 2','John','Doe Test 2','000000',6,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085576599, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"0000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:07','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:07'),(28,'BSEDUC',4,10,'Mens','John Doe Test 2','John','Doe Test 2','0000',6,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778085792964, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:08','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:08'),(29,'BSEDUC',4,11,'Womens','John Doe Test 2','John','Doe Test 2','00000',6,'00000','test@a.com','Jose','RIzal','[{\"id\": 1778085830995, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:09','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:09'),(30,'BSEDUC',3,6,'Mens','John Doe Test 2','John','Doe Test 2','000000',6,'00000000','test@a.com','Jose','Rizal','[{\"id\": 1778085950396, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:10','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:10'),(31,'BSEDUC',3,7,'Womens','John Doe Test 2','John','Doe Test 2','00000',6,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086097998, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:11','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:11'),(32,'BSEDUC',2,4,'Mens','John Doe Test 2','John','Doe Test 2','000000',6,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086156659, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:12','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:12'),(33,'BSIT',5,8,'Mens','John Doe Test 2','John','Doe Test 2','0000000',1,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085493388, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:13','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:13'),(34,'BSIT',5,9,'Womens','John Doe Test 2','John','Doe Test 2','000000',1,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085576599, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"0000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:14','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:14'),(35,'BSIT',4,10,'Mens','John Doe Test 2','John','Doe Test 2','0000',1,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778085792964, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:16','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:16'),(36,'BSIT',4,11,'Womens','John Doe Test 2','John','Doe Test 2','00000',1,'00000','test@a.com','Jose','RIzal','[{\"id\": 1778085830995, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:12','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:12'),(37,'BSIT',3,6,'Mens','John Doe Test 2','John','Doe Test 2','000000',1,'00000000','test@a.com','Jose','Rizal','[{\"id\": 1778085950396, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:20','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:20'),(38,'BSIT',3,7,'Womens','John Doe Test 2','John','Doe Test 2','00000',1,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086097998, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:21','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:21'),(39,'BSIT',2,4,'Mens','John Doe Test 2','John','Doe Test 2','000000',1,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086156659, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:22','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:22'),(40,'BSM',5,8,'Mens','John Doe Test 2','John','Doe Test 2','0000000',5,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085493388, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:10:10','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:10:10'),(41,'BSM',5,9,'Womens','John Doe Test 2','John','Doe Test 2','000000',5,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085576599, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"0000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:10:13','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:10:13'),(42,'BSM',4,10,'Mens','John Doe Test 2','John','Doe Test 2','0000',5,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778085792964, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:10:15','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:10:15'),(43,'BSM',4,11,'Womens','John Doe Test 2','John','Doe Test 2','00000',5,'00000','test@a.com','Jose','RIzal','[{\"id\": 1778085830995, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:10:18','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:10:18'),(44,'BSM',3,6,'Mens','John Doe Test 2','John','Doe Test 2','000000',5,'00000000','test@a.com','Jose','Rizal','[{\"id\": 1778085950396, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:10:21','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:10:21'),(45,'BSM',3,7,'Womens','John Doe Test 2','John','Doe Test 2','00000',5,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086097998, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:10:24','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:10:24'),(46,'BSM',2,4,'Mens','John Doe Test 2','John','Doe Test 2','000000',5,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086156659, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:10:26','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:10:26'),(47,'BSPSYCH',5,8,'Mens','John Doe Test 2','John','Doe Test 2','0000000',7,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085493388, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:22','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:22'),(48,'BSPSYCH',5,9,'Womens','John Doe Test 2','John','Doe Test 2','000000',7,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085576599, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"0000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:23','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:23'),(49,'BSPSYCH',4,10,'Mens','John Doe Test 2','John','Doe Test 2','0000',7,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778085792964, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:24','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:24'),(50,'BSPSYCH',4,11,'Womens','John Doe Test 2','John','Doe Test 2','00000',7,'00000','test@a.com','Jose','RIzal','[{\"id\": 1778085830995, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:25','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:25'),(51,'BSPSYCH',3,6,'Mens','John Doe Test 2','John','Doe Test 2','000000',7,'00000000','test@a.com','Jose','Rizal','[{\"id\": 1778085950396, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:26','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:26'),(52,'BSPSYCH',3,7,'Womens','John Doe Test 2','John','Doe Test 2','00000',7,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086097998, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:27','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:27'),(53,'BSPSYCH',2,4,'Mens','John Doe Test 2','John','Doe Test 2','000000',7,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086156659, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:08:28','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:08:28'),(54,'HRM',5,8,'Mens','John Doe Test 2','John','Doe Test 2','0000000',4,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085493388, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:58','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:58'),(55,'HRM',5,9,'Womens','John Doe Test 2','John','Doe Test 2','000000',4,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778085576599, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"0000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:01','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:01'),(56,'HRM',4,10,'Mens','John Doe Test 2','John','Doe Test 2','0000',4,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778085792964, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:02','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:02'),(57,'HRM',4,11,'Womens','John Doe Test 2','John','Doe Test 2','00000',4,'00000','test@a.com','Jose','RIzal','[{\"id\": 1778085830995, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:03','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:03'),(58,'HRM',3,6,'Mens','John Doe Test 2','John','Doe Test 2','000000',4,'00000000','test@a.com','Jose','Rizal','[{\"id\": 1778085950396, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:55','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:55'),(59,'HRM',3,7,'Womens','John Doe Test 2','John','Doe Test 2','00000',4,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086097998, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:56','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:56'),(60,'HRM',2,4,'Mens','John Doe Test 2','John','Doe Test 2','000000',4,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778086156659, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:07:57','2026-05-07 00:58:40','2026-05-07 00:58:40','2026-05-06 17:07:57'),(82,'BSCRIM',2,4,'Mens','John Doe Test 2','John','Doe Test 2','000000',3,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778087673459, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"0000\", \"course_name\": \"BSCRIM\"}]','[]','','Rejected','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:14:49','2026-05-06 17:14:33','2026-05-06 17:14:33','2026-05-06 17:14:49'),(83,'BSCRIM',2,5,'Womens','John Doe Test 2','John','Doe Test 2','00000',3,'000000','test@a.com','Jose','Rizal','[{\"id\": 1778087729978, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:49:32','2026-05-06 17:15:31','2026-05-06 17:15:31','2026-05-06 17:49:32'),(84,'BSCS',2,5,'Womens','John Doe Test 2','John','Doe Test 2','000000',2,'00000000','test@a.com','Jose','RIzal','[{\"id\": 1778087784836, \"course_id\": 2, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCS\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:49:29','2026-05-06 17:16:25','2026-05-06 17:16:25','2026-05-06 17:49:29'),(85,'BSEDUC',2,5,'Womens','John Doe Test 2','John','Doe Test 2','00000000',6,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778087885301, \"course_id\": 6, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSEDUC\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:49:28','2026-05-06 17:18:08','2026-05-06 17:18:08','2026-05-06 17:49:28'),(86,'BSIT',2,5,'Womens','John Doe Test 2','John','Doe Test 2','000000',1,'0000000','test@a.com','Jose','Rizal','[{\"id\": 1778089502244, \"course_id\": 1, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSIT\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:49:27','2026-05-06 17:45:03','2026-05-06 17:45:03','2026-05-06 17:49:27'),(87,'BSM',2,5,'Womens','John Doe Test 2','John','Doe Test 2','00000',5,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778089531562, \"course_id\": 5, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:49:25','2026-05-06 17:45:32','2026-05-06 17:45:32','2026-05-06 17:49:25'),(88,'BSPSYCH',2,5,'Womens','John Doe Test 2','John','Doe Test 2','0000',7,'0000','test@a.com','Jose','Rizal','[{\"id\": 1778089566612, \"course_id\": 7, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSPSYCH\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:49:24','2026-05-06 17:46:07','2026-05-06 17:46:07','2026-05-06 17:49:24'),(89,'HRM',2,5,'Womens','John Doe Test 2','John','Doe Test 2','0000',4,'00000','test@a.com','Jose','Rizal','[{\"id\": 1778089731320, \"course_id\": 4, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"HRM\"}]','[]','','Approved','John Doe Test 2','Representative',6,'John Doe Test','2026-05-06 17:49:22','2026-05-06 17:48:52','2026-05-06 17:48:52','2026-05-06 17:49:22'),(90,'BSCRIM',3,20,'Mens','John Doe Test','John','Doe Test','0000000',3,'09369929251','test2@a.com','Jose','Rizal','[{\"id\": 1778491092382, \"course_id\": 3, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"000000\", \"course_name\": \"BSCRIM\"}]','[]','','Approved','John Doe Test','Representative',7,'John Doe Test','2026-05-11 09:24:52','2026-05-11 09:18:20','2026-05-11 09:18:20','2026-05-11 09:24:52'),(91,'BSCS',3,20,'Mens','John Doe Test','John','Doe Test','90000000',2,'09462258807','test2@a.com','Jose','Rizal','[{\"id\": 1778491167604, \"course_id\": 2, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"00000\", \"course_name\": \"BSCS\"}]','[]','','Approved','John Doe Test','Representative',7,'John Doe Test','2026-05-11 09:24:51','2026-05-11 09:19:33','2026-05-11 09:19:33','2026-05-11 09:24:51'),(92,'BSEDUC',3,20,'Mens','John Doe Test','John','Doe Test','1234',6,'09217477024','test2@a.com','Jose','Rizal','[{\"id\": 1778491235134, \"course_id\": 6, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"98797\", \"course_name\": \"BSEDUC\"}]','[]','','Approved','John Doe Test','Representative',7,'John Doe Test','2026-05-11 09:24:50','2026-05-11 09:20:35','2026-05-11 09:20:35','2026-05-11 09:24:50'),(93,'BSIT',3,20,'Mens','John Doe Test','John','Doe Test','12341234',1,'09070354719','test2@a.com','Jose','Rizal','[{\"id\": 1778491283153, \"course_id\": 1, \"last_name\": \"Rizal\", \"first_name\": \"Jose\", \"student_id\": \"123124\", \"course_name\": \"BSIT\"}]','[]','','Approved','John Doe Test','Representative',7,'John Doe Test','2026-05-11 09:24:50','2026-05-11 09:21:23','2026-05-11 09:21:23','2026-05-11 09:24:50');
/*!40000 ALTER TABLE `team_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournament_bracket_participants`
--

DROP TABLE IF EXISTS `tournament_bracket_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tournament_bracket_participants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bracket_id` bigint unsigned NOT NULL,
  `registration_id` bigint unsigned NOT NULL,
  `seed_no` int unsigned NOT NULL,
  `is_bye` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bracket_participant_seed` (`bracket_id`,`seed_no`),
  UNIQUE KEY `uq_bracket_participant_registration` (`bracket_id`,`registration_id`),
  KEY `idx_bracket_participant_registration` (`registration_id`),
  CONSTRAINT `fk_bracket_participant_bracket` FOREIGN KEY (`bracket_id`) REFERENCES `tournament_brackets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bracket_participant_registration` FOREIGN KEY (`registration_id`) REFERENCES `team_registrations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournament_bracket_participants`
--

LOCK TABLES `tournament_bracket_participants` WRITE;
/*!40000 ALTER TABLE `tournament_bracket_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `tournament_bracket_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournament_brackets`
--

DROP TABLE IF EXISTS `tournament_brackets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tournament_brackets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `bracket_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tournament_type` enum('single_elimination','double_elimination','round_robin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `round_robin_format` enum('once') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'once',
  `has_third_place_match` tinyint(1) NOT NULL DEFAULT '1',
  `participant_count` int unsigned NOT NULL,
  `status` enum('Draft','Generated','InProgress','Completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Generated',
  `ui_theme` enum('dark','light') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dark',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tournament_brackets_code` (`bracket_code`),
  KEY `idx_tournament_brackets_event_id` (`event_id`),
  KEY `idx_tournament_brackets_type_status` (`tournament_type`,`status`),
  KEY `fk_tournament_brackets_created_by` (`created_by`),
  CONSTRAINT `fk_tournament_brackets_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tournament_brackets_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournament_brackets`
--

LOCK TABLES `tournament_brackets` WRITE;
/*!40000 ALTER TABLE `tournament_brackets` DISABLE KEYS */;
INSERT INTO `tournament_brackets` VALUES (28,4,'bk1778089787309','single_elimination','once',1,7,'Generated','dark',NULL,'2026-05-06 17:49:47','2026-05-08 18:24:03'),(37,20,'bk1778555712453','double_elimination','once',1,4,'Generated','dark',NULL,'2026-05-12 03:15:12','2026-05-12 03:15:12');
/*!40000 ALTER TABLE `tournament_brackets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournament_matches`
--

DROP TABLE IF EXISTS `tournament_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tournament_matches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bracket_id` bigint unsigned NOT NULL,
  `match_no` int unsigned NOT NULL,
  `bracket_stage` enum('main','upper','lower','third_place','final','round_robin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'main',
  `round_no` int unsigned NOT NULL DEFAULT '1',
  `round_label` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team1_registration_id` bigint unsigned DEFAULT NULL,
  `team2_registration_id` bigint unsigned DEFAULT NULL,
  `team1_score` int NOT NULL DEFAULT '0',
  `team2_score` int NOT NULL DEFAULT '0',
  `winner_registration_id` bigint unsigned DEFAULT NULL,
  `next_match_id` bigint unsigned DEFAULT NULL,
  `next_match_slot` enum('team1','team2') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loser_next_match_id` bigint unsigned DEFAULT NULL,
  `loser_next_match_slot` enum('team1','team2') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule_date` date DEFAULT NULL,
  `schedule_time` time DEFAULT NULL,
  `location` varchar(180) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `match_description` text COLLATE utf8mb4_unicode_ci,
  `match_status` enum('Pending','Scheduled','Ongoing','Completed','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tournament_matches_no` (`bracket_id`,`match_no`),
  KEY `idx_tournament_matches_bracket_round` (`bracket_id`,`round_no`),
  KEY `idx_tournament_matches_winner` (`winner_registration_id`),
  KEY `idx_tournament_matches_next` (`next_match_id`),
  KEY `fk_tournament_matches_team1` (`team1_registration_id`),
  KEY `fk_tournament_matches_team2` (`team2_registration_id`),
  KEY `fk_tm_loser_next` (`loser_next_match_id`),
  CONSTRAINT `fk_tm_loser_next` FOREIGN KEY (`loser_next_match_id`) REFERENCES `tournament_matches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tournament_matches_bracket` FOREIGN KEY (`bracket_id`) REFERENCES `tournament_brackets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tournament_matches_next` FOREIGN KEY (`next_match_id`) REFERENCES `tournament_matches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tournament_matches_team1` FOREIGN KEY (`team1_registration_id`) REFERENCES `team_registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tournament_matches_team2` FOREIGN KEY (`team2_registration_id`) REFERENCES `team_registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tournament_matches_winner` FOREIGN KEY (`winner_registration_id`) REFERENCES `team_registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=225 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournament_matches`
--

LOCK TABLES `tournament_matches` WRITE;
/*!40000 ALTER TABLE `tournament_matches` DISABLE KEYS */;
INSERT INTO `tournament_matches` VALUES (171,28,1,'main',1,'Quarterfinals',18,25,1,0,18,175,'team1',NULL,NULL,'2025-05-01','08:00:00','GYM',NULL,'Completed','2026-05-06 17:49:47','2026-05-06 17:53:51'),(172,28,2,'main',1,'Quarterfinals',32,39,0,1,39,175,'team2',NULL,NULL,'2025-05-01','09:00:00','GYM',NULL,'Completed','2026-05-06 17:49:47','2026-05-06 17:54:01'),(173,28,3,'main',1,'Quarterfinals',46,53,0,1,53,176,'team1',NULL,NULL,'2025-05-01','10:00:00','GYM',NULL,'Completed','2026-05-06 17:49:47','2026-05-06 17:54:08'),(174,28,4,'main',1,'Quarterfinals',60,NULL,1,0,60,176,'team2',NULL,NULL,'2025-05-01','11:00:00','GYM',NULL,'Completed','2026-05-06 17:49:47','2026-05-06 17:54:16'),(175,28,5,'main',2,'Semifinals',18,39,0,1,39,177,'team1',178,'team1','2025-05-02','08:00:00','GYM',NULL,'Completed','2026-05-06 17:49:47','2026-05-06 17:54:53'),(176,28,6,'main',2,'Semifinals',53,60,1,0,53,177,'team2',178,'team2','2025-05-02','09:00:00','GYM',NULL,'Completed','2026-05-06 17:49:47','2026-05-06 17:55:22'),(177,28,7,'main',3,'Finals',39,53,1,0,39,NULL,NULL,NULL,NULL,'2025-05-03','09:00:00','GYM',NULL,'Completed','2026-05-06 17:49:47','2026-05-06 17:56:14'),(178,28,8,'third_place',3,'3rd Place Match',18,60,1,0,18,NULL,NULL,NULL,NULL,'2025-05-03','08:00:00','GYM','Losers of the semifinals play for 3rd place.','Completed','2026-05-06 17:49:47','2026-05-08 18:21:37'),(219,37,1,'upper',1,'Winners Semifinals',90,91,0,0,NULL,221,'team1',222,'team1',NULL,NULL,NULL,NULL,'Pending','2026-05-12 03:15:12','2026-05-12 03:15:12'),(220,37,2,'upper',1,'Winners Semifinals',92,93,0,0,NULL,221,'team2',222,'team2',NULL,NULL,NULL,NULL,'Pending','2026-05-12 03:15:12','2026-05-12 03:15:12'),(221,37,3,'upper',2,'Winners Finals',NULL,NULL,0,0,NULL,224,'team1',223,'team2',NULL,NULL,NULL,NULL,'Pending','2026-05-12 03:15:12','2026-05-12 03:15:12'),(222,37,4,'lower',1,'Losers Semifinals',NULL,NULL,0,0,NULL,223,'team1',NULL,NULL,NULL,NULL,NULL,NULL,'Pending','2026-05-12 03:15:12','2026-05-12 03:15:12'),(223,37,5,'lower',2,'Losers Final',NULL,NULL,0,0,NULL,224,'team2',NULL,NULL,NULL,NULL,NULL,NULL,'Pending','2026-05-12 03:15:12','2026-05-12 03:15:12'),(224,37,6,'final',3,'Grand Final',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Winners Champion vs Losers Champion','Pending','2026-05-12 03:15:12','2026-05-12 03:15:12');
/*!40000 ALTER TABLE `tournament_matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('Administrator','Representative') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Representative',
  `status` enum('Active','Inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'admin','$2y$12$NXdVMmtT2ukpLijYnakN8.kk29wf52O.As1r0TNwT.yYbvV8huM7G','John Doe Test','john@example.com','639217477024','Administrator','Active','2026-04-29 19:35:43','2026-05-06 06:32:35'),(3,'admin2','$2y$12$eWwcPWH/8uv9GB8G3M3NzOV.40RCwZgLPbtiVScZ4Gtl.p4IbZe2i','John Doe Test2ww','jd@example.com','639217477024','Administrator','Active','2026-04-29 20:06:00','2026-05-06 06:32:17'),(6,'rep','$2y$12$VzKtP1LNBP46lqQjdGXrfOb9pnQuJKF0.XC1DFIXHVhkloFH194wS','John Doe Test 2','test@a.com','639369929251','Representative','Active','2026-05-01 18:30:24','2026-05-06 06:32:11'),(7,'rep2','$2y$12$3FLPSzKmRMgIrNfhW5v8xO5H/8xOhTeyxwFX0q90BKxGrg.Rnm1NW','John Doe Test','test2@a.com','639567195481','Representative','Active','2026-05-06 07:15:01','2026-05-06 07:15:01'),(8,'rep3','$2y$12$95hPAd1UVzU8iIVzofrMZuhhu5Pl7E.ggAVnN59hT6.soNWKD99Tq','John Doe Test 2','test3@a.com','639946335570','Representative','Active','2026-05-06 07:15:27','2026-05-06 07:15:27'),(9,'rep4','$2y$12$CfyzloB2v9L8eYuAl5FrEuB340eRcKWKO5S9/0xfQAQM4PMMuF6WG','John Doe Test 2','test4@a.com','09070354719','Representative','Active','2026-05-06 07:31:34','2026-05-06 07:31:34');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-27 22:03:32
