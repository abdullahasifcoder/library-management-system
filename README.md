# Library Management System - DevOps Final Project

**Course:** CSC418 - DevOps for Cloud Computing  
**Instructor:** Dr. M. Hasanain Ch  
**Semester:** Spring 2026  

## Team Members

| Member | Reg No | Responsibility |
|--------|--------|---------------|
| Abdullah Asif | FA23-BCS-017 | Section C: Kubernetes & AKS Deployment |
| Waqas | FA23-BCS-167 | Section B: CI/CD Pipeline (GitHub Actions) |
| Abdul Hannan | FA23-BCS-013 | Section A: Containerization (Docker & Compose) |
| Ramzan | FA23-BCS-126 | Section D: Selenium Testing & Documentation |

## Project Overview

A 3-tier Library Management System with:
- **Frontend** - Node.js/Express serving static HTML (port 3000)
- **Backend** - Node.js/Express REST API (port 5000)
- **Database** - PostgreSQL with seed data (port 5432)

### Features
- Admin: Add/Edit/Delete books, manage categories, view analytics, borrow history
- User: Browse books, borrow/return books, search and filter
- Dark mode support, pagination, role-based access

## Project Structure

```
finalproject/
├── backend/           # Backend API (Node.js + Express + pg)
│   ├── Dockerfile
│   ├── server.js
│   ├── test.js
│   └── package.json
├── frontend/          # Frontend UI (Node.js + Express + static HTML)
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   └── public/
│       ├── index.html
│       ├── admin.html
│       └── user.html
├── database/          # Database (PostgreSQL)
│   ├── Dockerfile
│   └── init.sql
├── k8s/               # Kubernetes manifests
│   ├── postgres.yaml
│   ├── backend.yaml
│   └── frontend.yaml
├── selenium-tests/    # Selenium automated tests
│   ├── test_library.py
│   └── requirements.txt
├── .github/workflows/ # CI/CD Pipeline
│   └── ci-cd.yml
├── docker-compose.yml
├── init.sql
└── README.md
```

## Section A: Containerization

### Docker Images
Each service has its own Dockerfile:
- `backend/Dockerfile` - Node.js 18 Alpine
- `frontend/Dockerfile` - Node.js 18 Alpine
- `database/Dockerfile` - PostgreSQL 15 with init script

### Docker Compose
Run all services with:
```bash
docker-compose up --build -d
```

Services are connected via `library-network` and DB data persists via `pgdata` volume.

### Docker Hub Images
- `wdymabdu/frontend:FA23-BCS-017`
- `wdymabdu/backend:FA23-BCS-017`
- `wdymabdu/database:FA23-BCS-017`

## Section B: CI/CD Pipeline (GitHub Actions)

Pipeline runs on push to `main`/`dev` branches and on PRs to `main`.

### Stages:
1. **Build & Test** - Install deps, init DB, run backend API tests
2. **Docker Build & Push** - Build images and push to Docker Hub
3. **Deploy to AKS** - Apply K8s manifests to Azure Kubernetes Service

### Secrets Required:
- `DOCKERHUB_USERNAME` - Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token
- `AZURE_CREDENTIALS` - Azure service principal JSON

## Section C: Kubernetes (AKS)

### Create AKS Cluster
```bash
az group create --name DevOpsExamResourceGroup --location austriaeast
az aks create --resource-group DevOpsExamResourceGroup --name DevOpsExamCluster --node-count 1 --node-vm-size Standard_B2s_v2 --tier free --generate-ssh-keys
az aks get-credentials --resource-group DevOpsExamResourceGroup --name DevOpsExamCluster
```

**Live URL:** http://68.210.64.129

### Deploy to AKS
```bash
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

### Verify
```bash
kubectl get pods
kubectl get svc
```

The frontend is exposed via LoadBalancer with a public IP.

## Section D: Selenium Tests

### Setup
```bash
cd selenium-tests
pip install -r requirements.txt
```

### Run Tests
```bash
python test_library.py
```

### Test Cases:
1. Verify homepage loads with login form
2. Validate invalid login shows error
3. Validate admin login redirects to admin page
4. Validate user login redirects to user page

## How to Run Locally

1. Make sure Docker is installed and running
2. Clone the repo and run:
```bash
docker-compose up --build -d
```
3. Access the app at http://localhost:3000
4. Login credentials:
   - Admin: `admin` / `admin123`
   - User: `user1` / `user123`
