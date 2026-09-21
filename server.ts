import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { createHash } from "crypto";

import { compareRevision } from "./server/services/revisionEngine";
import { orchestrateCase } from "./server/services/orchestrator";
import { JsonAuditRepository } from "./server/services/auditRepository";
import { caseRepository } from "./server/services/caseRepository";
import { processEmailPipeline } from "./server/services/processingPipeline";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

// 50 MB is needed for base64 image/PDF payloads used by Vision OCR.
app.use(express.json({ limit: "50mb" }));

const auditRepository = new JsonAuditRepository();

type DataSourceMode = "DEMO" | "LOCAL" | "DOCKER";

type PipelineRunState = {
  running: boolean;
  total: number;
  processed: number;
  failed: number;
  skipped: number;
  currentEmailId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  failures: {
    emailId: string;
    error: string;
  }[];
};

const pipelineRunState: PipelineRunState = {
  running: false,
  total: 0,
  processed: 0,
  failed: 0,
  skipped: 0,
  currentEmailId: null,
  startedAt: null,
  finishedAt: null,
  failures: [],
};

const PROCESSING_VERSION =
  "pipeline-v1";

const RUNTIME_DIR =
  path.resolve(
    process.cwd(),
    "runtime"
  );

const PROCESSED_CACHE_FILE =
  path.join(
    RUNTIME_DIR,
    "processed-email-cases.json"
  );

const EXISTING_CASES_FILE =
  path.join(
    RUNTIME_DIR,
    "existing-cases.json"
  );

type ProcessedEmailEntry = {
  processedAt: string;
  fingerprint: string;
  processingVersion: string;
  case: any;
};

type ProcessedEmailCache =
  Record<
    string,
    ProcessedEmailEntry
  >;

let processedEmailCache:
  ProcessedEmailCache = {};

