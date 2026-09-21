## Evaluation View

The Evaluation View uses the official SDOC Docker server for dataset access and evaluation.

### 1. Start the SDOC Docker Server

Open a terminal and navigate to the SDOC Docker directory:

```powershell
cd ".\datasets\sdoc-hackathon-docker"
```

Start the Docker services:

```powershell
docker compose up
```

### 2. Process the Provided Dataset

**Step 1:** Click **Process Real Dataset**

**Output:**
- `submission.json`
- Evaluation case review

**Step 2:** Click **Submit to Docker**

**Output:**
- **Stage-1 Macro F1**
- **Stage-3 Defect F1**
- **End-to-End Accuracy**
- **Composite Score**
