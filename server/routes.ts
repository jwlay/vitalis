import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";

// pdf-parse v2: use PDFParse class with { data: buffer } constructor
// Works in both ESM (dev) and CJS (production) contexts via dynamic require/import
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  let mod: any;
  try {
    // In CJS production build, native require is available
    mod = require("pdf-parse");
  } catch {
    // In ESM dev context, use dynamic import
    mod = await import("pdf-parse");
    mod = mod.default || mod;
  }
  const { PDFParse } = mod;
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text || "";
}
import { storage } from "./storage";
import { insertProfileSchema, insertBloodTestSchema } from "@shared/schema";
import { 
  BIOMARKER_DB, 
  BIOMARKER_MAP, 
  ALIAS_MAP, 
  CATEGORIES, 
  parsePdfText, 
  normalizeValue, 
  getFlagStatus,
  extractTestDate,
  extractLabName,
} from "./biomarkers";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  },
});

export async function registerRoutes(httpServer: Server, app: Express) {
  // ======= BIOMARKER REFERENCE DATA =======
  app.get("/api/biomarkers", (_req, res) => {
    res.json({
      biomarkers: BIOMARKER_DB.map((b) => ({
        key: b.key,
        name: b.name,
        shortName: b.shortName,
        category: b.category,
        canonicalUnit: b.canonicalUnit,
        description: b.description,
        relevance: b.relevance,
        researchNotes: b.researchNotes,
        referenceRanges: b.referenceRanges,
      })),
      categories: CATEGORIES,
    });
  });

  // ======= PROFILES =======
  app.get("/api/profiles", async (_req, res) => {
    const profiles = await storage.getProfiles();
    res.json(profiles);
  });

  app.get("/api/profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await storage.getProfile(id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  });

  app.post("/api/profiles", async (req, res) => {
    const result = insertProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid profile data", details: result.error.issues });
    }
    const profile = await storage.createProfile(result.data);
    res.status(201).json(profile);
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await storage.updateProfile(id, req.body);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteProfile(id);
    if (!deleted) return res.status(404).json({ error: "Profile not found" });
    res.json({ success: true });
  });

  // ======= BLOOD TESTS =======
  app.get("/api/profiles/:profileId/tests", async (req, res) => {
    const profileId = parseInt(req.params.profileId);
    const tests = await storage.getBloodTests(profileId);
    res.json(tests);
  });

  app.delete("/api/tests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteBloodTest(id);
    if (!deleted) return res.status(404).json({ error: "Test not found" });
    res.json({ success: true });
  });

  // ======= PDF UPLOAD & PARSING =======
  app.post("/api/profiles/:profileId/upload", upload.single("pdf"), async (req, res) => {
    try {
      const profileId = parseInt(req.params.profileId);
      const profile = await storage.getProfile(profileId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });

      // Parse PDF
      let pdfText = "";
      try {
        pdfText = await parsePdfBuffer(req.file.buffer);
      } catch (e: any) {
        console.error("[upload] PDF parse error:", e?.message || e);
        return res.status(400).json({ error: "Failed to parse PDF: " + (e?.message || "Unknown error") + ". Please ensure it is a valid, text-based PDF." });
      }

      if (!pdfText || pdfText.trim().length < 20) {
        return res.status(400).json({ error: "PDF appears to be empty or image-based (scanned). Please use a text-based PDF exported from a lab system." });
      }

      // Extract metadata
      const extractedDate = extractTestDate(pdfText);
      const extractedLab = extractLabName(pdfText);
      const testDate = req.body.testDate || extractedDate || new Date().toISOString().split("T")[0];
      const labName = req.body.labName || extractedLab || "Unknown Laboratory";
      const notes = req.body.notes || "";

      // Create blood test record
      const bloodTest = await storage.createBloodTest({
        profileId,
        testDate,
        labName,
        notes,
        rawText: pdfText.substring(0, 50000), // store first 50k chars
        fileName: req.file.originalname,
      });

      // Parse biomarkers
      const extracted = parsePdfText(pdfText);

      // Calculate profile age
      const dob = new Date(profile.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Create biomarker result records
      const toInsert = [];
      for (const item of extracted) {
        const normalized = normalizeValue(item.originalValue, item.originalUnit, item.biomarkerKey);
        if (!normalized) continue;

        const flagStatus = getFlagStatus(normalized.value, item.biomarkerKey, profile.gender, age);

        toInsert.push({
          bloodTestId: bloodTest.id,
          profileId,
          biomarkerKey: item.biomarkerKey,
          value: normalized.value,
          unit: normalized.unit,
          originalValue: item.originalValue,
          originalUnit: item.originalUnit,
          testDate,
          flagStatus,
        });
      }

      const savedResults = await storage.createBiomarkerResults(toInsert);

      res.json({
        bloodTest,
        extractedBiomarkers: savedResults.length,
        results: savedResults,
        rawTextPreview: pdfText.substring(0, 500),
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Manual biomarker entry (add individual result)
  app.post("/api/profiles/:profileId/manual-entry", async (req, res) => {
    try {
      const profileId = parseInt(req.params.profileId);
      const profile = await storage.getProfile(profileId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { testDate, labName, notes, biomarkers } = req.body;
      
      if (!testDate || !biomarkers || !Array.isArray(biomarkers)) {
        return res.status(400).json({ error: "Missing required fields: testDate, biomarkers[]" });
      }

      const bloodTest = await storage.createBloodTest({
        profileId,
        testDate,
        labName: labName || "Manual Entry",
        notes: notes || "",
        rawText: null,
        fileName: null,
      });

      const dob = new Date(profile.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      const toInsert = [];
      for (const item of biomarkers) {
        const { biomarkerKey, value, unit } = item;
        const normalized = normalizeValue(parseFloat(value), unit, biomarkerKey);
        if (!normalized) continue;

        const flagStatus = getFlagStatus(normalized.value, biomarkerKey, profile.gender, age);
        toInsert.push({
          bloodTestId: bloodTest.id,
          profileId,
          biomarkerKey,
          value: normalized.value,
          unit: normalized.unit,
          originalValue: parseFloat(value),
          originalUnit: unit,
          testDate,
          flagStatus,
        });
      }

      const savedResults = await storage.createBiomarkerResults(toInsert);
      res.json({ bloodTest, results: savedResults });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ======= BIOMARKER RESULTS =======
  app.get("/api/profiles/:profileId/results", async (req, res) => {
    const profileId = parseInt(req.params.profileId);
    const results = await storage.getBiomarkerResults(profileId);
    res.json(results);
  });

  app.get("/api/tests/:testId/results", async (req, res) => {
    const testId = parseInt(req.params.testId);
    const results = await storage.getBiomarkerResultsByTest(testId);
    res.json(results);
  });

  // ======= ANALYTICS =======
  app.get("/api/profiles/:profileId/analytics", async (req, res) => {
    const profileId = parseInt(req.params.profileId);
    const profile = await storage.getProfile(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const results = await storage.getBiomarkerResults(profileId);
    const tests = await storage.getBloodTests(profileId);

    // Group results by biomarker key
    const byBiomarker: Record<string, Array<{ value: number; unit: string; testDate: string; flagStatus: string | null; testId: number }>> = {};
    for (const r of results) {
      if (!byBiomarker[r.biomarkerKey]) byBiomarker[r.biomarkerKey] = [];
      byBiomarker[r.biomarkerKey].push({
        value: r.value,
        unit: r.unit,
        testDate: r.testDate,
        flagStatus: r.flagStatus,
        testId: r.bloodTestId,
      });
    }

    // Sort each series by date
    for (const key of Object.keys(byBiomarker)) {
      byBiomarker[key].sort((a, b) => a.testDate.localeCompare(b.testDate));
    }

    // Summary stats
    const totalTests = tests.length;
    const totalMarkers = Object.keys(byBiomarker).length;
    const latestTest = tests[0];
    
    // Flag counts for latest test
    const latestResults = latestTest ? results.filter((r) => r.bloodTestId === latestTest.id) : [];
    const flagCounts = {
      optimal: latestResults.filter((r) => r.flagStatus === "optimal").length,
      normal: latestResults.filter((r) => r.flagStatus === "normal").length,
      low: latestResults.filter((r) => r.flagStatus === "low").length,
      high: latestResults.filter((r) => r.flagStatus === "high").length,
      critical_low: latestResults.filter((r) => r.flagStatus === "critical_low").length,
      critical_high: latestResults.filter((r) => r.flagStatus === "critical_high").length,
    };

    res.json({
      totalTests,
      totalMarkers,
      latestTest,
      flagCounts,
      byBiomarker,
      tests: tests.map((t) => ({ id: t.id, testDate: t.testDate, labName: t.labName, fileName: t.fileName })),
    });
  });

  // Parse PDF without saving (preview)
  app.post("/api/parse-preview", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });

      let pdfText = "";
      try {
        pdfText = await parsePdfBuffer(req.file.buffer);
      } catch (e) {
        return res.status(400).json({ error: "Failed to parse PDF" });
      }

      const extracted = parsePdfText(pdfText);
      const extractedDate = extractTestDate(pdfText);
      const extractedLab = extractLabName(pdfText);

      const preview = extracted.map((item) => {
        const biomarker = BIOMARKER_MAP.get(item.biomarkerKey);
        return {
          biomarkerKey: item.biomarkerKey,
          biomarkerName: biomarker?.name || item.biomarkerKey,
          originalValue: item.originalValue,
          originalUnit: item.originalUnit,
          category: biomarker?.category,
        };
      });

      res.json({
        extractedBiomarkers: preview,
        extractedDate,
        extractedLab,
        textPreview: pdfText.substring(0, 1000),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