function createEmailFingerprint(
  email: any
): string {
  const source =
    JSON.stringify({
      emailId:
        email.email_id,
      from:
        email.from ||
        email.sender ||
        "",
      to:
        email.to ||
        email.recipient ||
        "",
      subject:
        email.subject ||
        "",
      body:
        email.body ||
        "",
      attachments:
        email.attachments ||
        [],
    });

  return createHash("sha256")
    .update(source)
    .digest("hex");
}

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
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https dataset URLs are allowed.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Dataset URL must not contain credentials.");
  }
  return parsed.toString().replace(/\/$/, "");
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller =
    new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(
  url: string,
  init?: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<any> {
  const response =
    await fetchWithTimeout(
      url,
      init,
      timeoutMs
    );

  const text =
    await response.text();

  if (!response.ok) {
    let details = text;

    try {
      const parsed =
        JSON.parse(text);

      details =
        parsed.error ||
        parsed.message ||
        text;
    } catch {
      // Keep raw response.
    }

    throw new Error(
      `${response.status} ${response.statusText}: ${details}`
    );
  }

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

async function internalPostJson<T>(
  route: string,
  body: unknown
): Promise<T> {
  return fetchJson(
    `http://127.0.0.1:${PORT}${route}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    90000
  ) as Promise<T>;
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

async function readAttachmentBuffer(attPath: string): Promise<Buffer> {
  if (!attPath.startsWith("attachments/")) {
    throw new Error("Attachment path must start with attachments/.");
  }

  if (serverConfig.dataSource === "DOCKER") {
    const upstream = await fetchWithTimeout(`${dockerBase()}/${attPath}`);
    if (!upstream.ok) {
      throw new Error(`${upstream.status} ${upstream.statusText}`);
    }
    return Buffer.from(await upstream.arrayBuffer());
  }

  if (serverConfig.dataSource === "LOCAL") {
    return fs.readFile(safeLocalAttachment(attPath));
  }

  throw new Error("Attachment loading from the backend is unavailable in DEMO mode.");
}

function extensionFromAttachment(attPath: string): string {
  return path.extname(attPath).toLowerCase();
}

async function saveProcessedEmailCache() {
  await fs.mkdir(
    RUNTIME_DIR,
    {
      recursive: true,
    }
  );

  const tempFile =
    `${PROCESSED_CACHE_FILE}.tmp`;

  await fs.writeFile(
    tempFile,
    JSON.stringify(
      processedEmailCache,
      null,
      2
    ),
    "utf8"
  );

  await fs.rename(
    tempFile,
    PROCESSED_CACHE_FILE
  );
}

async function loadProcessedState() {
  await fs.mkdir(
    RUNTIME_DIR,
    {
      recursive: true,
    }
  );

  // ----------------------------------
  // Load permanent processed cache
  // ----------------------------------
  try {
    const content =
      await fs.readFile(
        PROCESSED_CACHE_FILE,
        "utf8"
      );

    processedEmailCache =
      JSON.parse(content);

    for (
      const entry of
      Object.values(
        processedEmailCache
      )
    ) {
      if (entry?.case) {
        caseRepository.save(
          entry.case
        );
      }
    }

    console.log(
      `[Pipeline Cache] Loaded ${
        Object.keys(
          processedEmailCache
        ).length
      } cached emails`
    );
  } catch (error: any) {
    if (
      error?.code !==
      "ENOENT"
    ) {
      console.error(
        "[Pipeline Cache] Failed to load cache:",
        error
      );
    }
  }

  // ----------------------------------
  // One-time recovery of cases from
  // your current run
  // ----------------------------------
  try {
    const content =
      await fs.readFile(
        EXISTING_CASES_FILE,
        "utf8"
      );

    const existingCases =
      JSON.parse(content);

    if (
      Array.isArray(
        existingCases
      )
    ) {
      for (
        const shipmentCase of
        existingCases
      ) {
        if (
          shipmentCase?.id &&
          shipmentCase?.emailId &&
          !processedEmailCache[
            shipmentCase.emailId
          ]
        ) {
          caseRepository.save(
            shipmentCase
          );
        }
      }

      console.log(
        `[Pipeline Cache] Restored ${existingCases.length} existing cases`
      );
    }
  } catch (error: any) {
    if (
      error?.code !==
      "ENOENT"
    ) {
      console.error(
        "[Pipeline Cache] Existing-case restore failed:",
        error
      );
    }
  }
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
    if (typeof dataPath === "string" && dataPath.trim()) {
      serverConfig.dataPath = dataPath.trim();
    }
    if (typeof dataApiUrl === "string" && dataApiUrl.trim()) {
      serverConfig.dataApiUrl = validateHttpUrl(dataApiUrl.trim());
    }
    return res.json({ success: true, config: serverConfig });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// DS1 - Email classification
// ---------------------------------------------------------------------------
app.post("/api/ds1/classify-email", async (req, res) => {
  try {
    const email = req.body;

    if (!email || !email.email_id || !email.subject || !email.body) {
      return res.status(400).json({ error: "Invalid email input" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured" });
    }

    const prompt = `
You are the Inbox Intelligence Agent for ShipSure AI.

Classify ONE shipping operations email into exactly one category:
BL_COMPARISON, SI_REQUEST, INVOICE_QUERY, GENERAL, or SPAM.

Definitions:
- BL_COMPARISON: asks to check, compare, verify, validate, review, or confirm a draft Bill of Lading against a Shipping Instruction.
- SI_REQUEST: concerns submitting, requesting, creating, updating, or processing a Shipping Instruction, but not comparing SI against a draft BL.
- INVOICE_QUERY: primarily concerns invoices, billing, payment, charges, fees, or financial documentation.
- GENERAL: legitimate shipping/operational email that does not fit the categories above.
- SPAM: irrelevant, unsolicited, promotional, or non-operational content.

Rules:
- Consider subject, body, and attachment names together.
- Do not classify from keywords alone.
- A misleading subject must not override actual intent.
- Return exactly one category.
- Do not invent information.

Email ID: ${email.email_id}
From: ${email.from || email.sender || ""}
Subject: ${email.subject}
Body:
${email.body}

Attachments:
${JSON.stringify(email.attachments || [])}

Return ONLY valid JSON:
{
  "category": "BL_COMPARISON",
  "confidence": 0.95,
  "evidence": "Short explanation based on the email."
}`;

    let response: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        break;
      } catch (error: any) {
        if (error?.status === 503 && attempt < 3) {
          const delay = 5000 * attempt;
          console.log(
            `Gemini busy during email classification. Retry ${attempt}/3 in ${delay / 1000}s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    if (!response) throw new Error("Gemini did not return a response");

    const parsed = JSON.parse(response.text || "{}");
    const validCategories = [
      "BL_COMPARISON",
      "SI_REQUEST",
      "INVOICE_QUERY",
      "GENERAL",
      "SPAM",
    ];

    if (!validCategories.includes(parsed.category)) {
      throw new Error(`Invalid category returned: ${parsed.category}`);
    }

    return res.json({
      email_id: email.email_id,
      category: parsed.category,
      confidence: parsed.confidence,
      evidence: parsed.evidence,
    });
  } catch (error: any) {
    console.error(
      "Email classification error:",
      error
    );

    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Gemini email classification quota exceeded",
      });
    }

    if (error?.status === 503) {
      return res.status(503).json({
        success: false,
        error:
          "Gemini email classification temporarily unavailable",
      });
    }

    return res.status(500).json({
      success: false,
      error:
        "Email classification failed",
    });
  }
});

