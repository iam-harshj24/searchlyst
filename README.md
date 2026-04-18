# Searchlyst

Searchlyst is an AI-powered SEO and brand intelligence platform. The stack is a React/Vite frontend, a Node.js/Express backend API, and a PostgreSQL database — all orchestrated with Docker Compose.

---

## Dev Requirements

| Requirement | Notes |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Runs all containers |
| `make` | Orchestrates all commands (pre-installed on macOS/Linux) |
| `curl` | Used by health-check scripts (pre-installed on macOS) |

No local Node.js install is required to run containers. Node is only needed if you want to run the frontend or backend directly outside of Docker.

---

## First-time Setup

Copy the example env file and fill in the required values:

```bash
cp backend/.env.example backend/.env   # if an example exists, otherwise edit backend/.env directly
```

At minimum, set `JWT_SECRET` in `backend/.env`. The database connection is pre-configured for the Docker Compose Postgres service and does not need to change for local dev.

---

## Running the App

### Start all containers

```bash
make up
```

Builds images for the database, API, and UI, starts them in the background, and waits until the API is healthy.

| Service | URL |
|---|---|
| Frontend (UI) | http://localhost:5173 |
| Backend (API) | http://localhost:3000 |

### Stop all containers

```bash
make down
```

### Tail logs

```bash
make logs
```

### Rebuild images (without starting)

```bash
make build-app
```

---

## Running Integration Tests

Integration tests run against a dedicated, isolated test stack (separate DB on port `5432` and API on port `3001`) that is created and torn down automatically.

### Full cycle — build, start, test, teardown

```bash
make buildup-it
```

This will:
1. Build the test API and test runner images
2. Start `searchlyst-db-test` and `searchlyst-api-test`
3. Wait for the test API to be healthy
4. Run the integration test suite inside the `searchlyst-integration-tests` container
5. Stop the test containers

Test artifacts are written to `.appdata/integrationtests/`:

| Artifact | Path |
|---|---|
| JUnit XML | `.appdata/integrationtests/junit.xml` |
| Console output | `.appdata/integrationtests/output.txt` |

### Tear down test containers manually

```bash
make down-it
```

### Full cleanup (removes images and volumes for test stack)

```bash
make clean-it
```
