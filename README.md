# College Project Team Formation and Management System

A full-stack, responsive web application engineered for college students, team leaders, faculty mentors, and academic administrators. Built strictly according to the UML Class Diagram, State Diagram, and Activity Diagram specifications.

---

## 1. Tech Stack
- **Frontend**: React 18 + Vite 6 + Tailwind CSS (React Router DOM v6 for role-based navigation, Lucide React icons)
- **Backend**: Node.js + Express REST API (Layered MVC architecture)
- **Database**: PostgreSQL (via `pg` connection pool with `DATABASE_URL`) / SQLite fallback for local zero-config use
- **Authentication**: JWT (JSON Web Tokens) + bcrypt password hashing + Role-Based Access Control (RBAC) middleware
- **File Upload**: Multer for student/faculty avatar profile pictures
- **Deployment Targets**: Frontend on **Netlify**, Backend and Database on **Render**

---

## 2. Quick Setup & Local Run Instructions

### Step 1: Install Dependencies
Run the command below in the project root directory:
```bash
npm run install:all
```
*(Or individually: `npm install` in root, `cd backend && npm install`, `cd ../frontend && npm install`)*

### Step 2: Configure Environment
Copy `.env.example` to `.env` in both `backend/` and `frontend/`:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Step 3: Seed the Database
Populates the system with 1 Administrator and 2 Faculty accounts only. Zero student accounts, teams, projects, or tasks are pre-seeded:
```bash
npm run seed
```
*(Note: When the backend server boots for the first time with an empty database, it also seeds automatically).*

### Step 4: Start the Application
Run both the Backend API and the React Vite Frontend concurrently:
```bash
npm run dev
```

Open your browser at:
👉 **http://localhost:5173**

---

## 3. Production Deployment Guide

This project is pre-configured for automated deployment with the **Frontend on Netlify** and the **Backend & Database on Render**.

### A. Deploy Backend & Database on Render

1. **Create PostgreSQL Database on Render**:
   - Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **PostgreSQL**.
   - Set the database name (e.g. `college_project_db`).
   - Copy the **Internal Database URL** (or External Database URL).

2. **Deploy Backend Web Service**:
   - In Render Dashboard, click **New +** -> **Web Service**.
   - Connect your GitHub repository.
   - Configure the service:
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Add the following **Environment Variables**:
     | Variable | Value | Description |
     | :--- | :--- | :--- |
     | `NODE_ENV` | `production` | Enables production mode |
     | `DATABASE_URL` | `postgresql://...` | Render PostgreSQL connection string |
     | `JWT_SECRET` | *(generate a strong secret key)* | Key used to sign JWT auth tokens |
     | `CORS_ORIGIN` | `https://<your-netlify-app>.netlify.app` | Netlify frontend origin (or `*` during initial setup) |
     | `PORT` | `10000` *(Render sets this automatically)* | Port for Express server |

3. **Automatic First-Run Seeding**:
   - When the Render backend service starts for the first time, it automatically creates all PostgreSQL tables and indexes.
   - If the database is empty, it automatically seeds the initial 1 Administrator and 2 Faculty accounts.

---

### B. Deploy Frontend on Netlify

1. **Netlify Configuration Files**:
   - `netlify.toml` is provided at the repository root:
     ```toml
     [build]
       base = "frontend"
       command = "npm run build"
       publish = "dist"
     ```
   - `frontend/public/_redirects` ensures client-side React Router navigation works seamlessly:
     ```text
     /*  /index.html  200
     ```

