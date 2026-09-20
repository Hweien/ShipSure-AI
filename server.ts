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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ShipSure AI listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});