// ---------------------------------------------------------------------------
// DS1 - Read attachment content (TXT/XLSX/PDF/DOCX)
// ---------------------------------------------------------------------------
app.post("/api/ds1/read-document", async (req, res) => {
  try {
    const { path: attachmentPath } = req.body || {};
    if (!attachmentPath) {
      return res.status(400).json({ error: "Document path is required" });
    }

    const extension = extensionFromAttachment(attachmentPath);
    const data = await readAttachmentBuffer(attachmentPath);

    let content = "";
    let fileType = extension.replace(/^\./, "");

    if (extension === ".txt") {
      content = data.toString("utf8");
      fileType = "txt";
    } else if (extension === ".xlsx") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data as any);
      const lines: string[] = [];

      workbook.eachSheet((worksheet: any) => {
        worksheet.eachRow((row: any) => {
          const rowValues = Array.isArray(row.values)
            ? row.values.slice(1)
            : Object.values(row.values as object);
          const values = rowValues
            .map((value: any) => String(value ?? "").trim())
            .filter((value: string) => value.length > 0);
          if (values.length > 0) lines.push(values.join(" | "));
        });
      });

      content = lines.join("\n");
      fileType = "xlsx";
    } else if (extension === ".pdf") {
      fileType = "pdf";

      const parser = new PDFParse({
        data
      });

      try {
        const result =
          await parser.getText();

        content =
          result.text?.trim() || "";

        // A valid PDF with no extractable text
        // may be a scanned/image PDF.
        if (!content) {
          console.warn(
            `[Document Reader] PDF contains no extractable text: ${attachmentPath}`
          );
        }
      } catch (error: any) {
        console.warn(
          `[Document Reader] Unreadable PDF: ${attachmentPath} - ${error.message}`
        );

        // IMPORTANT:
        // Do not return HTTP 500.
        // Let the pipeline route this to Human Review.
        content = "";

        try {
          await parser.destroy();
        } catch {
          // Ignore cleanup failure.
        }

        return res.json({
          path: attachmentPath,
          fileType: "pdf",
          content: "",
          unreadable: true,
          readError:
            "invalid_pdf_structure"
        });
      }

      await parser.destroy();
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer: data });
      content = result.value;
      fileType = "docx";
    } else if ([".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
      // Image files are intentionally sent to the Vision OCR endpoint.
      content = "";
    } else {
      return res.status(400).json({ error: `Unsupported file type: ${extension}` });
    }

    return res.json({ path: attachmentPath, fileType, content });
  } catch (error: any) {
    console.error("Document reading error:", error);
    return res.status(500).json({ error: `Document reading failed: ${error.message}` });
  }
});

