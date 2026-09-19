/**
 * ShipSure AI - Synthetic Demo Dataset
 * 
 * DISCLAIMER: This is synthetic demonstration data generated for frontend prototyping 
 * and operational workflow evaluation. It is NOT the official hackathon private ground truth.
 * When running against the official dataset, this provider is bypassed.
 */

import { EmailRecord, ShipmentCase } from "../types";

export interface DemoCaseData {
  email: EmailRecord;
  case: ShipmentCase;
  siText?: string;
  blText?: string;
  blV2Text?: string;
}

export const SYNTHETIC_DEMO_CASES: DemoCaseData[] = [
  // 1. Container Count + Gross Weight Mismatch (Flagship failure case: SHP-8291)
  {
    email: {
      email_id: "email_004",
      from: "ops.jakarta@oceanic-lines.com",
      to: "doc-team@shipsure.io",
      subject: "Draft BL Review Request - SHP-8291 / B/L MAEU992011",
      date: "2026-09-19T08:15:00Z",
      body: "Hi Team,\n\nPlease find attached the Shipping Instruction and draft Bill of Lading for container shipment SHP-8291 from Port Klang to Rotterdam. Kindly review and confirm if draft BL matches the SI before final issue.\n\nBest regards,\nHaryanto - Oceanic Lines",
      attachments: ["attachments/email_004_SI.txt", "attachments/email_004_BL.txt"]
    },
    siText: `SHIPPING INSTRUCTION (SI)
Booking Ref: SHP-8291
Shipper: MALAYSIA BIO-PALM CHEMICALS SDN BHD, LOT 402 JALAN PELABUHAN, 42000 PORT KLANG
Consignee: ROTTERDAM OLEO DISTRIBUTORS B.V., HAVEN 1024, ROTTERDAM, NETHERLANDS
Notify Party: ROTTERDAM OLEO DISTRIBUTORS B.V.
Port of Loading: Port Klang, Malaysia
Port of Discharge: Rotterdam
Container Count: 3x40' High Cube Containers
Gross Weight: 22 MT (22,000.00 KGS)
Description: REFINED PALM ACID OIL IN FLEXITANKS`,
    blText: `DRAFT BILL OF LADING
B/L No: MAEU992011
Shipper / Exporter: MALAYSIA BIO-PALM CHEMICALS SDN BHD
Consignee: ROTTERDAM OLEO DISTRIBUTORS B.V.
Notify Address: ROTTERDAM OLEO DISTRIBUTORS B.V.
Load Port: PKL (NORTHPORT)
Discharge Port: ROTTERDAM
Total Containers: 4 x 40HC
Gross Wt.: 22,500.00 KG
Cargo: REFINED PALM ACID OIL IN FLEXITANKS`,
    case: {
      id: "CASE-8291",
      emailId: "email_004",
      shipmentReference: "SHP-8291",
      emailSubject: "Draft BL Review Request - SHP-8291 / B/L MAEU992011",
      receivedDate: "2026-09-19T08:15:00Z",
      category: "BL_COMPARISON",
      verificationStatus: "MISMATCH",
      hasDefect: true,
      defectFields: ["container_count", "gross_weight_kg"],
      reviewReason: null,
      priorityScore: 94,
      priorityReasons: ["Multiple confirmed discrepancies (Container Count + Gross Weight)", "Vessel loading cutoff in 12h"],
      blVersion: 1,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [
        {
          field: "shipper",
          label: "Shipper",
          status: "NORMALIZED_MATCH",
          siEvidence: { documentType: "SI", originalValue: "MALAYSIA BIO-PALM CHEMICALS SDN BHD, LOT 402 JALAN PELABUHAN, 42000 PORT KLANG", normalizedValue: "MALAYSIA BIO-PALM CHEMICALS SDN BHD", confidence: "HIGH", snippet: "Shipper: MALAYSIA BIO-PALM CHEMICALS SDN BHD" },
          blEvidence: { documentType: "BL", originalValue: "MALAYSIA BIO-PALM CHEMICALS SDN BHD", normalizedValue: "MALAYSIA BIO-PALM CHEMICALS SDN BHD", confidence: "HIGH", snippet: "Shipper / Exporter: MALAYSIA BIO-PALM CHEMICALS SDN BHD" },
          notes: "Address omitted on BL but legal corporate entity normalized matches"
        },
        {
          field: "consignee",
          label: "Consignee",
          status: "EXACT_MATCH",
          siEvidence: { documentType: "SI", originalValue: "ROTTERDAM OLEO DISTRIBUTORS B.V.", normalizedValue: "ROTTERDAM OLEO DISTRIBUTORS BV", confidence: "HIGH" },
          blEvidence: { documentType: "BL", originalValue: "ROTTERDAM OLEO DISTRIBUTORS B.V.", normalizedValue: "ROTTERDAM OLEO DISTRIBUTORS BV", confidence: "HIGH" }
        },
        {
          field: "notify_party",
          label: "Notify Party",
          status: "EXACT_MATCH",
          siEvidence: { documentType: "SI", originalValue: "ROTTERDAM OLEO DISTRIBUTORS B.V.", normalizedValue: "ROTTERDAM OLEO DISTRIBUTORS BV", confidence: "HIGH" },
          blEvidence: { documentType: "BL", originalValue: "ROTTERDAM OLEO DISTRIBUTORS B.V.", normalizedValue: "ROTTERDAM OLEO DISTRIBUTORS BV", confidence: "HIGH" }
        },
        {
          field: "port_of_loading",
          label: "Port of Loading",
          status: "NORMALIZED_MATCH",
          siEvidence: { documentType: "SI", originalValue: "Port Klang, Malaysia", normalizedValue: "PORT KLANG", confidence: "HIGH" },
          blEvidence: { documentType: "BL", originalValue: "PKL (NORTHPORT)", normalizedValue: "PORT KLANG", confidence: "HIGH" },
          notes: "Load Port alias 'PKL' mapped to canonical 'PORT KLANG'"
        },
        {
          field: "port_of_discharge",
          label: "Port of Discharge",
          status: "EXACT_MATCH",
          siEvidence: { documentType: "SI", originalValue: "Rotterdam", normalizedValue: "ROTTERDAM", confidence: "HIGH" },
          blEvidence: { documentType: "BL", originalValue: "ROTTERDAM", normalizedValue: "ROTTERDAM", confidence: "HIGH" }
        },
        {
          field: "container_count",
          label: "Container Count",
          status: "MISMATCH",
          siEvidence: { documentType: "SI", originalValue: "3x40' High Cube Containers", normalizedValue: 3, confidence: "HIGH" },
          blEvidence: { documentType: "BL", originalValue: "4 x 40HC", normalizedValue: 4, confidence: "HIGH" },
          notes: "Discrepancy: SI states 3 containers, draft BL states 4 containers (+1)"
        },
        {
          field: "gross_weight_kg",
          label: "Gross Weight (KG)",
          status: "MISMATCH",
          siEvidence: { documentType: "SI", originalValue: "22 MT (22,000.00 KGS)", normalizedValue: 22000, unit: "KG", confidence: "HIGH" },
          blEvidence: { documentType: "BL", originalValue: "22,500.00 KG", normalizedValue: 22500, unit: "KG", confidence: "HIGH" },
          notes: "Discrepancy: 500 KG excess reported on Draft BL"
        }
      ],
      draftResolution: {
        subject: "BL Amendment Required – Shipment SHP-8291",
        recipient: "ops.jakarta@oceanic-lines.com",
        body: `Dear Oceanic Lines Team,\n\nDuring automated verification of draft Bill of Lading (MAEU992011) against the verified Shipping Instruction for shipment SHP-8291, the following 2 discrepancies were detected:\n\n1. Container Count:\n   - Shipping Instruction: 3 Containers\n   - Draft BL: 4 Containers\n\n2. Gross Weight:\n   - Shipping Instruction: 22,000 KG (22 MT)\n   - Draft BL: 22,500 KG\n\nPlease adjust the draft Bill of Lading to match the Shipping Instruction (3 containers / 22,000 KG) and reissue a revised draft.\n\nThank you,\nShipping Operations Documentation Team`,
        status: "DRAFT"
      },
      timeline: [
        { id: "T-1", timestamp: "08:15:02", agent: "Inbox Agent", action: "Email Ingestion", summary: "Classified as BL_COMPARISON with 2 valid attachments", status: "success" },
        { id: "T-2", timestamp: "08:15:04", agent: "Document Agent", action: "Field Extraction", summary: "Identified SI and BL formats; extracted 7/7 mandatory fields", status: "success" },
        { id: "T-3", timestamp: "08:15:05", agent: "Verification Agent", action: "Comparison", summary: "Detected 2 field discrepancies: container_count, gross_weight_kg", status: "warning" },
        { id: "T-4", timestamp: "08:15:06", agent: "Validation Agent", action: "Critic Check", summary: "Confirmed discrepancies; high confidence in source extractions", status: "success" },
        { id: "T-5", timestamp: "08:15:08", agent: "Resolution Agent", action: "Drafting", summary: "Prepared amendment request email for operations supervisor review", status: "info" }
      ],
      decisions: [
        {
          id: "DEC-101",
          caseId: "CASE-8291",
          emailId: "email_004",
          agent: "Verification Agent",
          decision: "Flag container count mismatch (SI: 3 vs BL: 4)",
          siValue: 3,
          blValue: 4,
          confidence: "99.2%",
          validationStatus: "Confirmed",
          humanInterventionRequired: false,
          timestamp: "08:15:05"
        },
        {
          id: "DEC-102",
          caseId: "CASE-8291",
          emailId: "email_004",
          agent: "Verification Agent",
          decision: "Flag gross weight mismatch (SI: 22,000 KG vs BL: 22,500 KG)",
          siValue: 22000,
          blValue: 22500,
          confidence: "98.9%",
          validationStatus: "Confirmed",
          humanInterventionRequired: false,
          timestamp: "08:15:05"
        }
      ]
    }
  },

  // 2. Exact Match / Semantic Match (SHP-8102 - Status: OK)
  {
    email: {
      email_id: "email_008",
      from: "cs@evergreen-asia.com",
      to: "doc-team@shipsure.io",
      subject: "CHECK DRAFT B/L - EGLV782919 // SHP-8102",
      date: "2026-09-19T07:45:00Z",
      body: "Good day,\nAttached please find SI and draft B/L for your urgent verification.\nVessel: EVER GIVEN 042E.\nThanks!",
      attachments: ["attachments/email_008_SI.txt", "attachments/email_008_BL.txt"]
    },
    siText: `SHIPPING INSTRUCTION
Ref: SHP-8102
Shipper: TOYOTA TSUSHO ASIA PACIFIC PTE LTD, 150 BEACH ROAD, SINGAPORE
Consignee: TRANS-LOGISTICS DEUTSCHLAND GMBH, HAMBURG
Notify Party: TRANS-LOGISTICS DEUTSCHLAND GMBH
Port of Loading: Singapore
Port of Discharge: Hamburg, Germany
Quantity: 2 x 40' Dry Van
Gross Weight: 38,400 KGS`,
    blText: `BILL OF LADING DRAFT
B/L No: EGLV782919
Shipper: TOYOTA TSUSHO ASIA PACIFIC PTE LTD
Consignee: TRANS-LOGISTICS DEUTSCHLAND GMBH
Notify: TRANS-LOGISTICS DEUTSCHLAND GMBH
POL: SGSIN
POD: DEHAM
Containers: 2
Gross Mass: 38,400.00 KG`,
    case: {
      id: "CASE-8102",
      emailId: "email_008",
      shipmentReference: "SHP-8102",
      emailSubject: "CHECK DRAFT B/L - EGLV782919 // SHP-8102",
      receivedDate: "2026-09-19T07:45:00Z",
      category: "BL_COMPARISON",
      verificationStatus: "OK",
      hasDefect: false,
      defectFields: [],
      reviewReason: null,
      priorityScore: 20,
      priorityReasons: ["All 7 fields verified matching", "Auto-clear candidate"],
      blVersion: 1,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [
        { field: "shipper", label: "Shipper", status: "NORMALIZED_MATCH", siEvidence: { documentType: "SI", originalValue: "TOYOTA TSUSHO ASIA PACIFIC PTE LTD", normalizedValue: "TOYOTA TSUSHO ASIA PACIFIC PTE LTD", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "TOYOTA TSUSHO ASIA PACIFIC PTE LTD", normalizedValue: "TOYOTA TSUSHO ASIA PACIFIC PTE LTD", confidence: "HIGH" } },
        { field: "consignee", label: "Consignee", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "TRANS-LOGISTICS DEUTSCHLAND GMBH", normalizedValue: "TRANS-LOGISTICS DEUTSCHLAND GMBH", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "TRANS-LOGISTICS DEUTSCHLAND GMBH", normalizedValue: "TRANS-LOGISTICS DEUTSCHLAND GMBH", confidence: "HIGH" } },
        { field: "notify_party", label: "Notify Party", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "TRANS-LOGISTICS DEUTSCHLAND GMBH", normalizedValue: "TRANS-LOGISTICS DEUTSCHLAND GMBH", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "TRANS-LOGISTICS DEUTSCHLAND GMBH", normalizedValue: "TRANS-LOGISTICS DEUTSCHLAND GMBH", confidence: "HIGH" } },
        { field: "port_of_loading", label: "Port of Loading", status: "NORMALIZED_MATCH", siEvidence: { documentType: "SI", originalValue: "Singapore", normalizedValue: "SINGAPORE", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "SGSIN", normalizedValue: "SINGAPORE", confidence: "HIGH" }, notes: "Normalized UN/LOCODE SGSIN to Singapore" },
        { field: "port_of_discharge", label: "Port of Discharge", status: "NORMALIZED_MATCH", siEvidence: { documentType: "SI", originalValue: "Hamburg, Germany", normalizedValue: "HAMBURG", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "DEHAM", normalizedValue: "HAMBURG", confidence: "HIGH" }, notes: "Normalized UN/LOCODE DEHAM to Hamburg" },
        { field: "container_count", label: "Container Count", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "2 x 40' Dry Van", normalizedValue: 2, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "2", normalizedValue: 2, confidence: "HIGH" } },
        { field: "gross_weight_kg", label: "Gross Weight (KG)", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "38,400 KGS", normalizedValue: 38400, unit: "KG", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "38,400.00 KG", normalizedValue: 38400, unit: "KG", confidence: "HIGH" } }
      ],
      timeline: [
        { id: "T-20", timestamp: "07:45:01", agent: "Inbox Agent", action: "Email Ingestion", summary: "Classified as BL_COMPARISON", status: "success" },
        { id: "T-21", timestamp: "07:45:03", agent: "Document Agent", action: "Field Extraction", summary: "7/7 fields extracted cleanly", status: "success" },
        { id: "T-22", timestamp: "07:45:04", agent: "Verification Agent", action: "Comparison", summary: "No mismatch detected across all 7 fields", status: "success" }
      ],
      decisions: []
    }
  },

  // 3. Revised BL with Unexpected Modification (SHP-7612)
  {
    email: {
      email_id: "email_012",
      from: "documentation@cma-cgm-ops.com",
      to: "doc-team@shipsure.io",
      subject: "REVISED DRAFT BL V2 - SHP-7612 (Correction for weight & container)",
      date: "2026-09-19T06:30:00Z",
      body: "Dear ShipSure,\nPlease find attached Revised B/L V2 for SHP-7612. As requested, we corrected container count to 3 and weight to 22,000 KG. Please confirm release.\nRegards, CMA CGM Doc Team",
      attachments: ["attachments/email_012_SI.txt", "attachments/email_012_BL_V2.txt"]
    },
    siText: `SHIPPING INSTRUCTION
Case ID: SHP-7612
Shipper: ASAHI PRECISION INSTRUMENTS CO LTD
Consignee: PACIFIC INDUSTRIAL TRADING LTD
Notify Party: PACIFIC INDUSTRIAL TRADING LTD
Port of Loading: Busan
Port of Discharge: Los Angeles
Container Count: 3
Gross Weight: 18,200 KG`,
    blText: `DRAFT BILL OF LADING (V1)
Shipper: ASAHI PRECISION INSTRUMENTS CO LTD
Consignee: PACIFIC INDUSTRIAL TRADING LTD
Notify Party: PACIFIC INDUSTRIAL TRADING LTD
Port of Loading: Busan
Port of Discharge: Los Angeles
Container Count: 4 [DISCREPANCY]
Gross Weight: 19,500 KG [DISCREPANCY]`,
    blV2Text: `REVISED BILL OF LADING (V2)
Shipper: ASAHI PRECISION INSTRUMENTS CO LTD
Consignee: PACIFIC INDUSTRIAL LOGISTICS GROUP LTD [UNEXPECTED CHANGE]
Notify Party: PACIFIC INDUSTRIAL TRADING LTD
Port of Loading: Busan
Port of Discharge: Los Angeles
Container Count: 3 [CORRECTED]
Gross Weight: 18,200 KG [CORRECTED]`,
    case: {
      id: "CASE-7612",
      emailId: "email_012",
      shipmentReference: "SHP-7612",
      emailSubject: "REVISED DRAFT BL V2 - SHP-7612 (Correction for weight & container)",
      receivedDate: "2026-09-19T06:30:00Z",
      category: "BL_COMPARISON",
      verificationStatus: "MISMATCH",
      hasDefect: true,
      defectFields: ["consignee"],
      reviewReason: null,
      priorityScore: 88,
      priorityReasons: ["Unexpected Consignee modification detected in BL V2", "Carrier amended unrequested field"],
      blVersion: 2,
      hasRevision: true,
      humanReviewed: false,
      revisionComparison: {
        caseId: "CASE-7612",
        originalSi: {
          documentType: "SI",
          extractionConfidence: "HIGH",
          fields: {
            container_count: { raw: "3", normalized: 3 },
            gross_weight_kg: { raw: "18,200 KG", normalized: 18200 },
            consignee: { raw: "PACIFIC INDUSTRIAL TRADING LTD", normalized: "PACIFIC INDUSTRIAL TRADING LTD" }
          }
        },
        blV1: {
          documentType: "BL",
          extractionConfidence: "HIGH",
          fields: {
            container_count: { raw: "4", normalized: 4 },
            gross_weight_kg: { raw: "19,500 KG", normalized: 19500 },
            consignee: { raw: "PACIFIC INDUSTRIAL TRADING LTD", normalized: "PACIFIC INDUSTRIAL TRADING LTD" }
          }
        },
        blV2: {
          documentType: "BL",
          extractionConfidence: "HIGH",
          fields: {
            container_count: { raw: "3", normalized: 3 },
            gross_weight_kg: { raw: "18,200 KG", normalized: 18200 },
            consignee: { raw: "PACIFIC INDUSTRIAL LOGISTICS GROUP LTD", normalized: "PACIFIC INDUSTRIAL LOGISTICS GROUP LTD" }
          }
        },
        correctedFields: [
          { field: "container_count", siValue: 3, v1Value: 4, v2Value: 3, status: "CORRECTED" },
          { field: "gross_weight_kg", siValue: 18200, v1Value: 19500, v2Value: 18200, status: "CORRECTED" }
        ],
        unexpectedChanges: [
          {
            field: "consignee",
            siValue: "PACIFIC INDUSTRIAL TRADING LTD",
            v1Value: "PACIFIC INDUSTRIAL TRADING LTD",
            v2Value: "PACIFIC INDUSTRIAL LOGISTICS GROUP LTD",
            status: "UNEXPECTED_CHANGE",
            reason: "The requested corrections (count & weight) were resolved, but Consignee was unexpectedly changed from 'PACIFIC INDUSTRIAL TRADING LTD' to 'PACIFIC INDUSTRIAL LOGISTICS GROUP LTD'."
          }
        ],
        overallOutcome: "NEEDS_HUMAN_REVIEW"
      },
      fieldComparisons: [
        { field: "shipper", label: "Shipper", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "ASAHI PRECISION INSTRUMENTS CO LTD", normalizedValue: "ASAHI PRECISION INSTRUMENTS CO LTD", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "ASAHI PRECISION INSTRUMENTS CO LTD", normalizedValue: "ASAHI PRECISION INSTRUMENTS CO LTD", confidence: "HIGH" } },
        { field: "consignee", label: "Consignee", status: "MISMATCH", siEvidence: { documentType: "SI", originalValue: "PACIFIC INDUSTRIAL TRADING LTD", normalizedValue: "PACIFIC INDUSTRIAL TRADING LTD", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "PACIFIC INDUSTRIAL LOGISTICS GROUP LTD", normalizedValue: "PACIFIC INDUSTRIAL LOGISTICS GROUP LTD", confidence: "HIGH" }, notes: "Unexpected change on V2!" },
        { field: "notify_party", label: "Notify Party", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "PACIFIC INDUSTRIAL TRADING LTD", normalizedValue: "PACIFIC INDUSTRIAL TRADING LTD", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "PACIFIC INDUSTRIAL TRADING LTD", normalizedValue: "PACIFIC INDUSTRIAL TRADING LTD", confidence: "HIGH" } },
        { field: "port_of_loading", label: "Port of Loading", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "Busan", normalizedValue: "BUSAN", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "Busan", normalizedValue: "BUSAN", confidence: "HIGH" } },
        { field: "port_of_discharge", label: "Port of Discharge", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "Los Angeles", normalizedValue: "LOS ANGELES", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "Los Angeles", normalizedValue: "LOS ANGELES", confidence: "HIGH" } },
        { field: "container_count", label: "Container Count", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "3", normalizedValue: 3, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "3", normalizedValue: 3, confidence: "HIGH" }, notes: "Fixed in V2" },
        { field: "gross_weight_kg", label: "Gross Weight (KG)", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "18,200 KG", normalizedValue: 18200, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "18,200 KG", normalizedValue: 18200, confidence: "HIGH" }, notes: "Fixed in V2" }
      ],
      timeline: [
        { id: "T-30", timestamp: "06:30:01", agent: "Inbox Agent", action: "Email Ingestion", summary: "Identified revised BL V2 for previous case SHP-7612", status: "success" },
        { id: "T-31", timestamp: "06:30:03", agent: "Revision Agent", action: "3-Way Diff", summary: "Confirmed 2 corrections, flagged 1 unexpected Consignee alteration", status: "warning" },
        { id: "T-32", timestamp: "06:30:05", agent: "Validation Agent", action: "Human Escalation", summary: "Escalated unexpected modification to Human Review queue", status: "warning" }
      ],
      decisions: [
        {
          id: "DEC-301",
          caseId: "CASE-7612",
          emailId: "email_012",
          agent: "Revision Agent",
          decision: "Flag unexpected Consignee alteration in BL V2",
          siValue: "PACIFIC INDUSTRIAL TRADING LTD",
          blValue: "PACIFIC INDUSTRIAL LOGISTICS GROUP LTD",
          confidence: "99.7%",
          validationStatus: "Flagged",
          humanInterventionRequired: true,
          timestamp: "06:30:03"
        }
      ]
    }
  },

  // 4. Missing Attachment case (SHP-8392 -> NEEDS_REVIEW / missing_attachment)
  {
    email: {
      email_id: "email_015",
      from: "export.logistics@sinomarine.cn",
      to: "doc-team@shipsure.io",
      subject: "B/L Check request for Booking SN-48192 // SHP-8392",
      date: "2026-09-19T05:10:00Z",
      body: "Dear Operator,\nPlease review our draft bill of lading attached. Looking forward to your prompt response.\nBest,\nSinoMarine Export Team",
      attachments: ["attachments/email_015_BL.txt"] // SI IS MISSING!
    },
    blText: `BILL OF LADING
B/L: SN-48192
Shipper: NINGBO HENGSHENG TEXTILE CO LTD
Consignee: TEXTILES DU RHONE SAS
Port of Loading: Ningbo
Port of Discharge: Antwerp
Containers: 1 x 40HQ
Gross Weight: 14,200 KG`,
    case: {
      id: "CASE-8392",
      emailId: "email_015",
      shipmentReference: "SHP-8392",
      emailSubject: "B/L Check request for Booking SN-48192 // SHP-8392",
      receivedDate: "2026-09-19T05:10:00Z",
      category: "BL_COMPARISON",
      verificationStatus: "NEEDS_REVIEW",
      hasDefect: false,
      defectFields: [],
      reviewReason: "missing_attachment",
      priorityScore: 82,
      priorityReasons: ["Missing reference document: Shipping Instruction (SI) was not attached"],
      blVersion: 1,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [],
      timeline: [
        { id: "T-40", timestamp: "05:10:01", agent: "Inbox Agent", action: "Attachment Triage", summary: "Detected single attachment 'email_015_BL.txt'. SI is missing.", status: "warning" },
        { id: "T-41", timestamp: "05:10:02", agent: "Validation Agent", action: "Reliability Gate", summary: "Triggered NEEDS_REVIEW with reason 'missing_attachment'", status: "warning" }
      ],
      decisions: [
        {
          id: "DEC-401",
          caseId: "CASE-8392",
          emailId: "email_015",
          agent: "Validation Agent",
          decision: "Escalate due to missing SI attachment",
          confidence: "100%",
          validationStatus: "Confirmed",
          humanInterventionRequired: true,
          timestamp: "05:10:02"
        }
      ]
    }
  },

  // 5. Unreadable / Smudged Value case (SHP-8411 -> NEEDS_REVIEW / unreadable)
  {
    email: {
      email_id: "email_022",
      from: "docs@mediterranean-ship.com",
      to: "doc-team@shipsure.io",
      subject: "Urgent Document Review: MSCU881029 / SHP-8411",
      date: "2026-09-18T16:20:00Z",
      body: "Attached are scanned SI and draft BL for shipment SHP-8411. Please review today.",
      attachments: ["attachments/email_022_SI.txt", "attachments/email_022_BL.txt"]
    },
    siText: `SHIPPING INSTRUCTION
Reference: SHP-8411
Shipper: HYUNDAI HEAVY INDUSTRIES CO LTD, ULSAN, KOREA
Consignee: ROTTERDAM OFFSHORE ENERGY BV
Notify Party: ROTTERDAM OFFSHORE ENERGY BV
Port of Loading: Busan
Port of Discharge: Rotterdam
Container Count: 5
Gross Weight: 64,000 KG`,
    blText: `BILL OF LADING
B/L: MSCU881029
Shipper: HYUNDAI HEAVY INDUSTRIES CO LTD
Consignee: ROTTERDAM OFFSHORE ENERGY BV
Notify Party: ROTTERDAM OFFSHORE ENERGY BV
Load Port: BUSAN
Discharge Port: ROTTERDAM
Container Count: 5
Gross Weight: [UNREADABLE / SCAN SMUDGE: 6#,000 KG - 64,000 OR 68,000]`,
    case: {
      id: "CASE-8411",
      emailId: "email_022",
      shipmentReference: "SHP-8411",
      emailSubject: "Urgent Document Review: MSCU881029 / SHP-8411",
      receivedDate: "2026-09-18T16:20:00Z",
      category: "BL_COMPARISON",
      verificationStatus: "NEEDS_REVIEW",
      hasDefect: false,
      defectFields: [],
      reviewReason: "unreadable",
      priorityScore: 78,
      priorityReasons: ["Gross weight field smudged on scan; requires human optical confirmation"],
      blVersion: 1,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [
        { field: "shipper", label: "Shipper", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "HYUNDAI HEAVY INDUSTRIES CO LTD", normalizedValue: "HYUNDAI HEAVY INDUSTRIES CO LTD", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "HYUNDAI HEAVY INDUSTRIES CO LTD", normalizedValue: "HYUNDAI HEAVY INDUSTRIES CO LTD", confidence: "HIGH" } },
        { field: "consignee", label: "Consignee", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "ROTTERDAM OFFSHORE ENERGY BV", normalizedValue: "ROTTERDAM OFFSHORE ENERGY BV", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "ROTTERDAM OFFSHORE ENERGY BV", normalizedValue: "ROTTERDAM OFFSHORE ENERGY BV", confidence: "HIGH" } },
        { field: "notify_party", label: "Notify Party", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "ROTTERDAM OFFSHORE ENERGY BV", normalizedValue: "ROTTERDAM OFFSHORE ENERGY BV", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "ROTTERDAM OFFSHORE ENERGY BV", normalizedValue: "ROTTERDAM OFFSHORE ENERGY BV", confidence: "HIGH" } },
        { field: "port_of_loading", label: "Port of Loading", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "Busan", normalizedValue: "BUSAN", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "BUSAN", normalizedValue: "BUSAN", confidence: "HIGH" } },
        { field: "port_of_discharge", label: "Port of Discharge", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "Rotterdam", normalizedValue: "ROTTERDAM", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "ROTTERDAM", normalizedValue: "ROTTERDAM", confidence: "HIGH" } },
        { field: "container_count", label: "Container Count", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "5", normalizedValue: 5, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "5", normalizedValue: 5, confidence: "HIGH" } },
        { field: "gross_weight_kg", label: "Gross Weight (KG)", status: "NEEDS_REVIEW", siEvidence: { documentType: "SI", originalValue: "64,000 KG", normalizedValue: 64000, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "6#,000 KG (Scan smudged)", normalizedValue: 0, confidence: "LOW" }, notes: "Uncertain optical scan: Candidate A 64,000 (58%), Candidate B 68,000 (42%)" }
      ],
      timeline: [
        { id: "T-50", timestamp: "16:20:02", agent: "Document Agent", action: "OCR Scanning", summary: "Character ambiguity detected on BL Gross Weight digit 2", status: "warning" },
        { id: "T-51", timestamp: "16:20:04", agent: "Validation Agent", action: "Reliability Gate", summary: "Refused silent guess; routed to Human Review queue with dual candidate proposals", status: "warning" }
      ],
      decisions: []
    }
  },

  // 6. Missing Value in SI (SHP-8519 -> NEEDS_REVIEW / missing_value)
  {
    email: {
      email_id: "email_031",
      from: "forwarder@apex-freight.com",
      to: "doc-team@shipsure.io",
      subject: "Document verification: SHP-8519",
      date: "2026-09-18T14:10:00Z",
      body: "Please verify draft BL against our preliminary SI.",
      attachments: ["attachments/email_031_SI.txt", "attachments/email_031_BL.txt"]
    },
    siText: `SHIPPING INSTRUCTION
Shipper: APEX GRAIN EXPORTS LTD
Consignee: [BLANK / NOT PROVIDED]
Notify Party: APEX GRAIN TRADING SA
Port of Loading: Los Angeles
Port of Discharge: Shanghai
Container Count: 10
Gross Weight: 240,000 KG`,
    blText: `BILL OF LADING
Shipper: APEX GRAIN EXPORTS LTD
Consignee: SHANGHAI GRAIN & OIL IMPORT CORP
Notify Party: APEX GRAIN TRADING SA
Load Port: USLAX
Discharge Port: CNSHA
Containers: 10
Weight: 240,000 KG`,
    case: {
      id: "CASE-8519",
      emailId: "email_031",
      shipmentReference: "SHP-8519",
      emailSubject: "Document verification: SHP-8519",
      receivedDate: "2026-09-18T14:10:00Z",
      category: "BL_COMPARISON",
      verificationStatus: "NEEDS_REVIEW",
      hasDefect: false,
      defectFields: [],
      reviewReason: "missing_value",
      priorityScore: 70,
      priorityReasons: ["Mandatory Consignee field left blank in Shipping Instruction"],
      blVersion: 1,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [
        { field: "consignee", label: "Consignee", status: "NEEDS_REVIEW", siEvidence: null, blEvidence: { documentType: "BL", originalValue: "SHANGHAI GRAIN & OIL IMPORT CORP", normalizedValue: "SHANGHAI GRAIN & OIL IMPORT CORP", confidence: "HIGH" }, notes: "Consignee missing on SI" }
      ],
      timeline: [
        { id: "T-60", timestamp: "14:10:01", agent: "Validation Agent", action: "Completeness Check", summary: "Field Consignee missing in reference SI. Routed to human review.", status: "warning" }
      ],
      decisions: []
    }
  },

  // 7. Non-comparison: SI Request (SI_REQUEST)
  {
    email: {
      email_id: "email_040",
      from: "booking@global-traders.com",
      to: "doc-team@shipsure.io",
      subject: "Request to prepare new Shipping Instruction for PO #99104",
      date: "2026-09-18T11:00:00Z",
      body: "Hello Ops,\nCould you please help prepare and submit a new Shipping Instruction for our upcoming booking with Maersk for 2x20' containers of machine parts? Attached is our commercial packing list.",
      attachments: ["attachments/email_040_packing_list.txt"]
    },
    case: {
      id: "CASE-040",
      emailId: "email_040",
      shipmentReference: "N/A (SI Prep)",
      emailSubject: "Request to prepare new Shipping Instruction for PO #99104",
      receivedDate: "2026-09-18T11:00:00Z",
      category: "SI_REQUEST",
      verificationStatus: "OK",
      hasDefect: false,
      defectFields: [],
      reviewReason: null,
      priorityScore: 45,
      priorityReasons: ["New SI preparation request routed to documentation creation desk"],
      blVersion: 0,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [],
      timeline: [
        { id: "T-70", timestamp: "11:00:02", agent: "Inbox Agent", action: "Classification", summary: "Classified as SI_REQUEST. Does not proceed to BL checking step.", status: "info" }
      ],
      decisions: []
    }
  },

  // 8. Non-comparison: Invoice Query (INVOICE_QUERY)
  {
    email: {
      email_id: "email_045",
      from: "accounting@metro-freight.de",
      to: "doc-team@shipsure.io",
      subject: "Invoice Dispute - Detention & Demurrage charges on Inv #INV-88910",
      date: "2026-09-17T15:30:00Z",
      body: "Dear Finance & Ops,\nWe noticed an unexpected detention fee of EUR 450 on invoice INV-88910 for containers returned on Sep 12. Please review and provide credit note.",
      attachments: []
    },
    case: {
      id: "CASE-045",
      emailId: "email_045",
      shipmentReference: "INV-88910",
      emailSubject: "Invoice Dispute - Detention & Demurrage charges on Inv #INV-88910",
      receivedDate: "2026-09-17T15:30:00Z",
      category: "INVOICE_QUERY",
      verificationStatus: "OK",
      hasDefect: false,
      defectFields: [],
      reviewReason: null,
      priorityScore: 35,
      priorityReasons: ["Billing / invoice query routed to Finance Desk"],
      blVersion: 0,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [],
      timeline: [
        { id: "T-80", timestamp: "15:30:01", agent: "Inbox Agent", action: "Classification", summary: "Classified as INVOICE_QUERY. Triage complete.", status: "info" }
      ],
      decisions: []
    }
  },

  // 9. Non-comparison: General Operational Message (GENERAL)
  {
    email: {
      email_id: "email_050",
      from: "port-authority@rotterdam-harbour.nl",
      to: "doc-team@shipsure.io",
      subject: "Operational Advisory: Port of Rotterdam Berthing Delays due to storm",
      date: "2026-09-17T09:15:00Z",
      body: "Please be advised that severe gale weather is expected at Maasvlakte terminals over the weekend. Berthing delays of 12-24 hours are anticipated for container vessels.",
      attachments: []
    },
    case: {
      id: "CASE-050",
      emailId: "email_050",
      shipmentReference: "PORT-ADVISORY",
      emailSubject: "Operational Advisory: Port of Rotterdam Berthing Delays due to storm",
      receivedDate: "2026-09-17T09:15:00Z",
      category: "GENERAL",
      verificationStatus: "OK",
      hasDefect: false,
      defectFields: [],
      reviewReason: null,
      priorityScore: 15,
      priorityReasons: ["General port informational circular"],
      blVersion: 0,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [],
      timeline: [
        { id: "T-90", timestamp: "09:15:01", agent: "Inbox Agent", action: "Classification", summary: "Classified as GENERAL. Triage complete.", status: "info" }
      ],
      decisions: []
    }
  },

  // 10. Non-comparison: Spam (SPAM)
  {
    email: {
      email_id: "email_055",
      from: "promo@cheap-hotel-deals-travel.biz",
      to: "doc-team@shipsure.io",
      subject: "Exclusive 50% discount on luxury beach villas!",
      date: "2026-09-16T18:00:00Z",
      body: "Book your tropical vacation now with coupon code SUNNY50. Limited time offer!",
      attachments: []
    },
    case: {
      id: "CASE-055",
      emailId: "email_055",
      shipmentReference: "N/A",
      emailSubject: "Exclusive 50% discount on luxury beach villas!",
      receivedDate: "2026-09-16T18:00:00Z",
      category: "SPAM",
      verificationStatus: "OK",
      hasDefect: false,
      defectFields: [],
      reviewReason: null,
      priorityScore: 0,
      priorityReasons: ["Identified marketing spam; quarantined from operations queue"],
      blVersion: 0,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [],
      timeline: [
        { id: "T-100", timestamp: "18:00:01", agent: "Inbox Agent", action: "Spam Detection", summary: "High-confidence SPAM classification. Filtered out.", status: "info" }
      ],
      decisions: []
    }
  },

  // 11. Port of Discharge Mismatch (SHP-8994)
  {
    email: {
      email_id: "email_062",
      from: "export@trans-pacific.com",
      to: "doc-team@shipsure.io",
      subject: "Check Draft B/L - SHP-8994 // OOCL-55201",
      date: "2026-09-16T10:45:00Z",
      body: "Kindly cross-check draft BL with attached SI for discharge at Jebel Ali. Urgent!",
      attachments: ["attachments/email_062_SI.txt", "attachments/email_062_BL.txt"]
    },
    siText: `SHIPPING INSTRUCTION
Ref: SHP-8994
Shipper: MALAYSIAN RUBBER BOARD CO
Consignee: EMIRATES TIRE TRADING LLC
Notify Party: EMIRATES TIRE TRADING LLC
Port of Loading: Port Klang
Port of Discharge: Jebel Ali, UAE
Container Count: 2
Gross Weight: 36,000 KG`,
    blText: `BILL OF LADING
B/L: OOCL-55201
Shipper: MALAYSIAN RUBBER BOARD CO
Consignee: EMIRATES TIRE TRADING LLC
Notify Party: EMIRATES TIRE TRADING LLC
Port of Loading: Port Klang
Port of Discharge: Dammam, Saudi Arabia [MISMATCH]
Container Count: 2
Gross Weight: 36,000 KG`,
    case: {
      id: "CASE-8994",
      emailId: "email_062",
      shipmentReference: "SHP-8994",
      emailSubject: "Check Draft B/L - SHP-8994 // OOCL-55201",
      receivedDate: "2026-09-16T10:45:00Z",
      category: "BL_COMPARISON",
      verificationStatus: "MISMATCH",
      hasDefect: true,
      defectFields: ["port_of_discharge"],
      reviewReason: null,
      priorityScore: 91,
      priorityReasons: ["Critical port of discharge mismatch: Jebel Ali vs Dammam", "Risk of cross-border misdirection"],
      blVersion: 1,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [
        { field: "shipper", label: "Shipper", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "MALAYSIAN RUBBER BOARD CO", normalizedValue: "MALAYSIAN RUBBER BOARD CO", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "MALAYSIAN RUBBER BOARD CO", normalizedValue: "MALAYSIAN RUBBER BOARD CO", confidence: "HIGH" } },
        { field: "consignee", label: "Consignee", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "EMIRATES TIRE TRADING LLC", normalizedValue: "EMIRATES TIRE TRADING LLC", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "EMIRATES TIRE TRADING LLC", normalizedValue: "EMIRATES TIRE TRADING LLC", confidence: "HIGH" } },
        { field: "notify_party", label: "Notify Party", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "EMIRATES TIRE TRADING LLC", normalizedValue: "EMIRATES TIRE TRADING LLC", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "EMIRATES TIRE TRADING LLC", normalizedValue: "EMIRATES TIRE TRADING LLC", confidence: "HIGH" } },
        { field: "port_of_loading", label: "Port of Loading", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "Port Klang", normalizedValue: "PORT KLANG", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "Port Klang", normalizedValue: "PORT KLANG", confidence: "HIGH" } },
        { field: "port_of_discharge", label: "Port of Discharge", status: "MISMATCH", siEvidence: { documentType: "SI", originalValue: "Jebel Ali, UAE", normalizedValue: "JEBEL ALI", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "Dammam, Saudi Arabia", normalizedValue: "DAMMAM", confidence: "HIGH" }, notes: "Discharge port discrepancy: Jebel Ali vs Dammam" },
        { field: "container_count", label: "Container Count", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "2", normalizedValue: 2, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "2", normalizedValue: 2, confidence: "HIGH" } },
        { field: "gross_weight_kg", label: "Gross Weight (KG)", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "36,000 KG", normalizedValue: 36000, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "36,000 KG", normalizedValue: 36000, confidence: "HIGH" } }
      ],
      draftResolution: {
        subject: "CRITICAL: Discharge Port Amendment – SHP-8994",
        recipient: "export@trans-pacific.com",
        body: "Dear Trans-Pacific Team,\n\nUrgent correction needed: Draft BL (OOCL-55201) lists Port of Discharge as Dammam, Saudi Arabia, whereas Shipping Instruction explicitly designates Jebel Ali, UAE.\n\nPlease amend immediately to avoid destination customs re-manifesting penalty.",
        status: "DRAFT"
      },
      timeline: [
        { id: "T-110", timestamp: "10:45:02", agent: "Verification Agent", action: "Comparison", summary: "Detected critical Port of Discharge discrepancy: JEBEL ALI vs DAMMAM", status: "error" }
      ],
      decisions: []
    }
  },

  // 12. Shipper Name Mismatch (SHP-9022)
  {
    email: {
      email_id: "email_071",
      from: "carrier.ops@hapag-lloyd.de",
      to: "doc-team@shipsure.io",
      subject: "B/L Draft confirmation SHP-9022",
      date: "2026-09-15T12:00:00Z",
      body: "Please check draft bill of lading for booking HLCU992010.",
      attachments: ["attachments/email_071_SI.txt", "attachments/email_071_BL.txt"]
    },
    siText: `SHIPPING INSTRUCTION
Shipper: SUMITOMO CHEMICAL ASIA PTE LTD
Consignee: BAYER CROPSCIENCE AG
Notify Party: BAYER CROPSCIENCE AG
Port of Loading: Singapore
Port of Discharge: Rotterdam
Container Count: 1
Gross Weight: 19,800 KG`,
    blText: `BILL OF LADING
Shipper: MITSUI CHEMICALS ASIA PACIFIC LTD [MISMATCH]
Consignee: BAYER CROPSCIENCE AG
Notify Party: BAYER CROPSCIENCE AG
Port of Loading: Singapore
Port of Discharge: Rotterdam
Container Count: 1
Gross Weight: 19,800 KG`,
    case: {
      id: "CASE-9022",
      emailId: "email_071",
      shipmentReference: "SHP-9022",
      emailSubject: "B/L Draft confirmation SHP-9022",
      receivedDate: "2026-09-15T12:00:00Z",
      category: "BL_COMPARISON",
      verificationStatus: "MISMATCH",
      hasDefect: true,
      defectFields: ["shipper"],
      reviewReason: null,
      priorityScore: 89,
      priorityReasons: ["Shipper legal identity mismatch: Sumitomo vs Mitsui"],
      blVersion: 1,
      hasRevision: false,
      humanReviewed: false,
      fieldComparisons: [
        { field: "shipper", label: "Shipper", status: "MISMATCH", siEvidence: { documentType: "SI", originalValue: "SUMITOMO CHEMICAL ASIA PTE LTD", normalizedValue: "SUMITOMO CHEMICAL ASIA PTE LTD", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "MITSUI CHEMICALS ASIA PACIFIC LTD", normalizedValue: "MITSUI CHEMICALS ASIA PACIFIC LTD", confidence: "HIGH" }, notes: "Wrong shipper entity inserted on Draft BL" },
        { field: "consignee", label: "Consignee", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "BAYER CROPSCIENCE AG", normalizedValue: "BAYER CROPSCIENCE AG", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "BAYER CROPSCIENCE AG", normalizedValue: "BAYER CROPSCIENCE AG", confidence: "HIGH" } },
        { field: "notify_party", label: "Notify Party", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "BAYER CROPSCIENCE AG", normalizedValue: "BAYER CROPSCIENCE AG", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "BAYER CROPSCIENCE AG", normalizedValue: "BAYER CROPSCIENCE AG", confidence: "HIGH" } },
        { field: "port_of_loading", label: "Port of Loading", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "Singapore", normalizedValue: "SINGAPORE", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "Singapore", normalizedValue: "SINGAPORE", confidence: "HIGH" } },
        { field: "port_of_discharge", label: "Port of Discharge", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "Rotterdam", normalizedValue: "ROTTERDAM", confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "Rotterdam", normalizedValue: "ROTTERDAM", confidence: "HIGH" } },
        { field: "container_count", label: "Container Count", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "1", normalizedValue: 1, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "1", normalizedValue: 1, confidence: "HIGH" } },
        { field: "gross_weight_kg", label: "Gross Weight (KG)", status: "EXACT_MATCH", siEvidence: { documentType: "SI", originalValue: "19,800 KG", normalizedValue: 19800, confidence: "HIGH" }, blEvidence: { documentType: "BL", originalValue: "19,800 KG", normalizedValue: 19800, confidence: "HIGH" } }
      ],
      timeline: [
        { id: "T-120", timestamp: "12:00:02", agent: "Verification Agent", action: "Comparison", summary: "Shipper legal entity mismatch flagged", status: "error" }
      ],
      decisions: []
    }
  }
];

