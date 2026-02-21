# 🏢 ShiftTrack — Employee Attendance & Shift Management System

<div align="center">

![ShiftTrack Banner](https://img.shields.io/badge/ShiftTrack-v2.0.0-4f8ef7?style=for-the-badge&logo=clockify&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

**A production-ready full-stack Employee Attendance System built with the MERN Stack.**
Mark attendance, track shifts, view monthly reports, and manage employees — all in one place.


</div>

---

## ✨ Features

### 👤 Employee
- 🟢 **One-click Check IN / Check OUT** with live timestamp
- ⏱️ **Auto shift calculation** — late arrival, overtime & early leave detected automatically
- 📅 **Monthly attendance calendar** — color-coded daily status view
- 📊 **Personal dashboard** — live clock, today's summary, working hours & monthly stats

### 🛡️ Admin
- 📈 **Real-time dashboard** — pie charts, bar charts, live employee status feed
- 👥 **Employee management** — add, edit, deactivate with department & shift config
- 🗓️ **Attendance records** — filter by month, department, status, or employee ID
- 📥 **Excel export** — download `.xlsx` with full attendance data in one click
- 🔄 **Shift management** — Morning, Afternoon, Night & Flexible shifts

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Recharts, Lucide React |
| **Backend** | Node.js, Express.js (ES6 Modules) |
| **Database** | MongoDB, Mongoose |
| **Auth** | JWT + bcryptjs |
| **Export** | SheetJS (xlsx) |
| **Notifications** | React Toastify |
| **Deployment** | Render (Frontend + Backend), MongoDB Atlas |

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v18+`
- MongoDB running locally **or** a [MongoDB Atlas](https://cloud.mongodb.com) URI

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/attendance-system.git
cd attendance-system
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Seed the database
```bash
node seed.js
```

### 4. Start the backend
```bash
npm run dev        # development (nodemon)
# or
npm start          # production
```

### 5. Setup & start Frontend
```bash
cd ../frontend
npm install
npm start
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🛡️ Admin | `admin@company.com` | `admin123` |
| 👤 Employee | `rajesh@company.com` | `emp123` |
| 👤 Employee | `priya@company.com` | `emp123` |
| 👤 Employee | `mohammed@company.com` | `emp123` |

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

For production on Render, set these in the **Environment** tab of your service.

---

## 📁 Project Structure

```
attendance-system/
├── backend/
│   ├── models/
│   │   ├── User.js           # Employee schema with shift config
│   │   └── Attendance.js     # Attendance + auto metrics calculation
│   ├── routes/
│   │   ├── auth.js           # Login, register, password change
│   │   ├── attendance.js     # Check-in, check-out, monthly data
│   │   └── admin.js          # Employee CRUD, reports, Excel export
│   ├── middleware/
│   │   └── auth.js           # JWT protect + adminOnly guards
│   ├── server.js             # Express entry point (ES6 modules)
│   ├── seed.js               # Database seeder
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── _redirects        # Render SPA routing fix
    └── src/
        ├── context/
        │   └── AuthContext.jsx
        ├── utils/
        │   └── api.js        # Axios + all API functions
        ├── components/
        │   ├── Layout.jsx
        │   └── AdminLayout.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── AttendancePage.jsx
            ├── CalendarPage.jsx
            └── admin/
                ├── AdminDashboard.jsx
                ├── AdminEmployees.jsx
                └── AdminAttendance.jsx
```

---

## 📡 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/login` | Login, returns JWT + user | ❌ |
| `POST` | `/register` | Create employee | 🛡️ Admin |
| `GET` | `/me` | Get current user | ✅ |
| `PUT` | `/change-password` | Update password | ✅ |

### Attendance — `/api/attendance`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/checkin` | Mark check-in | ✅ |
| `POST` | `/checkout` | Mark check-out + calculate shift | ✅ |
| `GET` | `/today` | Today's record | ✅ |
| `GET` | `/monthly?year=&month=` | Monthly report + summary | ✅ |
| `GET` | `/history?limit=10` | Recent records | ✅ |

### Admin — `/api/admin`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/dashboard` | Stats + charts data | 🛡️ Admin |
| `GET` | `/employees` | Paginated employee list | 🛡️ Admin |
| `PUT` | `/employees/:id` | Update employee | 🛡️ Admin |
| `DELETE` | `/employees/:id` | Deactivate employee | 🛡️ Admin |
| `GET` | `/attendance` | All records with filters | 🛡️ Admin |
| `GET` | `/attendance/today-status` | Live status all employees | 🛡️ Admin |
| `GET` | `/export` | Download Excel file | 🛡️ Admin |

---

## 🔄 Shift Types

| Shift | Default Start | Default End |
|---|---|---|
| 🌅 Morning | 09:00 | 18:00 |
| ☀️ Afternoon | 13:00 | 22:00 |
| 🌙 Night | 22:00 | 07:00 |
| 🔄 Flexible | 08:00 | 17:00 |

Each employee's shift drives automatic detection of:
- ⚠️ **Late arrival** — checked in after scheduled start
- 🔥 **Overtime** — checked out after scheduled end
- 🚶 **Early leave** — checked out before scheduled end
- 📋 **Half day** — worked less than 4 hours

---

## 🌐 Deploying to Render

### Backend (Web Service)
```
Root Directory:  backend
Build Command:   npm install
Start Command:   npm start
```

Add these environment variables in Render dashboard:
```
MONGODB_URI      = mongodb+srv://...
JWT_SECRET       = your_secret
JWT_EXPIRE       = 7d
NODE_ENV         = production
CLIENT_URL       = https://your-frontend.onrender.com
```

### Frontend (Static Site)
```
Root Directory:     frontend
Build Command:      npm install && npm run build
Publish Directory:  build
```

Add this environment variable:
```
REACT_APP_API_URL = https://your-backend.onrender.com/api
```

**Fix 404 on refresh** — Go to Redirects/Rewrites tab and add:
```
Source: /*   →   Destination: /index.html   →   Action: Rewrite
```

---

## 🐳 Docker (Optional)

```bash
# Run the full stack with one command
docker compose up --build
```

| Service | Port |
|---|---|
| MongoDB | 27017 |
| Backend | 5000 |
| Frontend | 3000 |

---

## 📄 License

MIT License — free to use and modify for client projects.

---

<div align="center">

Built with ❤️ using the MERN Stack

**[⬆ Back to top](#-shifttrack--employee-attendance--shift-management-system)**

</div>
