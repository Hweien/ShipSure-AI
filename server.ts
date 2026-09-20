import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Server configuration state
let serverConfig = {
  dataSource: process.env.DATA_SOURCE || "DEMO",
  dataPath: process.env.DATA_PATH || "./data",
  dataApiUrl: process.env.DATA_API_URL || "http://localhost:8080",
};

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "ShipSure AI",
    version: "1.0.0",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    config: serverConfig,
    timestamp: new Date().toISOString(),
  });
});

// Get Config
app.get("/api/config", (req, res) => {
  res.json(serverConfig);
});

// Update Config (e.g. switch to Local folder or Docker URL)
app.post("/api/config", (req, res) => {
  const { dataSource, dataPath, dataApiUrl } = req.body;
  if (dataSource) serverConfig.dataSource = dataSource;
  if (dataPath) serverConfig.dataPath = dataPath;
  if (dataApiUrl) serverConfig.dataApiUrl = dataApiUrl;
  res.json({ success: true, config: serverConfig });
});

// Email classification
app.post("/api/ds1/classify-email", async (req, res) => {
  try {
    const email = req.body;

    if (!email || !email.email_id || !email.subject || !email.body) {
      return res.status(400).json({
        error: "Invalid email input",
      });
    }

    const prompt = `
You are the Inbox Intelligence Agent for ShipSure AI.

Your task is to classify ONE shipping operations email into exactly one
of these categories:

BL_COMPARISON
SI_REQUEST
INVOICE_QUERY
GENERAL
SPAM

Definitions:

BL_COMPARISON:
The sender asks to check, compare, verify, validate, review, or confirm
a draft Bill of Lading (BL) against a Shipping Instruction (SI).

SI_REQUEST:
The email concerns submitting, requesting, creating, updating, or
processing a Shipping Instruction, but is not asking to compare an SI
against a draft BL.

INVOICE_QUERY:
The email primarily concerns invoices, billing, payment, charges,
fees, or financial documentation.

GENERAL:
A legitimate shipping or operational email that does not fit the
categories above.

SPAM:
Irrelevant, unsolicited, promotional, or non-operational content.

Rules:
- Consider the subject, body, and attachment names together.
- Do not classify based only on keywords.
- A misleading subject must not override the actual email intent.
- Return exactly one category.
- Do not invent information.

Email:

Email ID: ${email.email_id}
From: ${email.from || email.sender || ""}
Subject: ${email.subject}
Body:
${email.body}

Attachments:
${JSON.stringify(email.attachments || [])}

Return ONLY valid JSON in this exact structure:

{
  "category": "BL_COMPARISON",
  "confidence": 0.95,
  "evidence": "Short explanation based on the email."
}
`;

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured",
      });
    }

    let response;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        break;
      } catch (error: any) {
        // Retry only temporary Gemini availability errors
        if (error?.status === 503 && attempt < 3) {
          const delay = 5000 * attempt;

          console.log(
            `Gemini busy during email classification. Retry ${attempt}/3 in ${delay / 1000}s...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );

          continue;
        }

        throw error;
      }
    }

    if (!response) {
      throw new Error("Gemini did not return a response");
    }

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

  } catch (error) {
    console.error("Email classification error:", error);

    res.status(500).json({
      error: "Email classification failed",
    });
  }
});

// DS1 - Identify SI and BL attachments
app.post("/api/ds1/identify-documents", async (req, res) => {
  try {
    const { email, attachmentContents = [] } = req.body;

    if (!email || !email.email_id) {
      return res.status(400).json({
        error: "Invalid email input",
      });
    }

    const attachments = email.attachments || [];

    if (attachments.length === 0) {
      return res.json([]);
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured",
      });
    }

    const prompt = `
You are the Document Identification Agent for ShipSure AI.

Your task is to identify the document type of each attachment in a
shipping operations email.

Allowed document types:

SI
- Shipping Instruction

BL
- Bill of Lading or Draft Bill of Lading

OTHER
- A document that is clearly neither SI nor BL

UNKNOWN
- There is not enough information to determine the document type

Use all available evidence:
1. Email subject
2. Email body
3. Attachment filename
4. Extracted attachment content

Prioritize the actual document content when it clearly identifies the
document type. Filenames and email wording may be misleading.

Common SI evidence may include terms such as:
- Shipping Instruction
- Bill of Lading Instruction
- BL Instruction
- instructions supplied by the shipper for preparing the BL

Common BL evidence may include terms such as:
- Bill of Lading
- Draft Bill of Lading
- B/L
- carrier-issued draft shipping document

Do not classify a document from one keyword alone.
Use the overall document structure and context.

Do not guess.
If the available evidence is insufficient or conflicting, return UNKNOWN.

Email ID: ${email.email_id}
Subject: ${email.subject || ""}
Body:
${email.body || ""}

Attachments:
${JSON.stringify(attachments)}

Extracted attachment contents:
${attachmentContents
  .map(
    (doc: any) => `
--- ${doc.path} ---
${(doc.content || "").slice(0, 12000)}
`
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
]
`;

    let response;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        break;
      } catch (error: any) {
        // Retry only temporary Gemini availability errors
        if (error?.status === 503 && attempt < 3) {
          const delay = 5000 * attempt;

          console.log(
            `Gemini busy during document identification. Retry ${attempt}/3 in ${delay / 1000}s...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );

          continue;
        }

        throw error;
      }
    }

    if (!response) {
      throw new Error("Gemini did not return a response");
    }

    const parsed = JSON.parse(response.text || "[]");

    if (!Array.isArray(parsed)) {
      throw new Error("Gemini did not return an array");
    }

    const validTypes = ["SI", "BL", "OTHER", "UNKNOWN"];

    for (const document of parsed) {
      if (!validTypes.includes(document.documentType)) {
        throw new Error(
          `Invalid document type returned: ${document.documentType}`
        );
      }
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error("Document identification error:", error);

    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Gemini document identification quota exceeded",
      });
    }

    return res.status(503).json({
      success: false,
      error: "Document identification is temporarily unavailable",
    });
  }
});

