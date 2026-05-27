# Online Tournament Management - Module and Feature Guide

## 1) System Summary

Online Tournament Management is a PHP + MySQL web application with two major surfaces:

- Public website for viewers and participants
- Admin portal for organizers and staff

The platform manages event publishing, team registration, bracket creation, match scheduling, score updates, winner declaration, announcements, and SMS notifications.

## 2) Website Modules and Included Features

### A. Public Website Module

Main pages:
- index.html
- events.html
- news.html
- news-article.html
- about.html
- contact.html
- login.html

Features:
- Responsive navigation and mobile menu
- Public event cards (ongoing + upcoming)
- Interactive event bracket view with sport, event, and gender filters
- Public schedule display (list and calendar style rendering)
- News list and detailed news article pages with photos
- Winner/announcement feed display
- About page content and team members pulled from API
- Contact information pulled from API
- Contact form submission to backend API

### B. Admin Portal Module

Main pages:
- admin/dashboard.html
- admin/events.html
- admin/register.html
- admin/news.html
- admin/announcement.html
- admin/reports.html
- admin/manage-users.html
- admin/about.html
- admin/contact.html
- admin/bracketing.html and admin/bracket-landing.html

Features:
- Protected access using login/session role-based behavior
- Dashboard stats (events, users, news, unread messages)
- Event CRUD and event status tracking
- Registration open/close control per event
- Sport management and sport media handling
- Team registration review and approval workflow
- Bracket generation and inline bracket editing
- Match schedule management from bracket data
- Match score reporting and winner declaration
- News CRUD with photo uploads
- Announcement CRUD and reusable templates
- About and Contact content management
- Contact message inbox and read/unread handling
- Reports area for admin oversight

### C. Authentication and Access Module

Core API:
- api/auth/login.php

Features:
- Username/password authentication
- Password verification using password_hash/password_verify (bcrypt)
- Session creation on successful login
- Active account checking before allowing login
- Role-aware UI behavior in admin side

### D. Events and Sports Module

Core APIs:
- api/events/create.php
- api/events/read.php
- api/events/update.php
- api/events/delete.php
- api/sports/create.php
- api/sports/read.php
- api/sports/update.php
- api/sports/delete.php
- api/sports/upload-photo.php

Features:
- Event metadata: title, sport, category, date range, location, description
- Tournament types: single elimination, double elimination, round robin
- Optional third-place match support
- Registration open/closed switch per event
- Event status lifecycle: upcoming, ongoing, completed, cancelled
- Auto SMS event settings for reminder and winner notifications
- Sports catalog maintenance and sport image upload

### E. Team Registration Module

Core APIs:
- api/registrations/create.php
- api/registrations/read.php
- api/registrations/update.php
- api/registrations/update-status.php
- api/courses/create.php
- api/courses/read.php
- api/courses/update.php
- api/courses/delete.php

Features:
- Full team registration form (representative, team, coach/manager, players)
- Department/course assignment for representatives and players
- Optional document attachment payload in registration
- Validation of category, minimum player list, email format, and required fields
- Registration status workflow: pending, approved, rejected
- Restriction: registration creation checks if selected event is still open
- Restriction: representative updates allowed while status is pending

### F. Bracket, Match, and Schedule Module

Core APIs:
- api/brackets/save.php
- api/brackets/read.php
- api/brackets/update_theme.php
- api/matches/update.php

Features:
- Bracket persistence per event in tournament_brackets
- Match persistence in tournament_matches
- Bracket regeneration support (replace existing bracket cleanly)
- Winner progression to next match slot
- Loser progression support for double elimination (when loser-next columns exist)
- Match scheduling fields: date, time, location, description
- Match status fields: pending, scheduled, ongoing, completed
- Public and admin schedule rendering from saved match data
- Theme support for bracket presentation

### G. News and Announcements Module

Core APIs:
- api/news/create.php
- api/news/read.php
- api/news/update.php
- api/news/delete.php
- api/news/upload-photos.php
- api/announcements/create.php
- api/announcements/read.php
- api/announcements/update.php
- api/announcements/delete.php
- api/announcements/templates_create.php
- api/announcements/templates_read.php
- api/announcements/templates_update.php
- api/announcements/templates_delete.php

Features:
- News management with categories, content, and multi-photo support
- Announcement board with database persistence
- Announcement templates for repeated message formats
- SMS status metadata on announcements (sent/page only pattern)
- Public news highlights and article detail display

### H. About and Contact Content Module