// ---------------------------------------------------------------------------
// DS1 - Identify SI and BL attachments
// ---------------------------------------------------------------------------
function identifyDocumentsFallback(
  attachments: string[],
  attachmentContents: any[]
) {
  return attachments.map((attachmentPath) => {
    const filename = attachmentPath
      .split(/[\\/]/)
      .pop()
      ?.toLowerCase() || "";

    const contentRecord = attachmentContents.find(
      (doc: any) => doc.path === attachmentPath
    );

    const content = String(
      contentRecord?.content || ""
    ).toLowerCase();

    let documentType:
      | "SI"
      | "BL"
      | "OTHER"
      | "UNKNOWN" = "UNKNOWN";

    let evidence =
      "No strong deterministic document marker found.";

    // Strong SI indicators
    if (
      content.includes("shipping instruction") ||
      filename.includes("_si.") ||
      filename.includes("-si.") ||
      filename.startsWith("si_")
    ) {
      documentType = "SI";
      evidence =
        "Identified by explicit Shipping Instruction marker in filename/content.";
    }

    // Strong BL indicators
    else if (
      content.includes("bill of lading") ||
      filename.includes("_bl.") ||
      filename.includes("-bl.") ||
      filename.includes("draft_bl") ||
      filename.includes("draft-bl")
    ) {
      documentType = "BL";
      evidence =
        "Identified by explicit Bill of Lading marker in filename/content.";
    }

    return {
      path: attachmentPath,
      documentType,

      // Conservative fallback score.
      // This is not treated as calibrated probability.
      confidence:
        documentType === "UNKNOWN"
          ? 0
          : 0.6,

      evidence:
        `[Deterministic fallback] ${evidence}`
    };
  });
}

