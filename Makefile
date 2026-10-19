.PHONY: help install dev build start test test-watch test-e2e \
	lint lint-fix check-types lint-check format codegen schema \
	db-generate db-migrate db-push db-studio seed-auth-user

help:
	@echo "StreamManager — single Next.js app"
	@echo ""
	@echo "Develop"
	@echo "  make install"
	@echo "  make dev             # next dev (webpack)"
	@echo "  make build"
	@echo "  make start"
	@echo ""
	@echo "Quality"
	@echo "  make lint"
	@echo "  make lint-fix"
	@echo "  make check-types"
	@echo "  make lint-check"
	@echo "  make format"
	@echo "  make test            # vitest (app + server layer)"
	@echo "  make test-watch"
	@echo "  make test-e2e        # playwright"
	@echo ""
	@echo "GraphQL"
	@echo "  make schema          # dump SDL to schema.graphql"
	@echo "  make codegen         # regenerate typed documents"
	@echo ""
	@echo "Database"
	@echo "  make db-generate"
	@echo "  make db-migrate"
	@echo "  make db-push"
	@echo "  make db-studio"
	@echo "  make seed-auth-user"

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

test:
	pnpm test

test-watch:
	pnpm test:watch

test-e2e:
	pnpm test:e2e

lint:
	pnpm lint

lint-fix:
	pnpm lint:fix

check-types:
	pnpm check:types

lint-check:
	pnpm lint:check

format:
	pnpm format

schema:
	pnpm schema:print

codegen:
	pnpm codegen

db-generate:
	pnpm db:generate

db-migrate:
	pnpm db:migrate

db-push:
	pnpm db:push

db-studio:
	pnpm db:studio

seed-auth-user:
	pnpm seed:auth-user
