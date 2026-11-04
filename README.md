# Home Services Booking SaaS Platform

A multi-tenant full-stack SaaS platform connecting customers with verified home service providers and technicians, featuring role-based access control, appointment scheduling, live booking workflows, and review management.

---

## 🚀 Technology Stack

- **Frontend:** React.js, Tailwind CSS, Lucide React, Axios, React Router v6
- **Backend:** Python FastAPI, Pydantic v2
- **Database & ORM:** MySQL 8.0+, SQLAlchemy 2.0, Alembic migrations
- **Authentication:** JWT (JSON Web Tokens) with role-based access (RBAC)
- **Architecture:** Clean Architecture (Separation of API, Domain Services, Repositories, and Data Models)

---

## 📁 Repository Structure

```
HomeService -sass/
├── backend/                   # FastAPI backend application
│   ├── app/                   # Clean architecture source code
│   │   ├── api/               # API routes (v1 endpoints, dependencies)
│   │   ├── core/              # Config, security (JWT), custom error handling
│   │   ├── db/                # DB session engine, base model, seeders
│   │   ├── models/            # Separated SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic schemas (Request/Response DTOs)
│   │   ├── repositories/      # Data access layer (CRUD queries)
│   │   └── services/          # Core business logic layer
│   ├── tests/                 # Automated unit and API integration tests
│   ├── .env.example           # Backend environment variables template
│   └── requirements.txt       # Python package dependencies
├── frontend/                  # React.js + Tailwind CSS client
│   ├── public/                # Static public assets
│   ├── src/                   # React source code
│   │   ├── assets/            # Images, icons, branding assets
│   │   ├── components/        # Reusable UI components (common, layout, feedback)
│   │   ├── features/          # Domain-specific modules (auth, bookings, services, etc.)
│   │   ├── context/           # Global state contexts (AuthContext, etc.)
│   │   ├── hooks/             # Custom reusable React hooks
│   │   ├── routes/            # Route definitions and RBAC Route Guards
│   │   ├── services/          # Axios HTTP client and backend API wrappers
│   │   ├── utils/             # Helpers, formatters, and validators
│   │   └── constants/         # App constants, roles, and status enums
│   ├── .env.example           # Frontend environment variables template
│   ├── package.json           # Frontend dependencies and scripts
│   ├── tailwind.config.js     # Tailwind CSS design system configuration
│   └── postcss.config.js      # PostCSS configuration
├── database/                  # Schema definition and SQL migration scripts
│   └── homeservices_schema.sql
├── documentation/             # SRS, database design, and architecture specs
│   ├── requirements.md
│   └── homeservices_database_design.md
├── testing/                   # Test plans and end-to-end testing guides
├── .gitignore                 # Git ignore rules for Python, Node, and environments
└── .env.example               # Root project environment template
```

---

## ⚙️ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MySQL credentials

# Run FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive API docs will be accessible at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
The React application will be accessible at: `http://localhost:5173`
