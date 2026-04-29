# Online Tournament Management - PHP Backend API

## Database Setup Instructions

### 1. Prerequisites
- PHP 7.4 or higher
- MySQL Server running on localhost
- MySQLi extension enabled in PHP

### 2. Configuration

Edit `config/db.php` to set your MySQL credentials:

```php
define('DB_HOST', 'localhost');  // Your MySQL host
define('DB_USER', 'root');       // Your MySQL username
define('DB_PASS', '');           // Your MySQL password (empty for default root)
define('DB_NAME', 'otm_db');     // Database name
define('DB_PORT', 3306);         // MySQL port
```

### 3. Create Database and Tables

Run the SQL queries from `mysql_database_setup.txt` in your MySQL client to create the database and tables.

Or use this quick command:
```sql
CREATE DATABASE IF NOT EXISTS otm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE otm_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('Administrator','Organizer') NOT NULL DEFAULT 'Organizer',
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_status (status)
) ENGINE=InnoDB;

-- Insert initial admin user
INSERT INTO users (username, password_hash, full_name, email, role, status) 
VALUES ('admin', '$2y$12$vH0d/pKdR1rB7KOiDJr0x.7OMv5pTrA3eG2l8hN5kQ9p6Y3w8mL2a', 'Administrator', 'admin@otm.local', 'Administrator', 'Active');
```

The password for the initial admin user is: **Admin@2026**

### 4. Start PHP Development Server

```bash
# Navigate to project root
cd C:\Users\u730166\Documents\OnlineTournamentManagement\Repository\OnlineTournamentManagement

# Start PHP server on port 8000
php -S localhost:8000
```

The website will be accessible at: `http://localhost:8000`

## API Endpoints

### Authentication

#### Login User
- **URL:** `/api/auth/login.php`
- **Method:** POST
- **Content-Type:** application/json
- **Body:**
  ```json
  {
    "username": "admin",
    "password": "Admin@2026"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "Administrator",
      "email": "admin@otm.local",
      "role": "Administrator"
    }
  }
  ```

### User Management

#### Create User
- **URL:** `/api/users/create.php`
- **Method:** POST
- **Content-Type:** application/json
- **Required Fields:** username, password, full_name, email
- **Optional Fields:** phone, role, status
- **Body:**
  ```json
  {
    "username": "newuser",
    "password": "Password@123",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "role": "Organizer",
    "status": "Active"
  }
  ```

#### Read Users
- **URL:** `/api/users/read.php`
- **Method:** GET
- **Query Parameters (optional):**
  - `id`: Get specific user by ID
  - `role`: Filter by role (Administrator, Organizer)
  - `status`: Filter by status (Active, Inactive)
  - `limit`: Number of records (default: 100)
  - `offset`: Offset for pagination (default: 0)
- **Examples:**
  ```
  GET /api/users/read.php                    (Get all users)
  GET /api/users/read.php?id=1               (Get user by ID)
  GET /api/users/read.php?role=Administrator (Get all administrators)
  GET /api/users/read.php?status=Active&limit=10&offset=0 (Paginated active users)
  ```

#### Update User
- **URL:** `/api/users/update.php`
- **Method:** PUT or POST
- **Content-Type:** application/json
- **Required Fields:** id
- **Optional Fields:** password, email, full_name, phone, role, status
- **Body:**
  ```json
  {
    "id": 2,
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "555-5678",
    "status": "Active"
  }
  ```

#### Delete User
- **URL:** `/api/users/delete.php`
- **Method:** DELETE or POST
- **Content-Type:** application/json
- **Required Fields:** id
- **Body:**
  ```json
  {
    "id": 2
  }
  ```

## Testing with cURL (PowerShell)

### Test Login
```powershell
$body = @{
    username = "admin"
    password = "Admin@2026"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login.php" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Test Create User
```powershell
$body = @{
    username = "organizer1"
    password = "Organizer@123"
    full_name = "Event Organizer"
    email = "organizer@example.com"
    phone = "555-1234"
    role = "Organizer"
    status = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/users/create.php" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Test Read Users
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/users/read.php" `
  -Method GET
```

### Test Update User
```powershell
$body = @{
    id = 2
    full_name = "Updated Name"
    status = "Inactive"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/users/update.php" `
  -Method PUT `
  -ContentType "application/json" `
  -Body $body
```

### Test Delete User
```powershell
$body = @{
    id = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/users/delete.php" `
  -Method DELETE `
  -ContentType "application/json" `
  -Body $body
```

## Security Notes

1. **Password Hashing:** All passwords are hashed using bcrypt (PASSWORD_BCRYPT) with cost 12
2. **Input Validation:** All inputs are validated for format and length
3. **SQL Injection Prevention:** All queries use prepared statements with parameterized queries
4. **Email Validation:** Email format is validated using PHP's FILTER_VALIDATE_EMAIL
5. **Unique Constraints:** Username and email must be unique in the database
6. **Session Management:** Login creates a PHP session with user data

## Future Enhancements

- Add JWT token authentication
- Implement role-based access control (RBAC)
- Add request logging and audit trails
- Implement rate limiting
- Add two-factor authentication (2FA)
- Create admin-only endpoints with permission checks
- Add password reset functionality
- Implement email verification
