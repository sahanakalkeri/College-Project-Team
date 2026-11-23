# Activity Diagram Application Flow Compliance Check

This document maps each state, decision diamond, action, fork, and join from the official system **Activity Diagram** against the actual implementation in the College Project Team Formation and Management System.

---

## 1. Compliance Matrix

| Diagram Step | Implemented (Yes / No) | Screen or Route | Tested |
| :--- | :---: | :--- | :---: |
| **1. Open Application (entry / Display home page)** | **Yes** | `/` (`LandingPage.jsx`) | **Yes** |
| **2. Registration (entry / Enter details)** | **Yes** | `/register` (`RegisterPage.jsx`) | **Yes** |
| **3. Validate Details (do / Check validity)** | **Yes** | Client validation + `POST /api/auth/register` (`Registration.js`) | **Yes** |
| **4. Registration Decision (Invalid -> Stay / Valid -> Login)** | **Yes** | Shows error banners on invalid; saves user to DB and redirects to `/login` | **Yes** |
| **5. Login (entry / Enter credentials)** | **Yes** | `/login` (`LoginPage.jsx`) | **Yes** |
| **6. Validate Credentials (do / Check login)** | **Yes** | `POST /api/auth/login` (`authController.js`, `User.js`, bcrypt) | **Yes** |
| **7. Login Decision (Invalid -> Loop back / Valid -> Dashboard)** | **Yes** | Shows 401 error and stays on `/login`; on success redirects to `/dashboard` | **Yes** |
| **8. Dashboard (entry / Display options) - Role-Aware** | **Yes** | `/dashboard` (`DashboardPage.jsx`, student/faculty/admin views) | **Yes** |
| **9. Progress Stepper (Team, Members, Topic, Tasks, Review)** | **Yes** | `ProgressStepper.jsx` across all student workflows | **Yes** |
| **10. Manage Team (entry / Create / Join team) [Fork Option 1]** | **Yes** | `/teams/search`, `/team` (`SearchTeamsPage.jsx`, `MyTeamPage.jsx`) | **Yes** |
| **11. Manage Members (entry / Add / Remove) [Fork Option 2, Leader Only]** | **Yes** | `/team` (`MyTeamPage.jsx`, `POST /api/teams/members/add`, `remove`) | **Yes** |
| **12. View Project Topics (entry / Select topic) [Fork Option 3]** | **Yes** | `/project/topic` (`ProjectTopicPage.jsx`, `selectOrProposeTopic`) | **Yes** |
| **13. Manage Tasks (entry / Assign / Update) [Fork Option 4]** | **Yes** | `/tasks` (`TaskManagementPage.jsx`, `POST /api/tasks/assign`, status move) | **Yes** |
| **14. Faculty Review (entry / Submit project) [Join Bar from Fork]** | **Yes** | `/review` (`FacultyReviewPage.jsx`, `POST /api/projects/submit-review`) | **Yes** |
| **15. Faculty Evaluation & Decision Diamond (Needs Changes vs Approved)** | **Yes** | `/faculty` (`FacultyDashboardPage.jsx`, `POST /api/faculty/project/:id/feedback`) | **Yes** |
| **16. Update Tasks (do / Modify / Reassign) [Needs Changes Branch Loop]** | **Yes** | `/tasks` (`TaskManagementPage.jsx`, `PUT /api/tasks/:taskId`, Edit Modal) | **Yes** |
| **17. Resubmit for Faculty Review [Loop to Review]** | **Yes** | `/review` (`FacultyReviewPage.jsx`, sets status back to `Submitted`) | **Yes** |
| **18. Send Notifications (entry / Notify users) [Post-Approval Branch 1]** | **Yes** | `/notifications` (`NotificationsPage.jsx`, `Notification.js`) | **Yes** |
| **19. Store Data (do / Save project details) [Post-Approval Branch 2]** | **Yes** | SQLite DB (`projects`, `feedback`, `tasks`), verified persistent across reloads | **Yes** |
| **20. Update Profile (entry / Update info) [Post-Approval Branch 3]** | **Yes** | `/profile` (`ProfilePage.jsx`, `PUT /api/profile`, change password) | **Yes** |
| **21. Logout (entry / End session) [Final State]** | **Yes** | Navbar & Sidebar Logout button, clears token/session, redirects to `/login` | **Yes** |

---

## 2. Key Architecture & Flow Alignments

1. **Exact Project Status Transitions**:
   - `Draft`: Initial status upon team creation or topic confirmation.
   - `Submitted`: Team leader submits/resubmits project deliverables for review.
   - `Needs Changes`: Faculty evaluator requests modifications with rating and feedback comments.
   - `Approved`: Faculty evaluator officially approves and certifies milestone deliverables.

2. **The Review Loop**:
   - When faculty selects **Needs Changes**, an alert banner appears on both the Dashboard and the Tasks page.
   - The team leader uses the **Edit / Reassign Task** modal on `/tasks` to modify task title, description, due date, status, or assignee.
   - The team leader navigates back to `/review` and clicks **Resubmit for Review**, setting the project status back to `Submitted` and notifying the faculty supervisor.

3. **Post-Approval Parallel Actions**:
   - Upon approval by faculty, 3 parallel actions activate in the UI:
     1. **Send Notifications**: Dispatches real-time notifications to team members and faculty.
     2. **Store Data**: Persists final status, 1–5 star rating, and timestamped feedback in SQLite.
     3. **Update Profile**: Direct link to edit academic credentials, semester, department, CGPA, avatar, or password.

4. **Security & Session Management**:
   - Seeded database contains **only** 1 Admin (`admin@college.edu`) and 2 Faculty (`faculty1@college.edu`, `faculty2@college.edu`).
   - Zero pre-seeded students; students register themselves with hashed passwords (bcrypt).
   - Sign out invalidates the client token, resets React state, and immediately redirects to `/login`.
