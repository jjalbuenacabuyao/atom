# Atom API — common development tasks.
GO ?= go
DATABASE_URL ?= postgres://atom:atom@localhost:5432/atom?sslmode=disable
TEST_DATABASE_URL ?= postgres://atom:atom@localhost:5432/atom_test?sslmode=disable

.PHONY: run dev build test test-unit lint fmt tidy

run: ## Run the API
	DATABASE_URL=$(DATABASE_URL) $(GO) run ./cmd/api

dev: ## Run the API with live reload (requires github.com/air-verse/air)
	DATABASE_URL=$(DATABASE_URL) air

build: ## Build a static binary into bin/
	CGO_ENABLED=0 $(GO) build -trimpath -ldflags="-s -w" -o bin/api ./cmd/api

test: ## Run all tests, including database integration tests
	TEST_DATABASE_URL=$(TEST_DATABASE_URL) $(GO) test -race -count=1 ./...

test-unit: ## Run unit tests only
	$(GO) test -race ./...

lint: ## Run static analysis
	$(GO) vet ./...
	golangci-lint run

fmt: ## Format code
	gofmt -s -w .

tidy:
	$(GO) mod tidy