// DS1 - Read attachment content
app.post("/api/ds1/read-document", async (req, res) => {
  try {
    const { path: attachmentPath } = req.body;

    if (!attachmentPath) {
      return res.status(400).json({
        error: "Document path is required",
      });
    }

    const attachmentsDir = path.resolve(
      process.cwd(),
      "datasets",
      "sdoc-hackathon-bundle",
      "attachments"
    );

    const cleanAttachmentPath = attachmentPath.startsWith("attachments/")
      ? attachmentPath.substring("attachments/".length)
      : attachmentPath;

    const filePath = path.resolve(
      attachmentsDir,
      cleanAttachmentPath
    );

    // Prevent reading files outside the attachments directory
    if (!filePath.startsWith(attachmentsDir + path.sep)) {
      return res.status(400).json({
        error: "Invalid document path",
      });
    }

    const extension = path.extname(filePath).toLowerCase();

    let content: string;
    let fileType: "txt" | "xlsx" | "pdf" | "doc" | "docx";

    if (extension === ".txt") {
      content = await fs.readFile(filePath, "utf-8");
      fileType = "txt";
    } else if (extension === ".xlsx") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const lines: string[] = [];

      workbook.eachSheet((worksheet) => {
        worksheet.eachRow((row) => {
          const rowValues = Array.isArray(row.values)
            ? row.values.slice(1)
            : Object.values(row.values);

          const values = rowValues
            .map((value) => String(value ?? "").trim())
            .filter((value) => value.length > 0);

          if (values.length > 0) {
            lines.push(values.join(" | "));
          }
        });
      });

      content = lines.join("\n");
      fileType = "xlsx";
    } else if (extension === ".pdf") {
      const data = await fs.readFile(filePath);

      const parser = new PDFParse({
        data,
      });

      const result = await parser.getText();

      content = result.text;
      fileType = "pdf";

      await parser.destroy(); 
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({
        path: filePath,
      });

      content = result.value;
      fileType = "docx";
        
    } else if (
      extension === ".png" ||
      extension === ".jpg" ||
      extension === ".jpeg"
    ) {
      return res.json({
        path: attachmentPath,
        fileType: extension.substring(1),
        content: "",
      });
    } else {
      return res.status(400).json({
        error: `Unsupported file type: ${extension}`,
      });
    }

    return res.json({
      path: attachmentPath,
      fileType,
      content,
    });

  } catch (error: any) {
    console.error("Document reading error:", error);

    if (error?.code === "ENOENT") {
      return res.status(404).json({
        error: "Document not found",
      });
    }

    return res.status(500).json({
      error: "Document reading failed",
    });
  }
});

