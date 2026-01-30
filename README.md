# YWMDSBS School Hub 🎓
<div align="center">

![YWMDSBS Logo](https://img.shields.io/badge/YWMDSBS-School%20Hub-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**Yihune Woldu Memorial Dessie Special Boarding School - Comprehensive School Management System**

*"Labor Omnia Vincit" - Work Conquers All*

[Features](#features) • [Installation](#installation) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [User Roles & Permissions](#user-roles--permissions)
- [Core Modules](#core-modules)
  - [Authentication System](#authentication-system)
  - [Student Management](#student-management)
  - [Teacher Management](#teacher-management)
  - [Academic Management](#academic-management)
  - [Assessment & Grading](#assessment--grading)
  - [Analytics & Reporting](#analytics--reporting)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [UI/UX Design](#uiux-design)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Acknowledgments](#acknowledgments)

---

## 🌟 Overview

The **YWMDSBS School Hub** is a comprehensive, modern school management system designed specifically for Yihune Woldu Memorial Dessie Special Boarding School in Dessie, Ethiopia. This full-stack web application streamlines academic operations, student management, teacher coordination, and administrative tasks through an intuitive, role-based interface.

### Mission Statement

To provide a premier center of academic excellence that produces globally competitive, ethically grounded, and socially responsible leaders who drive the sustainable transformation of Ethiopia and the world.

### Vision

The system embodies the school's commitment to:
- **Academic Excellence**: Rigorous STEM-focused curriculum management
- **Character Building**: Comprehensive student development tracking
- **Operational Efficiency**: Streamlined administrative processes
- **Data-Driven Decisions**: Advanced analytics and reporting capabilities

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- **Secure Authentication**: Email/password-based authentication with Supabase Auth
- **Role-Based Access Control (RBAC)**: Three distinct user roles (Super Admin, Teacher, Student)
- **Session Management**: Persistent sessions with automatic token refresh
- **Password Recovery**: Secure password reset functionality
- **Profile Management**: User profile customization and settings

### 👨‍🎓 Student Management
- **Student Registration**: Comprehensive student enrollment with detailed information
- **Student Profiles**: Complete student records including personal, academic, and boarding information
- **Class Enrollment**: Automated class assignment and enrollment tracking
- **Student Dashboard**: Personalized dashboard for students to view grades, performance, and schedules
- **Transcript Generation**: Automated academic transcript generation
- **Performance Tracking**: Real-time academic performance monitoring

### 👨‍🏫 Teacher Management
- **Teacher Registration**: Complete teacher onboarding with professional details
- **Class Assignments**: Subject-class-teacher relationship management
- **Teacher Dashboard**: Centralized view of assigned classes and students
- **Grade Management**: Streamlined grade entry and publishing
- **Assessment Creation**: Tools for creating and managing assessments
- **Student Analytics**: Class-level and individual student performance insights

### 📚 Academic Management
- **Academic Years**: Multi-year academic calendar management
- **Semester Management**: Semester-based academic organization
- **Class Management**: Grade level and section organization
- **Subject Management**: Comprehensive subject catalog with credit systems
- **Class-Subject Assignments**: Flexible subject-class-teacher mapping
- **Curriculum Planning**: Academic program structuring

### 📊 Assessment & Grading
- **Assessment Types**: Multiple assessment categories (Quiz, Test, Midterm, Final, Project, etc.)
- **Flexible Grading**: Customizable grading scales and letter grades
- **Weighted Scoring**: Assessment weight configuration for accurate GPA calculation
- **Grade Publishing**: Controlled grade release to students
- **Bulk Grade Upload**: Excel/CSV import for efficient grade entry
- **Grade History**: Complete academic record tracking

### 📈 Analytics & Reporting
- **Dashboard Analytics**: Real-time statistics and visualizations
- **Performance Reports**: Class and individual student performance analysis
- **Grade Distribution**: Visual representation of grade distributions
- **Trend Analysis**: Historical performance tracking
- **Export Capabilities**: PDF and Excel report generation
- **Custom Reports**: Configurable reporting templates

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first, fully responsive interface
- **Dark Mode Support**: System-wide theme customization
- **Intuitive Navigation**: Role-based navigation with clear information architecture
- **Accessibility**: WCAG 2.1 compliant design
- **Premium Aesthetics**: Modern, vibrant design with glassmorphism effects
- **Interactive Components**: Smooth animations and micro-interactions

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 6.30.1
- **State Management**: TanStack Query (React Query) 5.83.0
- **UI Framework**: Radix UI Components
- **Styling**: 
  - Tailwind CSS 3.4.17
  - Custom CSS with CSS Variables
  - Tailwind Animate
  - Class Variance Authority (CVA)
- **Form Management**: React Hook Form 7.61.1 with Zod validation
- **Charts & Visualization**: Recharts 2.15.4
- **Icons**: Lucide React 0.462.0
- **PDF Generation**: @react-pdf/renderer 4.3.2
- **Excel Processing**: XLSX 0.18.5
- **Date Handling**: date-fns 3.6.0

### Backend & Database
- **Backend as a Service**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Row Level Security (RLS)**: PostgreSQL RLS policies

### Development Tools
- **Package Manager**: npm / bun
- **Linting**: ESLint 9.32.0
- **Type Checking**: TypeScript 5.8.3
- **Testing**: Vitest 3.2.4 with Testing Library
- **Code Quality**: TypeScript ESLint 8.38.0

### Deployment
- **Hosting**: Vercel (configured)
- **CI/CD**: Automated deployment pipeline
- **Environment Management**: Environment-based configuration

---

## 📁 Project Structure

```
ywmdsbs-school-hub/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ui/             # Shadcn UI components (49 components)
│   │   ├── layout/         # Layout components (Header, Sidebar, AppLayout)
│   │   ├── dashboards/     # Dashboard components for each role
│   │   ├── teacher/        # Teacher-specific components
│   │   └── admin/          # Admin-specific components
│   │
│   ├── pages/              # Page components (29 pages)
│   │   ├── Auth.tsx        # Authentication page
│   │   ├── LandingPage.tsx # Public landing page
│   │   ├── Dashboard.tsx   # Main dashboard router
│   │   ├── Students.tsx    # Student management
│   │   ├── Teachers.tsx    # Teacher management
│   │   ├── Classes.tsx     # Class management
│   │   ├── Subjects.tsx    # Subject management
│   │   ├── AcademicYears.tsx # Academic year management
│   │   ├── Assessments.tsx # Assessment management
│   │   ├── Grades.tsx      # Grade management
│   │   ├── Analytics.tsx   # Analytics dashboard
│   │   ├── Settings.tsx    # System settings
│   │   ├── Enrollments.tsx # Student enrollment
│   │   ├── MyGrades.tsx    # Student grade view
│   │   ├── MyTranscript.tsx # Student transcript
│   │   ├── MyPerformance.tsx # Student performance
│   │   ├── ProfileSettings.tsx # User profile
│   │   ├── teacher/        # Teacher-specific pages
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── TeacherAssessments.tsx
│   │   │   ├── TeacherGrades.tsx
│   │   │   └── TeacherAnalytics.tsx
│   │   └── admin/          # Admin-specific pages
│   │       └── ClassTeacherAdmin.tsx
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.tsx     # Authentication hook
│   │   ├── use-toast.ts    # Toast notification hook
│   │   └── use-mobile.tsx  # Mobile detection hook
│   │
│   ├── lib/                # Utility libraries
│   │   ├── types.ts        # TypeScript type definitions
│   │   ├── utils.ts        # Utility functions
│   │   └── class-teacher-relations.ts # Relationship helpers
│   │
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client configuration
│   │
│   ├── test/               # Test files
│   │
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   ├── index.css           # Global styles and CSS variables
│   └── vite-env.d.ts       # Vite type definitions
│
├── supabase/               # Supabase configuration
│   ├── config.toml         # Supabase project configuration
│   └── migrations/         # Database migration files (9 migrations)
│
├── public/                 # Static assets
│
├── node_modules/           # Dependencies
│
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies and scripts
├── package-lock.json      # Dependency lock file
├── tsconfig.json          # TypeScript configuration
├── tsconfig.app.json      # App-specific TypeScript config
├── tsconfig.node.json     # Node-specific TypeScript config
├── vite.config.ts         # Vite configuration
├── vitest.config.ts       # Vitest test configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── eslint.config.js       # ESLint configuration
├── components.json        # Shadcn UI components config
├── vercel.json            # Vercel deployment config
├── index.html             # HTML entry point
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (or **bun** as an alternative)
- **Git**: For version control
- **Supabase Account**: Free tier is sufficient for development
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/DiamondTechEt/ywmdsbs-school-hub.git
cd ywmdsbs-school-hub
```

2. **Install dependencies**

Using npm:
```bash
npm install
```

Or using bun:
```bash
bun install
```

3. **Verify installation**

Check that all dependencies are installed correctly:
```bash
npm list --depth=0
```

### Environment Configuration

1. **Create environment file**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. **Configure environment variables**

Edit the `.env` file with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
VITE_APP_NAME=YWMDSBS School Hub
VITE_APP_VERSION=1.0.0

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id
```

**Where to find Supabase credentials:**
1. Go to [supabase.com](https://supabase.com)
2. Navigate to your project settings
3. Click on "API" in the settings menu
4. Copy the "Project URL" and "anon public" key

### Database Setup

1. **Create Supabase Project**

- Sign up at [supabase.com](https://supabase.com)
- Create a new project
- Note your project URL and API keys

2. **Run Database Migrations**

The project includes 9 migration files in `supabase/migrations/`. Apply them in order:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or manually execute each migration in the Supabase SQL Editor
```

**Migration files include:**
- Initial schema setup with all tables
- User roles and authentication
- Class-teacher relationships
- Subject assignments
- RLS (Row Level Security) policies
- Database functions and triggers
- Student and teacher management functions

3. **Verify Database Setup**

Check that all tables are created:
- `users` / `profiles`
- `user_roles`
- `students`
- `teachers`
- `classes`
- `subjects`
- `academic_years`
- `semesters`
- `enrollments`
- `class_subject_assignments`
- `class_teachers`
- `assessments`
- `assessment_types`
- `grades`
- `grading_scales`
- `grading_scale_items`
- `app_settings`

### Running the Application

1. **Development Mode**

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

2. **Build for Production**

Create a production build:

```bash
npm run build
```

3. **Preview Production Build**

Preview the production build locally:

```bash
npm run preview
```

4. **Run Tests**

Execute the test suite:

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

5. **Linting**

Check code quality:

```bash
npm run lint
```

---

## 👥 User Roles & Permissions

The system implements a comprehensive role-based access control (RBAC) system with three primary roles:

### 1. Super Admin (super_admin)

**Full System Access** - Complete control over all system features and data.

**Permissions:**
- ✅ Manage all students (create, read, update, delete)
- ✅ Manage all teachers (create, read, update, delete)
- ✅ Manage classes and subjects
- ✅ Manage academic years and semesters
- ✅ Configure assessment types and grading scales
- ✅ Assign teachers to classes and subjects
- ✅ Enroll students in classes
- ✅ View all grades and assessments
- ✅ Access system-wide analytics
- ✅ Configure system settings
- ✅ Manage user roles and permissions
- ✅ Export all data and reports
- ✅ Access audit logs

**Default Dashboard:** Admin Dashboard with system-wide statistics

**Navigation Access:**
- Students Management
- Teachers Management
- Classes Management
- Subjects Management
- Academic Years
- Enrollments
- Assessments
- Grades
- Analytics
- Settings
- Class-Teacher Assignments

### 2. Teacher (teacher)

**Academic Management** - Focused on teaching, assessment, and student performance.

**Permissions:**
- ✅ View assigned classes and students
- ✅ Create and manage assessments for assigned subjects
- ✅ Enter and publish grades for assigned students
- ✅ View student performance in assigned classes
- ✅ Access class-level analytics
- ✅ Upload grades via Excel/CSV
- ✅ Generate class reports
- ✅ Update own profile
- ❌ Cannot modify student enrollment
- ❌ Cannot access system settings
- ❌ Cannot manage other teachers

**Default Dashboard:** Teacher Dashboard with class overview

**Navigation Access:**
- My Classes (Teacher Dashboard)
- My Students
- Assessments (for assigned classes)
- Grades Management
- Upload Grades
- Teacher Analytics
- Profile Settings

### 3. Student (student)

**Personal Academic View** - Access to personal academic information and performance.

**Permissions:**
- ✅ View own grades and assessments
- ✅ View academic transcript
- ✅ View performance analytics
- ✅ View class schedule
- ✅ Update own profile
- ❌ Cannot view other students' data
- ❌ Cannot modify grades
- ❌ Cannot access administrative features

**Default Dashboard:** Student Dashboard with personal statistics

**Navigation Access:**
- My Grades
- My Transcript
- My Performance
- Profile Settings

### Role Assignment

Roles are assigned during user creation and stored in the `user_roles` table. The system uses Row Level Security (RLS) policies to enforce permissions at the database level.

**Role Assignment Process:**
1. User registers or is created by admin
2. Admin assigns appropriate role in `user_roles` table
3. System creates corresponding record in `students` or `teachers` table
4. User gains access to role-specific features

---

## 🧩 Core Modules

### Authentication System

**Location:** `src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`

**Features:**
- Email/password authentication via Supabase Auth
- Automatic session management
- Role-based redirection after login
- Persistent authentication state
- Secure password handling
- Profile creation on signup

**Authentication Flow:**
1. User enters credentials on Auth page
2. Supabase Auth validates credentials
3. System fetches user role from `user_roles` table
4. User is redirected to appropriate dashboard
5. Session is maintained across page refreshes

**Code Example:**
```typescript
const { signIn, signOut, user, role, loading } = useAuth();

// Sign in
await signIn(email, password);

// Sign out
await signOut();

// Check current user
if (user && role === 'super_admin') {
  // Admin-specific logic
}
```

### Student Management

**Location:** `src/pages/Students.tsx`

**Features:**
- Comprehensive student registration form
- Student search and filtering
- Bulk student import via Excel
- Student profile editing
- Enrollment status management
- Student ID code generation
- Gender and boarding status tracking

**Student Data Model:**
```typescript
interface Student {
  id: string;
  user_id: string;
  student_id_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'male' | 'female';
  date_of_birth: string;
  current_class_id?: string;
  enrollment_year: number;
  boarding_status: 'boarding' | 'day';
  is_active: boolean;
}
```

**Key Operations:**
- Create new student with user account
- Update student information
- Deactivate/reactivate students
- View student academic history
- Generate student reports

### Teacher Management

**Location:** `src/pages/Teachers.tsx`

**Features:**
- Teacher registration and onboarding
- Teacher profile management
- Subject specialization tracking
- Class assignment overview
- Teacher performance metrics
- Teacher ID code generation

**Teacher Data Model:**
```typescript
interface Teacher {
  id: string;
  user_id: string;
  teacher_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'male' | 'female';
  hire_date: string;
  is_active: boolean;
}
```

**Key Operations:**
- Create teacher with user account
- Assign teachers to classes and subjects
- View teacher workload
- Manage teacher status
- Track teaching assignments

### Academic Management

**Components:**
- Academic Years (`src/pages/AcademicYears.tsx`)
- Classes (`src/pages/Classes.tsx`)
- Subjects (`src/pages/Subjects.tsx`)
- Enrollments (`src/pages/Enrollments.tsx`)
- Class-Subject Assignments (`src/pages/ClassSubjectAssignments.tsx`)

**Academic Year Management:**
- Create and manage academic years
- Define semester periods
- Lock academic years to prevent changes
- Set active academic year

**Class Management:**
- Organize classes by grade level
- Assign homeroom teachers
- Track class capacity
- Manage class sections

**Subject Management:**
- Define subject catalog
- Set credit hours
- Specify grade level applicability
- Track subject status

**Enrollment System:**
- Enroll students in classes
- Track enrollment history
- Manage enrollment status
- Bulk enrollment operations

### Assessment & Grading

**Location:** `src/pages/Assessments.tsx`, `src/pages/Grades.tsx`, `src/pages/UploadGrades.tsx`

**Assessment Types:**
- Quiz
- Test
- Midterm Exam
- Final Exam
- Project
- Assignment
- Presentation
- Lab Work

**Grading Features:**
- Flexible grading scales
- Weighted assessment scoring
- Letter grade calculation
- GPA computation
- Grade publishing control
- Bulk grade upload via Excel
- Grade history tracking

**Assessment Data Model:**
```typescript
interface Assessment {
  id: string;
  class_subject_assignment_id: string;
  assessment_type_id: string;
  semester_id: string;
  title: string;
  max_score: number;
  weight: number;
  assessment_date: string;
  is_published: boolean;
  created_by_teacher_id: string;
}
```

**Grade Data Model:**
```typescript
interface Grade {
  id: string;
  student_id: string;
  assessment_id: string;
  score: number;
  percentage?: number;
  letter_grade?: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  semester_id: string;
  is_published: boolean;
}
```

**Grading Scale:**
- A: 90-100% (4.0 GPA)
- B: 80-89% (3.0 GPA)
- C: 70-79% (2.0 GPA)
- D: 60-69% (1.0 GPA)
- F: 0-59% (0.0 GPA)

### Analytics & Reporting

**Location:** `src/pages/Analytics.tsx`, `src/pages/teacher/TeacherAnalytics.tsx`

**Analytics Features:**
- Real-time dashboard statistics
- Performance trend analysis
- Grade distribution charts
- Class comparison reports
- Student performance tracking
- Teacher effectiveness metrics
- Exportable reports (PDF, Excel)

**Visualization Components:**
- Bar charts for grade distribution
- Line charts for performance trends
- Pie charts for demographic data
- Tables for detailed data views
- Cards for key metrics

**Key Metrics:**
- Total students/teachers/classes
- Average GPA by class/subject
- Pass/fail rates
- Grade distribution
- Student rankings
- Performance trends over time

---

## 🗄 Database Schema

### Core Tables

#### users / profiles
Stores user authentication and profile information.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_roles
Maps users to their system roles.

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'teacher', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### students
Stores student-specific information.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  current_class_id UUID REFERENCES classes(id),
  enrollment_year INTEGER,
  boarding_status TEXT CHECK (boarding_status IN ('boarding', 'day')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### teachers
Stores teacher-specific information.

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### academic_years
Manages academic year periods.

```sql
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### semesters
Defines semester periods within academic years.

```sql
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### classes
Organizes students into classes.

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  academic_year_id UUID REFERENCES academic_years(id),
  homeroom_teacher_id UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### subjects
Catalog of available subjects.

```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  grade_level INTEGER,
  credit DECIMAL(3,1) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### enrollments
Tracks student enrollment in classes.

```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, academic_year_id)
);
```

#### class_subject_assignments
Maps subjects to classes with assigned teachers.

```sql
CREATE TABLE class_subject_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, subject_id)
);
```

#### class_teachers
Many-to-many relationship for class-teacher assignments.

```sql
CREATE TABLE class_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, teacher_id, subject_id)
);
```

#### assessment_types
Defines types of assessments.

```sql
CREATE TABLE assessment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  weight_default DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### assessments
Individual assessment instances.

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_subject_assignment_id UUID REFERENCES class_subject_assignments(id),
  assessment_type_id UUID REFERENCES assessment_types(id),
  semester_id UUID REFERENCES semesters(id),
  title TEXT NOT NULL,
  max_score DECIMAL(6,2) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  assessment_date DATE,
  is_published BOOLEAN DEFAULT false,
  created_by_teacher_id UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### grades
Student grades for assessments.

```sql
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  score DECIMAL(6,2) NOT NULL,
  percentage DECIMAL(5,2),
  letter_grade TEXT,
  teacher_id UUID REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  academic_year_id UUID REFERENCES academic_years(id),
  semester_id UUID REFERENCES semesters(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, assessment_id)
);
```

#### grading_scales
Defines grading scale configurations.

```sql
CREATE TABLE grading_scales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  academic_year_id UUID REFERENCES academic_years(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### grading_scale_items
Individual grade ranges within a grading scale.

```sql
CREATE TABLE grading_scale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grading_scale_id UUID REFERENCES grading_scales(id) ON DELETE CASCADE,
  min_percentage DECIMAL(5,2) NOT NULL,
  max_percentage DECIMAL(5,2) NOT NULL,
  letter_grade TEXT NOT NULL,
  grade_point DECIMAL(3,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### app_settings
System-wide configuration settings.

```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

The database implements comprehensive RLS policies to ensure data security:

**Students Table:**
- Super admins: Full access
- Teachers: Read access to students in their classes
- Students: Read access to own record only

**Teachers Table:**
- Super admins: Full access
- Teachers: Read access to all teachers, update own record
- Students: Read access to their teachers

**Grades Table:**
- Super admins: Full access
- Teachers: Full access to grades for their assigned classes
- Students: Read access to own published grades only

**Assessments Table:**
- Super admins: Full access
- Teachers: Full access to assessments for their assigned classes
- Students: Read access to published assessments in their classes

---

## 🔌 API Documentation

### Supabase Client

**Location:** `src/integrations/supabase/client.ts`

The application uses Supabase client for all backend operations.

### Common API Patterns

#### Fetching Data

```typescript
// Fetch all students
const { data: students, error } = await supabase
  .from('students')
  .select('*')
  .order('last_name', { ascending: true });

// Fetch with relations
const { data: grades, error } = await supabase
  .from('grades')
  .select(`
    *,
    student:students(*),
    assessment:assessments(*),
    subject:subjects(*)
  `)
  .eq('student_id', studentId);
```

#### Creating Records

```typescript
// Create a new student
const { data, error } = await supabase
  .from('students')
  .insert({
    user_id: userId,
    student_id_code: 'STU001',
    first_name: 'John',
    last_name: 'Doe',
    gender: 'male',
    enrollment_year: 2024,
    boarding_status: 'boarding'
  })
  .select()
  .single();
```

#### Updating Records

```typescript
// Update student information
const { data, error } = await supabase
  .from('students')
  .update({
    current_class_id: newClassId,
    updated_at: new Date().toISOString()
  })
  .eq('id', studentId)
  .select()
  .single();
```

#### Deleting Records

```typescript
// Soft delete (deactivate)
const { error } = await supabase
  .from('students')
  .update({ is_active: false })
  .eq('id', studentId);

// Hard delete
const { error } = await supabase
  .from('students')
  .delete()
  .eq('id', studentId);
```

#### Real-time Subscriptions

```typescript
// Subscribe to grade changes
const subscription = supabase
  .channel('grades-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'grades',
      filter: `student_id=eq.${studentId}`
    },
    (payload) => {
      console.log('Grade updated:', payload);
      // Update UI
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

### Database Functions

The system includes several PostgreSQL functions for complex operations:

#### admin_manage_student
Creates or updates student records with user account.

```sql
SELECT admin_manage_student(
  p_user_id := NULL,
  p_email := 'student@example.com',
  p_password := 'securepassword',
  p_student_id_code := 'STU001',
  p_first_name := 'John',
  p_last_name := 'Doe',
  p_gender := 'male',
  p_date_of_birth := '2008-01-01',
  p_enrollment_year := 2024,
  p_boarding_status := 'boarding'
);
```

#### admin_manage_teacher
Creates or updates teacher records with user account.

```sql
SELECT admin_manage_teacher(
  p_user_id := NULL,
  p_email := 'teacher@example.com',
  p_password := 'securepassword',
  p_teacher_code := 'TCH001',
  p_first_name := 'Jane',
  p_last_name := 'Smith',
  p_gender := 'female',
  p_hire_date := '2020-09-01'
);
```

---

## 🎨 UI/UX Design

### Design System

**Color Palette:**
- Primary: HSL-based blue tones
- Secondary: Complementary accent colors
- Muted: Subtle grays for secondary content
- Destructive: Red tones for warnings/errors

**Typography:**
- Sans-serif: DM Sans (body text)
- Serif: Crimson Pro (headings)
- Monospace: SF Mono (code)

**Spacing:**
- Base unit: 4px
- Consistent padding/margin scale

**Border Radius:**
- Small: 4px
- Medium: 8px
- Large: 12px
- Extra Large: 24px+

### Component Library

The application uses 49 Shadcn UI components:

**Form Components:**
- Input, Textarea, Select, Checkbox, Radio Group
- Calendar, Date Picker
- Switch, Slider
- Form (with validation)

**Layout Components:**
- Card, Sheet, Dialog, Drawer
- Tabs, Accordion, Collapsible
- Separator, Scroll Area
- Sidebar

**Navigation:**
- Navigation Menu, Menubar
- Breadcrumb, Pagination
- Command (search)

**Feedback:**
- Toast, Sonner (notifications)
- Alert, Alert Dialog
- Progress, Skeleton
- Badge

**Data Display:**
- Table, Chart
- Avatar, Hover Card
- Tooltip, Popover
- Carousel

### Responsive Design

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile-First Approach:**
- All components designed for mobile first
- Progressive enhancement for larger screens
- Touch-friendly interactive elements

### Accessibility

**WCAG 2.1 Compliance:**
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast ratios
- Screen reader compatibility

---

## 🧪 Testing

### Test Setup

**Framework:** Vitest with Testing Library

**Configuration:** `vitest.config.ts`

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

### Test Structure

```
src/
└── test/
    ├── setup.ts          # Test setup and configuration
    └── *.test.tsx        # Component tests
```

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

The project is configured for Vercel deployment with `vercel.json`.

**Steps:**

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
# Development deployment
vercel

# Production deployment
vercel --prod
```

4. **Configure Environment Variables**
- Go to Vercel dashboard
- Navigate to project settings
- Add environment variables from `.env`

### Manual Deployment

1. **Build the application**
```bash
npm run build
```

2. **Deploy the `dist` folder** to your hosting provider

### Environment Variables in Production

Ensure all environment variables are set in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🔒 Security

### Authentication Security

- Passwords hashed with bcrypt via Supabase Auth
- JWT tokens for session management
- Automatic token refresh
- Secure password reset flow

### Database Security

- Row Level Security (RLS) policies on all tables
- Role-based data access
- SQL injection prevention via parameterized queries
- Encrypted connections (SSL/TLS)

### Frontend Security

- XSS prevention via React's built-in escaping
- CSRF protection
- Content Security Policy headers
- Secure environment variable handling

### Best Practices

- Never commit `.env` file
- Use environment variables for sensitive data
- Implement proper error handling
- Regular security audits
- Keep dependencies updated

---

## ⚡ Performance Optimization

### Code Splitting

- Route-based code splitting with React Router
- Lazy loading of components
- Dynamic imports for heavy modules

### Caching

- TanStack Query for server state caching
- Supabase client-side caching
- Browser caching for static assets

### Bundle Optimization

- Vite's automatic code splitting
- Tree shaking for unused code
- Minification in production builds
- Compression (gzip/brotli)

### Image Optimization

- Lazy loading images
- Responsive images
- WebP format support
- CDN delivery

### Database Optimization

- Indexed columns for frequent queries
- Efficient query patterns
- Pagination for large datasets
- Connection pooling

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem:** "User not authenticated" or "Session expired"

**Solution:**
- Clear browser cache and cookies
- Check Supabase project status
- Verify environment variables
- Re-login to the application

#### 2. Database Connection Issues

**Problem:** "Failed to fetch" or "Network error"

**Solution:**
- Check internet connection
- Verify Supabase URL and API key
- Check Supabase project status
- Review RLS policies

#### 3. Build Errors

**Problem:** TypeScript or build errors

**Solution:**
```bash
# Clear cache
rm -rf node_modules
rm -rf .vite

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

#### 4. Missing Data

**Problem:** Tables or data not showing

**Solution:**
- Verify database migrations are applied
- Check RLS policies
- Confirm user role assignments
- Review console for errors

#### 5. Slow Performance

**Problem:** Application loading slowly

**Solution:**
- Check network tab for slow requests
- Review database query efficiency
- Enable caching
- Optimize images
- Use pagination for large datasets

### Debug Mode

Enable detailed logging:

```typescript
// In useAuth.tsx or other hooks
console.log('Debug info:', { user, role, session });
```

### Getting Help

- Check browser console for errors
- Review Supabase logs
- Check network requests in DevTools
- Consult documentation
- Contact support team

---

## 🤝 Contributing

We welcome contributions to the YWMDSBS School Hub project!

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Write/update tests**
5. **Run linting and tests**
   ```bash
   npm run lint
   npm run test
   ```
6. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request**

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Pull Request Guidelines

- Provide clear description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 YWMDSBS School Hub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 💬 Support

### Contact Information

**School:**
- **Name:** Yihune Woldu Memorial Dessie Special Boarding School
- **Location:** Dessie, Amhara Region, Ethiopia
- **Email:** info@ywmdsbs.edu.et
- **Phone:** +251 33 111 ....
- **PO Box:** 1234, Dessie

**Technical Support:**
- **Email:** tech@ywmdsbs.edu.et
- **GitHub Issues:** [Create an issue](https://github.com/your-org/ywmdsbs-school-hub/issues)

### Documentation

- **User Guide:** Coming soon
- **Admin Manual:** Coming soon
- **API Reference:** See [API Documentation](#api-documentation)
- **Video Tutorials:** Coming soon

### Community

- **Discord:** Coming soon
- **Slack:** Coming soon
- **Forum:** Coming soon

---

## 🙏 Acknowledgments

### Built With

- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Supabase](https://supabase.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Recharts](https://recharts.org/) - Charting library

### Special Thanks

- The YWMDSBS administration and staff
- All contributors to this project
- The open-source community
- Students and teachers who provided feedback

### Inspiration

This project is dedicated to the memory of **Yihune Woldu** and the pursuit of academic excellence in Ethiopia.

---

## 📊 Project Statistics

- **Total Lines of Code:** ~50,000+
- **Components:** 64
- **Pages:** 29
- **Database Tables:** 15+
- **Migrations:** 9
- **Dependencies:** 68
- **Development Time:** Ongoing
- **Contributors:** Multiple

---

## 🗺 Roadmap

### Version 1.1 (Q2 2024)
- [ ] Mobile application (React Native)
- [ ] Parent portal
- [ ] SMS notifications
- [ ] Attendance tracking
- [ ] Library management

### Version 1.2 (Q3 2024)
- [ ] Financial management
- [ ] Hostel management
- [ ] Transport management
- [ ] Event calendar
- [ ] Document management

### Version 2.0 (Q4 2024)
- [ ] AI-powered analytics
- [ ] Predictive performance modeling
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Offline mode

---

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Complete authentication system
- ✅ Student management
- ✅ Teacher management
- ✅ Academic year and semester management
- ✅ Class and subject management
- ✅ Enrollment system
- ✅ Assessment and grading system
- ✅ Analytics and reporting
- ✅ Role-based access control
- ✅ Responsive design
- ✅ Landing page
- ✅ Dashboard for all roles

---

<div align="center">

**Made with ❤️ for YWMDSBS**

*"Labor Omnia Vincit" - Work Conquers All*

[⬆ Back to Top](#ywmdsbs-school-hub-)

</div>
