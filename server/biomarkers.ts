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
  plainDescription?: string;  // "What is this?" in plain English for non-medical readers
  whyItMatters?: string;       // "Why does it matter?" for non-medical readers
  bodySystem?: string;         // e.g. "Heart & Circulation", "Metabolism", "Liver & Digestion", "Kidneys", "Blood Cells", "Thyroid", "Immune System", "Vitamins & Minerals", "Hormones"
  referenceLinks?: Array<{ label: string; url: string }>;
  aliases: string[]; // alternate names/spellings to match in PDFs
  referenceRanges: ReferenceRange[];
  referenceSets?: ReferenceSet[];   // named clinical reference sets
  unitConversions: UnitConversion[];
  alternateUnits?: AlternateUnit[]; // display units the user can switch to
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

/** A named collection of thresholds drawn from a specific guideline / population */
export interface ReferenceSet {
  id: string;        // e.g. "clinical", "age_matched_35m", "athletic", "longevity"
  label: string;     // Display name shown in UI selector
  description: string; // 1-sentence explanation of the set
  source: string;    // Guideline / study citation
  sourceUrl?: string;
  ranges: ReferenceRange[];
}

/** An alternative unit that can be displayed alongside the canonical unit */
export interface AlternateUnit {
  unit: string;          // display unit string, e.g. "mmol/L"
  factor: number;        // multiply canonical value by this to get display value
  precision?: number;    // decimal places to show
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
    plainDescription: "A measure of how much sugar is in your blood right now. Taken after fasting (not eating for 8–12 hours).",
    whyItMatters: "Too much blood sugar over time damages blood vessels and nerves. It's one of the earliest warning signs of diabetes — which affects 1 in 10 adults.",
    bodySystem: "Metabolism",
    referenceLinks: [{ label: "CDC: Diabetes Testing", url: "https://www.cdc.gov/diabetes/basics/getting-tested.html" }, { label: "ADA Standards of Care 2023", url: "https://diabetesjournals.org/care/issue/46/Supplement_1" }],
    aliases: ["fasting glucose", "blood glucose", "glucose fasting", "glucose (fasting)", "fasting blood sugar", "blood sugar", "blutzucker", "glycemia", "BG", "FBG", "FBS", "glucose"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 18.02 },
      { fromUnit: "mg/dl", factor: 1 },
      { fromUnit: "mg/dL", factor: 1 },
    ],
    alternateUnits: [
      { unit: "mmol/L", factor: 1 / 18.02, precision: 2 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 70, optimalHigh: 90 },
      { label: "Normal", gender: "all", low: 70, high: 99 },
      { label: "Prediabetes", gender: "all", low: 100, high: 125 },
      { label: "Critical Low", gender: "all", criticalLow: 55 },
      { label: "Critical High", gender: "all", criticalHigh: 200 },
    ],
    referenceSets: [
      {
        id: "clinical",
        label: "Clinical Standard (ADA)",
        description: "Standard diagnostic criteria used by most clinicians worldwide.",
        source: "American Diabetes Association Standards of Medical Care, 2023",
        sourceUrl: "https://diabetesjournals.org/care/issue/46/Supplement_1",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 70, optimalHigh: 90 },
          { label: "Normal", gender: "all", low: 70, high: 99 },
          { label: "Prediabetes", gender: "all", low: 100, high: 125 },
          { label: "Critical Low", gender: "all", criticalLow: 55 },
          { label: "Critical High", gender: "all", criticalHigh: 200 },
        ],
      },
      {
        id: "longevity",
        label: "Optimal Longevity",
        description: "Tighter targets associated with lowest long-term cardiometabolic risk in large cohort studies.",
        source: "Emerging longevity medicine guidelines; Attia P. Outlive, 2023; NHANES cohort data",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 72, optimalHigh: 85 },
          { label: "Acceptable", gender: "all", low: 72, high: 94 },
          { label: "Borderline", gender: "all", low: 95, high: 109 },
          { label: "Critical Low", gender: "all", criticalLow: 60 },
          { label: "Critical High", gender: "all", criticalHigh: 126 },
        ],
      },
      {
        id: "athletic",
        label: "Athletic / Active",
        description: "Reference ranges observed in trained athletes; slightly lower fasting glucose is common due to high insulin sensitivity.",
        source: "Sports medicine literature; Marliss & Vranic, Diabetes 2002",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 65, optimalHigh: 88 },
          { label: "Normal", gender: "all", low: 65, high: 95 },
          { label: "Borderline", gender: "all", low: 96, high: 115 },
          { label: "Critical Low", gender: "all", criticalLow: 55 },
          { label: "Critical High", gender: "all", criticalHigh: 180 },
        ],
      },
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
    plainDescription: "Shows your average blood sugar over the past 2–3 months — like a blood sugar 'report card'.",
    whyItMatters: "Catches prediabetes and diabetes early. A result of 5.7% or above means your sugar has been running high. Many people with prediabetes can reverse it with lifestyle changes.",
    bodySystem: "Metabolism",
    referenceLinks: [{ label: "CDC: HbA1c Test Explained", url: "https://www.cdc.gov/diabetes/managing/managing-blood-sugar/a1c.html" }, { label: "ADA Standards 2023", url: "https://diabetesjournals.org/care/issue/46/Supplement_1" }],
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
    referenceSets: [
      {
        id: "clinical",
        label: "Clinical Standard (ADA)",
        description: "Widely used diagnostic cut-points from the American Diabetes Association.",
        source: "ADA Standards of Medical Care in Diabetes, 2023",
        sourceUrl: "https://diabetesjournals.org/care/issue/46/Supplement_1",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 4.0, optimalHigh: 5.6 },
          { label: "Normal", gender: "all", low: 4.0, high: 5.6 },
          { label: "Prediabetes", gender: "all", low: 5.7, high: 6.4 },
          { label: "Diabetes", gender: "all", criticalHigh: 6.5 },
        ],
      },
      {
        id: "longevity",
        label: "Optimal Longevity",
        description: "Tighter targets for lowest all-cause mortality and cardiovascular risk based on cohort studies.",
        source: "Selvin et al. NEJM 2010; Attia P. Outlive, 2023",
        sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa1007792",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 4.5, optimalHigh: 5.3 },
          { label: "Acceptable", gender: "all", low: 4.5, high: 5.5 },
          { label: "Elevated Risk", gender: "all", low: 5.6, high: 6.2 },
          { label: "High Risk", gender: "all", criticalHigh: 6.3 },
        ],
      },
      {
        id: "athletic",
        label: "Athletic / Active",
        description: "Values typically observed in well-trained endurance athletes with high insulin sensitivity.",
        source: "Adamopoulos S et al. EJHF 2011; general sports medicine data",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 4.4, optimalHigh: 5.4 },
          { label: "Normal", gender: "all", low: 4.4, high: 5.6 },
          { label: "Borderline", gender: "all", low: 5.7, high: 6.4 },
          { label: "Critical High", gender: "all", criticalHigh: 6.5 },
        ],
      },
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
    plainDescription: "Measures how much insulin your pancreas is making when you haven't eaten. Insulin is the hormone that moves sugar from your blood into your cells.",
    whyItMatters: "High fasting insulin often means your cells are becoming resistant to insulin — a precursor to type 2 diabetes, obesity, and heart disease. It usually rises years before blood sugar does.",
    bodySystem: "Metabolism",
    referenceLinks: [{ label: "NIH: Insulin Resistance", url: "https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-insulin-resistance" }],
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
    plainDescription: "The total amount of fatty substance (cholesterol) in your blood. Your body needs cholesterol to build cells, but too much can clog arteries.",
    whyItMatters: "High total cholesterol increases your risk of heart attack and stroke. It's most meaningful when read together with HDL and LDL.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "CDC: Cholesterol Facts", url: "https://www.cdc.gov/cholesterol/facts.htm" }, { label: "ACC/AHA 2019 Guidelines", url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625" }],
    aliases: ["total cholesterol", "cholesterol total", "cholesterol", "gesamtcholesterin", "TC", "chol"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 38.67 },
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mg/dl", factor: 1 },
    ],
    alternateUnits: [
      { unit: "mmol/L", factor: 1 / 38.67, precision: 2 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 150, optimalHigh: 200 },
      { label: "Desirable", gender: "all", low: 0, high: 200 },
      { label: "Borderline", gender: "all", low: 200, high: 239 },
      { label: "High", gender: "all", criticalHigh: 240 },
    ],
    referenceSets: [
      {
        id: "clinical",
        label: "Clinical Standard (NCEP ATP III)",
        description: "NCEP ATP III guidelines used in most clinical labs worldwide.",
        source: "NCEP ATP III Guidelines, JAMA 2001; ACC/AHA 2019 Cholesterol Guidelines",
        sourceUrl: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
        ranges: [
          { label: "Desirable", gender: "all", optimalLow: 150, optimalHigh: 200 },
          { label: "Borderline High", gender: "all", low: 200, high: 239 },
          { label: "High", gender: "all", criticalHigh: 240 },
        ],
      },
      {
        id: "longevity",
        label: "Optimal Longevity",
        description: "Lower targets associated with reduced long-term ASCVD risk in observational studies.",
        source: "Ference BA et al. JACC 2017; Ravnskov et al. BMJ Evidence 2016",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 140, optimalHigh: 185 },
          { label: "Acceptable", gender: "all", low: 140, high: 210 },
          { label: "Borderline", gender: "all", low: 210, high: 249 },
          { label: "High", gender: "all", criticalHigh: 250 },
        ],
      },
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
    plainDescription: "Often called 'bad cholesterol'. LDL carries cholesterol to your artery walls where it can build up as plaques — like rust in a pipe.",
    whyItMatters: "High LDL is the #1 modifiable risk factor for heart attacks. Lowering LDL by just 1 mmol/L (39 mg/dL) reduces your heart attack risk by ~22%.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "ACC/AHA 2019 Cholesterol Guidelines", url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625" }, { label: "CDC: LDL Cholesterol", url: "https://www.cdc.gov/cholesterol/ldl_hdl.htm" }],
    aliases: ["LDL", "ldl cholesterol", "LDL-C", "LDL-Cholesterin", "low density lipoprotein", "ldl-c", "ldl chol", "LDL Cholesterol"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 38.67 },
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mg/dl", factor: 1 },
    ],
    alternateUnits: [
      { unit: "mmol/L", factor: 1 / 38.67, precision: 2 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 100 },
      { label: "Near Optimal", gender: "all", low: 100, high: 129 },
      { label: "Borderline", gender: "all", low: 130, high: 159 },
      { label: "High", gender: "all", low: 160, high: 189 },
      { label: "Very High", gender: "all", criticalHigh: 190 },
    ],
    referenceSets: [
      {
        id: "clinical",
        label: "Clinical Standard (ACC/AHA)",
        description: "Standard risk categories from the American College of Cardiology / American Heart Association 2019 guidelines.",
        source: "ACC/AHA 2019 Guideline on the Primary Prevention of Cardiovascular Disease",
        sourceUrl: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000678",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 100 },
          { label: "Near Optimal", gender: "all", low: 100, high: 129 },
          { label: "Borderline High", gender: "all", low: 130, high: 159 },
          { label: "High", gender: "all", low: 160, high: 189 },
          { label: "Very High", gender: "all", criticalHigh: 190 },
        ],
      },
      {
        id: "longevity",
        label: "Optimal Longevity",
        description: "Lower targets linked to minimal atherosclerotic progression in lifetime exposure studies.",
        source: "Ference BA et al. JACC 2017; Attia P. Outlive, 2023; MESA Study",
        sourceUrl: "https://www.jacc.org/doi/10.1016/j.jacc.2017.02.001",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 70 },
          { label: "Acceptable", gender: "all", low: 70, high: 99 },
          { label: "Borderline", gender: "all", low: 100, high: 129 },
          { label: "Elevated", gender: "all", low: 130, high: 159 },
          { label: "Very High", gender: "all", criticalHigh: 160 },
        ],
      },
      {
        id: "athletic",
        label: "Athletic / Active",
        description: "LDL in fit individuals with high HDL and low TG; cardiovascular risk is context-dependent.",
        source: "Franklin et al. JACC 2018; Eijsvogels & Thompson, 2015",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 110 },
          { label: "Acceptable", gender: "all", low: 110, high: 139 },
          { label: "Borderline", gender: "all", low: 140, high: 169 },
          { label: "High", gender: "all", criticalHigh: 170 },
        ],
      },
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
    plainDescription: "Called 'good cholesterol'. HDL acts like a cleanup crew — it picks up excess cholesterol from your arteries and carries it back to the liver to be removed.",
    whyItMatters: "Higher HDL is protective against heart disease. Low HDL combined with high LDL is one of the most dangerous combinations for heart health.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "CDC: HDL Cholesterol", url: "https://www.cdc.gov/cholesterol/ldl_hdl.htm" }, { label: "AHA: HDL Cholesterol", url: "https://www.heart.org/en/health-topics/cholesterol/hdl-good-ldl-bad-cholesterol-and-triglycerides" }],
    aliases: ["HDL", "hdl cholesterol", "HDL-C", "HDL-Cholesterin", "high density lipoprotein", "hdl-c", "hdl chol", "HDL Cholesterol"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 38.67 },
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mg/dl", factor: 1 },
    ],
    alternateUnits: [
      { unit: "mmol/L", factor: 1 / 38.67, precision: 2 },
    ],
    referenceRanges: [
      { label: "Risk Factor (Low)", gender: "male", criticalLow: 40 },
      { label: "Risk Factor (Low)", gender: "female", criticalLow: 50 },
      { label: "Optimal (Male)", gender: "male", optimalLow: 60, optimalHigh: 80 },
      { label: "Optimal (Female)", gender: "female", optimalLow: 65, optimalHigh: 90 },
      { label: "Normal (Male)", gender: "male", low: 40, high: 1000 },
      { label: "Normal (Female)", gender: "female", low: 50, high: 1000 },
    ],
    referenceSets: [
      {
        id: "clinical",
        label: "Clinical Standard (ACC/AHA)",
        description: "Standard HDL risk thresholds from ACC/AHA guidelines.",
        source: "ACC/AHA 2019 Guideline on the Primary Prevention of Cardiovascular Disease",
        sourceUrl: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000678",
        ranges: [
          { label: "Risk Factor (Low)", gender: "male", criticalLow: 40 },
          { label: "Risk Factor (Low)", gender: "female", criticalLow: 50 },
          { label: "Optimal (Male)", gender: "male", optimalLow: 60, optimalHigh: 80 },
          { label: "Optimal (Female)", gender: "female", optimalLow: 65, optimalHigh: 90 },
          { label: "Normal (Male)", gender: "male", low: 40, high: 1000 },
          { label: "Normal (Female)", gender: "female", low: 50, high: 1000 },
        ],
      },
      {
        id: "athletic",
        label: "Athletic / Active",
        description: "Aerobic exercise raises HDL 5–10%; higher targets expected in trained individuals.",
        source: "Kodama et al. Archives of Internal Medicine 2007 (meta-analysis)",
        sourceUrl: "https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/413187",
        ranges: [
          { label: "Risk Factor (Low)", gender: "male", criticalLow: 45 },
          { label: "Risk Factor (Low)", gender: "female", criticalLow: 55 },
          { label: "Optimal (Male)", gender: "male", optimalLow: 65, optimalHigh: 90 },
          { label: "Optimal (Female)", gender: "female", optimalLow: 70, optimalHigh: 100 },
          { label: "Normal (Male)", gender: "male", low: 45, high: 1000 },
          { label: "Normal (Female)", gender: "female", low: 55, high: 1000 },
        ],
      },
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
    plainDescription: "Fats (lipids) found in your blood. When you eat more than your body needs, the extra calories are stored as triglycerides.",
    whyItMatters: "High triglycerides are linked to heart disease, especially when combined with low HDL. They also indicate you may be eating too many refined carbs or sugars.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "AHA: Triglycerides", url: "https://www.heart.org/en/health-topics/cholesterol/hdl-good-ldl-bad-cholesterol-and-triglycerides" }, { label: "NIH: Triglycerides", url: "https://www.nhlbi.nih.gov/health/blood-cholesterol/types" }],
    aliases: ["triglycerides", "triglyceride", "TG", "trigs", "trigliceridos", "triglyzeride", "TRIG", "triacylglycerols"],
    unitConversions: [
      { fromUnit: "mmol/L", factor: 88.57 },
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mg/dl", factor: 1 },
    ],
    alternateUnits: [
      { unit: "mmol/L", factor: 1 / 88.57, precision: 2 },
    ],
    referenceRanges: [
      { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 100 },
      { label: "Normal", gender: "all", low: 0, high: 150 },
      { label: "Borderline", gender: "all", low: 150, high: 199 },
      { label: "High", gender: "all", low: 200, high: 499 },
      { label: "Very High", gender: "all", criticalHigh: 500 },
    ],
    referenceSets: [
      {
        id: "clinical",
        label: "Clinical Standard (ACC/AHA)",
        description: "NCEP ATP III / ACC-AHA categories for fasting triglycerides.",
        source: "NCEP ATP III, JAMA 2001; ACC/AHA 2019",
        sourceUrl: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 100 },
          { label: "Normal", gender: "all", low: 0, high: 150 },
          { label: "Borderline High", gender: "all", low: 150, high: 199 },
          { label: "High", gender: "all", low: 200, high: 499 },
          { label: "Very High", gender: "all", criticalHigh: 500 },
        ],
      },
      {
        id: "longevity",
        label: "Optimal Longevity",
        description: "Triglycerides <80 mg/dL associated with lowest insulin-resistance risk and smallest LDL particle size.",
        source: "Muzio et al. Nutrients 2023; Krauss RM. Arteriosclerosis 1994",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 80 },
          { label: "Acceptable", gender: "all", low: 80, high: 119 },
          { label: "Borderline", gender: "all", low: 120, high: 149 },
          { label: "Elevated", gender: "all", low: 150, high: 299 },
          { label: "Very High", gender: "all", criticalHigh: 300 },
        ],
      },
      {
        id: "athletic",
        label: "Athletic / Active",
        description: "Trained athletes typically have triglycerides well below 100 mg/dL due to high lipoprotein lipase activity.",
        source: "Tran ZV et al. Medicine & Science in Sports & Exercise 1983",
        ranges: [
          { label: "Optimal", gender: "all", optimalLow: 0, optimalHigh: 70 },
          { label: "Normal", gender: "all", low: 0, high: 110 },
          { label: "Borderline", gender: "all", low: 110, high: 149 },
          { label: "High", gender: "all", low: 150, high: 349 },
          { label: "Very High", gender: "all", criticalHigh: 350 },
        ],
      },
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
    plainDescription: "The protein inside red blood cells that carries oxygen from your lungs to the rest of your body.",
    whyItMatters: "Low hemoglobin means your body isn't getting enough oxygen, causing fatigue, weakness, and shortness of breath. It's the main test for diagnosing anemia.",
    bodySystem: "Blood Cells",
    referenceLinks: [{ label: "WHO: Anaemia Fact Sheet", url: "https://www.who.int/news-room/fact-sheets/detail/anaemia" }, { label: "NIH: Anemia", url: "https://www.nhlbi.nih.gov/health/anemia" }],
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
    plainDescription: "The percentage of your blood that is made up of red blood cells. Think of it as how 'concentrated' your red cells are.",
    whyItMatters: "A low hematocrit confirms anemia; a high one can make blood too thick and increase clot risk. It helps doctors understand your overall blood health.",
    bodySystem: "Blood Cells",
    referenceLinks: [{ label: "NIH: Hematocrit Test", url: "https://medlineplus.gov/lab-tests/hematocrit-test/" }],
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
    plainDescription: "Your body's infection-fighting cells. White blood cells are the soldiers of your immune system.",
    whyItMatters: "A high count usually means your body is fighting an infection or inflammation. A very low count means your immune defenses are weakened.",
    bodySystem: "Immune System",
    referenceLinks: [{ label: "NIH: White Blood Cell Count", url: "https://medlineplus.gov/lab-tests/white-blood-count/" }, { label: "CDC: Blood Disorders", url: "https://www.cdc.gov/ncbddd/blooddisorders/index.html" }],
    aliases: ["WBC", "white blood cells", "white blood count", "leukocytes", "leukozyten", "WBC count", "leukocyte count"],
    unitConversions: [
      { fromUnit: "10³/μL", factor: 1 },
      { fromUnit: "K/μL", factor: 1 },
      { fromUnit: "×10³/μL", factor: 1 },
      { fromUnit: "/μL", factor: 0.001 },
      { fromUnit: "×10⁹/L", factor: 1 },
      { fromUnit: "10^9/L", factor: 1 },
      { fromUnit: "/cmm", factor: 0.001 },
      { fromUnit: "cells/cmm", factor: 0.001 },
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
    plainDescription: "The number of red blood cells in your blood. These cells carry oxygen to every organ and tissue in your body.",
    whyItMatters: "Too few red blood cells means anemia and poor oxygen delivery. Too many can thicken your blood and raise clot risk.",
    bodySystem: "Blood Cells",
    referenceLinks: [{ label: "NIH: RBC Count", url: "https://medlineplus.gov/lab-tests/red-blood-cell-rbc-count/" }],
    aliases: ["RBC", "red blood cells", "erythrocytes", "eritrozyten", "red cell count", "red blood cell count"],
    unitConversions: [
      { fromUnit: "10⁶/μL", factor: 1 },
      { fromUnit: "M/μL", factor: 1 },
      { fromUnit: "×10⁶/μL", factor: 1 },
      { fromUnit: "×10¹²/L", factor: 1 },
      { fromUnit: "10^12/L", factor: 1 },
      { fromUnit: "million/cmm", factor: 1 },
      { fromUnit: "mill/cmm", factor: 1 },
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
    plainDescription: "Tiny cell fragments in your blood that clump together to stop bleeding when you get a cut or injury.",
    whyItMatters: "Too few platelets means you bruise and bleed easily. Too many can cause dangerous blood clots that lead to stroke or heart attack.",
    bodySystem: "Blood Cells",
    referenceLinks: [{ label: "NIH: Platelet Count", url: "https://medlineplus.gov/lab-tests/platelet-count/" }, { label: "CDC: Blood Clots", url: "https://www.cdc.gov/ncbddd/dvt/facts.html" }],
    aliases: ["platelets", "PLT", "thrombocytes", "thrombozyten", "platelet count"],
    unitConversions: [
      { fromUnit: "10³/μL", factor: 1 },
      { fromUnit: "K/μL", factor: 1 },
      { fromUnit: "×10³/μL", factor: 1 },
      { fromUnit: "×10⁹/L", factor: 1 },
      { fromUnit: "10^9/L", factor: 1 },
      { fromUnit: "/cmm", factor: 0.001 },
      { fromUnit: "cells/cmm", factor: 0.001 },
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
    plainDescription: "A liver enzyme that leaks into your blood when liver cells are injured. It's the most specific blood test for liver damage.",
    whyItMatters: "Elevated ALT is often the first sign of fatty liver disease, which affects 1 in 4 adults. Catching it early lets you reverse it through diet and exercise.",
    bodySystem: "Liver & Digestion",
    referenceLinks: [{ label: "NIH: ALT Blood Test", url: "https://medlineplus.gov/lab-tests/alt-blood-test/" }, { label: "CDC: Liver Disease", url: "https://www.cdc.gov/nchs/fastats/liver-disease.htm" }],
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
    plainDescription: "An enzyme found in the liver, heart, and muscles. When these tissues are damaged, AST leaks into the bloodstream.",
    whyItMatters: "Elevated AST alongside ALT points to liver problems. When AST is high but ALT is normal, it may indicate heart or muscle damage instead.",
    bodySystem: "Liver & Digestion",
    referenceLinks: [{ label: "NIH: AST Blood Test", url: "https://medlineplus.gov/lab-tests/ast-test/" }],
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
    plainDescription: "A liver enzyme that rises when your liver is under stress, especially from alcohol, medications, or bile duct problems.",
    whyItMatters: "GGT is one of the earliest markers of liver stress and is independently linked to heart disease and diabetes risk — even when other liver tests look normal.",
    bodySystem: "Liver & Digestion",
    referenceLinks: [{ label: "NIH: GGT Test", url: "https://medlineplus.gov/lab-tests/gamma-glutamyl-transferase-ggt-test/" }],
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
    plainDescription: "A yellow pigment created when your body breaks down old red blood cells. Your liver processes it for removal.",
    whyItMatters: "High bilirubin can turn your skin and eyes yellow (jaundice) and may signal liver disease or bile duct blockage. Mildly elevated levels are often harmless and may even be protective.",
    bodySystem: "Liver & Digestion",
    referenceLinks: [{ label: "NIH: Bilirubin Test", url: "https://medlineplus.gov/lab-tests/bilirubin-blood-test/" }],
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
    plainDescription: "A waste product from normal muscle activity that your kidneys filter out. It's the primary blood test for checking kidney function.",
    whyItMatters: "Rising creatinine means your kidneys aren't filtering waste as well as they should. Early detection of kidney problems lets you protect them before permanent damage occurs.",
    bodySystem: "Kidneys",
    referenceLinks: [{ label: "NIH: Creatinine Test", url: "https://medlineplus.gov/lab-tests/creatinine-test/" }, { label: "CDC: Chronic Kidney Disease", url: "https://www.cdc.gov/kidneydisease/basics.html" }],
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
    plainDescription: "A waste product from the breakdown of protein in food and in your body. Your kidneys remove it from the blood.",
    whyItMatters: "High BUN can signal kidney problems or dehydration. Combined with creatinine, it helps doctors figure out whether your kidneys are struggling and why.",
    bodySystem: "Kidneys",
    referenceLinks: [{ label: "NIH: BUN Test", url: "https://medlineplus.gov/lab-tests/bun-blood-urea-nitrogen/" }],
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
    plainDescription: "An estimate of how well your kidneys are filtering waste from your blood each minute. It's the single best number for kidney health.",
    whyItMatters: "A declining eGFR is the hallmark of chronic kidney disease, which affects 1 in 7 adults. It also independently increases your risk of heart disease.",
    bodySystem: "Kidneys",
    referenceLinks: [{ label: "NIH: eGFR", url: "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis" }, { label: "CDC: Chronic Kidney Disease", url: "https://www.cdc.gov/kidneydisease/basics.html" }],
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
    plainDescription: "A hormone from your brain's pituitary gland that tells your thyroid how hard to work. It's the first test doctors order to check thyroid health.",
    whyItMatters: "An out-of-range TSH means your thyroid is over- or under-active, which affects your energy, weight, mood, heart rate, and metabolism. Thyroid disorders are very treatable once detected.",
    bodySystem: "Thyroid",
    referenceLinks: [{ label: "NIH: TSH Test", url: "https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/" }, { label: "ATA: Thyroid Function Tests", url: "https://www.thyroid.org/thyroid-function-tests/" }],
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
    plainDescription: "The active, unbound form of the main thyroid hormone (T4). It controls how fast your cells burn energy.",
    whyItMatters: "Low free T4 confirms an underactive thyroid (hypothyroidism), causing fatigue and weight gain. High free T4 confirms an overactive thyroid (hyperthyroidism), causing anxiety and weight loss.",
    bodySystem: "Thyroid",
    referenceLinks: [{ label: "NIH: T4 Test", url: "https://medlineplus.gov/lab-tests/thyroxine-t4-test/" }, { label: "ATA: Thyroid Function Tests", url: "https://www.thyroid.org/thyroid-function-tests/" }],
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
    plainDescription: "The 'sunshine vitamin'. Your skin makes it from sunlight, but most people don't get enough. It's essential for bones, immunity, and mood.",
    whyItMatters: "About half the world's population is deficient. Low vitamin D is linked to weak bones, frequent infections, depression, and increased cancer risk. It's easily correctable with supplements.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Vitamin D Fact Sheet", url: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/" }, { label: "CDC: Vitamin D", url: "https://www.cdc.gov/nutritionreport/pdf/Second-Nutrition-Report-Vitamin-D-Status.pdf" }],
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
    plainDescription: "A protein that stores iron in your body. Think of it as your iron 'savings account' — it shows how much iron you have in reserve.",
    whyItMatters: "Low ferritin is the most common nutritional deficiency worldwide, causing fatigue, hair loss, and brain fog. Very high ferritin can signal iron overload or chronic inflammation.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Ferritin Test", url: "https://medlineplus.gov/lab-tests/ferritin-blood-test/" }, { label: "WHO: Iron Deficiency", url: "https://www.who.int/news-room/fact-sheets/detail/anaemia" }],
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
    plainDescription: "An essential vitamin for brain and nerve health, and for making red blood cells. Found mainly in animal products like meat, fish, and eggs.",
    whyItMatters: "Deficiency causes fatigue, nerve damage (tingling, numbness), and memory problems. Vegans, older adults, and people on certain medications are especially at risk.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Vitamin B12 Fact Sheet", url: "https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/" }],
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
    plainDescription: "A B-vitamin (B9) your body needs to make DNA and new cells. It's especially critical during pregnancy for the baby's brain and spine development.",
    whyItMatters: "Low folate causes a type of anemia and raises homocysteine (a heart disease risk factor). In pregnancy, deficiency can cause serious birth defects.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Folate Fact Sheet", url: "https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/" }, { label: "CDC: Folic Acid", url: "https://www.cdc.gov/ncbddd/folicacid/about.html" }],
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
    plainDescription: "A protein your liver makes when there's inflammation somewhere in your body. The high-sensitivity version (hsCRP) detects very low levels of chronic inflammation.",
    whyItMatters: "Chronic low-grade inflammation is a hidden driver of heart disease, diabetes, and cancer. hsCRP is one of the best blood tests to detect it early.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "AHA: CRP and Heart Disease", url: "https://www.heart.org/en/health-topics/heart-attack/diagnosing-a-heart-attack/inflammation-and-heart-disease" }, { label: "NIH: CRP Test", url: "https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/" }],
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
    plainDescription: "An amino acid in your blood that needs B vitamins (B6, B9, B12) to be cleared. When those vitamins are low, homocysteine builds up.",
    whyItMatters: "High homocysteine damages blood vessel walls and increases risk of heart attack, stroke, and dementia. The good news: it's usually fixable with B vitamins.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "AHA: Homocysteine", url: "https://www.heart.org/en/health-topics/heart-attack/diagnosing-a-heart-attack/homocysteine-folic-acid-and-cardiovascular-disease" }, { label: "NIH: Homocysteine Test", url: "https://medlineplus.gov/lab-tests/homocysteine-test/" }],
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
    plainDescription: "The primary male sex hormone, also present in smaller amounts in women. It drives muscle growth, bone strength, energy, and libido.",
    whyItMatters: "Low testosterone causes fatigue, depression, muscle loss, and reduced sex drive in men. In women, it affects energy and bone health. It's a key marker of hormonal vitality.",
    bodySystem: "Hormones",
    referenceLinks: [{ label: "NIH: Testosterone Test", url: "https://medlineplus.gov/lab-tests/testosterone-levels-test/" }, { label: "AUA: Low Testosterone", url: "https://www.urologyhealth.org/urology-a-z/l/low-testosterone" }],
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
    plainDescription: "Your body's main stress hormone, made by the adrenal glands. It naturally peaks in the morning to wake you up and drops at night.",
    whyItMatters: "Chronically high cortisol (from ongoing stress) promotes weight gain, high blood sugar, and weakened immunity. Very low cortisol can signal adrenal problems causing fatigue and dizziness.",
    bodySystem: "Hormones",
    referenceLinks: [{ label: "NIH: Cortisol Test", url: "https://medlineplus.gov/lab-tests/cortisol-test/" }],
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

  // === LIVER & DIGESTION (additional) ===
  {
    key: "alp",
    name: "Alkaline Phosphatase",
    shortName: "ALP",
    category: "Liver",
    canonicalUnit: "U/L",
    description: "An enzyme found in the liver, bile ducts, bones, and intestines. Elevated ALP may indicate liver or bone disease.",
    relevance: "High ALP can signal bile duct obstruction, liver disease, or bone conditions such as Paget's disease. It is often evaluated alongside ALT, AST, and GGT to differentiate hepatic vs. bone sources.",
    researchNotes: "ALP rises physiologically in pregnancy (placental isoform) and in growing children (bone isoform). Persistently elevated ALP with normal GGT suggests a bone rather than hepatic origin.",
    plainDescription: "An enzyme released mainly by your liver and bones. It helps doctors check whether your liver is draining bile properly and if your bones are healthy.",
    whyItMatters: "Elevated levels can be an early sign of a blocked bile duct, liver disease, or bone disorders. It helps your doctor figure out why other liver tests might be high.",
    bodySystem: "Liver & Digestion",
    referenceLinks: [{ label: "NIH: ALP Test", url: "https://medlineplus.gov/lab-tests/alkaline-phosphatase/" }],
    aliases: ["alkaline phosphatase", "alk phos", "alp", "alkp", "alkaline phos"],
    unitConversions: [
      { fromUnit: "U/L", factor: 1 },
      { fromUnit: "IU/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 44, high: 147 },
      { label: "Optimal", gender: "all", optimalLow: 50, optimalHigh: 120 },
    ],
  },
  {
    key: "albumin",
    name: "Albumin",
    shortName: "Albumin",
    category: "Liver",
    canonicalUnit: "g/dL",
    description: "The most abundant protein in blood plasma, produced by the liver. It maintains oncotic pressure and transports hormones, drugs, and nutrients.",
    relevance: "Low albumin indicates liver dysfunction, malnutrition, chronic inflammation, or kidney loss (nephrotic syndrome). It is a powerful predictor of morbidity and mortality in hospitalized patients.",
    researchNotes: "Serum albumin < 3.5 g/dL is associated with increased post-surgical complications and longer hospital stays. In cirrhosis, albumin is part of the Child-Pugh score. Chronic low-grade inflammation can suppress albumin synthesis independently of liver function.",
    plainDescription: "The most common protein in your blood, made by the liver. It carries vitamins, hormones, and medicines through your bloodstream and keeps fluid from leaking out of blood vessels.",
    whyItMatters: "Low albumin can signal liver problems, poor nutrition, or chronic inflammation. It's one of the strongest simple predictors of overall health — very low levels are linked to worse outcomes in almost any illness.",
    bodySystem: "Liver & Digestion",
    referenceLinks: [{ label: "NIH: Albumin Blood Test", url: "https://medlineplus.gov/lab-tests/albumin-blood-test/" }],
    aliases: ["albumin", "serum albumin", "alb"],
    unitConversions: [
      { fromUnit: "g/dL", factor: 1 },
      { fromUnit: "g/L", factor: 0.1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 3.5, high: 5.5 },
      { label: "Optimal", gender: "all", optimalLow: 4.0, optimalHigh: 5.0 },
      { label: "Critical Low", gender: "all", criticalLow: 2.0 },
    ],
  },

  // === KIDNEYS (additional) ===
  {
    key: "uric_acid",
    name: "Uric Acid",
    shortName: "Uric Acid",
    category: "Kidney",
    canonicalUnit: "mg/dL",
    description: "A waste product formed from the breakdown of purines (found in certain foods and DNA). Excreted by the kidneys.",
    relevance: "High uric acid causes gout (painful crystal deposits in joints) and is linked to kidney stones, metabolic syndrome, and cardiovascular risk. Very low uric acid may impair antioxidant capacity.",
    researchNotes: "Levels above 6.8 mg/dL reach the saturation point for monosodium urate crystallization. Mendelian randomization studies suggest uric acid is causal for gout but its causal role in CVD remains debated.",
    plainDescription: "A natural waste product created when your body breaks down purines — substances found in foods like red meat and shellfish. Your kidneys filter it out.",
    whyItMatters: "Too much uric acid forms sharp crystals in joints (gout) and can damage your kidneys. Elevated levels are also linked to heart disease and metabolic problems.",
    bodySystem: "Kidneys",
    referenceLinks: [{ label: "NIH: Uric Acid Test", url: "https://medlineplus.gov/lab-tests/uric-acid-test/" }],
    aliases: ["uric acid", "urate", "serum uric acid", "harnsaeure"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "μmol/L", factor: 0.01681 },
      { fromUnit: "umol/L", factor: 0.01681 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 3.5, high: 7.2 },
      { label: "Normal (Female)", gender: "female", low: 2.6, high: 6.0 },
      { label: "Optimal", gender: "all", optimalLow: 3.0, optimalHigh: 5.5 },
    ],
  },

  // === ELECTROLYTES ===
  {
    key: "sodium",
    name: "Sodium",
    shortName: "Na",
    category: "Electrolytes",
    canonicalUnit: "mEq/L",
    description: "The primary extracellular electrolyte responsible for fluid balance, nerve conduction, and muscle contraction.",
    relevance: "Abnormal sodium affects brain function, blood pressure, and fluid status. Hyponatremia is the most common electrolyte disorder in hospitalized patients and can cause confusion, seizures, or coma.",
    researchNotes: "Chronic mild hyponatremia (130–134 mEq/L) is associated with cognitive impairment and increased falls in the elderly. Rapid correction of severe hyponatremia risks osmotic demyelination syndrome.",
    plainDescription: "An essential mineral (salt) that controls how much water your body holds and helps nerves and muscles work properly.",
    whyItMatters: "Sodium that's too low can cause confusion, seizures, and dangerous swelling in the brain. Too-high sodium usually signals dehydration. Both extremes require prompt medical attention.",
    bodySystem: "Kidneys",
    referenceLinks: [{ label: "NIH: Sodium Blood Test", url: "https://medlineplus.gov/lab-tests/sodium-blood-test/" }],
    aliases: ["sodium", "na", "na+", "serum sodium", "natrium"],
    unitConversions: [
      { fromUnit: "mEq/L", factor: 1 },
      { fromUnit: "mmol/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 136, high: 145 },
      { label: "Optimal", gender: "all", optimalLow: 138, optimalHigh: 142 },
      { label: "Critical Low", gender: "all", criticalLow: 120 },
      { label: "Critical High", gender: "all", criticalHigh: 160 },
    ],
  },
  {
    key: "potassium",
    name: "Potassium",
    shortName: "K",
    category: "Electrolytes",
    canonicalUnit: "mEq/L",
    description: "The primary intracellular electrolyte essential for heart rhythm, muscle function, and nerve signaling.",
    relevance: "Both high and low potassium can cause life-threatening cardiac arrhythmias. Potassium is tightly regulated by the kidneys and is commonly affected by diuretics, kidney disease, and adrenal disorders.",
    researchNotes: "Serum potassium outside 3.5–5.0 mEq/L significantly increases short-term mortality risk. Hemolyzed blood samples are the most common cause of falsely elevated results.",
    plainDescription: "A mineral that keeps your heartbeat regular and your muscles and nerves working. Most of your body's potassium sits inside cells.",
    whyItMatters: "Even small shifts in potassium can cause dangerous heart rhythm changes. Both too-high and too-low levels are medical emergencies that need quick treatment.",
    bodySystem: "Kidneys",
    referenceLinks: [{ label: "NIH: Potassium Blood Test", url: "https://medlineplus.gov/lab-tests/potassium-blood-test/" }],
    aliases: ["potassium", "k", "k+", "serum potassium", "kalium"],
    unitConversions: [
      { fromUnit: "mEq/L", factor: 1 },
      { fromUnit: "mmol/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 3.5, high: 5.0 },
      { label: "Optimal", gender: "all", optimalLow: 3.8, optimalHigh: 4.6 },
      { label: "Critical Low", gender: "all", criticalLow: 2.5 },
      { label: "Critical High", gender: "all", criticalHigh: 6.5 },
    ],
  },
  {
    key: "chloride",
    name: "Chloride",
    shortName: "Cl",
    category: "Electrolytes",
    canonicalUnit: "mEq/L",
    description: "An extracellular electrolyte that works with sodium to maintain fluid balance and acid-base homeostasis.",
    relevance: "Chloride abnormalities often mirror sodium changes. The anion gap, derived partly from chloride, helps classify metabolic acidosis (diabetic ketoacidosis, lactic acidosis, toxin ingestion).",
    researchNotes: "Serum chloride is used to calculate the anion gap: Na − (Cl + HCO₃). Elevated chloride with normal sodium may indicate renal tubular acidosis or excessive saline infusion.",
    plainDescription: "An electrolyte (related to table salt) that works alongside sodium to keep your body's fluid levels and acid-base balance in check.",
    whyItMatters: "Abnormal chloride often signals dehydration, kidney problems, or acid-base disturbances. Doctors use it with sodium and bicarbonate to calculate important diagnostic ratios.",
    bodySystem: "Kidneys",
    referenceLinks: [{ label: "NIH: Chloride Test", url: "https://medlineplus.gov/lab-tests/chloride-blood-test/" }],
    aliases: ["chloride", "cl", "cl-", "serum chloride"],
    unitConversions: [
      { fromUnit: "mEq/L", factor: 1 },
      { fromUnit: "mmol/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 98, high: 106 },
      { label: "Optimal", gender: "all", optimalLow: 100, optimalHigh: 104 },
    ],
  },
  {
    key: "bicarbonate",
    name: "Bicarbonate (CO₂)",
    shortName: "HCO₃",
    category: "Electrolytes",
    canonicalUnit: "mEq/L",
    description: "A buffer that helps regulate blood pH. Measured as total CO₂ in most basic metabolic panels.",
    relevance: "Low bicarbonate indicates metabolic acidosis (e.g., diabetic ketoacidosis, kidney failure, lactic acidosis). High bicarbonate may signal metabolic alkalosis from vomiting, diuretic use, or Cushing's syndrome.",
    researchNotes: "Venous total CO₂ (which includes dissolved CO₂ and bicarbonate) is typically 1–2 mEq/L higher than true bicarbonate from an arterial blood gas. Chronic kidney disease progressively lowers bicarbonate.",
    plainDescription: "A natural buffer in your blood that keeps your body's acid-base balance in the safe range. It's reported as 'CO₂' on most standard lab panels.",
    whyItMatters: "Low bicarbonate means your blood is too acidic, which can happen in kidney failure, diabetes emergencies, or severe infections. High levels can signal chronic vomiting or certain hormone disorders.",
    bodySystem: "Kidneys",
    referenceLinks: [{ label: "NIH: CO₂ Blood Test", url: "https://medlineplus.gov/lab-tests/carbon-dioxide-co2-in-blood/" }],
    aliases: ["bicarbonate", "hco3", "co2", "total co2", "carbon dioxide", "tco2", "serum bicarbonate"],
    unitConversions: [
      { fromUnit: "mEq/L", factor: 1 },
      { fromUnit: "mmol/L", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 22, high: 29 },
      { label: "Optimal", gender: "all", optimalLow: 23, optimalHigh: 27 },
      { label: "Critical Low", gender: "all", criticalLow: 10 },
      { label: "Critical High", gender: "all", criticalHigh: 40 },
    ],
  },
  {
    key: "calcium",
    name: "Calcium (Total)",
    shortName: "Ca",
    category: "Electrolytes",
    canonicalUnit: "mg/dL",
    description: "Essential mineral for bone strength, muscle contraction, nerve signaling, and blood clotting. About 99% is stored in bones.",
    relevance: "Hypercalcemia (most commonly from primary hyperparathyroidism or malignancy) can cause kidney stones, bone loss, and cardiac arrhythmias. Hypocalcemia may cause muscle cramps, tetany, and seizures.",
    researchNotes: "Total calcium must be corrected for low albumin: corrected Ca = measured Ca + 0.8 × (4.0 − albumin). Ionized calcium is the physiologically active fraction and is more accurate in critically ill patients.",
    plainDescription: "The most abundant mineral in your body — vital for strong bones and teeth, muscle movement, nerve signals, and blood clotting.",
    whyItMatters: "Too-high calcium can mean overactive parathyroid glands or even cancer, and may lead to kidney stones. Too-low calcium causes muscle cramps and, in severe cases, heart problems.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Calcium Blood Test", url: "https://medlineplus.gov/lab-tests/calcium-blood-test/" }],
    aliases: ["calcium", "ca", "total calcium", "serum calcium", "ca2+", "kalzium"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mmol/L", factor: 4.0 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 8.5, high: 10.5 },
      { label: "Optimal", gender: "all", optimalLow: 9.0, optimalHigh: 10.0 },
      { label: "Critical Low", gender: "all", criticalLow: 6.5 },
      { label: "Critical High", gender: "all", criticalHigh: 13.0 },
    ],
  },
  {
    key: "magnesium",
    name: "Magnesium",
    shortName: "Mg",
    category: "Electrolytes",
    canonicalUnit: "mg/dL",
    description: "A mineral cofactor for over 300 enzymatic reactions, involved in energy production, DNA synthesis, muscle and nerve function, and blood pressure regulation.",
    relevance: "Magnesium deficiency is common and under-diagnosed — serum levels reflect less than 1% of total body magnesium. Low Mg is linked to arrhythmias, muscle cramps, migraines, insulin resistance, and osteoporosis.",
    researchNotes: "Serum magnesium is an insensitive marker of total body stores. RBC magnesium or 24-hr urine magnesium may be more informative. Proton pump inhibitors (PPIs) are a common cause of hypomagnesemia.",
    plainDescription: "A mineral that helps hundreds of enzymes in your body work properly — from making energy and protein to keeping your heart rhythm steady and muscles relaxed.",
    whyItMatters: "Low magnesium is surprisingly common and linked to muscle cramps, migraines, heart-rhythm problems, and insulin resistance. Standard blood tests can miss mild deficiency because most magnesium is inside cells.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Magnesium Fact Sheet", url: "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/" }],
    aliases: ["magnesium", "mg", "serum magnesium", "mg2+"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mmol/L", factor: 2.43 },
      { fromUnit: "mEq/L", factor: 1.215 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 1.7, high: 2.2 },
      { label: "Optimal", gender: "all", optimalLow: 2.0, optimalHigh: 2.2 },
      { label: "Critical Low", gender: "all", criticalLow: 1.0 },
      { label: "Critical High", gender: "all", criticalHigh: 4.0 },
    ],
  },
  {
    key: "phosphate",
    name: "Phosphate (Inorganic)",
    shortName: "Phos",
    category: "Electrolytes",
    canonicalUnit: "mg/dL",
    description: "A mineral essential for bone formation, energy metabolism (ATP), and acid-base buffering. Regulated by PTH, vitamin D, and the kidneys.",
    relevance: "Hyperphosphatemia in chronic kidney disease accelerates vascular calcification and bone disease. Hypophosphatemia can cause muscle weakness, respiratory failure, and rhabdomyolysis.",
    researchNotes: "Phosphate levels are inversely related to calcium via PTH-vitamin D axis. Fasting morning samples are preferred as phosphate exhibits diurnal variation and is affected by recent carbohydrate intake.",
    plainDescription: "A mineral that works with calcium to build strong bones and teeth, and is a key part of ATP — the molecule your cells use for energy.",
    whyItMatters: "Too-high phosphate (common in kidney disease) speeds up hardening of arteries and bone loss. Too-low phosphate causes muscle weakness and, in severe cases, difficulty breathing.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Phosphate Test", url: "https://medlineplus.gov/lab-tests/phosphate-in-blood/" }],
    aliases: ["phosphate", "phosphorus", "inorganic phosphate", "phos", "po4", "serum phosphate"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "mmol/L", factor: 3.1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 2.5, high: 4.5 },
      { label: "Optimal", gender: "all", optimalLow: 3.0, optimalHigh: 4.0 },
      { label: "Critical Low", gender: "all", criticalLow: 1.0 },
      { label: "Critical High", gender: "all", criticalHigh: 8.0 },
    ],
  },

  // === BLOOD CELLS (additional) ===
  {
    key: "neutrophils",
    name: "Neutrophils",
    shortName: "Neutro",
    category: "Blood",
    canonicalUnit: "×10³/μL",
    description: "The most abundant type of white blood cell. Neutrophils are the immune system's first responders, rapidly migrating to sites of bacterial infection.",
    relevance: "Low neutrophils (neutropenia) dramatically increase infection risk — a critical concern during chemotherapy. High neutrophils (neutrophilia) may indicate bacterial infection, inflammation, or physiological stress.",
    researchNotes: "Absolute neutrophil count (ANC) < 500/μL constitutes severe neutropenia. The neutrophil-to-lymphocyte ratio (NLR) is an emerging marker of systemic inflammation and prognosis in cancers and CVD.",
    plainDescription: "The most common white blood cell and your body's front-line defense against bacteria. They rush to infection sites and engulf invading germs.",
    whyItMatters: "A very low neutrophil count leaves you dangerously vulnerable to infections. A high count usually signals your body is fighting an infection or dealing with inflammation.",
    bodySystem: "Blood Cells",
    referenceLinks: [{ label: "NIH: Blood Differential", url: "https://medlineplus.gov/lab-tests/blood-differential/" }],
    aliases: ["neutrophils", "neutrophil count", "absolute neutrophils", "anc", "neutro", "neut", "segmented neutrophils", "segs"],
    unitConversions: [
      { fromUnit: "×10³/μL", factor: 1 },
      { fromUnit: "10^3/uL", factor: 1 },
      { fromUnit: "×10⁹/L", factor: 1 },
      { fromUnit: "10^9/L", factor: 1 },
      { fromUnit: "/μL", factor: 0.001 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 1.5, high: 8.0 },
      { label: "Optimal", gender: "all", optimalLow: 2.0, optimalHigh: 6.0 },
      { label: "Critical Low", gender: "all", criticalLow: 0.5 },
    ],
  },
  {
    key: "lymphocytes",
    name: "Lymphocytes",
    shortName: "Lymph",
    category: "Blood",
    canonicalUnit: "×10³/μL",
    description: "White blood cells responsible for adaptive immunity — including T cells, B cells, and natural killer cells. They fight viral infections and produce antibodies.",
    relevance: "Low lymphocytes (lymphopenia) are seen in HIV/AIDS, autoimmune diseases, and severe viral infections including COVID-19. Elevated lymphocytes occur in viral infections and certain blood cancers (CLL, lymphoma).",
    researchNotes: "Persistent lymphocyte count > 5.0 × 10³/μL in adults warrants evaluation for chronic lymphocytic leukemia (CLL). CD4+ T-cell count is a specialized lymphocyte subset used to monitor HIV progression.",
    plainDescription: "White blood cells that form the 'smart' part of your immune system. They remember past infections and make antibodies to fight them faster next time.",
    whyItMatters: "Low lymphocytes mean a weakened immune system — your body struggles to fight viruses and other threats. Persistently high lymphocytes may point to a viral infection or, rarely, blood cancers.",
    bodySystem: "Blood Cells",
    referenceLinks: [{ label: "NIH: Blood Differential", url: "https://medlineplus.gov/lab-tests/blood-differential/" }],
    aliases: ["lymphocytes", "lymphocyte count", "absolute lymphocytes", "lymph", "lymphs"],
    unitConversions: [
      { fromUnit: "×10³/μL", factor: 1 },
      { fromUnit: "10^3/uL", factor: 1 },
      { fromUnit: "×10⁹/L", factor: 1 },
      { fromUnit: "10^9/L", factor: 1 },
      { fromUnit: "/μL", factor: 0.001 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 1.0, high: 4.8 },
      { label: "Optimal", gender: "all", optimalLow: 1.2, optimalHigh: 3.5 },
      { label: "Critical Low", gender: "all", criticalLow: 0.5 },
    ],
  },

  // === THYROID (additional) ===
  {
    key: "free_t3",
    name: "Free T3",
    shortName: "FT3",
    category: "Thyroid",
    canonicalUnit: "pg/mL",
    description: "The active thyroid hormone that drives cellular metabolism. Free T3 represents the unbound, biologically active fraction of triiodothyronine.",
    relevance: "Free T3 is the most potent thyroid hormone — it sets the pace of metabolism, body temperature, and energy production. Low FT3 with normal TSH may indicate poor T4-to-T3 conversion (low T3 syndrome), common in chronic illness.",
    researchNotes: "Free T3 is the last thyroid marker to drop in hypothyroidism and the most sensitive indicator of tissue-level thyroid activity. In euthyroid sick syndrome, FT3 falls while TSH stays normal.",
    plainDescription: "The most active form of thyroid hormone. It directly tells your cells how fast to run their metabolism.",
    whyItMatters: "Low Free T3 can explain fatigue and weight gain even when other thyroid numbers look normal. It's important for a complete picture of how well your thyroid is actually working at the cellular level.",
    bodySystem: "Thyroid",
    referenceLinks: [{ label: "ATA: Thyroid Function Tests", url: "https://www.thyroid.org/thyroid-function-tests/" }],
    aliases: ["free t3", "ft3", "free triiodothyronine", "t3 free"],
    unitConversions: [
      { fromUnit: "pg/mL", factor: 1 },
      { fromUnit: "pmol/L", factor: 0.651 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 2.0, high: 4.4 },
      { label: "Optimal", gender: "all", optimalLow: 2.5, optimalHigh: 4.0 },
    ],
  },

  // === HORMONES (additional) ===
  {
    key: "testosterone_free",
    name: "Free Testosterone",
    shortName: "Free T",
    category: "Hormones",
    canonicalUnit: "pg/mL",
    description: "The unbound, biologically active fraction of testosterone — typically 1–3% of total testosterone. It directly enters cells to exert androgenic effects.",
    relevance: "Free testosterone may be a better marker of androgen status than total testosterone, especially when SHBG is abnormal (obesity lowers SHBG, aging and liver disease raise it). Low free T is associated with reduced libido, muscle loss, fatigue, and increased fracture risk.",
    researchNotes: "Equilibrium dialysis is the gold-standard method for measuring free testosterone but is rarely used in routine labs. Calculated free testosterone (Vermeulen method) is a reliable alternative using total T, SHBG, and albumin.",
    plainDescription: "The small fraction of testosterone that's unbound and freely available for your body to use. It directly affects muscle growth, energy, mood, and sexual function.",
    whyItMatters: "Total testosterone can look normal while free testosterone is actually low — especially as you age or gain weight. Low free T is the real driver behind symptoms like fatigue, low libido, and muscle loss.",
    bodySystem: "Hormones",
    referenceLinks: [{ label: "Endocrine Society: Testosterone", url: "https://www.endocrine.org/patient-engagement/endocrine-library/testosterone" }],
    aliases: ["free testosterone", "free testo", "testosterone free", "ft", "free t"],
    unitConversions: [
      { fromUnit: "pg/mL", factor: 1 },
      { fromUnit: "pmol/L", factor: 0.2884 },
      { fromUnit: "ng/dL", factor: 10 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 5.0, high: 21.0 },
      { label: "Normal (Female)", gender: "female", low: 0.3, high: 1.9 },
      { label: "Optimal (Male)", gender: "male", optimalLow: 8.0, optimalHigh: 18.0 },
    ],
  },
  {
    key: "estradiol",
    name: "Estradiol (E2)",
    shortName: "E2",
    category: "Hormones",
    canonicalUnit: "pg/mL",
    description: "The primary and most potent estrogen. In women it drives the menstrual cycle, bone health, and cardiovascular protection. In men it plays a role in bone density and brain function.",
    relevance: "Low estradiol in premenopausal women indicates ovarian insufficiency or hypothalamic amenorrhea. In post-menopausal women, very low estradiol accelerates bone loss and cardiovascular risk. In men, both high and low estradiol have negative effects.",
    researchNotes: "In men, estradiol 20–35 pg/mL is considered optimal — values above 40 may indicate excessive aromatase activity. LC-MS/MS is the preferred assay; immunoassays can overestimate estradiol in men due to cross-reactivity.",
    plainDescription: "The main form of estrogen — the key female sex hormone. Women need it for menstrual cycles, bone strength, and heart health. Men need small amounts for bones and brain function.",
    whyItMatters: "In women, low estradiol can cause irregular periods, bone loss, and increased heart risk. In men, too-high estradiol (often from excess body fat) can cause breast tissue growth and mood changes.",
    bodySystem: "Hormones",
    referenceLinks: [{ label: "NIH: Estrogen Levels Test", url: "https://medlineplus.gov/lab-tests/estrogen-levels-test/" }],
    aliases: ["estradiol", "e2", "oestradiol", "estradiol e2", "17-beta estradiol", "17β-estradiol"],
    unitConversions: [
      { fromUnit: "pg/mL", factor: 1 },
      { fromUnit: "pmol/L", factor: 0.2724 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 10, high: 40 },
      { label: "Normal (Female, Follicular)", gender: "female", low: 12.5, high: 166 },
      { label: "Optimal (Male)", gender: "male", optimalLow: 20, optimalHigh: 35 },
    ],
  },
  {
    key: "dhea_s",
    name: "DHEA-Sulfate",
    shortName: "DHEA-S",
    category: "Hormones",
    canonicalUnit: "μg/dL",
    description: "The sulfated form of dehydroepiandrosterone, the most abundant circulating steroid hormone. Produced primarily by the adrenal glands, DHEA-S serves as a precursor for both testosterone and estrogen.",
    relevance: "DHEA-S declines steadily with age — by age 70 levels are 10–20% of peak values. Low DHEA-S is associated with reduced well-being, bone loss, and impaired immune function. High DHEA-S in women may indicate polycystic ovary syndrome (PCOS) or an adrenal tumor.",
    researchNotes: "DHEA-S is the best marker of adrenal androgen production because it has a long half-life and minimal diurnal variation (unlike cortisol and DHEA). Supplementation trials have shown mixed results for anti-aging benefits.",
    plainDescription: "A hormone made by your adrenal glands that your body converts into testosterone and estrogen. It's sometimes called the 'youth hormone' because levels decline steadily as you age.",
    whyItMatters: "Low DHEA-S may contribute to fatigue, low mood, and weaker bones as you get older. In younger women, high DHEA-S can point to PCOS or adrenal problems causing excess male-pattern hair growth.",
    bodySystem: "Hormones",
    referenceLinks: [{ label: "NIH: DHEA-S Test", url: "https://medlineplus.gov/lab-tests/dhea-sulfate-test/" }],
    aliases: ["dhea-s", "dhea sulfate", "dheas", "dehydroepiandrosterone sulfate", "dhea-so4"],
    unitConversions: [
      { fromUnit: "μg/dL", factor: 1 },
      { fromUnit: "ug/dL", factor: 1 },
      { fromUnit: "μmol/L", factor: 36.84 },
      { fromUnit: "umol/L", factor: 36.84 },
    ],
    referenceRanges: [
      { label: "Normal (Male 20-39)", gender: "male", low: 160, high: 449 },
      { label: "Normal (Female 20-39)", gender: "female", low: 65, high: 380 },
      { label: "Normal (Male 40-59)", gender: "male", low: 88, high: 427 },
      { label: "Normal (Female 40-59)", gender: "female", low: 35, high: 256 },
    ],
  },

  // === VITAMINS & MINERALS (additional) ===
  {
    key: "iron",
    name: "Iron (Serum)",
    shortName: "Iron",
    category: "Vitamins & Minerals",
    canonicalUnit: "μg/dL",
    description: "The amount of circulating iron bound to transferrin in the blood. Iron is essential for oxygen transport (hemoglobin), energy production, and DNA synthesis.",
    relevance: "Iron deficiency is the most common nutritional deficiency worldwide, causing anemia, fatigue, and impaired cognition. Iron overload (hemochromatosis) can damage the liver, heart, and pancreas.",
    researchNotes: "Serum iron varies substantially throughout the day and after meals — fasting morning draws are most reliable. Serum iron alone is insufficient for diagnosing iron status; it must be interpreted alongside ferritin, transferrin saturation, and TIBC.",
    plainDescription: "The amount of iron circulating in your blood right now. Iron is needed to make hemoglobin — the molecule in red blood cells that carries oxygen throughout your body.",
    whyItMatters: "Low iron leads to anemia, which causes fatigue, weakness, and brain fog. But too much iron (common in hereditary hemochromatosis) can silently damage your liver and heart.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Iron Test", url: "https://medlineplus.gov/lab-tests/iron-tests/" }],
    aliases: ["iron", "serum iron", "fe", "iron level", "eisen"],
    unitConversions: [
      { fromUnit: "μg/dL", factor: 1 },
      { fromUnit: "ug/dL", factor: 1 },
      { fromUnit: "μmol/L", factor: 5.587 },
      { fromUnit: "umol/L", factor: 5.587 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 65, high: 175 },
      { label: "Normal (Female)", gender: "female", low: 50, high: 170 },
      { label: "Optimal", gender: "all", optimalLow: 70, optimalHigh: 150 },
    ],
  },
  {
    key: "transferrin_saturation",
    name: "Transferrin Saturation",
    shortName: "TSAT",
    category: "Vitamins & Minerals",
    canonicalUnit: "%",
    description: "The percentage of iron-binding sites on transferrin that are occupied by iron. Calculated as (serum iron ÷ TIBC) × 100.",
    relevance: "Low TSAT (< 20%) indicates iron deficiency even before anemia develops. High TSAT (> 45%) raises suspicion for hereditary hemochromatosis or iron overload. TSAT is more specific for iron status than serum iron alone.",
    researchNotes: "TSAT > 45% has high sensitivity for HFE-related hemochromatosis. In chronic kidney disease, TSAT < 20% + ferritin < 100 ng/mL defines functional iron deficiency requiring IV iron supplementation.",
    plainDescription: "Shows how much of the iron-carrying protein in your blood (transferrin) is actually loaded with iron. It's expressed as a percentage.",
    whyItMatters: "A low percentage means your body doesn't have enough iron to keep up with demand — even if you're not yet anemic. A very high percentage can signal iron overload, which needs treatment to prevent organ damage.",
    bodySystem: "Vitamins & Minerals",
    referenceLinks: [{ label: "NIH: Iron Tests", url: "https://medlineplus.gov/lab-tests/iron-tests/" }],
    aliases: ["transferrin saturation", "tsat", "tf saturation", "iron saturation", "transferrin sat", "% transferrin saturation"],
    unitConversions: [
      { fromUnit: "%", factor: 1 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 20, high: 50 },
      { label: "Optimal", gender: "all", optimalLow: 25, optimalHigh: 45 },
      { label: "Critical High", gender: "all", criticalHigh: 80 },
    ],
  },

  // === CARDIOVASCULAR (additional) ===
  {
    key: "fibrinogen",
    name: "Fibrinogen",
    shortName: "Fbg",
    category: "Cardiovascular",
    canonicalUnit: "mg/dL",
    description: "A glycoprotein produced by the liver that is essential for blood clot formation. It is converted to fibrin by thrombin during the coagulation cascade.",
    relevance: "Elevated fibrinogen is both a clotting risk factor and an acute-phase inflammatory marker. High levels are independently associated with increased risk of heart attack, stroke, and venous thromboembolism.",
    researchNotes: "Fibrinogen > 400 mg/dL is associated with roughly doubled cardiovascular risk. As an acute-phase reactant, fibrinogen rises during infections, surgery, and inflammatory conditions, so elevated values should be interpreted in clinical context.",
    plainDescription: "A protein made by your liver that helps your blood clot. When you're injured, fibrinogen is converted into fibrin strands that form the mesh of a blood clot.",
    whyItMatters: "High fibrinogen makes your blood 'stickier' and raises your risk of heart attacks and strokes. It also rises during inflammation, so it can be a clue that something else is going on in your body.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "NIH: Fibrinogen Test", url: "https://medlineplus.gov/lab-tests/fibrinogen-test/" }],
    aliases: ["fibrinogen", "factor i", "fbg", "fibrinogen level", "fibrinogen activity"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "g/L", factor: 100 },
      { fromUnit: "μmol/L", factor: 34 },
    ],
    referenceRanges: [
      { label: "Normal", gender: "all", low: 200, high: 400 },
      { label: "Optimal", gender: "all", optimalLow: 200, optimalHigh: 350 },
      { label: "Critical Low", gender: "all", criticalLow: 100 },
    ],
  },
  {
    key: "lp_a",
    name: "Lipoprotein(a)",
    shortName: "Lp(a)",
    category: "Cardiovascular",
    canonicalUnit: "nmol/L",
    description: "A genetically determined lipoprotein particle consisting of an LDL-like particle bound to apolipoprotein(a). It promotes atherosclerosis and thrombosis.",
    relevance: "Elevated Lp(a) is one of the strongest genetic risk factors for coronary heart disease, aortic valve stenosis, and stroke. Unlike LDL, Lp(a) levels are ~90% genetically determined and largely unaffected by diet or statins.",
    researchNotes: "Lp(a) > 50 mg/dL (≈ 125 nmol/L) doubles cardiovascular risk. The 2024 EAS consensus recommends measuring Lp(a) at least once in every adult. New therapies (antisense oligonucleotides) targeting Lp(a) are in phase III trials.",
    plainDescription: "A special type of cholesterol particle that's almost entirely controlled by your genes. Think of it as 'sticky LDL' — it both clogs arteries and promotes blood clots.",
    whyItMatters: "High Lp(a) is one of the strongest inherited risk factors for heart attacks — and most people have never had it measured. Knowing your level helps you and your doctor take preventive action early.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "AHA: Lipoprotein(a)", url: "https://www.heart.org/en/health-topics/cholesterol/about-cholesterol/lipoprotein-a" }],
    aliases: ["lipoprotein a", "lp(a)", "lpa", "lp a", "lipoprotein(a)"],
    unitConversions: [
      { fromUnit: "nmol/L", factor: 1 },
      { fromUnit: "mg/dL", factor: 2.5 },
    ],
    referenceRanges: [
      { label: "Desirable", gender: "all", low: 0, high: 75 },
      { label: "Borderline", gender: "all", low: 75, high: 125 },
      { label: "High Risk", gender: "all", low: 125, high: 250 },
      { label: "Very High Risk", gender: "all", criticalHigh: 250 },
    ],
  },
  {
    key: "apolipoprotein_b",
    name: "Apolipoprotein B",
    shortName: "ApoB",
    category: "Cardiovascular",
    canonicalUnit: "mg/dL",
    description: "The primary structural protein of all atherogenic lipoproteins (LDL, VLDL, IDL, Lp(a)). Each atherogenic particle has exactly one ApoB molecule, so ApoB directly counts the total number of artery-clogging particles.",
    relevance: "ApoB is considered a superior predictor of cardiovascular risk compared to LDL-C because it counts all atherogenic particles, not just cholesterol content. Discordance between LDL-C and ApoB is common and clinically significant.",
    researchNotes: "Meta-analyses show ApoB is a stronger predictor of CVD events than LDL-C or non-HDL-C. The 2023 EAS/ESC guidelines recommend ApoB as the preferred lipid target. Optimal ApoB < 80 mg/dL (< 60 mg/dL for very high-risk patients).",
    plainDescription: "A protein that sits on the surface of every 'bad cholesterol' particle (LDL, VLDL, etc.). Since each dangerous particle has exactly one ApoB, it's a direct count of how many artery-clogging particles are in your blood.",
    whyItMatters: "Many experts now consider ApoB a better heart-risk marker than standard LDL cholesterol. Your LDL might look normal while you actually have too many small, dangerous particles — ApoB catches that discrepancy.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "JAMA: ApoB vs LDL", url: "https://jamanetwork.com/journals/jamacardiology/fullarticle/2781899" }],
    aliases: ["apolipoprotein b", "apo b", "apob", "apo-b", "apolipoprotein b-100"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "g/L", factor: 100 },
    ],
    referenceRanges: [
      { label: "Desirable", gender: "all", low: 0, high: 90 },
      { label: "Optimal", gender: "all", optimalLow: 40, optimalHigh: 80 },
      { label: "Borderline High", gender: "all", low: 90, high: 120 },
      { label: "High Risk", gender: "all", criticalHigh: 130 },
    ],
  },
  {
    key: "apolipoprotein_a1",
    name: "Apolipoprotein A1",
    shortName: "ApoA1",
    category: "Cardiovascular",
    canonicalUnit: "mg/dL",
    description: "The primary protein component of HDL particles. ApoA1 activates LCAT (an enzyme in reverse cholesterol transport) and helps clear cholesterol from artery walls.",
    relevance: "Higher ApoA1 is associated with reduced cardiovascular risk. The ApoB/ApoA1 ratio is one of the strongest predictors of myocardial infarction across all populations, ethnicities, and genders.",
    researchNotes: "The INTERHEART study found the ApoB/ApoA1 ratio to be the strongest lipid-related risk factor for MI, superior to any single lipid measurement. ApoA1 < 120 mg/dL in men or < 140 mg/dL in women is considered low.",
    plainDescription: "The main protein in 'good cholesterol' (HDL) particles. It helps HDL do its job of collecting excess cholesterol from your arteries and carrying it back to the liver for disposal.",
    whyItMatters: "Higher ApoA1 means more effective cholesterol cleanup from your arteries. The ratio of ApoB to ApoA1 is one of the most powerful predictors of heart attack risk across all populations.",
    bodySystem: "Heart & Circulation",
    referenceLinks: [{ label: "AHA: HDL Cholesterol", url: "https://www.heart.org/en/health-topics/cholesterol/hdl-good-ldl-bad-cholesterol-and-triglycerides" }],
    aliases: ["apolipoprotein a1", "apo a1", "apoa1", "apo-a1", "apolipoprotein a-1", "apo a-1"],
    unitConversions: [
      { fromUnit: "mg/dL", factor: 1 },
      { fromUnit: "g/L", factor: 100 },
    ],
    referenceRanges: [
      { label: "Normal (Male)", gender: "male", low: 94, high: 176 },
      { label: "Normal (Female)", gender: "female", low: 101, high: 199 },
      { label: "Optimal (Male)", gender: "male", optimalLow: 120, optimalHigh: 176 },
      { label: "Optimal (Female)", gender: "female", optimalLow: 140, optimalHigh: 199 },
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
// All known unit strings (normalised, lowercase, no spaces)
const ALL_KNOWN_UNITS = new Set<string>();
for (const b of BIOMARKER_DB) {
  ALL_KNOWN_UNITS.add(b.canonicalUnit.toLowerCase().replace(/\s/g, ""));
  for (const c of b.unitConversions) {
    ALL_KNOWN_UNITS.add(c.fromUnit.toLowerCase().replace(/\s/g, ""));
  }
}

/** Return true if tok looks like a lab unit */
function looksLikeUnit(tok: string): boolean {
  const t = tok.toLowerCase().replace(/\s/g, "");
  if (ALL_KNOWN_UNITS.has(t)) return true;
  // heuristic: contains % or / or starts with g or m or μ and is short
  if (t.length <= 12 && (/[%\/]/.test(t) || /^[gmμunpfl]/.test(t))) return true;
  return false;
}

/** Return true if tok is a pure number (allows comma as decimal separator) */
function isNumericToken(tok: string): boolean {
  return /^-?\d+([.,]\d+)?$/.test(tok);
}

/**
 * Score a candidate value/unit pair for a given biomarker.
 * Higher = better. Returns null if implausible.
 */
function scorePair(
  val: number,
  unit: string,
  biomarker: BiomarkerInfo
): number | null {
  if (isNaN(val) || val < 0) return null;

  const normUnit = unit.toLowerCase().replace(/\s/g, "");
  const canonNorm = biomarker.canonicalUnit.toLowerCase().replace(/\s/g, "");

  // Check exact unit match
  const exactUnitMatch =
    normUnit === canonNorm ||
    biomarker.unitConversions.some(
      (c) => c.fromUnit.toLowerCase().replace(/\s/g, "") === normUnit
    );

  // Check plausibility against reference ranges (wide margin)
  let plausible = false;
  for (const r of biomarker.referenceRanges) {
    const lo = r.criticalLow ?? r.low ?? r.optimalLow ?? 0;
    const hi = r.criticalHigh ?? r.high ?? r.optimalHigh ?? 1e9;
    // Allow 5x outside range for unit-converted values
    if (val >= lo * 0.05 && val <= hi * 5) {
      plausible = true;
      break;
    }
  }
  if (biomarker.referenceRanges.length === 0) plausible = true;

  let score = 0;
  if (exactUnitMatch) score += 10;
  if (plausible) score += 5;
  if (unit && looksLikeUnit(unit)) score += 3;
  if (!unit) score -= 2; // prefer values with units

  // Negative score means very unlikely
  return score >= 3 ? score : null;
}

/** Find all alias matches in a string, returning set of biomarker keys */
function findAliasesInLine(
  lowerClean: string,
  sortedAliases: Array<[string, string]>
): Set<string> {
  const matchedKeys = new Set<string>();
  for (const [alias, key] of sortedAliases) {
    if (!lowerClean.includes(alias)) continue;
    const idx = lowerClean.indexOf(alias);
    const before = idx === 0 ? " " : lowerClean[idx - 1];
    const after = idx + alias.length >= lowerClean.length ? " " : lowerClean[idx + alias.length];
    const wordBefore = /[\s\(\[:,\-\/]/.test(before);
    const wordAfter = /[\s\)\],:\.\-\/]/.test(after) || idx + alias.length >= lowerClean.length;
    if (wordBefore && wordAfter) {
      matchedKeys.add(key);
    }
  }
  return matchedKeys;
}

/**
 * Extract (value, unit) candidates from a segment of text.
 * Strategy: scan each numeric token; grab adjacent unit if present.
 */
function extractCandidatesFromText(text: string): Array<{ val: number; unit: string }> {
  const tokens = text.replace(/[\t:;|]+/g, " ").split(/\s+/).filter(Boolean);
  const candidates: Array<{ val: number; unit: string }> = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!isNumericToken(tokens[i])) continue;
    const val = parseFloat(tokens[i].replace(",", "."));
    if (isNaN(val)) continue;
    const nextTok = tokens[i + 1] || "";
    const prevTok = tokens[i - 1] || "";
    if (looksLikeUnit(nextTok)) {
      candidates.push({ val, unit: nextTok });
    } else if (looksLikeUnit(prevTok)) {
      candidates.push({ val, unit: prevTok });
    } else {
      candidates.push({ val, unit: "" });
    }
  }
  return candidates;
}