// Extract the fields from the document text using Gemini AI
app.post("/api/ds1/extract-fields", async (req, res) => {
  try {
    const { text, documentType } = req.body;

    if (!text || !["SI", "BL"].includes(documentType)) {
      return res.status(400).json({
        error: "Valid text and documentType are required",
      });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured",
      });
    }

    const prompt = `
You are the Document Field Extraction Agent for ShipSure AI.

Extract exactly these 7 fields from the shipping document:

1. shipper
2. consignee
3. notify_party
4. port_of_loading
5. port_of_discharge
6. container_count
7. gross_weight_kg

Rules:
- Extract values VERBATIM exactly as they appear in the document.
- Preserve all spaces, punctuation, capitalization, commas, symbols, and units.
- Do not reformat the extracted raw value.
- Do NOT normalize values.
- Do NOT change capitalization or punctuation.
- Do NOT convert units.
- Do NOT infer or guess missing values.
- If a field cannot be found, set raw to null.
- snippet must contain supporting text from the document.
- confidence must be a number between 0 and 1.

Document type: ${documentType}

Document:
${text}

Return ONLY valid JSON in this structure:

{
  "documentType": "${documentType}",
  "rawText": ${JSON.stringify(text)},
  "fields": {
    "shipper": {
      "raw": null,
      "confidence": 0,
      "snippet": ""
    },
    "consignee": {
      "raw": null,
      "confidence": 0,
      "snippet": ""
    },
    "notify_party": {
      "raw": null,
      "confidence": 0,
      "snippet": ""
    },
    "port_of_loading": {
      "raw": null,
      "confidence": 0,
      "snippet": ""
    },
    "port_of_discharge": {
      "raw": null,
      "confidence": 0,
      "snippet": ""
    },
    "container_count": {
      "raw": null,
      "confidence": 0,
      "snippet": ""
    },
    "gross_weight_kg": {
      "raw": null,
      "confidence": 0,
      "snippet": ""
    }
  },
  "unreadableFields": [],
  "extractionConfidence": 0
}
`;

    let response;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        break;
      } catch (error: any) {
        // Retry only temporary Gemini availability errors
        if (error?.status === 503 && attempt < 3) {
          const delay = 5000 * attempt;

          console.log(
            `Gemini busy during field extraction. Retry ${attempt}/3 in ${delay / 1000}s...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );

          continue;
        }

        throw error;
      }
    }

    if (!response) {
      throw new Error("Gemini did not return a response");
    }

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

// Gemini Multi-Agent & Copilot API endpoint
app.post("/api/copilot/chat", async (req, res) => {
  const { prompt, context, agentId, mode } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      fallback: true,
      message: "Server-side GEMINI_API_KEY not configured. Using deterministic multi-agent orchestration engine.",
    });
  }

  try {
    let systemRole = "You are ShipSure Lead Orchestrator, an AI shipping documentation operations specialist.";
    if (agentId === "verification") {
      systemRole = "You are the Verification Engine Agent. You evaluate strict 7-field rules (Shipper, Consignee, Notify Party, POL, POD, Container Count, Gross Weight KG), calculate discrepancies mathematically, and cite exact numbers.";
    } else if (agentId === "critic") {
      systemRole = "You are the Zero-Guess Critic Gate. You enforce strict reliability: never guess on smudged scans, blank fields, or missing attachments. You mandate human review with confidence metrics.";
    } else if (agentId === "revision") {
      systemRole = "You are the Revision Intelligence Agent. You perform 3-way reconciliation (SI vs BL V1 vs BL V2), check if requested corrections were made, and flag sneaky unauthorized carrier alterations.";
    } else if (agentId === "resolution") {
      systemRole = "You are the Carrier Resolution & Dispatch Agent. You draft formal carrier amendment emails with line-item citations and vessel cutoff urgency.";
    } else if (agentId === "extraction") {
      systemRole = "You are the Document Extraction & Normalizer Agent. You extract text, normalize units (Metric Tons to Kilograms), and resolve UN/LOCODE port codes.";
    } else if (agentId === "watchdog") {
      systemRole = "You are the Proactive Watchdog & Memory Agent. You identify systematic carrier error patterns and cross-shipment trends.";
    } else if (mode === "collaborative") {
      systemRole = "You are the ShipSure Multi-Agent War Room Orchestrator. You coordinate 7 specialized agents (Orchestrator, Verification, Extraction, Critic, Revision, Resolution, Watchdog) to investigate shipping documents, provide inter-agent hand-offs, and produce carrier amendment actions.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `${systemRole}
Shipment operations context:
${JSON.stringify(context || {})}

User request:
${prompt}

Provide a concise, professional shipping operations answer with evidence citations, defect breakdowns, and actionable next steps.`,
    });

    res.json({
      text: response.text,
      agent: agentId ? `ShipSure ${agentId.toUpperCase()} Agent (Gemini 3.5 Flash)` : "ShipSure Multi-Agent System (Gemini 3.5 Flash)",
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// AI Vision Model & OCR Document Reader API Endpoint
// Handles hard-to-read scans, crooked images, messy PDFs, and container tables
app.post("/api/vision/ocr", async (req, res) => {
  const { imageBase64, mimeType, docType, path: attachmentPath } = req.body;
  const ai = getGeminiClient();
  let visionBase64 = imageBase64;
  let visionMimeType = mimeType;

  // If a dataset attachment path is provided, load it from disk
  if (!visionBase64 && attachmentPath) {
    try {
      const attachmentsDir = path.resolve(
        process.cwd(),
        "datasets",
        "sdoc-hackathon-bundle",
        "attachments"
      );

      const cleanAttachmentPath = attachmentPath.startsWith("attachments/")
        ? attachmentPath.substring("attachments/".length)
        : attachmentPath;

      const filePath = path.resolve(
        attachmentsDir,
        cleanAttachmentPath
      );

      // Prevent access outside the attachments directory
      if (!filePath.startsWith(attachmentsDir + path.sep)) {
        return res.status(400).json({
          success: false,
          error: "Invalid document path",
        });
      }

      const extension = path.extname(filePath).toLowerCase();

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

      const fileBuffer = await fs.readFile(filePath);

      visionBase64 = fileBuffer.toString("base64");
      visionMimeType = detectedMimeType;
    } catch (error) {
      console.error("Failed to load Vision OCR document:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to load document for Vision OCR",
      });
    }
  }
  // If Gemini API is available and an image is provided
  if (ai && visionBase64) {
    try {
      const cleanBase64 = visionBase64.replace(/^data:[^;]+;base64,/, "");
      const effectiveMimeType = visionMimeType || "image/png";

      const prompt = `
You are ShipSure's Multimodal Document Intelligence Agent.

You are reading a shipping document:
${docType || "Shipping Instruction or Bill of Lading"}.

The document may be:
- a scanned image
- crooked or rotated
- low contrast
- partially unclear
- table-based
- a scanned PDF

Your job is to READ and EXTRACT information from the document.

Do NOT normalize values.
Do NOT convert units.
Do NOT correct spelling.
Do NOT standardize company names.
Do NOT standardize port names.
Do NOT guess missing or unreadable characters.

Extract exactly these 7 fields:

1. shipper
2. consignee
3. notify_party
4. port_of_loading
5. port_of_discharge
6. container_count
7. gross_weight_kg

For every field:
- "raw" must preserve the value as written in the document.
- "confidence" must be between 0 and 1.
- "snippet" must contain supporting text from the document.
- If the field cannot be reliably read, return raw as null and confidence as 0.
- Record unclear fields in unreadableFields.

Return ONLY valid JSON:

{
  "rawOcrText": "verbatim OCR text",
  "orientationCorrection": "description if rotation/skew was detected",
  "qualityScore": 0.0,
  "fields": {
    "shipper": {
      "raw": null,
      "confidence": 0.0,
      "snippet": ""
    },
    "consignee": {
      "raw": null,
      "confidence": 0.0,
      "snippet": ""
    },
    "notify_party": {
      "raw": null,
      "confidence": 0.0,
      "snippet": ""
    },
    "port_of_loading": {
      "raw": null,
      "confidence": 0.0,
      "snippet": ""
    },
    "port_of_discharge": {
      "raw": null,
      "confidence": 0.0,
      "snippet": ""
    },
    "container_count": {
      "raw": null,
      "confidence": 0.0,
      "snippet": ""
    },
    "gross_weight_kg": {
      "raw": null,
      "confidence": 0.0,
      "snippet": ""
    }
  },
  "unreadableFields": [],
  "opticalAmbiguities": []
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: effectiveMimeType,
            },
          },
          prompt,
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        success: true,
        source: "Gemini 3.5 Flash Multimodal Vision Model",
        data: parsed,
      });
    } catch (err: any) {
      console.error("Gemini Vision OCR Error:", err);
      if (err?.status === 429) {
        return res.status(429).json({
          success: false,
          error: "Gemini Vision OCR quota exceeded",
        });
      }
    }
  }

  return res.status(503).json({
    success: false,
    error: visionBase64
      ? "Vision OCR is temporarily unavailable"
      : "No image was provided for OCR",
  });
});

// Proxy submission to Docker Scoring Server
app.post("/api/evaluation/submit", async (req, res) => {
  const { dockerUrl, submission } = req.body;
  const targetUrl = (dockerUrl || serverConfig.dataApiUrl || "http://localhost:8080").replace(/\/$/, "") + "/submit";

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      throw new Error(`Scoring server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(502).json({
      error: `Could not reach scoring server at ${targetUrl}: ${err.message}`,
      simulatedFallback: {
        final_score: 95.8,
        stage1_macro_f1: 0.982,
        stage3_defect_f1: 0.965,
        end_to_end_accuracy: 0.941,
        message: "Simulated score - Docker server unreachable or not started yet",
      },
    });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ShipSure AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
