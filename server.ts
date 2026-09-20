import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { compareRevision } from "./server/services/revisionEngine";
import { orchestrateCase } from "./server/services/orchestrator";
import { JsonAuditRepository } from "./server/services/auditRepository";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

app.use(express.json({ limit: "15mb" }));

const auditRepository = new JsonAuditRepository();

type DataSourceMode = "DEMO" | "LOCAL" | "DOCKER";

let serverConfig: {
  dataSource: DataSourceMode;
  dataPath: string;
  dataApiUrl: string;
} = {
  dataSource: (process.env.DATA_SOURCE as DataSourceMode) || "DEMO",
  dataPath: process.env.DATA_PATH || "./data",
  dataApiUrl: process.env.DATA_API_URL || "http://localhost:8080",
};

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function validateHttpUrl(raw: string): string {
  const parsed = new URL(raw);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("Only http/https dataset URLs are allowed.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Dataset URL must not contain credentials.");
  }
  return parsed.toString().replace(/\/$/, "");
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const response = await fetchWithTimeout(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function dockerBase(): string {
  return validateHttpUrl(serverConfig.dataApiUrl);
}

function localRoot(): string {
  return path.resolve(serverConfig.dataPath);
}

function safeLocalAttachment(attPath: string): string {
  const root = path.resolve(localRoot(), "attachments");
  const relative = attPath.replace(/^attachments[\\/]/, "");
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) && target !== root) {
    throw new Error("Invalid attachment path.");
  }
  return target;
}

