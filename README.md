# CashFlash

[![Live Demo](https://img.shields.io/badge/Live%20Demo-https%3A%2F%2F13.238.125.86-brightgreen?style=for-the-badge&logo=google-chrome)](https://13.238.125.86)
[![AWS Lightsail](https://img.shields.io/badge/AWS-Lightsail%20(Sydney)-232F3E?style=for-the-badge&logo=amazon-aws)](https://13.238.125.86)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.2-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)

> **Live Application URL:** [https://13.238.125.86](https://13.238.125.86)  
> *Deployed on AWS Lightsail with automatic HTTPS via Caddy and Let's Encrypt.*

CashFlash is a full-stack digital wallet and payments application. It combines a React 19/Vite web client with Java 21 Spring Boot 4 microservices for wallet operations, payment methods, transactions, KYC, notifications, and PSP-backed card/bank-account verification.

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
| Main Spring Boot service | `CashflashBackend/cashflash-main-service` | `28080` |
| PSP Spring Boot service | `CashflashBackend/cashflash-psp-service` | `28082` |
| React/Vite frontend | `CashflashFrontend/frontend` | `25174` (next port if occupied) |
| Optional Python AI service | `CashflashFrontend/tools/ai` | `28001` |

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
PSP_BASE_URL=http://localhost:28082
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

Open the URL printed by Vite, normally `http://localhost:25174` (or `25175` if occupied).

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

## Temporary AWS demo deployment

See [`deploy/aws-demo/README.md`](deploy/aws-demo/README.md) for the AWS
Lightsail plan, Docker Compose setup, HTTPS, cost estimate, and teardown steps.

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
├── deploy/
│   └── aws-demo/
│       ├── Dockerfile.api
│       ├── Dockerfile.psp
│       ├── Dockerfile.web
│       ├── compose.yaml
│       ├── Caddyfile
│       └── mysql-init.sh
├── Profile pics/
├── .gitignore
├── .gitlab-ci.yml
└── README.md
```

## Security notes

Use GitLab CI/CD variables for credentials and deployment secrets. Rotate any credential immediately if it has ever been committed or exposed. The default values in application configuration are intended only for local development and must be replaced in shared or production environments.
