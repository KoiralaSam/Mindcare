# Database URL for golang-migrate (override per environment).
# Example: postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=disable
# Override locally: export DATABASE_URL='postgres://...' or make migrate-up DATABASE_URL='...'
DATABASE_URL ?= postgres://postgres:postgres@localhost:5432/g7?sslmode=disable
MIGRATIONS_PATH ?= backend/migrations

.PHONY: migrate-up migrate-down migrate-version migrate-create

migrate-up:
	migrate -path $(MIGRATIONS_PATH) -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path $(MIGRATIONS_PATH) -database "$(DATABASE_URL)" down 1

migrate-version:
	migrate -path $(MIGRATIONS_PATH) -database "$(DATABASE_URL)" version

# Next sequential pair:  make migrate-create NAME=add_oauth_sessions
migrate-create:
	@if [ -z "$(NAME)" ]; then \
		echo 'Usage: make migrate-create NAME=<snake_case_description>' >&2; \
		exit 1; \
	fi
	migrate create -ext sql -dir $(MIGRATIONS_PATH) -seq $(NAME)