Core APIs:
- api/about/read-content.php
- api/about/save-content.php
- api/about/upload-photo.php
- api/about/members/create.php
- api/about/members/read.php
- api/about/members/update.php
- api/about/members/delete.php
- api/contact/read-info.php
- api/contact/update-info.php
- api/contact/submit.php
- api/contact/read-messages.php
- api/contact/mark-read.php
- api/contact/delete-message.php

Features:
- Editable About page content and organization photo
- Team member profile CRUD for About page
- Editable Contact information (including Facebook URL support)
- Public contact form to message inbox flow
- Admin message triage (read/unread, delete)

### I. SMS Notification Module

Core APIs:
- api/sms/settings.php
- api/sms/philsms-blast.php
- api/sms/auto-match-reminders.php
- api/sms/recipients.php
- api/sms/debug-blast.php
- api/sms/sms-blaster-lib.php

Features:
- Manual SMS blast support
- Gateway settings/config handling
- Auto match reminder runs (intended for cron scheduling)
- Winner SMS dispatch triggered by match winner updates
- SMS log tracking and failed/sent reporting
- Placeholder-based SMS template rendering

### J. User Management Module

Core APIs:
- api/users/create.php
- api/users/read.php
- api/users/update.php
- api/users/delete.php

Features:
- Admin and representative account management
- Active/inactive account status
- Role assignment and profile updates

### K. Database and Migration Module

Database/config assets:
- config/db.php
- mysql_database_setup.txt
- migrations/2026_05_08_add_announcement_templates.sql
- installers/*.php and installers/*.sql migration helpers

Features:
- MySQL-backed persistence for all major modules
- Versioned schema updates via migrations/installers
- Backward checks for optional columns in APIs

## 3) Operational Process Flows

## Process 1: Creating an Event

1. Admin logs in from login page.
2. Open Admin -> Events.
3. Click Add Event and supply:
   - title
   - sport
   - category
   - start/end date-time
   - location
   - tournament type
   - third-place match flag
   - registration open/closed
   - optional auto reminder SMS and auto winner SMS template mapping
4. Save event.
5. System validates required fields and date order, checks sport existence, and writes to events table.

Key behavior:
- teams_count is initialized and maintained from approved registration flow.
- registration_open controls whether new team registrations can be submitted.

## Process 2: Team Registration

1. Open Admin -> Registration and click Fill Up Registration Form.
2. Enter representative details, team info, sport/category/event, coach/manager, and players.
3. Submit registration.
4. Backend validates all required fields and checks if the target event registration_open is enabled.
5. Registration is saved with Pending status by default unless explicitly provided by authorized flow.
6. Admin reviews requests and updates status to Approved or Rejected.

Key behavior:
- Bracket seeding flow uses Approved registrations only.
- Pending registrations may be updated; finalized entries are constrained by API logic.

## Process 3: Creating Bracket and Schedule

1. In Admin -> Events table, click Bracketing action for a chosen event.
2. System loads Approved teams for that event.
3. If minimum conditions are met (at least 3 approved teams for elimination flows), create or regenerate bracket.
4. Bracket data is saved through bracket API:
   - tournament header in tournament_brackets
   - match rows in tournament_matches
   - next-match links and loser-next links resolved after insert
5. Open inline match editor or schedule manager to assign:
   - schedule date
   - schedule time
   - location
   - match description
6. Save schedule updates.

Key behavior:
- Bracket can be re-generated; previous event bracket is replaced cleanly.
- Public events page schedule view reads from the saved bracket match records.

## Process 4: Declaring Match Scores and Winners

1. Open event bracket in admin.
2. Select a match and input score1/score2.
3. Set winner_registration_id and match status (usually Completed).
4. Submit match update.
5. Backend updates the match record and auto-propagates winner to next match slot.
6. If configured for double elimination and loser-next links exist, loser is propagated to lower bracket slot.
7. If auto winner SMS is enabled for the event and template exists, winner notification SMS is queued/sent and logged.

Key behavior:
- Clearing winner can clear propagated next-slot assignment.
- Match update API returns winner SMS summary payload.

## 4) End-to-End Tournament Lifecycle (Practical Sequence)

1. Configure sports, departments, and users.
2. Create event with proper tournament type and registration state.
3. Collect team registrations.
4. Approve qualified registrations.
5. Generate bracket from approved teams.
6. Assign match schedules.
7. Run matches and report scores.
8. Declare winners and complete bracket progression.
9. Publish announcements/news and optionally send SMS.
10. Close event and archive/report results.

## 5) Notes on Current Architecture

- Frontend is multi-page HTML/CSS/JS.
- Backend is modular PHP endpoints grouped by domain.
- Data is primarily database-driven, with some fallback localStorage paths retained in frontend code for compatibility scenarios.
- SMS integration is built as both manual blast and event-driven automation.
