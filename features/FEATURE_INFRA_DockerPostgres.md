# FEATURE_INFRA_DockerPostgres

## 1. Natural Language Description

### Current State
Currently, to run the application in development mode (`npm run dev`), developers need to:
1. Have PostgreSQL installed locally or running somewhere accessible
2. Manually configure `DATABASE_URL` in `.env.development`
3. Ensure the database exists and is running before starting development

This creates friction for new developers and inconsistent environments across team members.

### Expected End State
After this task, developers will have a streamlined workflow:
1. Run `npm run db:up` to start a PostgreSQL container with persistent data
2. Run `npm run db:migrate` to apply migrations
3. Run `npm run dev` to start the application

Data persists between container restarts via Docker volumes. Developers can reset to a clean database with `npm run db:reset`.

## 2. Technical Description

### Approach
Use Docker Compose to define a PostgreSQL service with:
- **Image:** `postgres:16-alpine` (lightweight, latest stable)
- **Named volume:** For data persistence across container restarts
- **Port mapping:** `5432:5432` for local access
- **Environment variables:** Preconfigured credentials for development

### Dependencies
- Docker Desktop (or Docker Engine + Docker Compose)
- No new npm dependencies required

### Integration Points
- `DATABASE_URL` in `.env.development` will point to the containerized PostgreSQL
- Existing Drizzle commands (`db:migrate`, `db:generate`) work unchanged
- E2E tests continue using TestContainers (separate, ephemeral database)

## 3. Files to Change/Create

### `docker-compose.yml` (CREATE)
**Objective:** Define the PostgreSQL service for local development with persistent storage.

**Pseudocode:**
```pseudocode
SERVICE postgres
  IMAGE: postgres:16-alpine
  CONTAINER_NAME: faviconforge-db
  ENVIRONMENT:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: faviconforge
  PORTS:
    - 5432:5432 (host:container)
  VOLUMES:
    - postgres_data:/var/lib/postgresql/data

VOLUME postgres_data
  PURPOSE: Persist database files between container restarts
```

---

### `package.json` (MODIFY)
**Objective:** Add npm scripts for database container lifecycle management.

**Pseudocode:**
```pseudocode
ADD scripts:
  "db:up"    -> docker compose up -d
               (Start PostgreSQL container in background)

  "db:down"  -> docker compose down
               (Stop container, preserve data volume)

  "db:reset" -> docker compose down -v && docker compose up -d
               (Destroy volume and recreate fresh database)
```

---

### `.env.development` (MODIFY)
**Objective:** Configure DATABASE_URL to point to the Docker container.

**Pseudocode:**
```pseudocode
SET DATABASE_URL = postgresql://postgres:postgres@localhost:5432/faviconforge

FORMAT: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
  USER:     postgres (matches POSTGRES_USER in docker-compose)
  PASSWORD: postgres (matches POSTGRES_PASSWORD in docker-compose)
  HOST:     localhost (container port mapped to host)
  PORT:     5432 (standard PostgreSQL port)
  DATABASE: faviconforge (matches POSTGRES_DB in docker-compose)
```

---

### `.env.example` (MODIFY)
**Objective:** Document the expected DATABASE_URL format for new developers.

**Pseudocode:**
```pseudocode
UPDATE DATABASE_URL comment:
  ADD example value for Docker setup
  ADD note about running db:up first
```

---

## 4. Verification Plan

Since this is infrastructure configuration, verification is manual:

### Test 1: Fresh Setup
**Preconditions:** No existing containers or volumes
**Steps:**
1. Run `npm run db:up`
2. Run `npm run db:migrate`
3. Run `npm run dev`
4. Navigate to `http://localhost:2025/health/db`
**Expected:** Returns `ok` (200)

### Test 2: Data Persistence
**Preconditions:** Test 1 completed, data exists in database
**Steps:**
1. Run `npm run db:down`
2. Run `npm run db:up`
3. Run `npm run dev`
4. Verify previous data still exists
**Expected:** Data persists after container restart

### Test 3: Clean Reset
**Preconditions:** Data exists in database
**Steps:**
1. Run `npm run db:reset`
2. Run `npm run db:migrate`
3. Run `npm run dev`
**Expected:** Database is empty (fresh state)

### Test 4: E2E Tests Unaffected
**Preconditions:** Docker container running
**Steps:**
1. Run `npm run test:e2e`
**Expected:** Tests pass using TestContainers (not the Docker Compose database)

---

## 5. Developer Workflow Summary

```
# First time setup
npm run db:up        # Start PostgreSQL container
npm run db:migrate   # Apply migrations
npm run dev          # Start development server

# Daily workflow
npm run db:up        # Ensure container is running (idempotent)
npm run dev          # Start development server

# Reset database
npm run db:reset     # Destroy and recreate fresh database
npm run db:migrate   # Apply migrations

# Stop everything
npm run db:down      # Stop container (data preserved)
```
