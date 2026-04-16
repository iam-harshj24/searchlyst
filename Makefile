.PHONY: up down logs build-app wait-app-api buildup-it wait-api down-it clean-it ci-dirs

# Enable Docker BuildKit for better caching and performance
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# ============================================================================
# APP STACK  (db + api + ui)
# ============================================================================

# Build and start the full app stack in the background
up:
	docker compose build db searchlyst-api searchlyst-ui
	docker compose up -d db searchlyst-api searchlyst-ui
	$(MAKE) wait-app-api
	@echo ""
	@echo "=== App is running ==="
	@echo "  UI  : http://localhost:5173"
	@echo "  API : http://localhost:3000"

# Stop the app stack
down:
	docker compose stop searchlyst-ui searchlyst-api db

# Tail logs for all app services
logs:
	docker compose logs -f db searchlyst-api searchlyst-ui

# Re-build images without starting
build-app:
	docker compose build db searchlyst-api searchlyst-ui

# Wait for the app API to be healthy
wait-app-api:
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do \
	  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then echo "API ready"; exit 0; fi; \
	  echo "Waiting for API... ($$i/30)"; sleep 2; \
	done; echo "API did not become ready"; exit 1

# ============================================================================
# INTEGRATION TESTS (full cycle: build, start, test, teardown)
# ============================================================================

# Full cycle: build, start, test, teardown. Results in .appdata/integrationtests/
buildup-it: ci-dirs
	docker compose build searchlyst-api-test searchlyst-integration-tests
	docker compose up -d searchlyst-db-test searchlyst-api-test
	$(MAKE) wait-api
	docker compose run --rm searchlyst-integration-tests
	docker compose stop searchlyst-api-test searchlyst-db-test
	@echo ""
	@echo "=== Test artifacts ==="
	@echo "  JUnit XML : .appdata/integrationtests/junit.xml"
	@echo "  Console   : .appdata/integrationtests/output.txt"

# Wait for test API health (used in buildup-it)
wait-api:
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do \
	  if curl -sf http://localhost:3001/health > /dev/null 2>&1; then echo "API ready"; exit 0; fi; \
	  echo "Waiting for API... ($$i/30)"; sleep 2; \
	done; echo "API did not become ready"; exit 1

# Tear down test containers
down-it:
	docker compose stop searchlyst-api-test searchlyst-db-test
	docker compose rm -f searchlyst-api-test searchlyst-db-test searchlyst-integration-tests

# Full cleanup: remove images and volumes for test stack
clean-it:
	docker compose rm -sf searchlyst-api-test searchlyst-db-test searchlyst-integration-tests
	docker volume rm -f searchlyst_searchlyst_test_pgdata 2>/dev/null || true

# Create required directories and stub files (for CI or first run)
ci-dirs:
	mkdir -p .appdata/integrationtests
	@test -f backend/.env || touch backend/.env
