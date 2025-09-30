# GAMA Martial Arts Management System

A comprehensive full-stack web application for managing martial arts schools with role-based access control for administrators and instructors.

## Features

### 🥋 Core Functionality
- **Role-based Authentication**: Admin and Instructor roles with different access levels
- **Student Management**: Complete CRUD operations for student records
- **Instructor Management**: Admin-only instructor management
- **Attendance Tracking**: Record and monitor class attendance
- **Fee Management**: Track payments and fees
- **Inventory Management**: Admin-only inventory tracking
- **Dashboard Analytics**: Role-specific KPIs and statistics

### 🎯 Role-Based Access
- **Admin**: Full access to all features across all branches
- **Instructor**: Limited access to their assigned branch only

### 🛠️ Technology Stack
- **Frontend**: React 18, React Router DOM, React Context API, React Toastify, React Icons
- **Backend**: Node.js, Express.js, PostgreSQL, JWT Authentication
- **Styling**: Pure CSS3 with modern design
- **Package Manager**: Bun

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Bun (latest version)
- PostgreSQL (v12 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gama-app3
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   bun install
   
   # Install backend dependencies
   cd backend
   bun install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb gama_martial_arts
   
   # Run schema and seed data
   psql -d gama_martial_arts -f backend/schema.sql
   psql -d gama_martial_arts -f backend/seed.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp backend/env.example backend/.env
   
   # Edit backend/.env with your database credentials
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gama_martial_arts
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your-super-secret-jwt-key
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start backend server
   cd backend
   bun run dev
   
   # Terminal 2: Start frontend development server
   bun run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Demo Credentials

### Admin Access
- **Username**: admin
- **Password**: password

### Instructor Access
- **Username**: instructor1
- **Password**: password

## Project Structure

```
gama-app3/
├── backend/                 # Backend API
│   ├── controllers/         # Route controllers
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── utils/              # Utility functions
│   ├── schema.sql          # Database schema
│   ├── seed.sql           # Sample data
│   └── server.js           # Main server file
├── src/                    # Frontend React app
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── context/            # React Context
│   ├── utils/              # Utility functions
│   └── App.jsx             # Main app component
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Instructors (Admin only)
- `GET /api/instructors` - Get all instructors
- `GET /api/instructors/:id` - Get instructor by ID
- `POST /api/instructors` - Create instructor
- `PUT /api/instructors/:id` - Update instructor
- `DELETE /api/instructors/:id` - Delete instructor

### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/:id` - Get attendance by ID
- `POST /api/attendance` - Record attendance
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

### Fees
- `GET /api/fees` - Get fee records
- `GET /api/fees/:id` - Get fee by ID
- `POST /api/fees` - Create fee record
- `PUT /api/fees/:id` - Update fee record
- `DELETE /api/fees/:id` - Delete fee record

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Inventory (Admin only)
- `GET /api/inventory` - Get inventory items
- `GET /api/inventory/:id` - Get inventory item by ID
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

## Database Schema

### Core Tables
- **users**: Admin and instructor accounts
- **branches**: School branch locations
- **students**: Student information and enrollment
- **instructors**: Instructor profiles and assignments
- **attendance**: Class attendance records
- **fees**: Payment and fee tracking
- **inventory**: Equipment and supply management

### Key Features
- Branch-level data isolation for instructors
- Role-based access control
- Comprehensive audit trails
- Flexible fee and attendance tracking

## Development

### Backend Development
```bash
cd backend
bun run dev  # Start with nodemon for auto-reload
```

### Frontend Development
```bash
bun run dev  # Start Vite development server
```

### Database Management
```bash
# Reset database
psql -d gama_martial_arts -f backend/schema.sql
psql -d gama_martial_arts -f backend/seed.sql
```

## Features in Detail

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based route protection
- Branch-level data filtering for instructors
- Secure password hashing with bcrypt

### 📊 Dashboard Analytics
- **Admin Dashboard**: System-wide statistics, all branches
- **Instructor Dashboard**: Branch-specific metrics only
- Real-time KPI tracking
- Recent activity monitoring

### 👥 Student Management
- Complete student profiles
- Emergency contact management
- Belt level tracking
- Branch assignment
- Enrollment history

### 🥋 Instructor Management
- Instructor profiles and certifications
- Branch assignments
- Specialization tracking
- Admin-only management interface

### 📝 Attendance System
- Daily class attendance recording
- Status tracking (Present, Absent, Late)
- Notes and comments
- Branch-filtered views for instructors

### 💰 Fee Management
- Multiple fee types (Monthly, Belt Test, Uniform, etc.)
- Payment status tracking
- Due date management
- Payment method recording

### 📦 Inventory Management
- Equipment and supply tracking
- Branch-specific inventory
- Supplier management
- Restock date tracking

## Security Features

- JWT token authentication
- Role-based access control
- Branch-level data isolation
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Error handling middleware

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.