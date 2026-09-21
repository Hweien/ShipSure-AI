# ShipSure AI

**Detect · Verify · Resolve · Learn**

ShipSure AI is an AI-assisted shipping document verification platform developed for the **Averis Hackathon**. It helps shipping operations teams classify incoming emails, extract Shipping Instruction (SI) and draft Bill of Lading (BL) data, compare mandatory shipment fields, explain discrepancies, and route uncertain cases to human review.

> **Official verification rule:** the Shipping Instruction (SI) is the source of truth when compared with the draft Bill of Lading (BL).

## Demo

**Live demo:** https://shipsure-ai-4.onrender.com/

**Team:** `PentaQueens`

---

## Table of Contents

- [Overview](#overview)
- [How ShipSure Works](#how-shipsure-works)
- [Core Features](#core-features)
- [Official Verification Rules](#official-verification-rules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Dataset Modes](#dataset-modes)
- [Official SDOC Docker Setup](#official-sdoc-docker-setup)
- [Render Deployment](#render-deployment)
- [Evaluation and Scoring](#evaluation-and-scoring)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Future Extension](#future-extension)

---

## Overview

Shipping operations teams handle high volumes of emails containing Shipping Instructions, draft Bills of Lading, invoice queries, general operational messages, and spam.

Manually identifying which emails require document verification and comparing SI and BL values line by line is repetitive and error-prone.

ShipSure AI combines:

- intelligent email classification
- SI / BL document extraction
- deterministic seven-field verification
- evidence-based discrepancy review
- zero-guess human escalation
- multimodal Vision OCR
- multi-agent case investigation
- evaluation and submission generation

The system follows a **zero-guess policy**: if required information is missing, unreadable, or cannot be verified confidently, the case is sent to human review instead of inventing a value.

---

## How ShipSure Works

```text
Incoming Email
     │
     ▼
Email Classification
     │
     ├── SI_REQUEST
     ├── INVOICE_QUERY
     ├── GENERAL
     ├── SPAM
     │
     └── BL_COMPARISON
              │
              ▼
      SI / Draft BL Identification
              │
              ▼
         Field Extraction
              │
              ▼
      Deterministic Normalization
              │
              ▼
       Seven-Field Comparison
              │
      ┌───────┼──────────┐
      ▼       ▼          ▼
     OK    MISMATCH  NEEDS_REVIEW
                          │
                          ▼
                     Human Review
```

Only `BL_COMPARISON` cases continue into the official SI ↔ BL verification workflow.

ShipSure uses a baseline processed-case cache plus runtime state. Runtime updates can override baseline entries for the same email during execution.

---

## Core Features

### Intelligent Inbox

Emails are classified into the five official SDOC categories:

- `BL_COMPARISON`
- `SI_REQUEST`
- `INVOICE_QUERY`
- `GENERAL`
- `SPAM`

### SI ↔ BL Verification

For BL comparison cases, ShipSure identifies the SI and draft BL, extracts the required fields, normalizes the values, and performs a deterministic comparison.

### Evidence and Explainability

The verification interface can show:

- original extracted values
- normalized values
- SI and BL evidence snippets
- confidence information
- field-level comparison status
- overall verification decision

### Human Review

Uncertain cases are routed to review when ShipSure encounters:

- `wrong_doc_type`
- `missing_attachment`
- `unreadable`
- `missing_value`

For `NEEDS_REVIEW` cases:

```text
has_defect = false
defect_fields = []
```

### Multimodal Vision OCR

ShipSure includes Gemini-powered Vision OCR support for difficult images and scans. The OCR workflow is designed to surface uncertainty instead of silently guessing unclear characters or values.

### Multi-Agent Operations War Room

The multi-agent interface supports case investigation, discrepancy explanation, review reasoning, resolution support, and operational coordination using selected shipment data.

### Analytics, Watchdog, and Audit

The application also includes operational analytics, monitoring views, and agent activity/audit information for tracing case processing and decisions.

### Evaluation and Scoring

ShipSure can generate predictions in the official submission structure and submit them to the organizer scoring API when connected to the official SDOC service.

---

## Official Verification Rules

### Seven Mandatory Fields

The official BL comparison workflow checks exactly:

1. `shipper`
2. `consignee`
3. `notify_party`
4. `port_of_loading`
5. `port_of_discharge`
6. `container_count`
7. `gross_weight_kg`

The **SI is always the source of truth**.

### Overall Status

ShipSure produces one of three outcomes:

- `OK`
- `MISMATCH`
- `NEEDS_REVIEW`

Decision logic:

```text
All 7 fields match
→ OK

At least 1 confirmed field difference
→ MISMATCH

Missing / unreadable / invalid comparison evidence
→ NEEDS_REVIEW
```

### Field-Level Status

Individual fields can be marked as:

- `EXACT_MATCH`
- `NORMALIZED_MATCH`
- `MISMATCH`
- `NEEDS_REVIEW`

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Recharts
- Motion

### Backend

- Node.js
- Express
- TypeScript
- Gemini API
- PDF processing with `pdf-parse`
- Word processing with `mammoth`
- spreadsheet processing with `exceljs`
- deterministic normalization and comparison services

### Infrastructure

- Docker
- Docker Compose
- official SDOC FastAPI service
- Render cloud deployment

---

## Project Structure

```text
ShipSure-AI/
├── data/
│   └── baseline-processed-email-cases.json
│
├── datasets/
│   └── sdoc-hackathon-docker/
│       ├── data_v2/
│       ├── server/
│       └── docker-compose.yml
│
├── runtime/
│   ├── agent-events.json
│   ├── existing-cases.json
│   └── processed-email-cases.json
│
├── server/
│   └── services/
│
├── src/
│   ├── components/
│   └── services/
│
├── cloud-data/
├── server.ts
├── Dockerfile
├── Dockerfile.inbox
├── package.json
├── .env.example
└── README.md
```

Important files:

```text
data/baseline-processed-email-cases.json
```

stores the bundled processed-case baseline.

```text
datasets/sdoc-hackathon-docker/data_v2
```

contains the local organizer dataset.

```text
Dockerfile.inbox
```

builds the participant-safe SDOC inbox API used for cloud deployment.

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Hweien/ShipSure-AI.git
cd ShipSure-AI
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Create `.env`

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

Recommended local Docker configuration:

```env
PORT=3000

DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080

GEMINI_API_KEY=your_real_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite

AUTO_PROCESS_NEW_EMAILS=false
INBOX_POLL_INTERVAL_MS=60000
REQUEST_TIMEOUT_MS=90000

ENABLE_REVISION_INTELLIGENCE=false
```

Never commit a real `.env` file or API key.

### 4. Start ShipSure

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

## Dataset Modes

ShipSure supports three dataset modes.

### `DEMO`

Uses synthetic/demo data.

```env
DATA_SOURCE=DEMO
```

### `LOCAL`

Reads the SDOC dataset directly from the filesystem.

```env
DATA_SOURCE=LOCAL
DATA_PATH=./datasets/sdoc-hackathon-docker/data_v2
```

### `DOCKER`

Reads dataset content through the official SDOC API.

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080
```

Use `DOCKER` mode when working with the organizer API or official scoring endpoint.

---

## Official SDOC Docker Setup

From the project root:

```bash
cd datasets/sdoc-hackathon-docker
docker compose up --build
```

The organizer API should be available at:

```text
http://localhost:8080
```

Test:

```text
http://localhost:8080/health
```

Return to the ShipSure root:

```bash
cd ../..
```

Configure ShipSure:

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080
```

Then run:

```bash
npm run dev
```

Local architecture:

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

If ShipSure itself runs inside Docker while the organizer API runs on the host, use:

```env
DATA_API_URL=http://host.docker.internal:8080
```

---

## Render Deployment

The cloud demo is deployed on **Render** using two services from the same repository.

```text
Render

ShipSure Web Service
Dockerfile
React + Express + Gemini
        │
        ▼
SDOC Inbox Service
Dockerfile.inbox
FastAPI + participant-safe dataset
```

### 1. SDOC Inbox Service

Create a Render service using:

```text
Dockerfile: ./Dockerfile.inbox
```

`Dockerfile.inbox`:

- uses Python 3.12
- installs the official SDOC API dependencies
- copies the organizer API code
- copies `cloud-data/` into `/data`
- exposes port `8000`

The inbox container uses:

```env
DATA_DIR=/data
GROUND_TRUTH=/secrets/ground_truth.json
REVEAL_GT=0
```

Do not place `ground_truth.json` inside `cloud-data/` or commit it to the public repository.

### 2. ShipSure Web Service

Create the main Render service using:

```text
Dockerfile: ./Dockerfile
```

Configure:

```env
NODE_ENV=production

DATA_SOURCE=DOCKER
DATA_API_URL=<YOUR_RENDER_INBOX_URL_OR_INTERNAL_ADDRESS>

GEMINI_API_KEY=your_real_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite

AUTO_PROCESS_NEW_EMAILS=false
INBOX_POLL_INTERVAL_MS=60000
REQUEST_TIMEOUT_MS=90000

ENABLE_REVISION_INTELLIGENCE=false
```

`DATA_PATH` is **not required** on the ShipSure Render service in this architecture because ShipSure reads data through `DATA_API_URL`.

Use either the inbox service's Render URL or the exact internal address provided by Render.

Set the ShipSure health check to:

```text
/api/health
```

Current public demo:

```text
https://shipsure-ai-4.onrender.com/
```

Health endpoint:

```text
https://shipsure-ai-4.onrender.com/api/health
```

### Cloud Scoring Note

`Dockerfile.inbox` intentionally does not copy private ground truth into the image.

Therefore, official `/submit` scoring requires private ground truth to be provided securely at runtime. For development and official scoring, use the local organizer Docker service unless a secure hosted scoring environment is required.

---

## Evaluation and Scoring

The Evaluation view builds the official submission structure from dataset emails and ShipSure prediction cases.

Example:

```json
{
  "category": "BL_COMPARISON",
  "status": "OK",
  "review_reason": null,
  "defect_fields": [],
  "has_defect": false
}
```

For official local scoring:

1. Start the organizer Docker API.
2. Configure:

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080
```

3. Start ShipSure.
4. Open **Evaluation & Scoring**.
5. Generate the submission.
6. Submit it to the organizer scoring endpoint.

ShipSure application logic must **never** read or use `ground_truth.json` to generate predictions.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Express server port. Defaults to `3000` locally. |
| `DATA_SOURCE` | `DEMO`, `LOCAL`, or `DOCKER`. |
| `DATA_API_URL` | Official SDOC API URL when using `DOCKER`. |
| `DATA_PATH` | Dataset filesystem path when using `LOCAL`. |
| `GEMINI_API_KEY` | Server-side Gemini API key. |
| `GEMINI_MODEL` | Gemini model used by AI-assisted features. |
| `AUTO_PROCESS_NEW_EMAILS` | Enables automatic inbox processing. |
| `INBOX_POLL_INTERVAL_MS` | Polling interval for automatic processing. |
| `REQUEST_TIMEOUT_MS` | Timeout for relevant API requests. |
| `ENABLE_REVISION_INTELLIGENCE` | Enables the experimental revision workflow. |

Recommended:

```env
GEMINI_MODEL=gemini-3.1-flash-lite
ENABLE_REVISION_INTELLIGENCE=false
```

---

## Troubleshooting

### No emails or cases appear

Check:

```text
http://localhost:3000/api/health
```

For local mode:

```env
DATA_SOURCE=LOCAL
DATA_PATH=./datasets/sdoc-hackathon-docker/data_v2
```

For Docker mode:

```env
DATA_SOURCE=DOCKER
DATA_API_URL=http://localhost:8080
```

### Organizer Docker API is unavailable

Run:

```bash
docker ps
```

Then test:

```text
http://localhost:8080/health
```

### Gemini features are unavailable

Confirm:

```env
GEMINI_API_KEY=your_real_key
```

Then restart ShipSure.

### Render ShipSure cannot reach the inbox service

Confirm:

- the inbox service deployed successfully from `Dockerfile.inbox`
- `cloud-data/` was included in the build
- `DATA_SOURCE=DOCKER`
- `DATA_API_URL` points to the real Render inbox address

---

## Security

- Never commit `.env` or real API keys.
- Keep Gemini credentials server-side.
- Never use `ground_truth.json` for classification, extraction, verification, or prediction generation.
- Keep participant-safe cloud data separate from private scoring labels.

The repository ignores:

```text
datasets/sdoc-hackathon-docker/data_v2/ground_truth.json
```

---

## Future Extension

ShipSure contains experimental **Version Intelligence** support for future BL revision workflows.

It is controlled by:

```env
ENABLE_REVISION_INTELLIGENCE=false
```

The feature is disabled by default and is not part of the official seven-field SDOC evaluation workflow.

---

## Team

**Team:** `PentaQueens`  
**Project:** ShipSure AI  
**Tagline:** Detect · Verify · Resolve · Learn