2. **Deploy on Netlify**:
   - Log in to your [Netlify Dashboard](https://app.netlify.com/) and click **Add new site** -> **Import an existing project**.
   - Select your GitHub repository.
   - Netlify will automatically detect settings from `netlify.toml` (Base: `frontend`, Build command: `npm run build`, Publish directory: `frontend/dist`).
   - In **Site configuration** -> **Environment variables**, add:
     | Variable | Value | Description |
     | :--- | :--- | :--- |
     | `VITE_API_URL` | `https://<your-render-backend-url>.onrender.com/api` | Base URL of your deployed Render backend |
   - Click **Deploy site**.

3. **Finalize CORS on Render**:
   - Once Netlify assigns your frontend domain (e.g. `https://college-project-team.netlify.app`), update `CORS_ORIGIN` on your Render Web Service to match this domain.

---

## 4. Demo Login Credentials (Faculty & Admin Only)

> **Important**: Per project security specifications, **zero student accounts are pre-seeded**. Students must self-register at `/register` with their own name, college email, strong password, semester, department, and CGPA. Student passwords are automatically hashed with bcrypt (10 rounds) and are never exposed or known to administrators or developers.

Use the seeded credentials below or use the 1-click quick-fill buttons on the login page:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ Administrator** | Administrator | `admin@college.edu` | `Admin@123` | User management, status toggling, CSV reports |
| **👨‍🏫 Faculty / Guide 1** | Dr. Robert Vance | `faculty1@college.edu` | `Faculty@123` | CSE Professor, team monitoring, feedback & grading |
| **👨‍🏫 Faculty / Guide 2** | Dr. Sarah Connor | `faculty2@college.edu` | `Faculty@456` | CSE Assistant Professor, project progress review |

### Student Registration Flow
1. Navigate to `/register`.
2. Fill in: Full Name, College Email, Semester, Department, CGPA, and a Strong Password (at least 8 characters, containing uppercase, lowercase, and a number).
3. Upon registration, you are redirected to the Login page.
4. Log in to access the Student Dashboard, search/create teams, manage project topics, and assign tasks.
5. Once a student creates a team, they automatically assume the **Team Leader** role with full member and task management controls.

---

## 5. Requirements Traceability Matrix

### Functional Requirements (FR1 – FR10)

| Requirement | Description | Implementing Backend & Frontend Files |
| :--- | :--- | :--- |
| **FR1** | New student registration (validation of name, email format, password strength, unique email) | `backend/src/models/Registration.js`, `backend/src/controllers/authController.js`, `frontend/src/pages/RegisterPage.jsx` |
| **FR2** | Secure login (JWT, bcrypt password hashing, session creation) | `backend/src/models/User.js`, `backend/src/middleware/authMiddleware.js`, `backend/src/controllers/authController.js`, `frontend/src/pages/LoginPage.jsx` |
| **FR3** | Create new project team (creator becomes TeamLeader) | `backend/src/models/Student.js` (`createTeam()`), `backend/src/controllers/teamController.js`, `frontend/src/pages/SearchTeamsPage.jsx` |
| **FR4** | Search for and join available teams (by name or topic, debounced search) | `backend/src/models/Student.js` (`searchTeams()`, `joinTeam()`), `backend/src/controllers/teamController.js`, `frontend/src/pages/SearchTeamsPage.jsx` |
| **FR5** | Team leader can add or remove team members (enforcing min 1 member rule) | `backend/src/models/Team.js` (`addMember()`, `removeMember()`), `backend/src/controllers/teamController.js`, `frontend/src/pages/MyTeamPage.jsx` |
| **FR6** | Select existing project topic or propose custom topic (with "Topic Confirmed" state) | `backend/src/models/Student.js` (`selectProjectTopic()`), `backend/src/controllers/projectController.js`, `frontend/src/pages/ProjectTopicPage.jsx` |
| **FR7** | Assign tasks to members (title, due date, assignee) & track status (Pending, In Progress, Completed) | `backend/src/models/Task.js`, `backend/src/models/TeamLeader.js`, `backend/src/controllers/taskController.js`, `frontend/src/pages/TaskManagementPage.jsx` |
| **FR8** | Faculty/guide view all teams, project details, task progress & provide 1–5 star feedback | `backend/src/models/Faculty.js`, `backend/src/models/Feedback.js`, `backend/src/controllers/facultyController.js`, `frontend/src/pages/FacultyDashboardPage.jsx`, `frontend/src/pages/FacultyReviewPage.jsx` |
| **FR9** | Notifications for team activity, task deadlines, and project updates (with unread badge) | `backend/src/models/Notification.js`, `backend/src/controllers/notificationController.js`, `frontend/src/pages/NotificationsPage.jsx`, `frontend/src/components/Navbar.jsx` |
| **FR10** | Profile update (including avatar picture upload) and secure logout | `backend/src/models/User.js` (`updateProfile()`, `logout()`), `backend/src/controllers/profileController.js`, `frontend/src/pages/ProfilePage.jsx` |

### Non-Functional Requirements (NFR1 – NFR8)

| Requirement | Category | Implementation Details |
| :--- | :--- | :--- |
| **NFR1** | **Security** | Password hashing with `bcryptjs`, signed JWT auth tokens, role guards (`authorizeRoles`), SQL parameterized queries, and login rate limiting (`express-rate-limit`). |
| **NFR2** | **Compatibility** | Fully responsive layout across desktop, tablet, and mobile with Tailwind CSS and collapsible mobile navigation drawer. |
| **NFR3** | **User Friendly** | Soft blue/indigo academic theme, color-coded badges, dark mode toggle, accessible modals, and empty/loading state indicators. |
| **NFR4** | **Maintainability** | Clean layered architecture: `controllers/`, `models/`, `routes/`, `middleware/`, `services/` on backend; `components/`, `pages/`, `context/`, `hooks/` on frontend. |
| **NFR5** | **Performance** | Server-side pagination (`LIMIT` / `OFFSET`), debounced search filters, indexed database columns (`idx_users_email`, `idx_teams_name`, etc.), optimized Vite chunking. |
| **NFR6** | **Reliability** | Database transactions (`transaction(...)` rollback on error), foreign key constraints with cascades, and destructive action confirmation dialogs (`ConfirmDialog.jsx`). |
| **NFR7** | **Scalability** | Stateless REST API, abstracted database client (`db.js`), connection pooling with PostgreSQL via `DATABASE_URL`. |
| **NFR8** | **Availability** | Dedicated health-check endpoint (`GET /api/health`), centralized error handling middleware, and graceful network retry banners. |

---

## 6. REST API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user (FR1)
- `POST /api/auth/login` - Authenticate with rate limiting (FR2)
- `POST /api/auth/logout` - Invalidate session (FR10)
- `GET /api/auth/me` - Get current session & role details

### Team Management (`/api/teams`)
- `GET /api/teams/search` - Search teams by name or topic (FR4)
- `POST /api/teams/create` - Create team (Creator becomes TeamLeader) (FR3)
- `POST /api/teams/join` - Join an existing team (FR4)
- `GET /api/teams/my-team` - Current student team, members, and project
- `POST /api/teams/members/add` - Team leader adds member (FR5)
- `POST /api/teams/members/remove` - Team leader removes member (FR5)
- `GET /api/teams/available-students` - List students available to join

### Projects & Topics (`/api/projects`)
- `GET /api/projects/topics/standard` - List curated academic topics
- `POST /api/projects/topics/select` - Select or propose project topic (FR6)
- `POST /api/projects/submit-review` - Submit project for faculty review
- `GET /api/projects/:projectId` - View project details, tasks, and feedback (FR8)
- `PUT /api/projects/:projectId` - Update project details

### Tasks (`/api/tasks`)
- `POST /api/tasks/assign` - Team leader assigns task (FR7)
- `PATCH /api/tasks/:taskId/status` - Update task status (Pending, In Progress, Completed) (FR7)
- `PUT /api/tasks/:taskId` - Update task details
- `DELETE /api/tasks/:taskId` - Remove task
- `GET /api/tasks/project/:projectId` - Tasks and progress metrics for project
- `GET /api/tasks/my-tasks` - Tasks assigned to current student

### Faculty (`/api/faculty`)
- `GET /api/faculty/teams` - View supervised teams & progress bars (FR8)
- `GET /api/faculty/project/:projectId` - Detailed project inspection
- `GET /api/faculty/project/:projectId/progress` - Progress metrics
- `POST /api/faculty/project/:projectId/feedback` - Submit 1–5 star rating & feedback (FR8)

### Administrator (`/api/admin`)
- `GET /api/admin/users` - Paginated user management table
- `POST /api/admin/users/:userId/action` - Toggle active/inactive, delete user
- `POST /api/admin/reports/generate` - Generate audit reports
- `GET /api/admin/reports` - List saved audit reports
- `GET /api/admin/reports/:reportId` - View specific report
- `GET /api/admin/export/csv?type=teams|users|tasks` - Export CSV datasets

### Notifications & Profile (`/api/notifications`, `/api/profile`)
- `GET /api/notifications` - Get user notifications & unread count (FR9)
- `PATCH /api/notifications/:id/read` - Mark notification as read (FR9)
- `PATCH /api/notifications/read-all` - Mark all notifications as read (FR9)
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile & upload avatar picture (FR10)

### System Health (`/api/health`)
- `GET /api/health` - Uptime and database connectivity status (NFR8)
