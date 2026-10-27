# AI Timetable Generator

A full-stack **AI Timetable Generator** built with **React**, **Flask**, **Pandas**, and **OpenPyXL**. The system solves scheduling using Artificial Intelligence concepts: **Constraint Satisfaction Problem (CSP)**, randomized valid assignment, backtracking search, and Minimum Remaining Values (MRV) / Degree heuristics.

---

## 🌟 Key Features

1. **Group-Wise Parallel Scheduling with Automatic Breaks**:
   - Teachers and students are partitioned into teacher groups (G1, G2, etc.).
   - When Group A attends a class during a period, other groups of the same subject in that section automatically receive a `Break` status if they have no scheduled class.
   - Automatic breaks are displayed cleanly and are not treated as conflict errors.

2. **Student Timetable Privacy (RBAC)**:
   - Authenticated JWT token security.
   - Students can only view their own assigned section and group timetable (`/api/timetable/student`).
   - Server-side identity enforcement returns **HTTP 403 Forbidden** if a student attempts to query another student's timetable.

3. **Multi-Sheet Excel Integration**:
   - Automated schema validation for `Students`, `Subjects`, `Faculty`, `TeacherGroups`, `Rooms`, `TimeSlots`, and `Availability`.
   - Downloadable Excel template and pre-populated sample workbook (`sample_timetable.xlsx`).

4. **Visual Themes**:
   - **Student Portal**: Modern dark-purple aesthetic (`#0B1020`, `#11182B`, `#171F35`, `#7C5CFC`, `#22D3EE`).
   - **Admin Portal**: Executive dark/light dashboard layouts with KPI stat widgets, progress visualizers, conflict tables, and Excel exporters.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, JavaScript, React Router DOM, Axios, Lucide Icons, Custom CSS.
- **Backend**: Python 3.10+, Flask, Flask-CORS, Pandas, OpenPyXL, PyJWT.
- **Data Source**: Excel (`.xlsx`) files (No SQL/Mongo databases, external AI APIs, or OR-Tools used).

---

## 🔑 Sample Demonstration Credentials

| Role | Username / Student ID | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full Access (Upload Excel, Validate, Generate, View All, Export) |
| **Student 1** | `STU001` | `student123` | Student View Only (Rahul Sharma - Sec A, Group G1) |
| **Student 2** | `STU003` | `student123` | Student View Only (Aman Verma - Sec A, Group G2) |
| **Student 3** | `STU004` | `student123` | Student View Only (Neha Patel - Sec B, Group G3) |

---

## 🚀 Installation & Execution Instructions

### Prerequisites
- Python 3.10 or higher
- Node.js v18+ and npm

### 1. Backend Setup & Run

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask Backend Server
python app.py
```
*Backend will run at:* `http://localhost:5000`

### 2. Frontend Setup & Run

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite Development Server
npm run dev
```
*Frontend will run at:* `http://localhost:5173`

---

## 🧠 AI Algorithm Breakdown

1. **Excel Data Parsing**: Loads data sheets and validates relationships.
2. **Task Creation**: Creates period tasks for each teacher group.
3. **MRV & Degree Heuristic Sorting**: Schedules difficult tasks first (Labs first, higher weekly periods first, constrained room/faculty first).
4. **Randomized Assignment**: Shuffles valid slots to produce diverse, balanced timetables across runs.
5. **Hard Constraint Checker**: Enforces 14 hard rules (no faculty/room/group double bookings, room capacity/type matching, faculty availability).
6. **Depth-First Backtracking**: Undoes invalid assignments when deadlocks occur.
7. **Automatic Break Generator**: Populates unused periods with `Break` status for each student group.
