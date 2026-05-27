# Online Tournament Management - Full Setup Guide (Windows)

This guide covers complete setup from package contents to running the website locally.

## 1) What Is Included in This Package

Core setup assets found in the repository:

- installers/mysql-9.7.0-winx64.msi
- installers/php.zip
- start-server.bat

Important:
- start-server.bat starts the PHP development web server.
- MySQL database service startup may be done using an existing MySQL service, XAMPP service control, or your own .bat file (steps included below).

## 2) Prerequisites

- Windows 10/11
- Administrator access for software/service install
- Network access (only needed if your SMS gateway requires it)

## 3) Install MySQL

Option A: Use included installer
1. Open installers/mysql-9.7.0-winx64.msi
2. Complete setup and install MySQL Server.
3. During setup:
   - set root password
   - keep default port 3306 unless required to change
4. Confirm service name (commonly MySQL80).

Option B: Use existing MySQL installation
- Ensure MySQL service is installed and running.
- Ensure you know host, username, password, and port.

## 4) Install PHP

Option A: Use included archive
1. Extract installers/php.zip to a folder such as C:/php.
2. Add C:/php to system PATH.
3. Open new terminal and run:
   php -v

Option B: Use existing PHP
- Ensure php command is available in terminal.

## 5) Configure Database Connection in the Project

Edit config/db.php with your environment values:

- DB_HOST
- DB_USER
- DB_PASS
- DB_NAME
- DB_PORT

Default target database name used by project: otm_db

## 6) Restore Database Tables and Initial Data

You have two common restore paths.

### Path A: Restore from full SQL backup file (if your package includes one)

If you received a full backup file such as backup.sql or otm_db.sql, run:

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS otm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p otm_db < path_to_your_backup_file.sql

Replace path_to_your_backup_file.sql with your actual backup filename.

### Path B: Use schema/setup scripts included in this repository

1. Create database:

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS otm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

2. Build base tables using mysql_database_setup.txt
- Open mysql_database_setup.txt
- Copy SQL and execute in MySQL client or phpMyAdmin SQL tab

3. Apply migrations:

mysql -u root -p otm_db < migrations/2026_05_08_add_announcement_templates.sql
mysql -u root -p otm_db < installers/event_auto_sms_migration.sql
mysql -u root -p otm_db < installers/add_registration_open_column.sql

Notes:
- Some installer files are PHP migration scripts (.php). Run them with PHP CLI if needed, for example:
  php installers/add_bracket_theme_column.php
- Run only migrations relevant to your current schema state.

## 7) Start MySQL Database Service Using .bat

If your environment already provides a service startup .bat, run it as Administrator.

If not, create your own file named start-mysql-service.bat with one of these forms.

### Method 1: Start Windows service by name

@echo off
net start MySQL80
pause

If your service has a different name, replace MySQL80 accordingly.

### Method 2: Start XAMPP MySQL service (if applicable)

@echo off
net start mysql
pause

Save the file and run as Administrator.

## 8) Start the Website (PHP Server)

From project root, you can run either:

- Double click start-server.bat

or manually:

php -S 0.0.0.0:8081

Open in browser:
- http://localhost:8081

## 9) Login and Smoke Test

1. Open login page and sign in with an admin account present in your database.
2. Verify:
   - Admin dashboard loads
   - Events page reads/writes events
   - Registration page creates and updates status
   - Bracket creation works after approved registrations exist
   - Match score updates propagate winners

## 10) Optional: Schedule Automatic Match Reminders

The project provides reminder automation endpoint:
- api/sms/auto-match-reminders.php

Example Task Scheduler call (URL or script-based trigger):
- Run every 5-10 minutes
- Ensure SMS gateway settings are configured first

## 11) Common Troubleshooting

- php command not found:
  Add PHP folder to PATH and reopen terminal.

- Database connection failed:
  Recheck config/db.php credentials, host, and port.

- Access denied for MySQL user:
  Validate username/password and user privileges on otm_db.

- Blank data in admin modules:
  Confirm tables are restored and migrations were applied.

- Bracket cannot be created:
  Ensure the selected event has enough Approved registrations.

## 12) Quick Setup Checklist

- Install MySQL
- Install PHP
- Configure config/db.php
- Create/restore otm_db
- Apply migrations
- Start MySQL service via .bat
- Start PHP server via start-server.bat
- Login and verify modules