// ---------------------------------------------------------------------------
// Core health and configuration
// ---------------------------------------------------------------------------
app.get("/api/health", async (_req, res) => {
  let dataset: any = { mode: serverConfig.dataSource, status: "not_checked" };
  try {
    if (serverConfig.dataSource === "DOCKER") {
      dataset = { mode: "DOCKER", ...(await fetchJson(`${dockerBase()}/health`)) };
    } else if (serverConfig.dataSource === "LOCAL") {
      const inboxDir = path.join(localRoot(), "inbox");
      const files = await fs.readdir(inboxDir);
      dataset = {
        mode: "LOCAL",
        status: "ok",
        emails: files.filter((name) => /^email_.*\.json$/i.test(name)).length,
      };
    } else {
      dataset = { mode: "DEMO", status: "ok", note: "Frontend synthetic demo provider" };
    }
  } catch (error: any) {
    dataset = { mode: serverConfig.dataSource, status: "offline", error: error.message };
  }

  res.json({
    status: "ok",
    app: "ShipSure AI",
    version: "1.1.0-cs1",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: GEMINI_MODEL,
    config: serverConfig,
    dataset,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/config", (_req, res) => res.json(serverConfig));

app.post("/api/config", async (req, res) => {
  try {
    const { dataSource, dataPath, dataApiUrl } = req.body || {};
    if (dataSource && !["DEMO", "LOCAL", "DOCKER"].includes(dataSource)) {
      return res.status(400).json({ error: "Invalid dataSource." });
    }
    if (dataSource) serverConfig.dataSource = dataSource;
    if (typeof dataPath === "string" && dataPath.trim()) serverConfig.dataPath = dataPath.trim();
    if (typeof dataApiUrl === "string" && dataApiUrl.trim()) {
      serverConfig.dataApiUrl = validateHttpUrl(dataApiUrl.trim());
    }
    return res.json({ success: true, config: serverConfig });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Dataset adapter: official LOCAL bundle or official Docker HTTP interface.
// Ground truth is intentionally never read here.
// ---------------------------------------------------------------------------
app.get("/api/dataset/emails", async (_req, res) => {
  try {
    if (serverConfig.dataSource === "DOCKER") {
      return res.json(await fetchJson(`${dockerBase()}/emails`));
    }
    if (serverConfig.dataSource === "LOCAL") {
      const inboxDir = path.join(localRoot(), "inbox");
      const names = (await fs.readdir(inboxDir))
        .filter((name) => /^email_.*\.json$/i.test(name))
        .sort();
      const emails = await Promise.all(
        names.map(async (name) => JSON.parse(await fs.readFile(path.join(inboxDir, name), "utf8"))),
      );
      return res.json(emails);
    }
    return res.json([]);
  } catch (error: any) {
    return res.status(502).json({ error: `Dataset read failed: ${error.message}` });
  }
});

app.get("/api/dataset/emails/:emailId", async (req, res) => {
  try {
    const emailId = req.params.emailId;
    if (!/^email_[A-Za-z0-9_-]+$/i.test(emailId)) {
      return res.status(400).json({ error: "Invalid email id." });
    }
    if (serverConfig.dataSource === "DOCKER") {
      return res.json(await fetchJson(`${dockerBase()}/emails/${encodeURIComponent(emailId)}`));
    }
    if (serverConfig.dataSource === "LOCAL") {
      const file = path.join(localRoot(), "inbox", `${emailId}.json`);
      return res.json(JSON.parse(await fs.readFile(file, "utf8")));
    }
    return res.status(404).json({ error: "DEMO mode is served by the frontend demo provider." });
  } catch (error: any) {
    return res.status(502).json({ error: `Email read failed: ${error.message}` });
  }
});

app.get("/api/dataset/attachment", async (req, res) => {
  try {
    const attPath = String(req.query.path || "");
    if (!attPath.startsWith("attachments/")) {
      return res.status(400).json({ error: "Attachment path must start with attachments/." });
    }

    if (serverConfig.dataSource === "DOCKER") {
      const upstream = await fetchWithTimeout(`${dockerBase()}/${attPath}`);
      if (!upstream.ok) throw new Error(`${upstream.status} ${upstream.statusText}`);
      const body = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
      return res.send(body);
    }

    if (serverConfig.dataSource === "LOCAL") {
      return res.sendFile(safeLocalAttachment(attPath));
    }

    return res.status(404).json({ error: "DEMO attachments are served by the frontend demo provider." });
  } catch (error: any) {
    return res.status(502).json({ error: `Attachment read failed: ${error.message}` });
  }
});

app.get("/api/dataset/sample-submission", async (_req, res) => {
  try {
    if (serverConfig.dataSource === "DOCKER") {
      return res.json(await fetchJson(`${dockerBase()}/sample_submission`));
    }
    if (serverConfig.dataSource === "LOCAL") {
      const file = path.join(localRoot(), "sample_submission.json");
      return res.json(JSON.parse(await fs.readFile(file, "utf8")));
    }
    return res.status(404).json({ error: "No official sample submission in DEMO mode." });
  } catch (error: any) {
    return res.status(502).json({ error: `Sample submission read failed: ${error.message}` });
  }
});

// ---------------------------------------------------------------------------
// CS1 orchestration and revision workflow
// ---------------------------------------------------------------------------
app.post("/api/orchestration/run", async (req, res) => {
  try {
    const caseObj = req.body?.case;
    if (!caseObj?.id || !caseObj?.category) {
      return res.status(400).json({ error: "A valid ShipmentCase is required." });
    }
    const events = orchestrateCase(caseObj);
    await auditRepository.append(events);
    return res.json({ caseId: caseObj.id, events });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/orchestration/events", async (req, res) => {
  try {
    return res.json(await auditRepository.list(req.query.caseId ? String(req.query.caseId) : undefined));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/revision/compare", (req, res) => {
  try {
    const { caseId, si, blV1, blV2 } = req.body || {};
    if (!caseId || !si || !blV1 || !blV2) {
      return res.status(400).json({ error: "caseId, si, blV1 and blV2 are required." });
    }
    return res.json(compareRevision(caseId, si, blV1, blV2));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Gemini Copilot integration. Gemini explains/summarizes; deterministic modules
// should remain responsible for comparison and status decisions.
// ---------------------------------------------------------------------------
app.post("/api/copilot/chat", async (req, res) => {
  const { prompt, context, agentId, mode } = req.body || {};
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured.",
      fallback: true,
    });
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required." });
  }

  const roles: Record<string, string> = {
    verification: "Explain deterministic seven-field verification results. Do not invent values.",
    critic: "Explain reliability flags and why a case requires human review. Do not guess missing values.",
    revision: "Explain the supplied SI vs BL V1 vs BL V2 diff. Do not invent changes.",
    resolution: "Draft a correction request from supplied confirmed discrepancies. Require human approval before sending.",
    extraction: "Explain supplied document extraction evidence. Do not fabricate OCR output.",
    watchdog: "Summarize supplied operational patterns. Distinguish correlation from causation.",
    orchestrator: "Coordinate the supplied ShipSure case state and suggest the next workflow step.",
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${roles[agentId] || roles.orchestrator}\nMode: ${mode || "collaborative"}\n\nVerified system context:\n${JSON.stringify(context || {}, null, 2)}\n\nUser request:\n${prompt}\n\nOnly use facts present in the verified system context. If evidence is missing, say it requires review.`,
    });
    return res.json({ text: response.text, agent: agentId || "orchestrator", model: GEMINI_MODEL });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gemini request failed." });
  }
});

// DS1 integration endpoint: no fake OCR result when the AI service is absent.
app.post("/api/vision/ocr", async (req, res) => {
  const { imageBase64, mimeType, docType } = req.body || {};
  const ai = getGeminiClient();
  if (!ai) return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required." });

  try {
    const cleanBase64 = String(imageBase64).replace(/^data:[^;]+;base64,/, "");
    const prompt = `Extract the seven required shipping fields from this ${docType || "shipping document"}. Preserve raw evidence snippets. If a required value is unreadable or ambiguous, mark it for human review instead of guessing. Return JSON only.`;
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ inlineData: { data: cleanBase64, mimeType: mimeType || "image/png" } }, prompt],
      config: { responseMimeType: "application/json" },
    });
    return res.json({ success: true, source: GEMINI_MODEL, data: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Vision extraction failed." });
  }
});

// ---------------------------------------------------------------------------
// Official scoring proxy. Never fabricate a score if the scoring server is down.
// ---------------------------------------------------------------------------
app.post("/api/evaluation/submit", async (req, res) => {
  try {
    if (serverConfig.dataSource !== "DOCKER") {
      return res.status(409).json({ error: "Switch DATA_SOURCE to DOCKER before submitting to the official scoring endpoint." });
    }
    const submission = req.body?.submission ?? req.body;
    if (!submission || typeof submission !== "object" || Array.isArray(submission)) {
      return res.status(400).json({ error: "submission must be an object keyed by email_id." });
    }
    const result = await fetchJson(`${dockerBase()}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(502).json({ error: `Official scoring server unavailable: ${error.message}` });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ShipSure AI listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
