# CashFlash

CashFlash is a full-stack digital wallet and payments application. It combines a React/Vite web client with Java 21 Spring Boot services for wallet operations, payment methods, transactions, KYC, notifications, and PSP-backed card/bank-account verification.

## Features

- User registration, OTP verification, login, password reset, and PIN flows
- Wallet top-up, withdrawal, peer-to-peer transfers, transaction history, and audit logging
- Card and bank-account payment methods with a separate PSP service
- Payment requests, contacts, trusted contacts, notifications, and WebSocket updates
- KYC document upload and admin review workflows
- Merchant upgrade and admin dashboards
- Optional AI assistant for chat, recommendations, and voice-based send-money parsing

## Architecture

| Component | Location | Default port |
| --- | --- | ---: |
| Main Spring Boot service | `CashflashBackend/cashflash-main-service` | `8080` |
| PSP Spring Boot service | `CashflashBackend/cashflash-psp-service` | `8082` |
| React/Vite frontend | `CashflashFrontend/frontend` | `5173` |
| Optional Python AI service | `CashflashFrontend/tools/ai` | configured by environment |

The main service calls the PSP service for payment-method verification and balance operations. Both Java services use MySQL and externalized environment variables.

## Requirements

- Java 21
- Maven 3.9+ or the Maven Wrapper included in each backend service
- Node.js 22+ and npm
- MySQL 8+
- Python 3.11+ only when running the optional AI service
- Ollama and the configured local model only when using AI chat/recommendation features

## Local setup

### 1. Configure the backend

Create `CashflashBackend/.env` locally. This file is intentionally ignored by Git. At minimum, configure the database credentials, JWT secret, and PSP URL:

```properties
SPRING_DATASOURCE_MAIN_URL=jdbc:mysql://localhost:3306/cashflashdb?useSSL=false&serverTimezone=UTC
SPRING_DATASOURCE_MAIN_USERNAME=root
SPRING_DATASOURCE_MAIN_PASSWORD=change-me
SPRING_DATASOURCE_PSP_URL=jdbc:mysql://localhost:3306/cashflash_pspdb?useSSL=false&serverTimezone=UTC
SPRING_DATASOURCE_PSP_USERNAME=root
SPRING_DATASOURCE_PSP_PASSWORD=change-me
JWT_SECRET=replace-with-a-long-random-secret
PSP_BASE_URL=http://localhost:8082
```

Create the databases before starting the services:

```sql
CREATE DATABASE cashflashdb;
CREATE DATABASE cashflash_pspdb;
```

Do not commit real passwords, JWT secrets, API keys, KYC documents, or uploaded profile files.

### 2. Start the PSP service

```powershell
cd CashflashBackend/cashflash-psp-service
.\mvnw.cmd spring-boot:run
```

### 3. Start the main service

In a second terminal:

```powershell
cd CashflashBackend/cashflash-main-service
.\mvnw.cmd spring-boot:run
```

### 4. Start the frontend

In a third terminal:

```powershell
cd CashflashFrontend/frontend
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

### 5. Optional AI service

```powershell
cd CashflashFrontend/tools/ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python ai_chat_api.py
```

Configure the AI service environment separately and keep its `.env` file out of Git.

## Useful commands

From `CashflashFrontend/frontend`:

```powershell
npm run build
npm run lint
```

From either backend service directory:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

## GitLab CI/CD

The root [`.gitlab-ci.yml`](.gitlab-ci.yml) runs:

- GitLab SAST
- GitLab secret detection
- GitLab dependency scanning
- Maven build and tests for both Spring Boot services
- Frontend dependency installation, build, and lint

Security findings are published in GitLab’s pipeline and vulnerability views. Generated build output, local dependencies, environment files, bundled JDK files, and runtime uploads are excluded by [`.gitignore`](.gitignore).

### If a pipeline is stuck

A job marked **pending/stuck** usually means GitLab cannot assign it to a runner; this is different from a job that starts and then fails.

1. Open **Project → Settings → CI/CD → Runners**.
2. Confirm the project has an active runner that supports Docker/container jobs.
3. Confirm the runner is not paused, offline, locked to another project, or restricted by tags.
4. If the runner requires tags, add the same tag under `default: tags:` in `.gitlab-ci.yml`, or register/enable an untagged runner.
5. Retry the pipeline after the runner becomes online.

If the page says **no runners available**, the fix is project/group runner registration or enabling the Endava shared runner; changing JavaScript or Maven code will not resolve it. If a job starts and fails, open that job’s log—the remedy will be in the log rather than runner assignment.

## Repository layout

```text
CashFlash/
├── CashflashBackend/
│   ├── cashflash-main-service/
│   ├── cashflash-psp-service/
│   └── qodana.yaml
├── CashflashFrontend/
│   ├── frontend/
│   └── tools/ai/
├── Profile pics/
├── .gitignore
├── .gitlab-ci.yml
└── README.md
```

## Security notes

Use GitLab CI/CD variables for credentials and deployment secrets. Rotate any credential immediately if it has ever been committed or exposed. The default values in application configuration are intended only for local development and must be replaced in shared or production environments.