app.post("/api/ds1/identify-documents", async (req, res) => {
  const {
    email,
    attachmentContents = []
  } = req.body || {};

  const attachments =
    email?.attachments || [];

  try {
    if (!email || !email.email_id) {
      return res.status(400).json({ error: "Invalid email input" });
    }

    const attachments = email.attachments || [];
    if (attachments.length === 0) return res.json([]);

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured" });
    }

    const prompt = `
You are the Document Identification Agent for ShipSure AI.

Identify each attachment as SI, BL, OTHER, or UNKNOWN.
Use the email subject, body, filename, and extracted attachment content.
Prioritize actual document content when it clearly identifies the document type.
Do not classify from one keyword alone. If evidence is insufficient or conflicting, return UNKNOWN.

Email ID: ${email.email_id}
Subject: ${email.subject || ""}
Body:
${email.body || ""}

Attachments:
${JSON.stringify(attachments)}

Extracted attachment contents:
${attachmentContents
  .map(
    (doc: any) => `\n--- ${doc.path} ---\n${(doc.content || "").slice(0, 12000)}\n`,
  )
  .join("\n")}

Return ONLY valid JSON as an array:
[
  {
    "path": "attachment filename exactly as provided",
    "documentType": "SI",
    "confidence": 0.95,
    "evidence": "Short explanation"
  }
]`;

    let response: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        break;
      } catch (error: any) {
        if (error?.status === 503 && attempt < 3) {
          const delay = 5000 * attempt;
          console.log(
            `Gemini busy during document identification. Retry ${attempt}/3 in ${delay / 1000}s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    if (!response) throw new Error("Gemini did not return a response");

    const parsed = JSON.parse(response.text || "[]");
    if (!Array.isArray(parsed)) throw new Error("Gemini did not return an array");

    const validTypes = ["SI", "BL", "OTHER", "UNKNOWN"];
    for (const document of parsed) {
      if (!validTypes.includes(document.documentType)) {
        throw new Error(`Invalid document type returned: ${document.documentType}`);
      }
    }

    return res.json(parsed);
  } catch (error: any) {
      console.error(
        "Document identification error:",
        error
      );

      // Gemini temporarily unavailable:
      // fall back to deterministic evidence.
      if (
        error?.status === 503 ||
        error?.status === 429
      ) {
        console.warn(
          "Gemini identification unavailable. " +
          "Using deterministic fallback."
        );

        const fallback =
          identifyDocumentsFallback(
            attachments,
            attachmentContents
          );

        return res.json(fallback);
      }

      return res.status(500).json({
        success: false,
        error:
          "Document identification failed"
      });
    }
});

// ---------------------------------------------------------------------------
// DS1 - Extract the seven fields from document text
// ---------------------------------------------------------------------------
app.post("/api/ds1/extract-fields", async (req, res) => {
  try {
    const { text, documentType } = req.body || {};
    if (!text || !["SI", "BL"].includes(documentType)) {
      return res.status(400).json({ error: "Valid text and documentType are required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured" });
    }

    const prompt = `
You are the Document Field Extraction Agent for ShipSure AI.

Extract exactly these 7 fields:
1. shipper
2. consignee
3. notify_party
4. port_of_loading
5. port_of_discharge
6. container_count
7. gross_weight_kg

Rules:
- Extract values VERBATIM exactly as they appear.
- Preserve spaces, punctuation, capitalization, symbols, and units.
- Do NOT normalize values.
- Do NOT convert units.
- Do NOT infer or guess missing values.
- If a field cannot be found, set raw to null.
- snippet must contain supporting document text.
- confidence must be between 0 and 1.

Document type: ${documentType}
Document:
${text}

Return ONLY valid JSON:
{
  "documentType": "${documentType}",
  "rawText": ${JSON.stringify(text)},
  "fields": {
    "shipper": { "raw": null, "confidence": 0, "snippet": "" },
    "consignee": { "raw": null, "confidence": 0, "snippet": "" },
    "notify_party": { "raw": null, "confidence": 0, "snippet": "" },
    "port_of_loading": { "raw": null, "confidence": 0, "snippet": "" },
    "port_of_discharge": { "raw": null, "confidence": 0, "snippet": "" },
    "container_count": { "raw": null, "confidence": 0, "snippet": "" },
    "gross_weight_kg": { "raw": null, "confidence": 0, "snippet": "" }
  },
  "unreadableFields": [],
  "extractionConfidence": 0
}`;

    let response: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        break;
      } catch (error: any) {
        if (error?.status === 503 && attempt < 3) {
          const delay = 5000 * attempt;
          console.log(
            `Gemini busy during field extraction. Retry ${attempt}/3 in ${delay / 1000}s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    if (!response) throw new Error("Gemini did not return a response");

    const parsed = JSON.parse(response.text || "{}");
    const requiredFields = [
      "shipper",
      "consignee",
      "notify_party",
      "port_of_loading",
      "port_of_discharge",
      "container_count",
      "gross_weight_kg",
    ];

    for (const field of requiredFields) {
      if (!parsed.fields || !(field in parsed.fields)) {
        throw new Error(`Missing extracted field: ${field}`);
      }
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error("Field extraction error:", error);
    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Gemini field extraction quota exceeded",
      });
    }
    return res.status(503).json({
      success: false,
      error: "Field extraction is temporarily unavailable",
    });
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
        names.map(async (name) =>
          JSON.parse(await fs.readFile(path.join(inboxDir, name), "utf8")),
        ),
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
    const body = await readAttachmentBuffer(attPath);
    const extension = extensionFromAttachment(attPath);
    const contentTypes: Record<string, string> = {
      ".txt": "text/plain; charset=utf-8",
      ".pdf": "application/pdf",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };
    res.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
    return res.send(body);
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
// Shipment case repository API
// ---------------------------------------------------------------------------
app.get("/api/cases", (_req, res) => {
  return res.json(caseRepository.getAll());
});

app.get("/api/cases/:id", (req, res) => {
  const shipmentCase = caseRepository.getById(req.params.id);
  if (!shipmentCase) {
    return res.status(404).json({ error: "Case not found" });
  }
  return res.json(shipmentCase);
});

app.post("/api/cases", (req, res) => {
  const shipmentCase = req.body;
  if (!shipmentCase?.id) {
    return res.status(400).json({ error: "ShipmentCase with id is required." });
  }
  const saved = caseRepository.save(shipmentCase);
  return res.status(201).json(saved);
});

app.post(
  "/api/pipeline/process/:emailId",
  async (req, res) => {
    try {
      const emailId = req.params.emailId;

      if (!/^email_[A-Za-z0-9_-]+$/i.test(emailId)) {
        return res.status(400).json({
          error: "Invalid email id",
        });
      }

      let email: any;

      if (serverConfig.dataSource === "DOCKER") {
        email = await fetchJson(
          `${dockerBase()}/emails/${encodeURIComponent(emailId)}`
        );
      } else if (serverConfig.dataSource === "LOCAL") {
        const file = path.join(
          localRoot(),
          "inbox",
          `${emailId}.json`
        );

        email = JSON.parse(
          await fs.readFile(file, "utf8")
        );
      } else {
        return res.status(409).json({
          error:
            "Pipeline processing requires LOCAL or DOCKER mode.",
        });
      }

      const force =
        req.query.force ===
        "true";

      const fingerprint =
        createEmailFingerprint(
          email
        );

      const cached =
        processedEmailCache[
          email.email_id
        ];

      if (
        !force &&
        cached &&
        cached.fingerprint ===
          fingerprint &&
        cached.processingVersion ===
          PROCESSING_VERSION
      ) {
        caseRepository.save(
          cached.case
        );

        console.log(
          `[Pipeline] Reused cached result for ${email.email_id}`
        );

        return res.json({
          success: true,
          cached: true,
          case: cached.case,
          events: [],
        });
      }

      const shipmentCase =
        await processEmailPipeline(
          email,
          internalPostJson
        );

      caseRepository.save(shipmentCase);

      processedEmailCache[
        email.email_id
      ] = {
        processedAt:
          new Date().toISOString(),

        fingerprint,

        processingVersion:
          PROCESSING_VERSION,

        case: shipmentCase,
      };

      await saveProcessedEmailCache();

      const events =
        orchestrateCase(shipmentCase);

      await auditRepository.append(events);

      return res.json({
        success: true,
        case: shipmentCase,
        events,
      });
    } catch (error: any) {
      console.error(
        "Pipeline processing failed:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Pipeline processing failed",
      });
    }
  }
);

async function processNewEmails():
  Promise<void> {

  if (
    pipelineRunState.running
  ) {
    return;
  }

  pipelineRunState.running =
    true;

  pipelineRunState.total = 0;
  pipelineRunState.processed = 0;
  pipelineRunState.failed = 0;
  pipelineRunState.skipped = 0;

  pipelineRunState.currentEmailId =
    null;

  pipelineRunState.startedAt =
    new Date().toISOString();

  pipelineRunState.finishedAt =
    null;

  pipelineRunState.failures = [];

  try {
    let emails: any[] = [];

    if (
      serverConfig.dataSource ===
      "DOCKER"
    ) {
      emails =
        await fetchJson(
          `${dockerBase()}/emails`
        );
    } else if (
      serverConfig.dataSource ===
      "LOCAL"
    ) {
      const inboxDir =
        path.join(
          localRoot(),
          "inbox"
        );

      const names =
        (
          await fs.readdir(
            inboxDir
          )
        )
          .filter(
            (name) =>
              /^email_.*\.json$/i.test(
                name
              )
          )
          .sort();

      emails =
        await Promise.all(
          names.map(
            async (name) =>
              JSON.parse(
                await fs.readFile(
                  path.join(
                    inboxDir,
                    name
                  ),
                  "utf8"
                )
              )
          )
        );
    } else {
      throw new Error(
        "Automatic pipeline requires LOCAL or DOCKER mode."
      );
    }

    pipelineRunState.total =
      emails.length;

    const queue: {
      email: any;
      fingerprint: string;
    }[] = [];

    // ----------------------------------
    // Decide which emails actually need
    // Gemini.
    // ----------------------------------
    for (
      const email of emails
    ) {
      const fingerprint =
        createEmailFingerprint(
          email
        );

      const cached =
        processedEmailCache[
          email.email_id
        ];

      // Already permanently cached
      if (
        cached &&
        cached.fingerprint ===
          fingerprint &&
        cached.processingVersion ===
          PROCESSING_VERSION
      ) {
        caseRepository.save(
          cached.case
        );

        pipelineRunState.skipped++;

        continue;
      }

      // --------------------------------
      // One-time migration:
      // case existed before we added
      // persistent caching.
      // --------------------------------
      const existingCase =
        caseRepository
          .getAll()
          .find(
            (item) =>
              item.emailId ===
              email.email_id
          );

      if (
        existingCase &&
        !cached
      ) {
        processedEmailCache[
          email.email_id
        ] = {
          processedAt:
            new Date()
              .toISOString(),

          fingerprint,

          processingVersion:
            PROCESSING_VERSION,

          case: existingCase,
        };

        pipelineRunState.skipped++;

        continue;
      }

      // New or changed email
      queue.push({
        email,
        fingerprint,
      });
    }

    if (
      pipelineRunState.skipped >
      0
    ) {
      await saveProcessedEmailCache();
    }

    console.log(
      `[Pipeline] Inbox total: ${emails.length}`
    );

    console.log(
      `[Pipeline] Already processed: ${pipelineRunState.skipped}`
    );

    console.log(
      `[Pipeline] New/changed: ${queue.length}`
    );

    // ----------------------------------
    // Only new/changed emails enter
    // Gemini / DS1 / DS2.
    // ----------------------------------
    for (
      let index = 0;
      index < queue.length;
      index++
    ) {
      const {
        email,
        fingerprint,
      } = queue[index];

      pipelineRunState.currentEmailId =
        email.email_id;

      console.log(
        `[Pipeline] New email ${index + 1}/${queue.length}: ${email.email_id}`
      );

      try {
        const shipmentCase =
          await processEmailPipeline(
            email,
            internalPostJson
          );

        caseRepository.save(
          shipmentCase
        );

        // Only mark as processed after
        // successful completion.
        processedEmailCache[
          email.email_id
        ] = {
          processedAt:
            new Date()
              .toISOString(),

          fingerprint,

          processingVersion:
            PROCESSING_VERSION,

          case: shipmentCase,
        };

        await saveProcessedEmailCache();

        const events =
          orchestrateCase(
            shipmentCase
          );

        await auditRepository.append(
          events
        );

        pipelineRunState.processed++;

        console.log(
          `[Pipeline] Completed ${email.email_id}`
        );
      } catch (error: any) {
        const message =
          error?.message ||
          "Unknown processing error";

        pipelineRunState.failed++;

        pipelineRunState
          .failures
          .push({
            emailId:
              email.email_id,
            error: message,
          });

        console.error(
          `[Pipeline] Failed ${email.email_id}: ${message}`
        );

        // IMPORTANT:
        // Don't burn more requests while
        // the quota window is exhausted.
        if (
          message.includes(
            "429"
          ) ||
          message
            .toLowerCase()
            .includes(
              "quota"
            )
        ) {
          console.warn(
            "[Pipeline] Gemini quota reached. Remaining emails will be retried on the next inbox check."
          );

          break;
        }
      }
    }
  } catch (error: any) {
    console.error(
      "[Pipeline] Inbox processing failed:",
      error
    );
  } finally {
    pipelineRunState.running =
      false;

    pipelineRunState.currentEmailId =
      null;

    pipelineRunState.finishedAt =
      new Date().toISOString();
  }
}

app.post(
  "/api/pipeline/process-new",
  (_req, res) => {
    if (
      pipelineRunState.running
    ) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "Inbox processing is already running.",
        });
    }

    void processNewEmails();

    return res
      .status(202)
      .json({
        success: true,
        message:
          "New-email processing started.",
      });
  }
);

