# Database Migrations

Alembic is configured for database migrations. To create and run migrations:

## Create Initial Migration

```bash
cd backend
alembic revision --autogenerate -m "Initial schema: users, rooms, messages"
```

## Review Migration

Check the generated migration file in `alembic/versions/` and adjust if needed.

## Apply Migration

```bash
alembic upgrade head
```

## Rollback Migration

```bash
alembic downgrade -1
```

## With Docker

```bash
docker-compose exec backend alembic revision --autogenerate -m "Initial schema"
docker-compose exec backend alembic upgrade head
```

