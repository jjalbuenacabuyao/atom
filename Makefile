# Atom — top-level development tasks.
.PHONY: dev-api dev-web test lint build up down

dev-api: ## Run the Go API with live reload on :8080
	$(MAKE) -C server dev

dev-web: ## Run the Angular dev server on :4200 (proxies /api to :8080)
	cd client && npm start

test: ## Run backend and frontend test suites
	$(MAKE) -C server test
	cd client && npm run test:ci

lint: ## Run linters
	$(MAKE) -C server lint
	cd client && npm run lint && npm run format:check

build: ## Production builds
	$(MAKE) -C server build
	cd client && npm run build

up: ## Start the full stack with Docker Compose
	docker compose up --build -d

down:
	docker compose down
