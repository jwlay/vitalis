import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";

// pdf-parse v2: use PDFParse class with { data: buffer } constructor
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  let mod: any;
  try {
    mod = require("pdf-parse");
  } catch {
    mod = await import("pdf-parse");
    mod = mod.default || mod;
  }
  const { PDFParse } = mod;
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text || "";
}

import { getStorage } from "./storage-registry";
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
  limits: { fileSize: 20 * 1024 * 1024 },
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
        plainDescription: b.plainDescription,
        whyItMatters: b.whyItMatters,
        bodySystem: b.bodySystem,
        relevance: b.relevance,
        researchNotes: b.researchNotes,
        referenceRanges: b.referenceRanges,
        referenceSets: b.referenceSets,
        alternateUnits: b.alternateUnits,
        referenceLinks: b.referenceLinks,
      })),
      categories: CATEGORIES,
    });
  });

  // ======= PROFILES =======
  app.get("/api/profiles", async (_req, res) => {
    const profiles = await getStorage().getProfiles();
    res.json(profiles);
  });

  app.get("/api/profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await getStorage().getProfile(id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  });

  app.post("/api/profiles", async (req, res) => {
    const result = insertProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid profile data", details: result.error.issues });
    }
    const profile = await getStorage().createProfile(result.data);
    res.status(201).json(profile);
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await getStorage().updateProfile(id, req.body);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await getStorage().deleteProfile(id);
    if (!deleted) return res.status(404).json({ error: "Profile not found" });
    res.json({ success: true });
  });

  // ======= BLOOD TESTS =======
  app.get("/api/profiles/:profileId/tests", async (req, res) => {
    const profileId = parseInt(req.params.profileId);
    const tests = await getStorage().getBloodTests(profileId);
    res.json(tests);
  });

  app.get("/api/tests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const test = await getStorage().getBloodTest(id);
    if (!test) return res.status(404).json({ error: "Test not found" });
    res.json(test);
  });

  app.patch("/api/tests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { testDate, labName, notes } = req.body;
    const updated = await getStorage().updateBloodTest(id, { testDate, labName, notes });
    if (!updated) return res.status(404).json({ error: "Test not found" });
    res.json(updated);
  });

  app.delete("/api/tests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await getStorage().deleteBloodTest(id);
    if (!deleted) return res.status(404).json({ error: "Test not found" });
    res.json({ success: true });
  });

  // ======= PDF UPLOAD =======
  app.post("/api/profiles/:profileId/upload", upload.single("pdf"), async (req, res) => {
    try {
      const profileId = parseInt(req.params.profileId);
      const profile = await getStorage().getProfile(profileId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });

      let pdfText = "";
      try {
        pdfText = await parsePdfBuffer(req.file.buffer);
      } catch (e: any) {
        return res.status(400).json({ error: "Failed to parse PDF: " + (e?.message || "Unknown error") + ". Please ensure it is a valid, text-based PDF." });
      }

      if (!pdfText || pdfText.trim().length < 20) {
        return res.status(400).json({ error: "PDF appears to be empty or image-based (scanned). Please use a text-based PDF." });
      }

      const extractedDate = extractTestDate(pdfText);
      const extractedLab = extractLabName(pdfText);
      const testDate = req.body.testDate || extractedDate || new Date().toISOString().split("T")[0];
      const labName = req.body.labName || extractedLab || "Unknown Laboratory";
      const notes = req.body.notes || "";

      const bloodTest = await getStorage().createBloodTest({
        profileId, testDate, labName, notes,
        rawText: pdfText.substring(0, 50000),
        fileName: req.file.originalname,
      });

      const extracted = parsePdfText(pdfText);
      const dob = new Date(profile.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      const toInsert = [];
      for (const item of extracted) {
        const normalized = normalizeValue(item.originalValue, item.originalUnit, item.biomarkerKey);
        if (!normalized) continue;
        const flagStatus = getFlagStatus(normalized.value, item.biomarkerKey, profile.gender, age);
        toInsert.push({
          bloodTestId: bloodTest.id, profileId,
          biomarkerKey: item.biomarkerKey,
          value: normalized.value, unit: normalized.unit,
          originalValue: item.originalValue, originalUnit: item.originalUnit,
          testDate, flagStatus,
        });
      }

      const savedResults = await getStorage().createBiomarkerResults(toInsert);
      res.json({ bloodTest, extractedBiomarkers: savedResults.length, results: savedResults });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // ======= MANUAL TEST ENTRY =======
  app.post("/api/profiles/:profileId/manual-entry", async (req, res) => {
    try {
      const profileId = parseInt(req.params.profileId);
      const profile = await getStorage().getProfile(profileId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { testDate, labName, notes, biomarkers } = req.body;
      if (!testDate || !biomarkers || !Array.isArray(biomarkers)) {
        return res.status(400).json({ error: "Missing required fields: testDate, biomarkers[]" });
      }

      const bloodTest = await getStorage().createBloodTest({
        profileId, testDate,
        labName: labName || "Manual Entry",
        notes: notes || "",
        rawText: null, fileName: null,
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
          bloodTestId: bloodTest.id, profileId, biomarkerKey,
          value: normalized.value, unit: normalized.unit,
          originalValue: parseFloat(value), originalUnit: unit,
          testDate, flagStatus,
        });
      }

      const savedResults = await getStorage().createBiomarkerResults(toInsert);
      res.json({ bloodTest, results: savedResults });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ======= BIOMARKER RESULTS — CRUD =======
  app.get("/api/profiles/:profileId/results", async (req, res) => {
    const profileId = parseInt(req.params.profileId);
    const results = await getStorage().getBiomarkerResults(profileId);
    res.json(results);
  });

  app.get("/api/tests/:testId/results", async (req, res) => {
    const testId = parseInt(req.params.testId);
    const results = await getStorage().getBiomarkerResultsByTest(testId);
    res.json(results);
  });

  // Edit a single biomarker result
  app.patch("/api/results/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { value, unit, biomarkerKey } = req.body;

      // Re-normalize and re-flag if value changed
      let updates: any = {};
      if (value !== undefined) {
        const normalized = normalizeValue(parseFloat(value), unit || "mg/dL", biomarkerKey);
        if (normalized) {
          // Get the result to find profile for age
          const existingResults = await getStorage().getBiomarkerResultsByTest(0); // just need profile
          updates.value = normalized.value;
          updates.unit = normalized.unit;
        } else {
          updates.value = parseFloat(value);
          if (unit) updates.unit = unit;
        }
      }
      if (req.body.flagStatus !== undefined) updates.flagStatus = req.body.flagStatus;

      const updated = await getStorage().updateBiomarkerResult(id, updates);
      if (!updated) return res.status(404).json({ error: "Result not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a single biomarker result
  app.delete("/api/results/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await getStorage().deleteBiomarkerResult(id);
    if (!deleted) return res.status(404).json({ error: "Result not found" });
    res.json({ success: true });
  });

  // ======= ANALYTICS =======
  app.get("/api/profiles/:profileId/analytics", async (req, res) => {
    const profileId = parseInt(req.params.profileId);
    const profile = await getStorage().getProfile(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const results = await getStorage().getBiomarkerResults(profileId);
    const tests = await getStorage().getBloodTests(profileId);

    const byBiomarker: Record<string, Array<{ id: number; value: number; unit: string; testDate: string; flagStatus: string | null; testId: number }>> = {};
    for (const r of results) {
      if (!byBiomarker[r.biomarkerKey]) byBiomarker[r.biomarkerKey] = [];
      byBiomarker[r.biomarkerKey].push({
        id: r.id,
        value: r.value,
        unit: r.unit,
        testDate: r.testDate,
        flagStatus: r.flagStatus,
        testId: r.bloodTestId,
      });
    }
    for (const key of Object.keys(byBiomarker)) {
      byBiomarker[key].sort((a, b) => a.testDate.localeCompare(b.testDate));
    }

    const totalTests = tests.length;
    const totalMarkers = Object.keys(byBiomarker).length;
    const latestTest = tests[0];
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
      totalTests, totalMarkers, latestTest, flagCounts, byBiomarker,
      tests: tests.map((t) => ({ id: t.id, testDate: t.testDate, labName: t.labName, fileName: t.fileName, notes: t.notes })),
    });
  });

  // ======= EXPORT — Excel =======
  app.get("/api/profiles/:profileId/export", async (req, res) => {
    try {
      const profileId = parseInt(req.params.profileId);
      const profile = await getStorage().getProfile(profileId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const results = await getStorage().getBiomarkerResults(profileId);
      const tests = await getStorage().getBloodTests(profileId);

      const wb = XLSX.utils.book_new();

      // Sheet 1: Profile Info
      const profileSheet = XLSX.utils.aoa_to_sheet([
        ["Field", "Value"],
        ["Name", profile.name],
        ["Date of Birth", profile.dateOfBirth],
        ["Gender", profile.gender],
        ["Ethnicity", profile.ethnicity || ""],
        ["Notes", profile.notes || ""],
        ["Export Date", new Date().toISOString()],
      ]);
      XLSX.utils.book_append_sheet(wb, profileSheet, "Profile");

      // Sheet 2: All Results (flat)
      const biomarkerMap = new Map(BIOMARKER_DB.map(b => [b.key, b]));
      const resultsRows = [["Date", "Lab", "Biomarker", "Category", "Value", "Unit", "Status"]];
      const testMap = new Map(tests.map(t => [t.id, t]));
      for (const r of results.sort((a, b) => a.testDate.localeCompare(b.testDate))) {
        const bm = biomarkerMap.get(r.biomarkerKey);
        const test = testMap.get(r.bloodTestId);
        resultsRows.push([
          r.testDate,
          test?.labName || "Unknown",
          bm?.name || r.biomarkerKey,
          bm?.category || "Other",
          r.value,
          r.unit,
          r.flagStatus || "unknown",
        ]);
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resultsRows), "All Results");

      // Sheet 3: Per-biomarker trend (pivot)
      const biomarkerKeys = [...new Set(results.map(r => r.biomarkerKey))].sort();
      const sortedDates = [...new Set(results.map(r => r.testDate))].sort();
      const pivotHeader = ["Biomarker", "Category", "Unit", ...sortedDates];
      const pivotRows = [pivotHeader];
      for (const key of biomarkerKeys) {
        const bm = biomarkerMap.get(key);
        const byDate = new Map(results.filter(r => r.biomarkerKey === key).map(r => [r.testDate, r.value]));
        pivotRows.push([
          bm?.name || key,
          bm?.category || "Other",
          bm?.canonicalUnit || "",
          ...sortedDates.map(d => byDate.get(d) ?? ""),
        ]);
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pivotRows), "Trends (Pivot)");

      // Sheet 4: Test Summary
      const testRows = [["Date", "Lab", "File", "Notes", "Biomarkers Measured"]];
      for (const t of tests) {
        const count = results.filter(r => r.bloodTestId === t.id).length;
        testRows.push([t.testDate, t.labName || "", t.fileName || "", t.notes || "", count]);
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(testRows), "Tests");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Disposition", `attachment; filename="vitalis-${profile.name.replace(/\s+/g, "_")}-export.xlsx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buf);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ======= PUBLIC API (programmatic access) =======
  // These endpoints mirror the internal API but are explicitly documented
  // GET /api/v1/profiles/:id/summary
  app.get("/api/v1/profiles/:id/summary", async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await getStorage().getProfile(id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    const results = await getStorage().getBiomarkerResults(id);
    const tests = await getStorage().getBloodTests(id);

    const biomarkerMap = new Map(BIOMARKER_DB.map(b => [b.key, b]));
    const byBiomarker: Record<string, any[]> = {};
    for (const r of results) {
      if (!byBiomarker[r.biomarkerKey]) byBiomarker[r.biomarkerKey] = [];
      byBiomarker[r.biomarkerKey].push({
        id: r.id,
        value: r.value,
        unit: r.unit,
        testDate: r.testDate,
        flagStatus: r.flagStatus,
        bloodTestId: r.bloodTestId,
      });
    }

    res.json({
      profile: { id: profile.id, name: profile.name, gender: profile.gender, dateOfBirth: profile.dateOfBirth },
      tests: tests.map(t => ({ id: t.id, testDate: t.testDate, labName: t.labName })),
      biomarkers: Object.entries(byBiomarker).map(([key, history]) => {
        const bm = biomarkerMap.get(key);
        return {
          key,
          name: bm?.name || key,
          category: bm?.category || "Other",
          unit: bm?.canonicalUnit || "",
          history: history.sort((a, b) => a.testDate.localeCompare(b.testDate)),
          latest: history.sort((a, b) => b.testDate.localeCompare(a.testDate))[0],
        };
      }),
    });
  });

  // GET /api/v1/profiles/:id/biomarkers
  app.get("/api/v1/profiles/:id/biomarkers", async (req, res) => {
    const id = parseInt(req.params.id);
    const results = await getStorage().getBiomarkerResults(id);
    res.json(results);
  });

  // GET /api/v1/profiles/:id/tests
  app.get("/api/v1/profiles/:id/tests", async (req, res) => {
    const id = parseInt(req.params.id);
    const tests = await getStorage().getBloodTests(id);
    res.json(tests);
  });

  // GET /api/v1/biomarkers — reference data
  app.get("/api/v1/biomarkers", (_req, res) => {
    res.json(BIOMARKER_DB.map(b => ({
      key: b.key, name: b.name, category: b.category,
      canonicalUnit: b.canonicalUnit, referenceRanges: b.referenceRanges,
    })));
  });

  // Preview PDF without saving
  app.post("/api/parse-preview", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });
      let pdfText = "";
      try { pdfText = await parsePdfBuffer(req.file.buffer); }
      catch (e) { return res.status(400).json({ error: "Failed to parse PDF" }); }

      const extracted = parsePdfText(pdfText);
      const extractedDate = extractTestDate(pdfText);
      const extractedLab = extractLabName(pdfText);
      const preview = extracted.map((item) => {
        const biomarker = BIOMARKER_MAP.get(item.biomarkerKey);
        return {
          biomarkerKey: item.biomarkerKey,
          biomarkerName: biomarker?.name || item.biomarkerKey,
          originalValue: item.originalValue, originalUnit: item.originalUnit,
          category: biomarker?.category,
        };
      });
      res.json({ extractedBiomarkers: preview, extractedDate, extractedLab, textPreview: pdfText.substring(0, 1000) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