app.get(
  "/api/pipeline/status",
  (_req, res) => {
    const completed =
      pipelineRunState.processed +
      pipelineRunState.failed +
      pipelineRunState.skipped;

    const progress =
      pipelineRunState.total > 0
        ? Math.round(
            (
              completed /
              pipelineRunState.total
            ) * 100
          )
        : 0;

    return res.json({
      ...pipelineRunState,
      completed,
      progress,

      cachedEmails:
        Object.keys(
          processedEmailCache
        ).length,

      totalCases:
        caseRepository
          .getAll()
          .length,
    });
  }
);

// ---------------------------------------------------------------------------
// CS1 orchestration and revision workflow
// ---------------------------------------------------------------------------
app.post(
  "/api/orchestration/run",
  async (req, res) => {
    try {
      const caseId =
        req.body?.caseId;

      if (!caseId) {
        return res
          .status(400)
          .json({
            error:
              "caseId is required.",
          });
      }

      const shipmentCase =
        caseRepository.getById(
          caseId
        );

      if (!shipmentCase) {
        return res
          .status(404)
          .json({
            error:
              "Shipment case not found.",
          });
      }

      const events =
        orchestrateCase(
          shipmentCase
        );

      await auditRepository.append(
        events
      );

      return res.json({
        success: true,
        caseId:
          shipmentCase.id,
        events,
      });
    } catch (error: any) {
      console.error(
        "Orchestration failed:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          error:
            error.message ||
            "Orchestration failed",
        });
    }
  }
);

