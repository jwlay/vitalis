/**
 * Demo data seeding for Vitalis
 * Creates a rich demo profile (Alex Müller, 35M) with 3 blood tests over 14 months
 * showing realistic trends: improving cholesterol, recovering vitamin D, progressing HbA1c.
 */
import { storage } from "./storage";
import { normalizeValue, getFlagStatus } from "./biomarkers";

interface SeedReading {
  biomarkerKey: string;
  value: number;
  unit: string;
}

const DEMO_PROFILE = {
  name: "Alex Müller",
  dateOfBirth: "1989-04-12",
  gender: "male" as const,
  ethnicity: "European",
  notes: "Demo profile — 3 blood tests tracking cardiovascular and metabolic health over 14 months",
};

// Three tests: Jan 2024 (baseline, some red flags), Aug 2024 (improving), Mar 2025 (excellent)
const TESTS = [
  {
    testDate: "2024-01-08",
    labName: "LabCorp München",
    fileName: "blood_test_jan_2024.pdf",
    notes: "Annual checkup. Patient reports fatigue and poor sleep.",
  },
  {
    testDate: "2024-08-15",
    labName: "LabCorp München",
    fileName: "blood_test_aug_2024.pdf",
    notes: "Follow-up after dietary changes and exercise programme. Patient reports improved energy.",
  },
  {
    testDate: "2025-03-05",
    labName: "Synlab Berlin",
    fileName: "blood_test_mar_2025.pdf",
    notes: "Annual checkup. Patient on low-carb diet for 8 months. Supplement: Vitamin D 4000 IU/day.",
  },
];

// [jan2024, aug2024, mar2025] — realistic trending values
const READINGS: { key: string; unit: string; values: [number, number, number] }[] = [
  // === Complete Blood Count ===
  { key: "hemoglobin",         unit: "g/dL",       values: [14.8, 15.1, 15.3] },
  { key: "hematocrit",         unit: "%",           values: [44.1, 44.6, 45.0] },
  { key: "red_blood_cells",    unit: "10⁶/μL",      values: [4.88, 4.92, 4.95] },
  { key: "white_blood_cells",  unit: "10³/μL",      values: [7.2,  6.8,  6.1]  },
  { key: "platelets",          unit: "10³/μL",      values: [242,  251,  248]  },

  // === Metabolic (progressing issues → resolved) ===
  { key: "glucose",            unit: "mg/dL",       values: [104, 98,  91]  }, // prediabetes → normal
  { key: "hba1c",              unit: "%",           values: [5.8, 5.6, 5.3] }, // prediabetes → optimal
  { key: "insulin_fasting",    unit: "μIU/mL",      values: [14,  11,  7]   }, // elevated → optimal
  { key: "creatinine",         unit: "mg/dL",       values: [1.08, 1.06, 1.05] },
  { key: "egfr",               unit: "mL/min",      values: [88,  91,  96]  },
  { key: "urea",               unit: "mg/dL",       values: [18.5, 17.2, 16.8] },

  // === Liver ===
  { key: "alt",                unit: "U/L",         values: [42,  35,  27]  }, // high → normal (fatty liver)
  { key: "ast",                unit: "U/L",         values: [38,  31,  24]  },
  { key: "ggt",                unit: "U/L",         values: [51,  44,  32]  },
  { key: "bilirubin_total",    unit: "mg/dL",       values: [0.8, 0.9, 0.9] },

  // === Lipids (big improvement) ===
  { key: "total_cholesterol",  unit: "mg/dL",       values: [241, 224, 208] }, // high → borderline → ok
  { key: "ldl_cholesterol",    unit: "mg/dL",       values: [162, 148, 134] }, // high → borderline → ok
  { key: "hdl_cholesterol",    unit: "mg/dL",       values: [44,  48,  52]  }, // low → ok → good
  { key: "triglycerides",      unit: "mg/dL",       values: [198, 168, 138] }, // high → border → normal
  { key: "homocysteine",       unit: "μmol/L",      values: [14.2, 11.8, 9.4] }, // elevated → normal

  // === Hormones ===
  { key: "testosterone_total", unit: "ng/dL",       values: [448, 492, 524] },
  { key: "cortisol",           unit: "μg/dL",       values: [18.2, 16.1, 14.8] }, // slightly high → normal
  { key: "tsh",                unit: "μIU/mL",      values: [2.8,  2.4,  2.1]  },
  { key: "free_t4",            unit: "ng/dL",       values: [1.1,  1.2,  1.2]  },

  // === Vitamins & Minerals ===
  { key: "vitamin_d",          unit: "ng/mL",       values: [14,  22,  31]  }, // deficient → insufficient → sufficient
  { key: "vitamin_b12",        unit: "pg/mL",       values: [312, 398, 468] },
  { key: "folate",             unit: "ng/mL",       values: [5.8, 7.1, 8.2] },

  // === Inflammation ===
  { key: "crp",                unit: "mg/L",        values: [3.2, 2.1, 0.9] }, // elevated → normal
];

export async function seedDemoData(): Promise<void> {
  try {
    // Check if demo profile already exists
    const existing = await storage.getProfiles();
    if (existing.some((p) => p.name === DEMO_PROFILE.name)) {
      return; // Already seeded
    }

    const profile = await storage.createProfile(DEMO_PROFILE);

    for (let testIdx = 0; testIdx < TESTS.length; testIdx++) {
      const testMeta = TESTS[testIdx];
      const bloodTest = await storage.createBloodTest({
        profileId: profile.id,
        testDate: testMeta.testDate,
        labName: testMeta.labName,
        fileName: testMeta.fileName,
        notes: testMeta.notes,
        rawText: null,
      });

      const resultsToInsert = [];
      for (const reading of READINGS) {
        const rawValue = reading.values[testIdx];
        const normalized = normalizeValue(rawValue, reading.unit, reading.key);
        if (normalized === null) continue;

        // Calculate age from dateOfBirth
        const birthYear = parseInt(profile.dateOfBirth.split('-')[0]);
        const testYear = parseInt(testMeta.testDate.split('-')[0]);
        const age = testYear - birthYear;
        const flagStatus = getFlagStatus(normalized.value, reading.key, profile.gender, age);

        resultsToInsert.push({
          bloodTestId: bloodTest.id,
          profileId: profile.id,
          biomarkerKey: reading.key,
          value: normalized.value,
          unit: normalized.unit,
          testDate: testMeta.testDate,
          originalValue: rawValue,
          originalUnit: reading.unit,
          flagStatus,
        });
      }

      await storage.createBiomarkerResults(resultsToInsert);
    }

    console.log(
      `[seed] Demo profile "${DEMO_PROFILE.name}" created with ${TESTS.length} blood tests and ${READINGS.length} tracked biomarkers`
    );
  } catch (err) {
    console.error("[seed] Failed to seed demo data:", err);
  }
}