export function parsePdfText(text: string): Array<{
  biomarkerKey: string;
  originalValue: number;
  originalUnit: string;
  date?: string;
}> {
  const found = new Map<string, { val: number; unit: string; score: number }>();

  // Keep original lines (with tabs) for tab-split strategy
  const rawLines = text.replace(/\r/g, "").split("\n");
  // Also maintain normalised (tab→space) lines for alias matching
  const lines = rawLines.map(l => l.replace(/\t/g, " "));

  // ---- Pre-index alias lengths for longest-match priority ----
  const sortedAliases = [...ALIAS_MAP.entries()].sort(
    ([a], [b]) => b.length - a.length
  );

  // ----
  // PASS 1: Single-line scan
  // Handles: standard tabular format and sterling-accuris tab-split format
  // ----
  for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
    const rawOrig = rawLines[lineIdx]; // original with tabs
    const raw = rawOrig.trim();
    if (!raw || raw.length < 3) continue;

    const clean = raw.replace(/\s+/g, " ");
    const lowerClean = clean.toLowerCase();

    const matchedKeys = findAliasesInLine(lowerClean, sortedAliases);
    if (matchedKeys.size === 0) continue;

    // Build candidate set
    const candidates: Array<{ val: number; unit: string }> = [];

    const tabIdx = rawOrig.indexOf("\t");
    // Detect "reference range only" lines: "Name [H/L] unit N1 - N2" with no tab and no actual value
    // Key: the line has ONLY 2 numeric tokens which form the reference range (no isolated measured value)
    // Example: "SGPT U/L 0 - 50" (only 0 and 50) vs "Hemoglobin 15.1 g/dL 13.5 – 17.5" (15.1, 13.5, 17.5 = 3 tokens)
    const allNumericTokens = raw.split(/\s+/).filter(t => /^-?\d+([.,]\d+)?$/.test(t));
    const endsWithRange = /\d+[.,]?\d*\s*[-–]\s*\d+[.,]?\d*\s*$/.test(raw.trim());
    // isRefRangeLine: no tab, ends with range, and has at most 2 numeric tokens (only the range values)
    const isRefRangeLine = tabIdx === -1 && endsWithRange && allNumericTokens.length <= 2;

    if (tabIdx !== -1) {
      // Sterling-Accuris tab format: "Name unit refRange[TAB]Method VALUE"
      // The part AFTER the tab contains the method + the actual measurement value
      // The value is always the LAST numeric token after the tab
      const afterTab = rawOrig.substring(tabIdx + 1).trim();
      const beforeTab = rawOrig.substring(0, tabIdx).trim();

      // Extract unit from the before-tab part (it's after the name, before the ref range)
      const beforeTokens = beforeTab.split(/\s+/).filter(Boolean);
      const unit = beforeTokens.find(t => looksLikeUnit(t)) || "";

      // Last numeric token after tab = the measured value
      const afterTokens = afterTab.split(/\s+/).filter(Boolean);
      const lastNumTok = [...afterTokens].reverse().find(t => isNumericToken(t));
      if (lastNumTok) {
        const val = parseFloat(lastNumTok.replace(",", "."));
        if (!isNaN(val)) {
          candidates.push({ val, unit });
        }
      }
      // Also add any candidates from the full line (lower priority)
      candidates.push(...extractCandidatesFromText(clean));
    } else if (!isRefRangeLine) {
      // Standard format: scan entire line (skip ref-range-only lines)
      candidates.push(...extractCandidatesFromText(clean));
      // Also try last-token strategy (for lines like "Method 7.10")
      const rawTokens = raw.split(/\s+/);
      const lastNumTok = [...rawTokens].reverse().find(t => isNumericToken(t));
      if (lastNumTok) {
        const val = parseFloat(lastNumTok.replace(",", "."));
        if (!isNaN(val)) {
          const li = rawTokens.lastIndexOf(lastNumTok);
          const nextU = rawTokens[li + 1] || "";
          const prevU = rawTokens[li - 1] || "";
          const unit = looksLikeUnit(nextU) ? nextU : looksLikeUnit(prevU) ? prevU : "";
          candidates.push({ val, unit });
        }
      }
    }
    // If isRefRangeLine and no tab: leave candidates empty; Pass 2 lookahead will find the value

    // Score & store best candidate per biomarker
    for (const key of matchedKeys) {
      const biomarker = BIOMARKER_MAP.get(key);
      if (!biomarker) continue;

      let best: { val: number; unit: string; score: number } | null = null;
      for (const { val, unit } of candidates) {
        const s = scorePair(val, unit, biomarker);
        if (s !== null && (!best || s > best.score)) {
          best = { val, unit, score: s };
        }
      }

      if (best) {
        const existing = found.get(key);
        if (!existing || best.score > existing.score) {
          found.set(key, best);
        }
      }
    }
  }

  // ----
  // PASS 2: Multi-line lookahead (up to 8 lines)
  // Handles sterling-accuris multi-line format:
  //   Line i: "HbA1c H % For Screening:"
  //   Lines i+1..i+7: reference ranges (skipped)
  //   Line i+k: "Method VALUE"  <- value line (ends with a number)
  // ----
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.length < 3) continue;
    const lowerClean = raw.replace(/\s+/g, " ").toLowerCase();

    const matchedKeys = findAliasesInLine(lowerClean, sortedAliases);
    if (matchedKeys.size === 0) continue;

    // For each biomarker not yet found (or found with low score), look ahead
    for (const key of matchedKeys) {
      const existingScore = found.get(key)?.score ?? -999;
      if (existingScore >= 15) continue; // already found with high confidence

      const biomarker = BIOMARKER_MAP.get(key);
      if (!biomarker) continue;

      // Scan next 8 lines for a "method value" line
      for (let j = i + 1; j < Math.min(i + 9, lines.length); j++) {
        const vLine = lines[j].trim();
        if (!vLine || vLine.length < 2) continue;

        // Skip lines that are clearly reference range lines (range, threshold, percentage range)
        if (/\d+[.,]?\d*\s*[-–]\s*\d+[.,]?\d*/.test(vLine) && !vLine.includes("\t")) continue;
        // Skip threshold lines like "> 7.0 %" or "< 100" (reference boundaries)
        if (/^[<>]\s*\d+/.test(vLine) || /:\s*[<>]\s*\d+/.test(vLine)) continue;
        // Skip lines that only contain a percentage range like "5.7% -" or "6.4%"
        if (/^\d+[.,]?\d*%?\s*[-–]?\s*$/.test(vLine)) continue;
        // Skip narrative/explanatory lines (bullet points, long sentences, >70 chars with no tab)
        if (vLine.startsWith("•") || vLine.startsWith("-") || (vLine.length > 70 && !vLine.includes("\t") && /\s[a-zA-Z]{4,}\s/.test(vLine))) continue;
        // Skip pure reference/threshold description lines (no tab, only keywords + numbers)
        if (!vLine.includes("\t") && /^(near|borderline|optimal|very high|poor control|good control|for screening|for diabetic|non-diab|desirable|high:|low:|borderline high)/i.test(vLine)) continue;
        // Stop at page markers or completely new sections
        if (/^(page|--\s*\d+\s*of|test result|explanation|reference|erythrocyte|lipid profile|biochemistry|haematology|complete blood)/i.test(vLine)) break;

        const vTokens = vLine.split(/\s+/).filter(Boolean);
        const lastNum = [...vTokens].reverse().find(t => isNumericToken(t));
        if (!lastNum) continue;

        const val = parseFloat(lastNum.replace(",", "."));
        if (isNaN(val)) continue;

        const li = vTokens.lastIndexOf(lastNum);
        const nextU = vTokens[li + 1] || "";
        const prevU = vTokens[li - 1] || "";
        const unit = looksLikeUnit(nextU) ? nextU : looksLikeUnit(prevU) ? prevU : "";

        const s = scorePair(val, unit, biomarker);
        if (s !== null && s > existingScore) {
          found.set(key, { val, unit, score: s });
        }
        // Stop at first line that has a scoreable number
        if (s !== null) break;
      }
    }
  }

  // ---- Build result array ----
  const results: Array<{
    biomarkerKey: string;
    originalValue: number;
    originalUnit: string;
  }> = [];

  for (const [key, { val, unit }] of found) {
    const biomarker = BIOMARKER_MAP.get(key)!;
    results.push({
      biomarkerKey: key,
      originalValue: val,
      originalUnit: unit || biomarker.canonicalUnit,
    });
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