export interface AnomalyAlertItem {
  id: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  affectedShipments: string[];
  recommendedAction: string;
}

export const defaultAnomalyAlerts: AnomalyAlertItem[] = [
  {
    id: "ALERT-01",
    severity: "HIGH",
    title: "Metric Ton (MT) Unit Misalignment Surge",
    description: "Multiple carrier booking drafts are converting SI Metric Tons directly into Kilograms without multiplying by 1,000, resulting in 1000x tare/gross mass errors.",
    affectedShipments: ["SHP-8291", "SHP-7612"],
    recommendedAction: "Mandate SI Gross Mass regex parser flag prior to draft release."
  },
  {
    id: "ALERT-02",
    severity: "MEDIUM",
    title: "Port Klang (MYPKG) Terminal Code Ambiguity",
    description: "Northport and Westport terminals on Port Klang bookings frequently encounter clerical mismatch between PKL and PORT KLANG.",
    affectedShipments: ["SHP-8291", "SHP-8994"],
    recommendedAction: "Apply automatic UN/LOCODE alias dictionary normalization."
  },
  {
    id: "ALERT-03",
    severity: "HIGH",
    title: "Unauthorized Entity Name Alterations on BL V2",
    description: "Carriers amending draft BL versions are altering Consignee legal names without customer change order requests.",
    affectedShipments: ["SHP-7612"],
    recommendedAction: "Lock 3-way version re-verification gate with mandatory human sign-off."
  }
];

