FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY vitest.config.integration.js ./
COPY tests ./tests

RUN mkdir -p /app/results

# Wait for API health then run vitest; exit with vitest's code so Docker reports pass/fail
# JUnit XML + console log written to mounted volume for CI / host access
CMD ["bash", "-c", " \
  until curl -sf \"http://${API_HOST}:${API_PORT}/health\"; do echo 'Waiting for API...'; sleep 2; done && \
  npx vitest run --config vitest.config.integration.js 2>&1 | tee /app/results/output.txt; \
  exit ${PIPESTATUS[0]} \
  "]
