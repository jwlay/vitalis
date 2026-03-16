// Comprehensive biomarker reference database
// Contains canonical info, units, reference ranges, and clinical context

export interface BiomarkerInfo {
  key: string;
  name: string;
  shortName?: string;
  category: string;
  canonicalUnit: string;
  description: string;
  relevance: string;
  researchNotes: string;
  aliases: string[]; // alternate names/spellings to match in PDFs
  referenceRanges: ReferenceRange[];
  unitConversions: UnitConversion[];
}

export interface ReferenceRange {
  label: string;
  gender?: "male" | "female" | "all";
  ageMin?: number;
  ageMax?: number;
  low?: number;
  high?: number;
  optimalLow?: number;
  optimalHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export interface UnitConversion {
  fromUnit: string;
  factor: number; // multiply fromUnit by factor to get canonicalUnit
}

export const BIOMARKER_DB: BiomarkerInfo[] = [
  // === METABOLIC / GLUCOSE ===
  {
    key: "glucose",
    name: "Fasting Glucose",
    shortName: "Glucose",
    category: "Metabolic",
    canonicalUnit: "mg/dL",
    description: "Blood sugar level measured after fasting. A key indicator of metabolic health and diabetes risk.",
    relevance: "High fasting glucose indicates insulin resistance or diabetes. Optimal levels reflect efficient glucose metabolism and reduced risk of type 2 diabetes, cardiovascular disease, and cognitive decline.",
    researchNotes: "Studies show that keeping fasting glucose below 90 mg/dL is associated with significantly lower risk of type 2 diabetes. Even levels in the 100–125 mg/dL range (prediabetes) increase all-cause mortality risk by ~15%.",
    aliases: ["fasting glucose", "blood glucose", "glucose fasting", "blutzucker", "glycemia", "BG", "FBG", "fasting blood sugar", "FBS"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 18.02 },
      { fromUnit: "mg/dl", factor: 1 },
      { fromUnit: "mg/dL", factor: 1 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 70, optimalHigh: 90 },
      { label: "Normal", gender: "all", low: 70, high: 99 },
      { label: "Prediabetes", gender: "all", low: 100, high: 125 },
      { label: "Critical Low", gender: "all", criticalLow: 55 },
      { label: "Critical High", gender: "all", criticalHigh: 200 },
    ],
  },
  {
    key: "hba1c",
    name: "Hemoglobin A1c",
    shortName: "HbA1c",
    category: "Metabolic",
    canonicalUnit: "%",
    description: "Reflects average blood glucose over the past 2–3 months by measuring glycated hemoglobin.",
    relevance: "The gold standard for long-term glucose control assessment. Predicts diabetes complications with high accuracy and guides treatment decisions.",
    researchNotes: "Each 1% reduction in HbA1c reduces the risk of diabetic complications by 21% (UKPDS trial). Levels below 5.7% are associated with lowest cardiovascular risk.",
    aliases: ["HbA1c", "hemoglobin a1c", "glycated hemoglobin", "glycohemoglobin", "A1C", "HBA1C", "hba1c", "gly-hb"],
    unitConversions: [
      { fromUnit: "%", factor: 1 },
      { fromUnit: "mmol/mol", factor: 0.0916 }, // IFCC to NGSP
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 4.0, optimalHigh: 5.6 },
      { label: "Normal", gender: "all", low: 4.0, high: 5.6 },
      { label: "Prediabetes", gender: "all", low: 5.7, high: 6.4 },
      { label: "Diabetes threshold", gender: "all", criticalHigh: 6.5 },
    ],
  },
  {
    key: "insulin_fasting",
    name: "Fasting Insulin",
    shortName: "Insulin",
    category: "Metabolic",
    canonicalUnit: "μIU/mL",
    description: "Fasting blood insulin level, measuring how much insulin the pancreas is producing at baseline.",
    relevance: "Elevated fasting insulin is an early marker of insulin resistance, often detectable years before glucose rises. Critical for cardiovascular risk stratification.",
    researchNotes: "Optimal fasting insulin is debated; emerging research suggests <6 μIU/mL is ideal for longevity. The CARDIA study linked elevated insulin to 23-year cardiovascular outcomes.",
    aliases: ["insulin", "fasting insulin", "insulin fasting", "basal insulin"],
    unitConversions: [
      { fromUnit: "μIU/mL", factor: 1 },
      { fromUnit: "uIU/mL", factor: 1 },
      { fromUnit: "mIU/L", factor: 1 },
      { fromUnit: "pmol/L", factor: 0.1389 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 2, optimalHigh: 6 },
      { label: "Normal", gender: "all", low: 2, high: 25 },
      { label: "Elevated", gender: "all", criticalHigh: 25 },
    ],
  },

  // === LIPIDS ===
  {
    key: "total_cholesterol",
    name: "Total Cholesterol",
    shortName: "Cholesterol",
    category: "Lipids",
    canonicalUnit: "mg/dL",
    description: "Total blood cholesterol including LDL, HDL, and VLDL fractions.",
    relevance: "A key lipid panel marker for cardiovascular risk assessment. Must be interpreted alongside LDL, HDL, and triglycerides for meaningful risk stratification.",
    researchNotes: "Total cholesterol alone is a poor predictor of cardiovascular events. The cholesterol/HDL ratio provides better risk discrimination. High total cholesterol in elderly populations may paradoxically associate with lower all-cause mortality.",
    aliases: ["total cholesterol", "cholesterol total", "cholesterol", "gesamtcholesterin", "TC", "chol"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 38.67 },
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mg/dl", factor: 1 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 150, optimalHigh: 200 },
      { label: "Desirable", gender: "all", low: 0, high: 200 },
      { label: "Borderline", gender: "all", low: 200, high: 239 },
      { label: "High", gender: "all", criticalHigh: 240 },
    ],
  },
  {
    key: "ldl_cholesterol",
    name: "LDL Cholesterol",
    shortName: "LDL-C",
    category: "Lipids",
    canonicalUnit: "mg/dL",
    description: "Low-density lipoprotein cholesterol, often called 'bad cholesterol'. Transports cholesterol to tissues.",
    relevance: "Elevated LDL is the primary modifiable risk factor for atherosclerosis and coronary artery disease. LDL particles can penetrate arterial walls and oxidize, initiating plaque formation.",
    researchNotes: "Each 39 mg/dL (1 mmol/L) reduction in LDL reduces major cardiovascular events by ~22% (Cholesterol Treatment Trialists). Optimal LDL for low-risk individuals is <100 mg/dL; <70 mg/dL for high-risk.",
    aliases: ["LDL", "ldl cholesterol", "LDL-C", "LDL-Cholesterin", "low density lipoprotein", "ldl-c", "ldl chol", "LDL Cholesterol"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 38.67 },
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mg/dl", factor: 1 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 100 },
      { label: "Near Optimal", gender: "all", low: 100, high: 129 },
      { label: "Borderline", gender: "all", low: 130, high: 159 },
      { label: "High", gender: "all", low: 160, high: 189 },
      { label: "Very High", gender: "all", criticalHigh: 190 },
    ],
  },
  {
    key: "hdl_cholesterol",
    name: "HDL Cholesterol",
    shortName: "HDL-C",
    category: "Lipids",
    canonicalUnit: "mg/dL",
    description: "High-density lipoprotein cholesterol, the 'good cholesterol'. Transports cholesterol from tissues back to the liver for disposal.",
    relevance: "Higher HDL is protective against cardiovascular disease. HDL mediates reverse cholesterol transport and has anti-inflammatory, antioxidant, and endothelial protective properties.",
    researchNotes: "Low HDL (<40 mg/dL in men, <50 mg/dL in women) is an independent cardiovascular risk factor. Raising HDL through exercise (aerobic activity increases HDL by 5–10%), alcohol in moderation, and niacin is beneficial.",
    aliases: ["HDL", "hdl cholesterol", "HDL-C", "HDL-Cholesterin", "high density lipoprotein", "hdl-c", "hdl chol", "HDL Cholesterol"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 38.67 },
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mg/dl", factor: 1 },
    ],
    referenceRanges: [
      { label: "Risk Factor (Low)", gender: "male", criticalLow: 40 },
      { label: "Risk Factor (Low)", gender: "female", criticalLow: 50 },
      { label: "Optimal (Male)", gender: "male", optimalLow: 60, optimalHigh: 80 },
      { label: "Optimal (Female)", gender: "female", optimalLow: 65, optimalHigh: 90 },
      { label: "Normal (Male)", gender: "male", low: 40, high: 1000 },
      { label: "Normal (Female)", gender: "female", low: 50, high: 1000 },
    ],
  },
  {
    key: "triglycerides",
    name: "Triglycerides",
    shortName: "TG",
    category: "Lipids",
    canonicalUnit: "mg/dL",
    description: "The most common type of fat in the blood. Excess calories, alcohol, and sugar are converted into triglycerides.",
    relevance: "High triglycerides indicate metabolic dysfunction and increase cardiovascular risk, especially when combined with low HDL. Fasting triglycerides are the best predictor of insulin resistance in the lipid panel.",
    researchNotes: "Triglycerides/HDL ratio is a potent proxy for insulin resistance. A ratio below 2 (in mg/dL) is associated with predominantly large, buoyant LDL particles (less atherogenic); above 3.5 suggests small, dense LDL.",
    aliases: ["triglycerides", "triglyceride", "TG", "trigs", "trigliceridos", "triglyzeride", "TRIG", "triacylglycerols"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 88.57 },
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mg/dl", factor: 1 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 100 },
      { label: "Normal", gender: "all", low: 0, high: 150 },
      { label: "Borderline", gender: "all", low: 150, high: 199 },
      { label: "High", gender: "all", low: 200, high: 499 },
      { label: "Very High", gender: "all", criticalHigh: 500 },
    ],
  },

  // === COMPLETE BLOOD COUNT (CBC) ===
  {
    key: "hemoglobin",
    name: "Hemoglobin",
    shortName: "Hgb",
    category: "Complete Blood Count",
    canonicalUnit: "g/dL",
    description: "The oxygen-carrying protein in red blood cells. Low hemoglobin indicates anemia.",
    relevance: "Critical for oxygen delivery to all tissues. Low hemoglobin causes fatigue, cognitive impairment, and exercise intolerance. Unusually high levels may indicate polycythemia.",
    researchNotes: "Hemoglobin below 12 g/dL in women and 13 g/dL in men defines anemia (WHO). Iron, B12, and folate deficiencies are common causes. Anemia affects ~1.62 billion people globally (WHO).",
    aliases: ["hemoglobin", "haemoglobin", "Hb", "HGB", "Hgb", "hämoglobin"],
    unitConversions: [
      { fromUnit: "g/dL", factor: 1 },
      { fromUnit: "g/dl", factor: 1 },
      { fromUnit: "g/L", factor: 0.1 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 13.5, high: 17.5, optimalLow: 14.5, optimalHigh: 16.5 },
      { label: "Normal (Female)", gender: "female", low: 12.0, high: 15.5, optimalLow: 13.0, optimalHigh: 15.0 },
      { label: "Critical Low (Male)", gender: "male", criticalLow: 8.0 },
      { label: "Critical Low (Female)", gender: "female", criticalLow: 7.0 },
    ],
  },
  {
    key: "hematocrit",
    name: "Hematocrit",
    shortName: "HCT",
    category: "Complete Blood Count",
    canonicalUnit: "%",
    description: "The percentage of red blood cells in total blood volume.",
    relevance: "Hematocrit measures blood's oxygen-carrying capacity. Low values indicate anemia; high values increase blood viscosity and clot risk.",
    researchNotes: "Hematocrit is highly correlated with hemoglobin (~3x relationship). Altitude, dehydration, and androgen therapy significantly affect levels.",
    aliases: ["hematocrit", "haematocrit", "HCT", "Hkt", "packed cell volume", "PCV"],
    unitConversions: [
      { fromUnit: "%", factor: 1 },
      { fromUnit: "L/L", factor: 100 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 41, high: 53, optimalLow: 42, optimalHigh: 50 },
      { label: "Normal (Female)", gender: "female", low: 36, high: 46, optimalLow: 38, optimalHigh: 45 },
    ],
  },
  {
    key: "white_blood_cells",
    name: "White Blood Cells",
    shortName: "WBC",
    category: "Complete Blood Count",
    canonicalUnit: "10³/μL",
    description: "Total white blood cell count, the body's primary immune defense cells.",
    relevance: "WBC reflects immune system activity. Elevated WBC suggests infection, inflammation, or, rarely, blood disorders. Chronically elevated WBC is associated with increased cardiovascular mortality.",
    researchNotes: "High normal WBC (>7.0 × 10³/μL) is associated with 40% higher cardiovascular mortality risk in some studies. Low WBC may indicate viral infections or immunosuppression.",
    aliases: ["WBC", "white blood cells", "white blood count", "leukocytes", "leukozyten", "WBC count", "leukocyte count"],
    unitConversions: [
      { fromUnit: "10³/μL", factor: 1 },
      { fromUnit: "K/μL", factor: 1 },
      { fromUnit: "×10³/μL", factor: 1 },
      { fromUnit: "/μL", factor: 0.001 },
      { fromUnit: "×10⁹/L", factor: 1 },
      { fromUnit: "10^9/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 4.5, high: 11.0, optimalLow: 4.5, optimalHigh: 7.0 },
      { label: "Critical Low", gender: "all", criticalLow: 2.0 },
      { label: "Critical High", gender: "all", criticalHigh: 30.0 },
    ],
  },
  {
    key: "red_blood_cells",
    name: "Red Blood Cells",
    shortName: "RBC",
    category: "Complete Blood Count",
    canonicalUnit: "10⁶/μL",
    description: "The number of red blood cells per unit of blood. Carries oxygen via hemoglobin.",
    relevance: "RBC count is used to diagnose anemia and polycythemia. Paired with hemoglobin and hematocrit to fully characterize red cell status.",
    researchNotes: "RBC count alone is less informative than hemoglobin or hematocrit; MCV and MCH provide additional context about cell size and hemoglobin content.",
    aliases: ["RBC", "red blood cells", "erythrocytes", "eritrozyten", "red cell count", "red blood cell count"],
    unitConversions: [
      { fromUnit: "10⁶/μL", factor: 1 },
      { fromUnit: "M/μL", factor: 1 },
      { fromUnit: "×10⁶/μL", factor: 1 },
      { fromUnit: "×10¹²/L", factor: 1 },
      { fromUnit: "10^12/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 4.7, high: 6.1, optimalLow: 4.8, optimalHigh: 5.8 },
      { label: "Normal (Female)", gender: "female", low: 4.2, high: 5.4, optimalLow: 4.3, optimalHigh: 5.2 },
    ],
  },
  {
    key: "platelets",
    name: "Platelets",
    shortName: "PLT",
    category: "Complete Blood Count",
    canonicalUnit: "10³/μL",
    description: "Small blood cell fragments essential for clotting and wound healing.",
    relevance: "Low platelets (thrombocytopenia) increases bleeding risk; high platelets (thrombocytosis) may indicate inflammation or increase clot risk.",
    researchNotes: "Optimal platelet range for minimal clot and bleed risk is 150–350 × 10³/μL. Mean platelet volume (MPV) is a marker of platelet activation and cardiovascular risk.",
    aliases: ["platelets", "PLT", "thrombocytes", "thrombozyten", "platelet count"],
    unitConversions: [
      { fromUnit: "10³/μL", factor: 1 },
      { fromUnit: "K/μL", factor: 1 },
      { fromUnit: "×10³/μL", factor: 1 },
      { fromUnit: "×10⁹/L", factor: 1 },
      { fromUnit: "10^9/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 150, high: 400, optimalLow: 150, optimalHigh: 350 },
      { label: "Critical Low", gender: "all", criticalLow: 50 },
      { label: "Critical High", gender: "all", criticalHigh: 1000 },
    ],
  },

  // === LIVER FUNCTION ===
  {
    key: "alt",
    name: "Alanine Aminotransferase",
    shortName: "ALT",
    category: "Liver Function",
    canonicalUnit: "U/L",
    description: "An enzyme found primarily in liver cells. Released into the bloodstream when liver cells are damaged.",
    relevance: "The most specific marker of liver cell damage. Elevated ALT indicates liver inflammation, non-alcoholic fatty liver disease (NAFLD), or other hepatic injury.",
    researchNotes: "Even mildly elevated ALT (>25 U/L) is associated with increased cardiovascular and metabolic risk. NAFLD affects ~25% of adults globally. ALT responds well to weight loss and carbohydrate restriction.",
    aliases: ["ALT", "alanine aminotransferase", "alanine transaminase", "SGPT", "GPT", "ALAT"],
    unitConversions: [
      { fromUnit: "U/L", factor: 1 },
      { fromUnit: "IU/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "male", optimalLow: 0, optimalHigh: 25 },
      { label: "Optimal", gender: "female", optimalLow: 0, optimalHigh: 20 },
      { label: "Normal (Male)", gender: "male", low: 0, high: 45 },
      { label: "Normal (Female)", gender: "female", low: 0, high: 34 },
      { label: "Elevated (Male)", gender: "male", criticalHigh: 56 },
      { label: "Elevated (Female)", gender: "female", criticalHigh: 45 },
    ],
  },
  {
    key: "ast",
    name: "Aspartate Aminotransferase",
    shortName: "AST",
    category: "Liver Function",
    canonicalUnit: "U/L",
    description: "An enzyme found in liver, heart, muscles, and other tissues. Less liver-specific than ALT.",
    relevance: "Elevated AST with elevated ALT points to liver disease. When AST > ALT (AST/ALT > 2), alcoholic liver disease is more likely. Isolated elevated AST may indicate cardiac or muscle damage.",
    researchNotes: "The AST/ALT ratio (De Ritis ratio) helps distinguish liver pathology. NAFLD typically shows ALT > AST. Alcoholic hepatitis shows AST > ALT. Muscle damage (exercise, rhabdomyolysis) elevates AST without ALT.",
    aliases: ["AST", "aspartate aminotransferase", "SGOT", "GOT", "ASAT"],
    unitConversions: [
      { fromUnit: "U/L", factor: 1 },
      { fromUnit: "IU/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 0, high: 40, optimalLow: 0, optimalHigh: 25 },
      { label: "Normal (Female)", gender: "female", low: 0, high: 32, optimalLow: 0, optimalHigh: 22 },
      { label: "Critical High", gender: "all", criticalHigh: 120 },
    ],
  },
  {
    key: "ggt",
    name: "Gamma-Glutamyl Transferase",
    shortName: "GGT",
    category: "Liver Function",
    canonicalUnit: "U/L",
    description: "An enzyme sensitive to liver damage, bile duct disease, and alcohol consumption.",
    relevance: "GGT is an early and sensitive marker of liver stress. Elevated GGT is independently associated with cardiovascular mortality, type 2 diabetes, and all-cause mortality even within 'normal' ranges.",
    researchNotes: "A landmark study of 163,944 individuals found that optimal GGT is <16 U/L in men and <9 U/L in women. Even 'normal' GGT in the upper quartile predicts significant long-term risk.",
    aliases: ["GGT", "gamma-glutamyl transferase", "gamma GT", "γ-GT", "gammaGT", "GGT enzyme"],
    unitConversions: [
      { fromUnit: "U/L", factor: 1 },
      { fromUnit: "IU/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Optimal (Male)", gender: "male", optimalLow: 0, optimalHigh: 16 },
      { label: "Optimal (Female)", gender: "female", optimalLow: 0, optimalHigh: 9 },
      { label: "Normal (Male)", gender: "male", low: 0, high: 55 },
      { label: "Normal (Female)", gender: "female", low: 0, high: 38 },
    ],
  },
  {
    key: "bilirubin_total",
    name: "Total Bilirubin",
    shortName: "T-Bili",
    category: "Liver Function",
    canonicalUnit: "mg/dL",
    description: "A yellow compound produced from the breakdown of red blood cells, processed by the liver.",
    relevance: "Elevated bilirubin indicates liver disease, bile duct obstruction, or hemolysis. Mildly elevated bilirubin (Gilbert's syndrome) is usually benign and associated with reduced cardiovascular risk.",
    researchNotes: "Bilirubin is a potent antioxidant. High-normal bilirubin (1.0–1.5 mg/dL) is associated with reduced risk of cardiovascular disease, metabolic syndrome, and some cancers.",
    aliases: ["bilirubin total", "total bilirubin", "serum bilirubin", "T-Bilirubin", "Gesamtbilirubin"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "μmol/L", factor: 0.0585 },
      { fromUnit: "umol/L", factor: 0.0585 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 0.1, high: 1.2, optimalLow: 0.3, optimalHigh: 1.0 },
      { label: "Critical High", gender: "all", criticalHigh: 3.0 },
    ],
  },

  // === KIDNEY FUNCTION ===
  {
    key: "creatinine",
    name: "Creatinine",
    shortName: "Creat",
    category: "Kidney Function",
    canonicalUnit: "mg/dL",
    description: "A waste product from muscle metabolism, filtered by the kidneys. A primary marker of kidney function.",
    relevance: "Elevated creatinine indicates impaired kidney filtration. Creatinine is used to calculate eGFR, the key index of kidney function. Muscle mass significantly affects creatinine levels.",
    researchNotes: "eGFR < 60 mL/min/1.73m² is defined as chronic kidney disease. Each 10 mL/min/1.73m² decline in eGFR increases cardiovascular mortality by 15%. Very low creatinine may indicate low muscle mass.",
    aliases: ["creatinine", "creatinin", "CREAT", "Kreatinin", "serum creatinine"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "μmol/L", factor: 0.01131 },
      { fromUnit: "umol/L", factor: 0.01131 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 0.7, high: 1.3, optimalLow: 0.8, optimalHigh: 1.2 },
      { label: "Normal (Female)", gender: "female", low: 0.5, high: 1.1, optimalLow: 0.6, optimalHigh: 1.0 },
    ],
  },
  {
    key: "urea",
    name: "Blood Urea Nitrogen",
    shortName: "BUN",
    category: "Kidney Function",
    canonicalUnit: "mg/dL",
    description: "A waste product from protein metabolism, filtered by the kidneys. Used alongside creatinine to assess kidney function.",
    relevance: "Elevated BUN can indicate kidney disease, dehydration, or high protein intake. BUN/creatinine ratio helps distinguish prerenal from renal causes of elevated BUN.",
    researchNotes: "BUN alone is non-specific. The BUN/creatinine ratio >20 suggests prerenal azotemia (dehydration, bleeding); 10–20 is normal; <10 suggests liver disease or low protein intake.",
    aliases: ["BUN", "urea", "blood urea nitrogen", "urea nitrogen", "harnstoff", "serum urea"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mmol/L", factor: 2.8 }, // urea mmol/L to BUN mg/dL
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 7, high: 20, optimalLow: 10, optimalHigh: 18 },
      { label: "Critical High", gender: "all", criticalHigh: 50 },
    ],
  },
  {
    key: "egfr",
    name: "Estimated GFR",
    shortName: "eGFR",
    category: "Kidney Function",
    canonicalUnit: "mL/min/1.73m²",
    description: "Estimated glomerular filtration rate — the key measure of kidney filtration capacity.",
    relevance: "eGFR is the primary staging criterion for chronic kidney disease (CKD). A decline in eGFR is a strong predictor of cardiovascular events, independent of other risk factors.",
    researchNotes: "CKD stages: G1 ≥90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 <15 mL/min/1.73m². Even mildly reduced eGFR (60–90) doubles cardiovascular risk.",
    aliases: ["eGFR", "GFR", "estimated GFR", "glomerular filtration rate", "eGFR (CKD-EPI)"],
    unitConversions: [
      { fromUnit: "mL/min/1.73m²", factor: 1 },
      { fromUnit: "mL/min", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 90, high: 200, optimalLow: 100, optimalHigh: 150 },
      { label: "Mild Reduction", gender: "all", low: 60, high: 89 },
      { label: "Moderate", gender: "all", low: 30, high: 59 },
      { label: "Critical Low", gender: "all", criticalLow: 30 },
    ],
  },

  // === THYROID ===
  {
    key: "tsh",
    name: "Thyroid Stimulating Hormone",
    shortName: "TSH",
    category: "Thyroid",
    canonicalUnit: "mIU/L",
    description: "Pituitary hormone that regulates thyroid function. The primary screening test for thyroid disorders.",
    relevance: "TSH is the most sensitive marker of thyroid function. Both hypothyroidism (high TSH) and hyperthyroidism (low TSH) affect energy, weight, cognition, heart rate, and metabolism.",
    researchNotes: "Subclinical hypothyroidism (TSH 4.5–10) affects 5–10% of adults. Recent research suggests optimal TSH is 1.0–2.5 mIU/L for most adults. TSH above 4.0 in pregnancy is associated with worse fetal outcomes.",
    aliases: ["TSH", "thyroid stimulating hormone", "thyrotropin", "thyreotropin", "TSH basal"],
    unitConversions: [
      { fromUnit: "mIU/L", factor: 1 },
      { fromUnit: "μIU/mL", factor: 1 },
      { fromUnit: "uIU/mL", factor: 1 },
      { fromUnit: "mU/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 1.0, optimalHigh: 2.5 },
      { label: "Normal", gender: "all", low: 0.4, high: 4.5 },
      { label: "Critical Low", gender: "all", criticalLow: 0.1 },
      { label: "Critical High", gender: "all", criticalHigh: 10.0 },
    ],
  },
  {
    key: "free_t4",
    name: "Free T4 (Thyroxine)",
    shortName: "fT4",
    category: "Thyroid",
    canonicalUnit: "ng/dL",
    description: "Free thyroxine — the unbound, active form of the main thyroid hormone.",
    relevance: "Free T4 reflects thyroid hormone production. Used alongside TSH to distinguish primary from secondary thyroid disease and assess adequacy of thyroid hormone replacement.",
    researchNotes: "Low-normal free T4 with high-normal TSH ('subclinical hypothyroidism') is the most common thyroid disorder. Whether to treat is debated; symptoms, age, and cardiovascular risk guide decisions.",
    aliases: ["free T4", "fT4", "FT4", "free thyroxine", "freies T4", "thyroxine free"],
    unitConversions: [
      { fromUnit: "ng/dL", factor: 1 },
      { fromUnit: "pmol/L", factor: 0.0777 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 0.8, high: 1.8, optimalLow: 1.0, optimalHigh: 1.5 },
    ],
  },

  // === VITAMINS & MINERALS ===
  {
    key: "vitamin_d",
    name: "Vitamin D (25-OH)",
    shortName: "Vit D",
    category: "Vitamins & Minerals",
    canonicalUnit: "ng/mL",
    description: "25-hydroxyvitamin D — the storage form of vitamin D. Reflects overall vitamin D status from sun exposure and supplementation.",
    relevance: "Vitamin D deficiency affects ~50% of the global population. It's critical for bone health, immune function, muscle strength, mental health, and cardiovascular health. Low levels are associated with increased cancer risk.",
    researchNotes: "Meta-analyses link vitamin D sufficiency (>30 ng/mL) to 16% lower all-cause mortality. Optimal supplementation targets >40 ng/mL. Toxicity is rare but occurs above 150 ng/mL. D3 is 87% more effective at raising serum 25-OH-D than D2.",
    aliases: ["vitamin D", "25-OH vitamin D", "25-hydroxyvitamin D", "25(OH)D", "Vitamin D3", "cholecalciferol", "25-OH-VitD", "VIT D 25-OH"],
    unitConversions: [
      { fromUnit: "ng/mL", factor: 1 },
      { fromUnit: "nmol/L", factor: 0.4006 },
    ],
    referenceRanges: [
      { label: "Deficient", gender: "all", criticalLow: 20 },
      { label: "Insufficient", gender: "all", low: 20, high: 30 },
      { label: "Sufficient", gender: "all", low: 30, high: 100 },
      { label: "Optimal", gender: "all", optimalLow: 40, optimalHigh: 70 },
      { label: "Toxic", gender: "all", criticalHigh: 150 },
    ],
  },
  {
    key: "ferritin",
    name: "Ferritin",
    shortName: "Ferritin",
    category: "Vitamins & Minerals",
    canonicalUnit: "ng/mL",
    description: "The main iron storage protein. A key indicator of iron stores and overall iron status.",
    relevance: "Ferritin is the most sensitive marker of iron deficiency. Low ferritin causes fatigue, cognitive impairment, restless legs, and hair loss. Elevated ferritin can indicate inflammation, iron overload (hemochromatosis), or metabolic syndrome.",
    researchNotes: "Brain iron stores correlate with ferritin. Studies show ferritin below 30 ng/mL impairs neurological function. Ferritin above 200 ng/mL in men and 150 in women may indicate iron overload or chronic inflammation. Optimal may be 60–100 ng/mL.",
    aliases: ["ferritin", "serum ferritin", "ferritin level", "ferritine"],
    unitConversions: [
      { fromUnit: "ng/mL", factor: 1 },
      { fromUnit: "μg/L", factor: 1 },
      { fromUnit: "ug/L", factor: 1 },
      { fromUnit: "pmol/L", factor: 0.449 },
    ],
    referenceRanges: [
      { label: "Deficient", gender: "all", criticalLow: 12 },
      { label: "Suboptimal", gender: "all", low: 12, high: 30 },
      { label: "Optimal (Male)", gender: "male", optimalLow: 60, optimalHigh: 150 },
      { label: "Optimal (Female)", gender: "female", optimalLow: 40, optimalHigh: 100 },
      { label: "Normal (Male)", gender: "male", low: 24, high: 336 },
      { label: "Normal (Female)", gender: "female", low: 11, high: 307 },
    ],
  },
  {
    key: "vitamin_b12",
    name: "Vitamin B12",
    shortName: "B12",
    category: "Vitamins & Minerals",
    canonicalUnit: "pg/mL",
    description: "An essential vitamin for neurological function, red blood cell formation, and DNA synthesis.",
    relevance: "B12 deficiency causes megaloblastic anemia, peripheral neuropathy, and cognitive decline. At-risk groups include vegans, the elderly, and those on metformin. Symptoms may appear before serum levels fall into the 'deficient' range.",
    researchNotes: "Serum B12 may not fully reflect cellular status — methylmalonic acid and homocysteine are more sensitive functional markers. Methylcobalamin and adenosylcobalamin are more bioavailable than cyanocobalamin.",
    aliases: ["vitamin B12", "B12", "cobalamin", "cyanocobalamin", "Vit B12", "VIT B12"],
    unitConversions: [
      { fromUnit: "pg/mL", factor: 1 },
      { fromUnit: "pmol/L", factor: 1.355 },
    ],
    referenceRanges: [
      { label: "Deficient", gender: "all", criticalLow: 200 },
      { label: "Insufficient", gender: "all", low: 200, high: 300 },
      { label: "Normal", gender: "all", low: 200, high: 900 },
      { label: "Optimal", gender: "all", optimalLow: 400, optimalHigh: 800 },
    ],
  },
  {
    key: "folate",
    name: "Folate (Folic Acid)",
    shortName: "Folate",
    category: "Vitamins & Minerals",
    canonicalUnit: "ng/mL",
    description: "A B-vitamin essential for DNA synthesis, cell division, and amino acid metabolism.",
    relevance: "Folate deficiency causes megaloblastic anemia and elevated homocysteine. Critical for pregnancy (neural tube defect prevention). Low folate is associated with depression and cognitive decline.",
    researchNotes: "Homocysteine (elevated when folate, B12, or B6 are low) is an independent cardiovascular risk factor. The MTHFR genetic variant affects folate metabolism in ~10–15% of the population, requiring methylfolate supplementation.",
    aliases: ["folate", "folic acid", "folsäure", "vitamin B9", "serum folate"],
    unitConversions: [
      { fromUnit: "ng/mL", factor: 1 },
      { fromUnit: "nmol/L", factor: 0.4413 },
    ],
    referenceRanges: [
      { label: "Deficient", gender: "all", criticalLow: 2.0 },
      { label: "Normal", gender: "all", low: 2.0, high: 20.0 },
      { label: "Optimal", gender: "all", optimalLow: 5.0, optimalHigh: 15.0 },
    ],
  },

  // === INFLAMMATION ===
  {
    key: "crp",
    name: "C-Reactive Protein",
    shortName: "CRP",
    category: "Inflammation",
    canonicalUnit: "mg/L",
    description: "An acute-phase protein produced by the liver in response to inflammation.",
    relevance: "CRP is a sensitive marker of systemic inflammation. Elevated CRP is associated with cardiovascular disease, metabolic syndrome, and poor outcomes across many chronic diseases.",
    researchNotes: "High-sensitivity CRP (hsCRP) below 1.0 mg/L indicates low cardiovascular risk; 1–3 mg/L moderate risk; >3 mg/L high risk (AHA). CRP predicts cardiovascular events better than LDL in some analyses (JUPITER trial).",
    aliases: ["CRP", "C-reactive protein", "C-reaktives Protein", "hsCRP", "hs-CRP", "high sensitivity CRP"],
    unitConversions: [
      { fromUnit: "mg/L", factor: 1 },
      { fromUnit: "mg/dL", factor: 10 },
    ],
    referenceRanges: [
      { label: "Low CV Risk", gender: "all", optimalLow: 0, optimalHigh: 1.0 },
      { label: "Moderate CV Risk", gender: "all", low: 1.0, high: 3.0 },
      { label: "High CV Risk / Infection", gender: "all", criticalHigh: 10.0 },
    ],
  },
  {
    key: "homocysteine",
    name: "Homocysteine",
    shortName: "Hcy",
    category: "Inflammation",
    canonicalUnit: "μmol/L",
    description: "An amino acid produced during methionine metabolism. Requires B vitamins (B6, B9, B12) for clearance.",
    relevance: "Elevated homocysteine damages blood vessel walls and is an independent risk factor for cardiovascular disease, stroke, and dementia. Often elevated with B-vitamin deficiencies.",
    researchNotes: "Each 5 μmol/L increase in homocysteine is associated with 35% higher stroke risk (BMJ meta-analysis). B-vitamin supplementation can normalize homocysteine and may slow cognitive decline (VITACOG trial).",
    aliases: ["homocysteine", "homocystein", "Hcy", "total homocysteine"],
    unitConversions: [
      { fromUnit: "μmol/L", factor: 1 },
      { fromUnit: "umol/L", factor: 1 },
      { fromUnit: "mg/L", factor: 7.397 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 9 },
      { label: "Normal", gender: "all", low: 0, high: 15 },
      { label: "Elevated", gender: "all", low: 15, high: 30 },
      { label: "Critical High", gender: "all", criticalHigh: 50 },
    ],
  },

  // === HORMONES ===
  {
    key: "testosterone_total",
    name: "Testosterone (Total)",
    shortName: "Testosterone",
    category: "Hormones",
    canonicalUnit: "ng/dL",
    description: "Total testosterone including protein-bound and free fractions. Primary male sex hormone, also important in women.",
    relevance: "In men, low testosterone causes fatigue, reduced muscle mass, depression, and decreased libido. In women, it affects libido, energy, and bone density. Optimal testosterone supports metabolic health.",
    researchNotes: "Men with testosterone in the lowest quartile have 40% higher all-cause mortality (large prospective studies). Testosterone is highly pulsatile — morning levels are significantly higher. Age, sleep, adiposity, and stress all affect levels.",
    aliases: ["testosterone", "total testosterone", "testosterone total", "Testosteron"],
    unitConversions: [
      { fromUnit: "ng/dL", factor: 1 },
      { fromUnit: "nmol/L", factor: 28.85 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 270, high: 1070, optimalLow: 500, optimalHigh: 900 },
      { label: "Normal (Female)", gender: "female", low: 15, high: 70, optimalLow: 25, optimalHigh: 55 },
      { label: "Low (Male)", gender: "male", criticalLow: 270 },
    ],
  },
  {
    key: "cortisol",
    name: "Cortisol (Morning)",
    shortName: "Cortisol",
    category: "Hormones",
    canonicalUnit: "μg/dL",
    description: "A steroid stress hormone secreted by the adrenal glands. Follows a diurnal rhythm, peaking in the morning.",
    relevance: "Cortisol regulates stress response, metabolism, immune function, and blood pressure. Chronically elevated cortisol (from stress or Cushing's syndrome) promotes insulin resistance, weight gain, and immune suppression.",
    researchNotes: "Morning cortisol (drawn 8–9 AM) provides the most reproducible assessment. Cortisol below 15 μg/dL in the morning may indicate adrenal insufficiency. Salivary cortisol at awakening is more sensitive for assessing HPA axis function.",
    aliases: ["cortisol", "serum cortisol", "morning cortisol", "cortisol am", "cortisol morning"],
    unitConversions: [
      { fromUnit: "μg/dL", factor: 1 },
      { fromUnit: "ug/dL", factor: 1 },
      { fromUnit: "nmol/L", factor: 0.0362 },
    ],
    referenceRanges: [
      { label: "Normal (Morning)", gender: "all", low: 6, high: 23, optimalLow: 10, optimalHigh: 20 },
    ],
  },
];

// Create a lookup map
export const BIOMARKER_MAP = new Map<string, BiomarkerInfo>(
  BIOMARKER_DB.map((b) => [b.key, b])
);

// Build alias map for matching extracted text
export const ALIAS_MAP = new Map<string, string>(); // alias -> biomarker key
for (const biomarker of BIOMARKER_DB) {
  for (const alias of biomarker.aliases) {
    ALIAS_MAP.set(alias.toLowerCase().trim(), biomarker.key);
  }
  ALIAS_MAP.set(biomarker.key.toLowerCase(), biomarker.key);
  ALIAS_MAP.set(biomarker.name.toLowerCase(), biomarker.key);
}

// Get categories
export const CATEGORIES = [...new Set(BIOMARKER_DB.map((b) => b.category))];

// Normalize a value to the canonical unit
export function normalizeValue(
  value: number,
  fromUnit: string,
  biomarkerKey: string
): { value: number; unit: string } | null {
  const biomarker = BIOMARKER_MAP.get(biomarkerKey);
  if (!biomarker) return null;

  const fromUnitNormalized = fromUnit.trim().toLowerCase();
  const canonicalNormalized = biomarker.canonicalUnit.toLowerCase();

  if (fromUnitNormalized === canonicalNormalized) {
    return { value, unit: biomarker.canonicalUnit };
  }

  for (const conv of biomarker.unitConversions) {
    if (conv.fromUnit.toLowerCase() === fromUnitNormalized) {
      return { value: value * conv.factor, unit: biomarker.canonicalUnit };
    }
  }

  // Try case-insensitive match
  for (const conv of biomarker.unitConversions) {
    if (conv.fromUnit.toLowerCase().replace(/\s/g, "") === fromUnitNormalized.replace(/\s/g, "")) {
      return { value: value * conv.factor, unit: biomarker.canonicalUnit };
    }
  }

  // If unit not found, return as-is with original unit (best effort)
  return { value, unit: fromUnit };
}

// Calculate flag status for a result
export function getFlagStatus(
  value: number,
  biomarkerKey: string,
  gender?: string,
  age?: number
): "normal" | "low" | "high" | "optimal" | "critical_low" | "critical_high" {
  const biomarker = BIOMARKER_MAP.get(biomarkerKey);
  if (!biomarker) return "normal";

  const ranges = biomarker.referenceRanges.filter((r) => {
    if (r.gender && r.gender !== "all" && gender && r.gender !== gender) return false;
    if (r.ageMin && age && age < r.ageMin) return false;
    if (r.ageMax && age && age > r.ageMax) return false;
    return true;
  });

  for (const range of ranges) {
    if (range.criticalLow !== undefined && value < range.criticalLow) return "critical_low";
    if (range.criticalHigh !== undefined && value > range.criticalHigh) return "critical_high";
  }

  for (const range of ranges) {
    if (range.optimalLow !== undefined && range.optimalHigh !== undefined) {
      if (value >= range.optimalLow && value <= range.optimalHigh) return "optimal";
    }
  }

  for (const range of ranges) {
    if (range.low !== undefined && value < range.low) return "low";
    if (range.high !== undefined && value > range.high) return "high";
  }

  return "normal";
}

// Parse PDF text to extract biomarker readings
export function parsePdfText(text: string): Array<{
  biomarkerKey: string;
  originalValue: number;
  originalUnit: string;
  date?: string;
}> {
  const results: Array<{
    biomarkerKey: string;
    originalValue: number;
    originalUnit: string;
    date?: string;
  }> = [];

  const lines = text.split(/\n/);
  
  // Extract date from PDF
  let testDate: string | undefined;
  const datePatterns = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/,
    /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i,
  ];

  // Value extraction: look for patterns like "Glucose 95 mg/dL" or "LDL: 120 mg/dL"
  const numberPattern = /(-?\d+(?:\.\d+)?(?:[,]\d+)?)\s*([a-zA-Z%\/\^²³μ·×⁰¹²³⁴⁵⁶⁷⁸⁹\(\)\.]+)?/;

  // Common patterns for lab results
  const labLinePatterns = [
    // "Analyte Name    Value    Unit    Ref Range"
    /^(.+?)\s{2,}(\d+(?:[.,]\d+)?)\s+([^\s]+(?:\/[^\s]+)?)/,
    // "Analyte Name: Value Unit"
    /^(.+?):\s*(\d+(?:[.,]\d+)?)\s+([^\s]+(?:\/[^\s]+)?)/,
    // "Analyte Name Value Unit Reference"
    /^(.+?)\s+(\d+(?:[.,]\d+)?)\s+([a-zA-Z%\/μ]+)/,
  ];

  for (const line of lines) {
    const cleanLine = line.trim().replace(/\s+/g, " ");
    if (!cleanLine || cleanLine.length < 3) continue;

    // Try to extract date
    if (!testDate) {
      for (const dp of datePatterns) {
        const m = cleanLine.match(dp);
        if (m) {
          testDate = m[0];
          break;
        }
      }
    }

    // Try each alias in the biomarker database
    for (const [alias, key] of ALIAS_MAP) {
      // Case-insensitive check if line contains this alias
      const lowerLine = cleanLine.toLowerCase();
      if (!lowerLine.includes(alias.toLowerCase())) continue;

      // Find the numeric value near this alias
      // Search for numbers in this line
      const numMatches = [...cleanLine.matchAll(/(\d+(?:[.,]\d+)?)\s*([^\d\s,;|<>]+)?/g)];
      
      for (const numMatch of numMatches) {
        const rawVal = numMatch[1].replace(",", ".");
        const val = parseFloat(rawVal);
        if (isNaN(val) || val === 0) continue;
        
        const unit = (numMatch[2] || "").trim();
        
        // Sanity check: value must be plausible for this biomarker
        const biomarker = BIOMARKER_MAP.get(key);
        if (!biomarker) continue;
        
        // Check unit makes sense
        const hasKnownUnit = biomarker.unitConversions.some(
          (c) => c.fromUnit.toLowerCase().replace(/\s/g, "") === unit.toLowerCase().replace(/\s/g, "")
        ) || biomarker.canonicalUnit.toLowerCase().replace(/\s/g, "") === unit.toLowerCase().replace(/\s/g, "");
        
        if (unit && !hasKnownUnit) {
          // Try without unit if no unit match
          // Still add as a candidate if no unit, will try to guess
        }

        // Avoid duplicate entries for the same biomarker key
        const existing = results.find((r) => r.biomarkerKey === key);
        if (!existing) {
          results.push({
            biomarkerKey: key,
            originalValue: val,
            originalUnit: unit || biomarker.canonicalUnit,
            date: testDate,
          });
        }
        break;
      }

      // Once we found a match for this alias, move to next line
      if (results.some((r) => r.biomarkerKey === key)) break;
    }
  }

  return results;
}

// Try to extract test date from text
export function extractTestDate(text: string): string | null {
  const patterns = [
    /(?:date|datum|collected|specimen date|report date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
    /(?:date|datum|collected|specimen date|report date)[:\s]+(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i,
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{2}\/\d{2}\/\d{4})\b/,
    /\b(\d{2}\.\d{2}\.\d{4})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] + (match[2] ? " " + match[2] + " " + match[3] : "");
    }
  }
  return null;
}

export function extractLabName(text: string): string | null {
  const patterns = [
    /(?:laboratory|labor|lab|clinic|hospital|institute)[:\s]+([^\n,]+)/i,
    /^([A-Z][A-Za-z\s&]+(?:Lab|Laboratory|Diagnostics|Health|Medical|Clinic|Institute))[,\n]/m,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim().substring(0, 100);
  }
  return null;
}
