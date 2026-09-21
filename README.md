# ShipSure AI

**Detect · Verify · Resolve · Learn**

ShipSure AI is an AI-assisted shipping document verification platform developed for the SDOC Hackathon. It helps shipping operations teams triage incoming emails, extract Shipping Instruction (SI) and Bill of Lading (BL) data, detect discrepancies across mandatory fields, explain the evidence behind each decision, and route uncertain cases for human review.

> **Official verification rule:** the Shipping Instruction (SI) is treated as the source of truth when comparing it with the draft Bill of Lading (BL).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Verification Scope](#verification-scope)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Official SDOC Docker Setup](#official-sdoc-docker-setup)
- [Local Dataset Setup](#local-dataset-setup)
- [Production Build](#production-build)
- [Docker Setup](#docker-setup)
- [Railway Deployment](#railway-deployment)
- [Evaluation and Scoring](#evaluation-and-scoring)
- [Useful Commands](#useful-commands)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Future Extension](#future-extension)

---

## Project Overview

Shipping operations teams receive large volumes of emails containing Shipping Instructions, draft Bills of Lading, invoice queries, general operational messages, and spam.

Manually identifying which emails require document verification and comparing SI and BL values line by line is repetitive and error-prone.

ShipSure AI provides one workflow for:

1. Inbox classification
2. SI / BL document extraction
3. Seven-field deterministic verification
4. Mismatch detection
5. Evidence-based explanations
6. Human review for uncertain cases
7. Multi-agent case investigation
8. Evaluation and submission generation

The system follows a **zero-guess policy**: when a value is missing, unreadable, or cannot be compared confidently, the case is routed to human review instead of silently inventing a value.

---

## Core Features

### Intelligent Inbox

Incoming emails are classified into the official SDOC categories:

- `BL_COMPARISON`
- `SI_REQUEST`
- `INVOICE_QUERY`
- `GENERAL`
- `SPAM`

Only relevant BL comparison requests continue into the document verification workflow.

### SI ↔ BL Verification

ShipSure extracts and compares the required fields from the Shipping Instruction and draft Bill of Lading.

Possible verification outcomes:

- `OK`
- `MISMATCH`
- `NEEDS_REVIEW`

### Evidence and Explainability

Operators can inspect supporting evidence such as:

- extracted raw values
- normalized values
- confidence information
- supporting text snippets
- field-level comparison results

### Human Review

Cases with missing attachments, unreadable content, missing values, or uncertain extraction can be escalated for human review.

### Multi-Agent Operations War Room

Specialized agents help investigate cases, explain discrepancies, inspect review requirements, and support resolution workflows using the selected shipment's real case data.

### Evaluation and Scoring

ShipSure can generate predictions in the official submission format and, when connected to the official SDOC Docker API, submit them to the scoring endpoint.

---

## Verification Scope

The official BL comparison workflow checks exactly seven mandatory fields:

1. `shipper`
2. `consignee`
3. `notify_party`
4. `port_of_loading`
5. `port_of_discharge`
6. `container_count`
7. `gross_weight_kg`

The **Shipping Instruction is the source of truth**.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Recharts

### Backend

- Node.js
- Express
- TypeScript
- Gemini API
- PDF / Word / spreadsheet document processing
- Deterministic normalization and comparison services

### Infrastructure

- Docker
- Docker Compose
- Official SDOC Docker API
- Railway for cloud demo deployment

---

## Project Structure

A simplified project structure is shown below:

```text
ShipSure-AI/
├── data/
│   └── baseline-processed-email-cases.json
│
├── datasets/
│   └── sdoc-hackathon-docker/
│       ├── data_v2/
│       ├── server/
│       ├── docker-compose.yml
│       └── README.md
│
├── runtime/
│   ├── agent-events.json
│   ├── existing-cases.json
│   └── processed-email-cases.json
│
├── server/
│   ├── contracts/
│   └── services/
│
├── src/
│   ├── components/
│   └── services/
│
├── server.ts
├── Dockerfile
├── package.json
├── .env.example
└── README.md
```

The shared baseline cache is stored at:

```text
data/baseline-processed-email-cases.json
```

The local SDOC dataset is stored at:

```text
datasets/sdoc-hackathon-docker/data_v2
```

---

## Prerequisites

For local development:

- **Node.js 22 recommended**
- npm
- Git
- Docker Desktop if using the official SDOC Docker API
- Gemini API key for AI-powered extraction and reasoning

Check the installations:

```bash
node --version
npm --version
git --version
docker --version
docker compose version
```

---

# Setup Instructions

## 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd ShipSure-AI
```

---

## 2. Install Dependencies

Use:

```bash
npm ci
```

If the project is being set up without a lockfile, use:

```bash
npm install
```

---

## 3. Configure Environment Variables

Copy the example environment file.

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

Open `.env` and configure the required values.

Example:

```env
PORT=3000

DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080

DATA_PATH=./datasets/sdoc-hackathon-docker/data_v2

GEMINI_API_KEY=your_real_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite

AUTO_PROCESS_NEW_EMAILS=false
INBOX_POLL_INTERVAL_MS=60000
REQUEST_TIMEOUT_MS=90000

ENABLE_REVISION_INTELLIGENCE=false
```

> Never commit the real `.env` file or API keys to Git.

---

## 4. Choose a Dataset Mode

ShipSure supports three dataset modes.

### `DEMO`

Synthetic frontend demo data.

```env
DATA_SOURCE=DEMO
```

### `LOCAL`

Reads the SDOC dataset directly from the local filesystem.

```env
DATA_SOURCE=LOCAL
DATA_PATH=./datasets/sdoc-hackathon-docker/data_v2
```

### `DOCKER`

Connects to the official SDOC Docker API.

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080
```

For **official evaluation and scoring**, use `DOCKER`.

---

## 5. Start ShipSure

From the project root:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

---

# Official SDOC Docker Setup

Use this mode when you want ShipSure to interact with the official SDOC dataset API and scoring endpoint.

From the ShipSure project root:

```bash
cd datasets/sdoc-hackathon-docker
```

Start the organizer Docker service:

```bash
docker compose up --build
```

The official API should be available at:

```text
http://localhost:8080
```

Test it:

```text
http://localhost:8080/health
```

Then return to the ShipSure root:

```bash
cd ../..
```

Configure `.env`:

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080
```

Start ShipSure:

```bash
npm run dev
```

ShipSure will run at:

```text
http://localhost:3000
```

The architecture is:

```text
Browser
   │
   ▼
ShipSure
localhost:3000
   │
   ▼
Official SDOC API
localhost:8080
```

---

# Local Dataset Setup

If the official Docker API is not required, ShipSure can read the dataset directly from:

```text
datasets/sdoc-hackathon-docker/data_v2
```

Configure:

```env
DATA_SOURCE=LOCAL
DATA_PATH=./datasets/sdoc-hackathon-docker/data_v2
```

Then start:

```bash
npm run dev
```

This mode is useful for development and cloud demos.

> Official scoring through `/submit` requires `DATA_SOURCE=DOCKER`.

---

# Production Build

Run the TypeScript check:

```bash
npm run lint
```

Build the frontend and backend:

```bash
npm run build
```

Set:

```env
NODE_ENV=production
```

Then start the production server:

```bash
npm start
```

The application will be served by the Express backend using the generated `dist/` build.

---

# Docker Setup

The project includes a root Dockerfile.

Build the ShipSure image:

```bash
docker build -t shipsure-ai .
```

For a standalone container using the dataset bundled inside the image:

```bash
docker run --rm \
  -p 3000:3000 \
  --env-file .env \
  -e NODE_ENV=production \
  -e DATA_SOURCE=LOCAL \
  -e DATA_PATH=/app/datasets/sdoc-hackathon-docker/data_v2 \
  shipsure-ai
```

On Windows PowerShell:

```powershell
docker run --rm `
  -p 3000:3000 `
  --env-file .env `
  -e NODE_ENV=production `
  -e DATA_SOURCE=LOCAL `
  -e DATA_PATH=/app/datasets/sdoc-hackathon-docker/data_v2 `
  shipsure-ai
```

Open:

```text
http://localhost:3000
```

### ShipSure Container + Official Docker API

When ShipSure itself runs inside Docker while the official SDOC API runs on Docker Desktop on the host machine, `localhost:8080` points back to the ShipSure container.

Use:

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://host.docker.internal:8080
```

For a shared Docker Compose network, use the service hostname configured by the Compose file instead.

---

# Railway Deployment

Railway can build ShipSure directly from the root `Dockerfile`.

## Recommended Preliminary-Round Deployment

For the public cloud demo, use the bundled local dataset:

```env
NODE_ENV=production

DATA_SOURCE=LOCAL
DATA_PATH=/app/datasets/sdoc-hackathon-docker/data_v2

GEMINI_API_KEY=<RAILWAY_SECRET>
GEMINI_MODEL=gemini-3.1-flash-lite

AUTO_PROCESS_NEW_EMAILS=false
INBOX_POLL_INTERVAL_MS=60000
REQUEST_TIMEOUT_MS=90000

ENABLE_REVISION_INTELLIGENCE=false
```

### Railway Steps

1. Push the latest ShipSure code to GitHub.
2. Create a Railway project.
3. Select **Deploy from GitHub Repo**.
4. Select the ShipSure repository.
5. Railway should detect the root `Dockerfile`.
6. Add the environment variables above under **Variables**.
7. Deploy the service.
8. Open **Settings → Networking → Generate Domain**.
9. Test the generated public URL.

Do not hardcode `PORT` for Railway unless required. The ShipSure backend reads:

```ts
process.env.PORT
```

and falls back to `3000` locally.

Verify the deployment with:

```text
https://<YOUR-RAILWAY-DOMAIN>/api/health
```

The expected dataset configuration for the simplified cloud deployment is:

```text
DATA_SOURCE=LOCAL
DATA_PATH=/app/datasets/sdoc-hackathon-docker/data_v2
```

The official SDOC scoring server can remain local for preliminary evaluation.

---

# Evaluation and Scoring

For official scoring:

1. Start the official SDOC Docker service.
2. Run ShipSure with:

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080
```

3. Open **Evaluation & Scoring** in ShipSure.
4. Generate the submission from the complete dataset.
5. Submit the prediction to the official scoring API.

The backend proxies official submissions to:

```text
POST /submit
```

through the configured SDOC Docker API.

ShipSure application logic must never use `ground_truth.json` to generate predictions.

---

# Useful Commands

| Command | Purpose |
|---|---|
| `npm ci` | Install project dependencies |
| `npm run dev` | Start local development server |
| `npm run lint` | Run TypeScript validation |
| `npm run build` | Build frontend and backend |
| `npm start` | Start production server |
| `docker build -t shipsure-ai .` | Build ShipSure Docker image |
| `docker compose up --build` | Start a Compose environment |
| `docker compose down` | Stop Compose services |

---

# Troubleshooting

## ShipSure opens but no cases appear

Confirm the active data source using:

```text
http://localhost:3000/api/health
```

For local mode, confirm:

```env
DATA_SOURCE=LOCAL
DATA_PATH=./datasets/sdoc-hackathon-docker/data_v2
```

For Docker mode, confirm:

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080
```

---

## Docker API is unreachable

Check that the organizer Docker service is running:

```bash
docker ps
```

Then open:

```text
http://localhost:8080/health
```

---

## Settings returns to DEMO mode

Verify the real backend configuration at:

```text
http://localhost:3000/api/config
```

---

## Gemini features are unavailable

Check that `.env` contains:

```env
GEMINI_API_KEY=your_real_key
```

Then restart ShipSure.

Never expose this key in frontend code or commit it to Git.

---

## Railway deployment cannot find the dataset

The correct container path is:

```text
/app/datasets/sdoc-hackathon-docker/data_v2
```

Use:

```env
DATA_SOURCE=LOCAL
DATA_PATH=/app/datasets/sdoc-hackathon-docker/data_v2
```

The shared 520-case baseline is expected at:

```text
/app/data/baseline-processed-email-cases.json
```

---

# Security Notes

- Never commit `.env`.
- Never commit real API keys.
- Keep Gemini credentials server-side.
- Do not expose the official ground-truth file to application logic.
- Do not use `ground_truth.json` for classification, extraction, verification, or prediction generation.
- Keep experimental features disabled during official evaluation unless explicitly required.

---

# Future Extension

ShipSure contains experimental **Version Intelligence** support for future BL revision workflows.

It can be controlled using:

```env
ENABLE_REVISION_INTELLIGENCE=false
```

The feature is disabled by default for the official SDOC evaluation workflow.

---

## Demo

Add the preliminary-round demo link here once available:

```text
https://shipsure-ai-4.onrender.com/
```

---

## Team

**Team:** `PentaQueens`

**Project:** ShipSure AI

**Tagline:** Detect · Verify · Resolve · Learn
