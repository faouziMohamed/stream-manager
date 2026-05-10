.PHONY: dev build start format lint lint-fix check-types lint-check db-generate db-migrate db-push db-studio db-promote tsc

dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

format:
	pnpm format

lint:
	pnpm lint

lint-fix:
	pnpm lint:fix

check-types:
	pnpm check:types

lint-check:
	pnpm lint:check

db-generate:
	pnpm db:generate

db-migrate:
	pnpm db:migrate

db-push:
	pnpm db:push

db-studio:
	pnpm db:studio

db-promote:
	pnpm db:promote

tsc:
	pnpm tsc