app.get("/api/orchestration/events", async (req, res) => {
  try {
    return res.json(
      await auditRepository.list(
        req.query.caseId ? String(req.query.caseId) : undefined,
      ),
    );
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/revision/compare", (req, res) => {
  try {
    const { caseId, si, blV1, blV2 } = req.body || {};
    if (!caseId || !si || !blV1 || !blV2) {
      return res.status(400).json({
        error: "caseId, si, blV1 and blV2 are required.",
      });
    }
    return res.json(compareRevision(caseId, si, blV1, blV2));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Gemini Copilot integration
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

    return res.json({
      text: response.text,
      agent: agentId || "orchestrator",
      model: GEMINI_MODEL,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gemini request failed." });
  }
});

// ---------------------------------------------------------------------------
// DS1 Vision OCR - accepts uploaded base64 OR an official dataset attachment path
// ---------------------------------------------------------------------------
app.post("/api/vision/ocr", async (req, res) => {
  const {
    imageBase64,
    mimeType,
    docType,
    path: attachmentPath,
  } = req.body || {};

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
  }

  let visionBase64 = imageBase64 ? String(imageBase64) : "";
  let visionMimeType = mimeType ? String(mimeType) : "";

  try {
    if (!visionBase64 && attachmentPath) {
      const extension = extensionFromAttachment(String(attachmentPath));
      const mimeTypes: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
      };

      const detectedMimeType = mimeTypes[extension];
      if (!detectedMimeType) {
        return res.status(400).json({
          success: false,
          error: "Unsupported Vision OCR file type",
        });
      }

      const fileBuffer = await readAttachmentBuffer(String(attachmentPath));
      visionBase64 = fileBuffer.toString("base64");
      visionMimeType = detectedMimeType;
    }

    if (!visionBase64) {
      return res.status(400).json({
        error: "imageBase64 or an attachment path is required.",
      });
    }

    const cleanBase64 = visionBase64.replace(/^data:[^;]+;base64,/, "");
    const effectiveMimeType = visionMimeType || "image/png";

    const prompt = `
You are ShipSure's Multimodal Document Intelligence Agent.

Read this ${docType || "Shipping Instruction or Bill of Lading"} and extract exactly:
shipper, consignee, notify_party, port_of_loading, port_of_discharge,
container_count, gross_weight_kg.

Rules:
- Preserve raw values as written.
- Do not normalize values or convert units.
- Do not guess unreadable or missing characters.
- For each field return raw, confidence, and supporting snippet.
- If a field cannot be reliably read, return raw as null and confidence as 0.
- Record unclear fields in unreadableFields.

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: effectiveMimeType,
          },
        },
        prompt,
      ],
      config: { responseMimeType: "application/json" },
    });

    return res.json({
      success: true,
      source: GEMINI_MODEL,
      data: JSON.parse(response.text || "{}"),
    });
  } catch (error: any) {
    console.error("Gemini Vision OCR Error:", error);
    return res.status(500).json({
      error: error.message || "Vision extraction failed.",
    });
  }
});

// ---------------------------------------------------------------------------
// Official scoring proxy. Never fabricate a score if the scoring server is down.
// ---------------------------------------------------------------------------
app.post("/api/evaluation/submit", async (req, res) => {
  try {
    if (serverConfig.dataSource !== "DOCKER") {
      return res.status(409).json({
        error: "Switch DATA_SOURCE to DOCKER before submitting to the official scoring endpoint.",
      });
    }

    const submission = req.body?.submission ?? req.body;
    if (!submission || typeof submission !== "object" || Array.isArray(submission)) {
      return res.status(400).json({
        error: "submission must be an object keyed by email_id.",
      });
    }

    const result = await fetchJson(`${dockerBase()}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(502).json({
      error: `Official scoring server unavailable: ${error.message}`,
    });
  }
});

async function startServer() {
  await loadProcessedState();
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `ShipSure AI listening on 0.0.0.0:${PORT}`
      );

      if (
        process.env
          .AUTO_PROCESS_NEW_EMAILS ===
          "true"
      ) {
        const intervalMs =
          Number(
            process.env
              .INBOX_POLL_INTERVAL_MS ||
              60000
          );

        console.log(
          `[Pipeline] New-email watcher enabled (${intervalMs} ms)`
        );

        // First check after server is ready
        setTimeout(
          () => {
            void processNewEmails();
          },
          1500
        );

        // Continue checking inbox
        setInterval(
          () => {
            if (
              !pipelineRunState.running
            ) {
              void processNewEmails();
            }
          },
          intervalMs
        );
      }
    }
  );
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});