export interface AgentTraceItem {
  id: string;
  agentName: string;
  caseId: string;
  action: string;
  details: string;
  status: string;
  timestamp: string;
}

export const defaultAgentTraces: AgentTraceItem[] = [
  {
    id: "TR-01",
    agentName: "Inbox Intelligence Agent",
    caseId: "CASE-8291",
    action: "Email Ingestion & Intent Classification",
    details: "Classified incoming message as 'BL_COMPARISON' (Confidence: 0.98). Identified 2 text attachments (SI and Draft BL).",
    status: "completed",
    timestamp: "2026-09-19T08:15:02Z"
  },
  {
    id: "TR-02",
    agentName: "Document Extraction Agent",
    caseId: "CASE-8291",
    action: "Multi-Field Extraction & Normalization",
    details: "Normalized Port of Loading 'PKL (NORTHPORT)' to 'PORT KLANG'. Converted SI weight '22 MT' to '22,000 KG'.",
    status: "completed",
    timestamp: "2026-09-19T08:15:05Z"
  },
  {
    id: "TR-03",
    agentName: "Verification Engine Agent",
    caseId: "CASE-8291",
    action: "Deterministic Rule Verification",
    details: "Detected 2 defects: Container Count mismatch (3 vs 4) and Gross Weight mismatch (22,000 KG vs 22,500 KG).",
    status: "error_flagged",
    timestamp: "2026-09-19T08:15:08Z"
  },
  {
    id: "TR-04",
    agentName: "Validation Critic Agent",
    caseId: "CASE-8411",
    action: "Zero-Guess Confidence Gate",
    details: "Optical smudge detected on Gross Weight digit (64,000 vs 68,000 KG). Escalated to Human Review without guessing.",
    status: "escalated",
    timestamp: "2026-09-19T08:20:12Z"
  },
  {
    id: "TR-05",
    agentName: "Revision Intelligence Agent",
    caseId: "CASE-7612",
    action: "3-Way Document Version Diff",
    details: "Verified that Container Count and Gross Weight corrections were applied in BL V2, but flagged unauthorized Consignee alteration.",
    status: "review_required",
    timestamp: "2026-09-19T09:10:04Z"
  }
];

