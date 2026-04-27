# OnlineTournamentManagement

Online Tournament Management is a web-based platform designed to help organizers plan, run, and monitor campus sports events efficiently. It centralizes event brackets, schedules, announcements, participants, and communication tools in one accessible interface for both public users and administrators.

## Project Overview

The system is built as a multi-page website with two primary areas:

- Public pages for visitors and participants to view events, brackets, schedules, announcements, and updates.
- Admin pages for organizers to manage tournament content, users, and notifications.

The project is optimized for campus sportfest workflows and supports sports like Volleyball, Basketball, Futsal, and Badminton.

## Core Features

- Dynamic tournament bracket view with sport, event, gender, and course filters.
- Visual playoff-style bracket presentation with round progression and champion slot.
- Schedule section linked to selected event and active filters.
- Sports selector with sport-specific icons/images.
- Public content pages: Home, Events, News, About, and Contact.
- Admin authentication flow for secured management pages.
- Admin management tools for announcements, events, news, contacts, and users.
- SMS notification integration module for alerts and announcements.
- Responsive layout for desktop and mobile viewing.

## Website Modules

### 1. Public Interface Module

Handles visitor-facing pages and content display.

- `index.html`: Landing page and entry point.
- `events.html`: Interactive bracket and schedules page.
- `news.html`: Tournament news and updates.
- `about.html`: Project and organization overview.
- `contact.html`: Contact details and inquiry page.

### 2. Authentication Module

Controls login and access protection for admin features.

- `login.html`: Admin sign-in page.
- `js/auth.js`: Session and authentication logic.

### 3. Admin Management Module

Supports CRUD-style operations for tournament data and user-facing information.

- `admin/`: Admin dashboard and management pages.
- `js/admin.js`: Admin interactions, data handling, and UI updates.

### 4. Bracket and Event Logic Module

Manages rendering and interactivity for sports brackets and schedules.

- `js/main.js`: Frontend logic for sports selector, bracket generation, filtering, and schedule rendering.

### 5. Notification Module

Provides SMS communication support for tournament updates.

- `js/sms-blaster.js`: SMS utility/integration layer.

### 6. Styling and UI Module

Defines the visual identity and responsive behavior.

- `css/style.css`: Public page styling and bracket UI styles.
- `css/admin.css`: Admin panel styling.
- `src/images/`: Sports icons and UI assets.

## Data and Storage Approach

The site uses browser-based storage for current data handling during development/demo flow, with modular scripts that can be extended to API/database-backed services for production deployment.

## Intended Use

This project is ideal for:

- Campus intramurals and sportfest tournaments.
- School organizations managing multi-event competitions.
- Small-to-medium tournament operations needing centralized event control and communication.
