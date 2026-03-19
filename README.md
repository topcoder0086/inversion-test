# Who is my granddaddy? - Family Tree Search

A professional family tree exploration application built with React, Django, and PostgreSQL.

## Features
- **Family Tree Viewer**: Search by Identity Number to see all descendants up to 10 levels deep, with an option to expand further.
- **Root Ascendant**: Find the ultimate ancestor of any individual in the database.
- **Modern UI**: Clean, responsive design using Tailwind CSS with professional typography and micro-animations.
- **Scalable Backend**: Django REST Framework with optimized recursive tree traversal.

## Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite.
- **Backend**: Python 3.11, Django 5.0, Django REST Framework.
- **Database**: PostgreSQL 16.
- **Infrastructure**: Docker & Docker Compose.

## Getting Started

### Prerequisites
- Docker and Docker Compose installed.

### Setup & Run
1. **Clone the repository**:
   ```bash
   git clone https://github.com/topcoder0086/inversion-test.git
   cd inversion
   ```

2. **Start the application**:
   ```bash
   docker-compose up --build
   ```

3. **Initialize Database & Seed Data**:
   In a new terminal, run:
   ```bash
   # Create migrations
   docker-compose exec backend python manage.py makemigrations
   docker-compose exec backend python manage.py migrate

   # Seed the database with a 20-generation family tree
   docker-compose exec backend python manage.py seed_data
   ```

4. **Access the app**:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:8000/api/](http://localhost:8000/api/)

## Running Tests
To run the core logic tests:
```bash
docker-compose exec backend python manage.py test
```

## Time Log
| Task | Description | Time Spent |
| :--- | :--- | :--- |
| **Project Initialization** | Docker setup, Django/Vite boilerplate, configuration | 0.5h |
| **Backend Development** | Person model, recursive tree API, root ascendant logic | 2.0h |
| **Frontend Development** | Tailwind UI, search, tree visualization, API integration | 3.0h |
| **Data & Testing** | Seeding script for deep trees, unit tests for core logic | 1.0h |
| **Total** | | **7.0 hours** |
