import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

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

      // Sheet 5: Reference Sets used per biomarker
      const refPrefs: Record<string, string> = profile.referencePreferences
        ? JSON.parse(profile.referencePreferences as string) : {};
      const refRows: any[][] = [["Biomarker", "Category", "Reference Set Used", "Source", "Source URL", "Ranges (Label: Low–High)"]];
      for (const key of biomarkerKeys) {
        const bm = biomarkerMap.get(key);
        if (!bm) continue;
        const setId = refPrefs[key] || "clinical";
        const refSet = bm.referenceSets?.find(s => s.id === setId) || bm.referenceSets?.[0];
        const rangesStr = refSet
          ? refSet.ranges.map(r => {
              const lo = r.criticalLow ?? r.optimalLow ?? r.low ?? "—";
              const hi = r.criticalHigh ?? r.optimalHigh ?? r.high ?? "—";
              return `${r.label}: ${lo}–${hi}`;
            }).join(" | ")
          : "Default ranges";
        refRows.push([
          bm.name, bm.category,
          refSet ? refSet.label : "Default",
          refSet ? refSet.source : "",
          refSet ? refSet.sourceUrl || "" : "",
          rangesStr,
        ]);
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(refRows), "Reference Sets");

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

  // ======= EXPORT — PDF Health Report =======
  app.get("/api/profiles/:profileId/export.pdf", async (req, res) => {
    try {
      const profileId = parseInt(req.params.profileId);
      const profile = await getStorage().getProfile(profileId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const results = await getStorage().getBiomarkerResults(profileId);
      const tests = await getStorage().getBloodTests(profileId);

      const refPrefs: Record<string, string> = profile.referencePreferences
        ? JSON.parse(profile.referencePreferences as string) : {};

      const biomarkerMap = new Map(BIOMARKER_DB.map(b => [b.key, b]));

      // Group results by biomarker, sorted by date
      const byBiomarker: Record<string, typeof results> = {};
      for (const r of results) {
        if (!byBiomarker[r.biomarkerKey]) byBiomarker[r.biomarkerKey] = [];
        byBiomarker[r.biomarkerKey].push(r);
      }
      for (const key of Object.keys(byBiomarker)) {
        byBiomarker[key].sort((a, b) => a.testDate.localeCompare(b.testDate));
      }

      // Calculate age
      const dob = new Date(profile.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Group biomarkers by body system / category
      const byCategory: Record<string, string[]> = {};
      for (const key of Object.keys(byBiomarker)) {
        const bm = biomarkerMap.get(key);
        const cat = bm?.bodySystem || bm?.category || "Other";
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(key);
      }

      // Status styling
      const statusColors: Record<string, string> = {
        optimal: "#10b981", normal: "#f59e0b", low: "#f97316",
        high: "#f97316", critical_low: "#ef4444", critical_high: "#ef4444",
      };
      const statusLabels: Record<string, string> = {
        optimal: "Optimal", normal: "Normal", low: "Below Range",
        high: "Above Range", critical_low: "Critically Low", critical_high: "Critically High",
      };

      // Helper: safe number
      const safeNum = (v: any): number => (v != null && !isNaN(Number(v)) ? Number(v) : 0);

      // Create PDF
      const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuf = Buffer.concat(chunks);
        res.setHeader("Content-Disposition", `attachment; filename="vitalis-report-${profile.name.replace(/\s+/g, "_")}.pdf"`);
        res.setHeader("Content-Type", "application/pdf");
        res.send(pdfBuf);
      });

      const pageW = doc.page.width - 100;
      const col1 = 50;

      // Helper: colored status badge
      const drawStatus = (status: string, x: number, y: number) => {
        const color = statusColors[status] || "#6b7280";
        const label = statusLabels[status] || status;
        const w = doc.widthOfString(label) + 12;
        doc.save().roundedRect(x, y, w, 14, 4).fill(color).restore();
        doc.fill("white").fontSize(8).font("Helvetica").text(label, x + 6, y + 3, { lineBreak: false });
        doc.fill("#1e293b");
      };

      // Helper: section divider
      const drawCategoryHeader = (label: string) => {
        const y = doc.y + 5;
        doc.rect(col1, y, pageW, 22).fill("#1e293b");
        doc.fill("white").fontSize(11).font("Helvetica-Bold").text(label.toUpperCase(), col1 + 12, y + 6, { lineBreak: false });
        doc.fill("#1e293b");
        doc.y = y + 28;
      };

      // ── COVER PAGE ──
      doc.rect(0, 0, doc.page.width, 140).fill("#1e293b");
      doc.fill("white").fontSize(28).font("Helvetica-Bold").text("VITALIS", col1, 45, { lineBreak: false });
      doc.fill("white").fontSize(13).font("Helvetica").text("Health Report", col1 + 115, 52, { lineBreak: false });
      doc.fill("white").fontSize(10).font("Helvetica")
        .text("Generated: " + new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }), col1, 100, { lineBreak: false });
      doc.fill("white").fontSize(10).text("Powered by Vitalis Blood Test Tracker", doc.page.width - 280, 100, { lineBreak: false });

      // Move below the header
      doc.y = 165;
      doc.fill("#1e293b");

      // ── PROFILE INFO BOX ──
      const profBoxY = doc.y;
      doc.roundedRect(col1, profBoxY, pageW, 95, 6).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fill("#1e293b").fontSize(13).font("Helvetica-Bold").text("Patient Profile", col1 + 15, profBoxY + 12, { lineBreak: false });
      doc.fill("#64748b").fontSize(9.5).font("Helvetica")
        .text(`Name: ${profile.name}`, col1 + 15, profBoxY + 32, { lineBreak: false });
      doc.text(`Date of Birth: ${profile.dateOfBirth}  (Age ${age})`, col1 + 15, profBoxY + 47, { lineBreak: false });
      doc.text(`Gender: ${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}`, col1 + 15, profBoxY + 62, { lineBreak: false });
      doc.text(`Tests on file: ${tests.length}`, col1 + 15, profBoxY + 77, { lineBreak: false });
      doc.y = profBoxY + 102;
      doc.fill("#1e293b");

      // ── SUMMARY STATS ──
      const latestTest = [...tests].sort((a, b) => b.testDate.localeCompare(a.testDate))[0];
      if (latestTest) {
        const latestResults = results.filter(r => r.bloodTestId === latestTest.id);
        const flagCounts = {
          optimal: latestResults.filter(r => r.flagStatus === "optimal").length,
          normal: latestResults.filter(r => r.flagStatus === "normal").length,
          attention: latestResults.filter(r => ["low","high","critical_low","critical_high"].includes(r.flagStatus || "")).length,
        };

        doc.fill("#1e293b").fontSize(12).font("Helvetica-Bold").text("Latest Test Summary", col1, doc.y + 8, { lineBreak: false });
        doc.y += 22;
        doc.fill("#64748b").fontSize(9).font("Helvetica")
          .text(`Test date: ${latestTest.testDate}  ·  Lab: ${latestTest.labName || "Unknown"}`, col1, doc.y, { lineBreak: false });
        doc.y += 16;

        const statBoxW = Math.floor((pageW - 20) / 3);
        const statY = doc.y;
        const statData = [
          { label: "Optimal", val: flagCounts.optimal, color: "#10b981" },
          { label: "Normal", val: flagCounts.normal, color: "#f59e0b" },
          { label: "Need Attention", val: flagCounts.attention, color: "#ef4444" },
        ];
        for (let i = 0; i < statData.length; i++) {
          const s = statData[i];
          const bx = col1 + i * (statBoxW + 10);
          doc.save().roundedRect(bx, statY, statBoxW, 42, 5).fill(s.color).restore();
          doc.roundedRect(bx + 1, statY + 1, statBoxW - 2, 40, 4).fill("#ffffff");
          doc.fill(s.color).fontSize(22).font("Helvetica-Bold").text(String(s.val), bx + 12, statY + 8, { lineBreak: false });
          doc.fill("#475569").fontSize(9).font("Helvetica").text(s.label, bx + 12 + 26, statY + 14, { lineBreak: false });
        }
        doc.y = statY + 55;
        doc.fill("#1e293b");
      }

      // ── BIOMARKER SECTIONS ──
      for (const [category, keys] of Object.entries(byCategory).sort()) {
        if (doc.y > doc.page.height - 150) doc.addPage();
        drawCategoryHeader(category);

        for (const key of [...keys].sort()) {
          const bm = biomarkerMap.get(key);
          if (!bm) continue;
          const history = byBiomarker[key];
          const latest = history[history.length - 1];
          if (!latest) continue;

          const setId = refPrefs[key] || "clinical";
          const refSet = bm.referenceSets?.find(s => s.id === setId) || bm.referenceSets?.[0];

          const cardH = bm.plainDescription ? 112 : 88;
          if (doc.y > doc.page.height - cardH - 20) doc.addPage();

          const cardY = doc.y + 4;
          doc.roundedRect(col1, cardY, pageW, cardH, 5).fillAndStroke("#f8fafc", "#e2e8f0");

          // Name
          doc.fill("#1e293b").fontSize(11).font("Helvetica-Bold")
            .text(bm.name, col1 + 12, cardY + 10, { lineBreak: false });

          // Value (right-aligned)
          const valVal = safeNum(latest.value);
          const valText = `${valVal.toFixed(2)} ${latest.unit || ""}`;
          doc.fill("#1e293b").fontSize(12).font("Helvetica-Bold")
            .text(valText, col1 + 12, cardY + 10, { width: pageW - 24, align: "right", lineBreak: false });

          // Status badge
          if (latest.flagStatus) {
            drawStatus(latest.flagStatus, col1 + 12, cardY + 28);
          }

          // Trend
          if (history.length > 1) {
            const trendStr = history.slice(-4).map(h => safeNum(h.value).toFixed(1)).join(" → ");
            doc.fill("#64748b").fontSize(8).font("Helvetica")
              .text(`Trend: ${trendStr} ${latest.unit || ""}`, col1 + 12, cardY + 28, { width: pageW - 24, align: "right", lineBreak: false });
          }

          // Description
          if (bm.plainDescription) {
            doc.fill("#475569").fontSize(8.5).font("Helvetica")
              .text(bm.plainDescription, col1 + 12, cardY + 46, { width: pageW - 24 });
          }

          // Reference set info
          if (refSet) {
            const refY = cardY + (bm.plainDescription ? 78 : 50);
            const rangeText = refSet.ranges?.map((r: any) => `${r.label}: ${r.low != null ? r.low + "–" : "<"}${r.high ?? ""}`).slice(0, 3).join("  |  ") || "";
            doc.fill("#94a3b8").fontSize(7.5).font("Helvetica")
              .text(`Ref: ${refSet.label} (${refSet.source})${rangeText ? "  ·  " + rangeText : ""}`, col1 + 12, refY, { width: pageW - 24, lineBreak: false });
          }

          doc.y = cardY + cardH + 4;
          doc.fill("#1e293b");
        }
      }

      // ── RECOMMENDATIONS PAGE ──
      doc.addPage();
      doc.rect(0, 0, doc.page.width, 50).fill("#1e293b");
      doc.fill("white").fontSize(16).font("Helvetica-Bold").text("Recommendations", col1, 17, { lineBreak: false });
      doc.y = 68;
      doc.fill("#1e293b");

      const needsAttention = Object.entries(byBiomarker)
        .map(([key, hist]) => ({ key, latest: hist[hist.length - 1], bm: biomarkerMap.get(key) }))
        .filter(({ latest }) => latest && ["low","high","critical_low","critical_high"].includes(latest.flagStatus || ""));

      if (needsAttention.length === 0) {
        const boxY = doc.y;
        doc.roundedRect(col1, boxY, pageW, 60, 6).fill("#dcfce7");
        doc.fill("#166534").fontSize(12).font("Helvetica-Bold")
          .text("✓ All Biomarkers Within Normal Range", col1 + 15, boxY + 12, { lineBreak: false });
        doc.fill("#166534").fontSize(10).font("Helvetica")
          .text("Your latest results show no markers outside normal ranges. Keep up the great work!", col1 + 15, boxY + 32, { width: pageW - 30 });
        doc.y = boxY + 68;
      } else {
        for (const { key, latest, bm } of needsAttention) {
          if (!bm || !latest) continue;
          if (doc.y > doc.page.height - 120) doc.addPage();

          const isHigh = latest.flagStatus?.includes("high");
          const recCardY = doc.y + 4;
          const recBg = isHigh ? "#fff7ed" : "#eff6ff";
          const recBorder = isHigh ? "#fed7aa" : "#bfdbfe";
          const recAccent = isHigh ? "#c2410c" : "#1d4ed8";

          doc.roundedRect(col1, recCardY, pageW, 95, 5).fillAndStroke(recBg, recBorder);

          // Biomarker name + value
          const recVal = safeNum(latest.value);
          doc.fill(recAccent).fontSize(11).font("Helvetica-Bold")
            .text(`${bm.name}: ${recVal.toFixed(2)} ${latest.unit || ""}`, col1 + 12, recCardY + 10, { lineBreak: false });

          // Status badge
          if (latest.flagStatus) drawStatus(latest.flagStatus, col1 + 12, recCardY + 28);

          // Why it matters
          if (bm.whyItMatters) {
            doc.fill("#374151").fontSize(9).font("Helvetica")
              .text(bm.whyItMatters, col1 + 12, recCardY + 48, { width: pageW - 24 });
          }

          // Reference range context
          const setId = refPrefs[key] || "clinical";
          const refSet = bm.referenceSets?.find(s => s.id === setId) || bm.referenceSets?.[0];
          if (refSet) {
            doc.fill("#64748b").fontSize(7.5).font("Helvetica")
              .text(`Reference: ${refSet.label} (${refSet.source})`, col1 + 12, recCardY + 76, { width: pageW - 24, lineBreak: false });
          }

          doc.y = recCardY + 102;
          doc.fill("#1e293b");
        }
      }

      // ── DISCLAIMER ──
      if (doc.y > doc.page.height - 90) {
        doc.addPage();
        doc.y = 50;
      } else {
        doc.y += 20;
      }
      const discY = doc.y;
      doc.roundedRect(col1, discY, pageW, 60, 5).fill("#f1f5f9");
      doc.fill("#64748b").fontSize(8).font("Helvetica")
        .text("DISCLAIMER: This report is generated by Vitalis for personal health tracking purposes only. " +
          "It is not a medical diagnosis and should not replace consultation with a qualified healthcare professional. " +
          "Reference ranges are for guidance only and may vary by laboratory and individual circumstances. " +
          "Always consult your doctor for interpretation of your results and any health concerns.",
          col1 + 10, discY + 8, { width: pageW - 20 });
      doc.fill("#94a3b8").fontSize(7).font("Helvetica")
        .text("Generated by Vitalis Blood Test Tracker · Powered by Perplexity Computer", col1 + 10, discY + 48, { lineBreak: false });

      doc.end();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
