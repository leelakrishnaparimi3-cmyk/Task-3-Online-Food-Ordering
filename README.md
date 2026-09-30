# Online Food Ordering Platform

## Overview

This project demonstrates a containerized online food-ordering platform deployed using Docker Compose and automated through Jenkins.

The application consists of three services:

* **Nginx** — reverse proxy and entry point
* **Order API** — Node.js/Express REST API
* **PostgreSQL** — database for storing food orders

### Architecture

```text
Customer
   |
   v
 Nginx :8080
   |
   v
Order API :3000
   |
   v
PostgreSQL :5432
```

All services communicate through a Docker bridge network. The Order API connects to PostgreSQL using the Compose service name `db`, not `localhost`.

## Project Structure

```text
Task-3-Online-Food-Ordering/
├── app/
│   ├── package.json
│   └── server.js
├── nginx/
│   └── nginx.conf
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── compose.yaml
├── Jenkinsfile
└── README.md
```

## Technologies

* Node.js
* Express
* PostgreSQL 16
* Nginx
* Docker
* Docker Compose
* Jenkins
* Git/GitHub

## Environment Configuration

Copy `.env.example` to `.env` and configure the database and application values.

Important variables include:

```text
POSTGRES_DB=foodorders
POSTGRES_USER=fooduser
POSTGRES_PASSWORD=foodpassword

DB_HOST=db
DB_PORT=5432
DB_NAME=foodorders
DB_USER=fooduser
DB_PASSWORD=foodpassword

API_PORT=3000
NGINX_PORT=8080
```

The `.env` file is excluded from Git using `.gitignore`.

## Running Locally

Start the complete environment:

```powershell
docker compose up -d --build
```

Check the services:

```powershell
docker compose ps
```

The application is available through Nginx at:

```text
http://localhost:8080
```

## Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
```

Expected response:

```json
{
  "status": "UP",
  "database": "CONNECTED"
}
```

## Create an Order

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/orders" `
  -ContentType "application/json" `
  -Body '{"customer_name":"Leela","food_item":"Pizza","quantity":2}'
```

## Retrieve Orders

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8080/orders" `
  -Method Get
```

## Database Verification

Orders can be verified directly in PostgreSQL:

```powershell
docker compose exec -T db psql -U fooduser -d foodorders -c "SELECT id, customer_name, food_item, quantity, created_at FROM orders;"
```

## Persistent Storage

PostgreSQL uses the named Docker volume:

```text
food_orders_data
```

The volume is mounted at:

```text
/var/lib/postgresql/data
```

Application containers can be removed without deleting the database volume:

```powershell
docker compose down
```

The database data remains available when the environment is started again:

```powershell
docker compose up -d
```

## Jenkins Pipeline

The Jenkins pipeline performs the following steps:

1. Checkout source code from Git
2. Check Docker and Docker Compose
3. Validate Docker Compose configuration
4. Build the Order API image
5. Deploy PostgreSQL, Order API and Nginx
6. Wait for the application health endpoint
7. Create a test order
8. Retrieve orders through Nginx
9. Verify orders directly in PostgreSQL
10. Display container information and logs when the pipeline fails
11. Stop application containers while retaining the database volume

### Jenkins Job

```text
Task-3-Online-Food-Ordering
```

The Jenkins pipeline uses the system Docker Compose executable.

## Troubleshooting: Database Hostname

The Order API must connect to PostgreSQL using the Docker Compose service name:

```text
DB_HOST=db
```

Inside the `order-api` container, `localhost` refers to the Order API container itself. PostgreSQL is running in a separate container named `db`.

### Intentional Failure Test

To demonstrate the configuration problem, temporarily change:

```text
DB_HOST=db
```

to:

```text
DB_HOST=localhost
```

Run the Jenkins pipeline.

The Order API should be unable to connect to PostgreSQL because PostgreSQL is not running inside the Order API container.

The health check should therefore report that the database is not connected, and the Jenkins pipeline should fail during application verification.

### Correction

Restore:

```text
DB_HOST=db
```

Commit and push the correction, then run the Jenkins pipeline again.

The deployment should return to a healthy state.

## Cleanup

Stop and remove the application containers and network:

```powershell
docker compose down
```

The PostgreSQL named volume is retained.

To remove the database volume as well, use:

```powershell
docker compose down -v
```

**Warning:** removing the volume deletes the persisted PostgreSQL data.

## Conclusion

This project demonstrates a complete Dockerized online food-ordering environment with:

* REST API
* PostgreSQL persistence
* Nginx reverse proxy
* Docker networking
* Docker Compose orchestration
* Jenkins CI/CD automation
* Health verification
* Database verification
* Failure troubleshooting
* Persistent database storage
