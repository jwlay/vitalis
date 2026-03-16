import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea,
} from "recharts";
import {
  ArrowLeft, Upload, Sun, Moon, Activity, FlaskConical,
  TrendingUp, TrendingDown, Minus, Info, X, ChevronDown, ChevronUp,
  Calendar, FileText, Trash2, BarChart2, CheckCircle, AlertTriangle, AlertCircle,
  ExternalLink, HelpCircle, ArrowUpDown, BookOpen, Pencil, Save, Plus,
  Download, Heart, Droplets, ZapOff, Atom, Cpu, Filter, Eye,
} from "lucide-react";
import type { Profile, BloodTest, BiomarkerResult } from "@shared/schema";
import PerplexityAttribution from "@/components/PerplexityAttribution";

// ===== TYPES =====
interface ReferenceRange {
  label: string;
  gender?: string;
  low?: number;
  high?: number;
  optimalLow?: number;
  optimalHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

interface ReferenceSet {
  id: string;
  label: string;
  description: string;
  source: string;
  sourceUrl?: string;
  ranges: ReferenceRange[];
}

interface AlternateUnit {
  unit: string;
  factor: number;
  precision?: number;
}

interface ReferenceLink {
  label: string;
  url: string;
}

interface BiomarkerInfo {
  key: string;
  name: string;
  shortName?: string;
  category: string;
  canonicalUnit: string;
  description: string;
  plainDescription?: string;
  whyItMatters?: string;
  bodySystem?: string;
  relevance: string;
  researchNotes: string;
  referenceRanges: ReferenceRange[];
  referenceSets?: ReferenceSet[];
  alternateUnits?: AlternateUnit[];
  referenceLinks?: ReferenceLink[];
}

interface AnalyticsData {
  totalTests: number;
  totalMarkers: number;
  latestTest: BloodTest | null;
  flagCounts: Record<string, number>;
  byBiomarker: Record<string, Array<{
    id: number;
    value: number;
    unit: string;
    testDate: string;
    flagStatus: string | null;
    testId: number;
  }>>;
  tests: Array<{ id: number; testDate: string; labName: string | null; fileName: string | null; notes?: string | null }>;
}

// ===== COLOR MAP — STRICT: green=optimal, amber=normal, orange=high/low, red=critical. NO BLUE. =====
const FLAG_COLORS: Record<string, { bg: string; text: string; border: string; label: string; dot: string; hex: string }> = {
  optimal:       { bg: "bg-emerald-50 dark:bg-emerald-950/30",  text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", label: "Optimal",       dot: "#10b981", hex: "#10b981" },
  normal:        { bg: "bg-amber-50 dark:bg-amber-950/30",      text: "text-amber-700 dark:text-amber-400",    border: "border-amber-200 dark:border-amber-800",    label: "Normal",        dot: "#f59e0b", hex: "#f59e0b" },
  low:           { bg: "bg-orange-50 dark:bg-orange-950/30",    text: "text-orange-700 dark:text-orange-400",  border: "border-orange-200 dark:border-orange-800",  label: "Low",           dot: "#f97316", hex: "#f97316" },
  high:          { bg: "bg-orange-50 dark:bg-orange-950/30",    text: "text-orange-700 dark:text-orange-400",  border: "border-orange-200 dark:border-orange-800",  label: "High",          dot: "#f97316", hex: "#f97316" },
  critical_low:  { bg: "bg-red-50 dark:bg-red-950/30",         text: "text-red-700 dark:text-red-400",        border: "border-red-200 dark:border-red-800",        label: "Critical Low",  dot: "#ef4444", hex: "#ef4444" },
  critical_high: { bg: "bg-red-50 dark:bg-red-950/30",         text: "text-red-700 dark:text-red-400",        border: "border-red-200 dark:border-red-800",        label: "Critical High", dot: "#ef4444", hex: "#ef4444" },
};

const NEEDS_ATTENTION = new Set(["low", "high", "critical_low", "critical_high"]);

const CATEGORY_COLORS: Record<string, string> = {
  "Metabolic":             "#01696f",
  "Lipids":                "#8b5cf6",
  "Complete Blood Count":  "#3b82f6",
  "Liver Function":        "#f59e0b",
  "Kidney Function":       "#ec4899",
  "Thyroid":               "#06b6d4",
  "Vitamins & Minerals":   "#10b981",
  "Inflammation":          "#ef4444",
  "Hormones":              "#f97316",
};

// Body system icon map
const BODY_SYSTEM_ICONS: Record<string, JSX.Element> = {
  "Heart & Circulation": <Heart size={14} className="text-red-500" />,
  "Metabolism":          <Atom size={14} className="text-teal-500" />,
  "Liver & Digestion":   <Droplets size={14} className="text-amber-500" />,
  "Kidneys":             <ZapOff size={14} className="text-pink-500" />,
  "Blood Cells":         <Activity size={14} className="text-blue-500" />,
  "Thyroid":             <Cpu size={14} className="text-cyan-500" />,
  "Vitamins & Minerals": <FlaskConical size={14} className="text-emerald-500" />,
  "Immune System":       <Filter size={14} className="text-orange-500" />,
  "Hormones":            <BarChart2 size={14} className="text-purple-500" />,
};

// ===== HELPERS =====

function computeFlagStatus(value: number, ranges: ReferenceRange[], gender?: string): string {
  const applicable = ranges.filter(r => !r.gender || r.gender === "all" || r.gender === gender);
  for (const r of applicable) {
    if (r.criticalLow !== undefined && value < r.criticalLow) return "critical_low";
    if (r.criticalHigh !== undefined && value > r.criticalHigh) return "critical_high";
  }
  for (const r of applicable) {
    if (r.optimalLow !== undefined && r.optimalHigh !== undefined) {
      if (value >= r.optimalLow && value <= r.optimalHigh) return "optimal";
    }
  }
  for (const r of applicable) {
    if (r.low !== undefined && r.high !== undefined && r.high < 5000) {
      if (value >= r.low && value <= r.high) return "normal";
      if (value < r.low) return "low";
      if (value > r.high) return "high";
    }
  }
  return "normal";
}

function FlagIcon({ status }: { status: string | null }) {
  if (!status) return <Minus size={14} className="text-muted-foreground" />;
  if (status === "optimal") return <CheckCircle size={14} className="text-emerald-500" />;
  if (status === "normal") return <CheckCircle size={14} className="text-amber-500" />;
  if (status === "low" || status === "high") return <AlertTriangle size={14} className="text-orange-500" />;
  return <AlertCircle size={14} className="text-red-500" />;
}

function FlagBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const c = FLAG_COLORS[status] || FLAG_COLORS.normal;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

function TrendIcon({ values }: { values: number[] }) {
  if (values.length < 2) return <Minus size={14} className="text-muted-foreground" />;
  const delta = values[values.length - 1] - values[values.length - 2];
  if (Math.abs(delta) < 0.01) return <Minus size={14} className="text-muted-foreground" />;
  if (delta > 0) return <TrendingUp size={14} className="text-orange-500" />;
  return <TrendingDown size={14} className="text-emerald-500" />;
}

function getThresholds(ranges: ReferenceRange[], gender?: string, unit: string = "", unitFactor: number = 1): Array<{ label: string; value: string; meaning: string }> {
  const applicable = ranges.filter(r => !r.gender || r.gender === "all" || r.gender === gender);
  const thresholds: Array<{ label: string; value: string; meaning: string; sortKey: number }> = [];
  for (const r of applicable) {
    if (r.optimalLow !== undefined && r.optimalLow > 0)
      thresholds.push({ label: r.label + " lower bound", value: `≥ ${(r.optimalLow * unitFactor).toFixed(unitFactor === 1 ? 0 : 2)} ${unit}`, meaning: "Minimum for optimal", sortKey: r.optimalLow });
    if (r.optimalHigh !== undefined && r.optimalHigh < 9999)
      thresholds.push({ label: r.label + " upper bound", value: `≤ ${(r.optimalHigh * unitFactor).toFixed(unitFactor === 1 ? 0 : 2)} ${unit}`, meaning: "Maximum for optimal range", sortKey: r.optimalHigh });
    if (r.low !== undefined && r.high !== undefined && r.high < 5000)
      thresholds.push({ label: r.label, value: `${(r.low * unitFactor).toFixed(unitFactor === 1 ? 0 : 2)} – ${(r.high * unitFactor).toFixed(unitFactor === 1 ? 0 : 2)} ${unit}`, meaning: `Range for "${r.label}" classification`, sortKey: r.low });
    if (r.criticalLow !== undefined)
      thresholds.push({ label: "Critical Low threshold", value: `< ${(r.criticalLow * unitFactor).toFixed(unitFactor === 1 ? 0 : 2)} ${unit}`, meaning: "Below this is clinically critical", sortKey: r.criticalLow });
    if (r.criticalHigh !== undefined)
      thresholds.push({ label: "Critical High threshold", value: `> ${(r.criticalHigh * unitFactor).toFixed(unitFactor === 1 ? 0 : 2)} ${unit}`, meaning: "Above this is clinically critical", sortKey: r.criticalHigh });
  }
  const seen = new Set<string>();
  return thresholds
    .sort((a, b) => a.sortKey - b.sortKey)
    .filter(t => { if (seen.has(t.value)) return false; seen.add(t.value); return true; });
}

// ===== IMPROVED GAUGE — no text inside bar, value shown clearly below =====
function BiomarkerGauge({
  value, biomarker, gender, activeRanges, displayUnit, displayFactor, onShowExplanation,
}: {
  value: number;
  biomarker: BiomarkerInfo;
  gender?: string;
  activeRanges: ReferenceRange[];
  displayUnit: string;
  displayFactor: number;
  onShowExplanation: () => void;
}) {
  const ranges = activeRanges.filter(r => !r.gender || r.gender === "all" || r.gender === gender);
  const normalRange = ranges.find(r => r.label === "Normal" || r.label === "Acceptable" || r.label === "Desirable" ||
    (r.low !== undefined && r.high !== undefined && r.high < 5000));
  if (!normalRange || normalRange.low === undefined || normalRange.high === undefined) return null;

  const { low, high } = normalRange;
  const optRange = ranges.find(r => r.optimalLow !== undefined && r.optimalHigh !== undefined);
  const range = high - low;
  const padding = range * 0.3;
  const minVal = Math.max(0, low - padding);
  const maxVal = high + padding;
  const totalRange = maxVal - minVal;

  const displayValue = value * displayFactor;
  const clampedValue = Math.min(Math.max(value, minVal), maxVal);
  const pct = ((clampedValue - minVal) / totalRange) * 100;

  const optLow = optRange?.optimalLow ?? low;
  const optHigh = optRange?.optimalHigh ?? high;
  const optLowPct = ((Math.max(optLow, minVal) - minVal) / totalRange) * 100;
  const optHighPct = ((Math.min(optHigh, maxVal) - minVal) / totalRange) * 100;
  const normalLowPct = ((Math.max(low, minVal) - minVal) / totalRange) * 100;
  const normalHighPct = ((Math.min(high, maxVal) - minVal) / totalRange) * 100;

  const flagStatus = computeFlagStatus(value, activeRanges, gender);
  const flagColors = FLAG_COLORS[flagStatus] || FLAG_COLORS.normal;
  const displayPrec = displayFactor === 1 ? 1 : 2;

  return (
    <div className="w-full mt-3 space-y-2">
      {/* Gauge bar — NO text inside, clean colored zones only */}
      <div className="relative h-6 rounded-full overflow-hidden bg-muted">
        {/* Out-of-range zones (red) */}
        <div className="absolute inset-y-0 left-0 bg-red-200/70 dark:bg-red-900/40" style={{ width: `${normalLowPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-red-200/70 dark:bg-red-900/40" style={{ left: `${normalHighPct}%` }} />
        {/* Normal zone (amber) */}
        <div className="absolute inset-y-0 bg-amber-200/60 dark:bg-amber-900/30" style={{ left: `${normalLowPct}%`, width: `${normalHighPct - normalLowPct}%` }} />
        {/* Optimal zone (emerald) */}
        <div className="absolute inset-y-0 bg-emerald-300/70 dark:bg-emerald-900/60" style={{ left: `${optLowPct}%`, width: `${optHighPct - optLowPct}%` }} />
        {/* Value indicator needle */}
        <div
          className="absolute top-0.5 bottom-0.5 w-1.5 rounded-full bg-foreground shadow-md transition-all duration-500"
          style={{ left: `${Math.max(0, Math.min(97, pct))}%`, transform: "translateX(-50%)" }}
        />
      </div>

      {/* Zone boundary numbers — below the bar, clearly spaced */}
      <div className="relative h-4">
        {/* Min */}
        <span className="absolute text-[9px] text-muted-foreground tabular-nums" style={{ left: 0 }}>
          {(minVal * displayFactor).toFixed(displayPrec)}
        </span>
        {/* Normal low boundary */}
        {Math.abs(normalLowPct) > 2 && (
          <span className="absolute text-[9px] text-red-500 dark:text-red-400 font-medium tabular-nums -translate-x-1/2" style={{ left: `${normalLowPct}%` }}>
            {(low * displayFactor).toFixed(displayPrec)}
          </span>
        )}
        {/* Optimal low boundary */}
        {optLow > low + 1 && (
          <span className="absolute text-[9px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums -translate-x-1/2" style={{ left: `${optLowPct}%` }}>
            {(optLow * displayFactor).toFixed(displayPrec)}
          </span>
        )}
        {/* Optimal high boundary */}
        {optHigh < high - 1 && (
          <span className="absolute text-[9px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums -translate-x-1/2" style={{ left: `${optHighPct}%` }}>
            {(optHigh * displayFactor).toFixed(displayPrec)}
          </span>
        )}
        {/* Normal high boundary */}
        {Math.abs(normalHighPct - 100) > 2 && (
          <span className="absolute text-[9px] text-red-500 dark:text-red-400 font-medium tabular-nums -translate-x-1/2" style={{ left: `${normalHighPct}%` }}>
            {(high * displayFactor).toFixed(displayPrec)}
          </span>
        )}
        {/* Max */}
        <span className="absolute text-[9px] text-muted-foreground tabular-nums" style={{ right: 0 }}>
          {(maxVal * displayFactor).toFixed(displayPrec)}
        </span>
      </div>

      {/* Value + status row — clear and prominent below the bar */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-semibold tabular-nums ${flagColors.bg} ${flagColors.text} ${flagColors.border}`}>
            <FlagIcon status={flagStatus} />
            <span>{displayValue.toFixed(displayPrec)} {displayUnit}</span>
          </div>
          <FlagBadge status={flagStatus} />
        </div>
        <button
          onClick={onShowExplanation}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle size={12} />
          Why these ranges?
        </button>
      </div>

      {/* Zone legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm bg-emerald-300/70 dark:bg-emerald-900/60 inline-block" />
          <span className="font-medium text-foreground/70">Optimal</span>
          {optRange && (
            <span>{optLow > 0 ? `${(optLow * displayFactor).toFixed(displayPrec)}` : ""}
              {optHigh < 9999 ? ` – ${(optHigh * displayFactor).toFixed(displayPrec)} ${displayUnit}` : `+ ${displayUnit}`}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm bg-amber-200/60 dark:bg-amber-900/30 inline-block" />
          <span className="font-medium text-foreground/70">Normal</span>
          <span>{(low * displayFactor).toFixed(displayPrec)} – {(high * displayFactor).toFixed(displayPrec)} {displayUnit}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm bg-red-200/70 dark:bg-red-900/40 inline-block" />
          <span className="font-medium text-foreground/70">Out of range</span>
        </span>
      </div>
    </div>
  );
}

// ===== THRESHOLD PANEL with reference links =====
function ThresholdPanel({
  biomarker, activeSetId, gender, displayUnit, displayFactor,
}: {
  biomarker: BiomarkerInfo;
  activeSetId: string;
  gender?: string;
  displayUnit: string;
  displayFactor: number;
}) {
  const activeSet = biomarker.referenceSets?.find(s => s.id === activeSetId);
  const ranges = activeSet?.ranges ?? biomarker.referenceRanges;
  const applicable = ranges.filter(r => !r.gender || r.gender === "all" || r.gender === gender);
  const thresholds = getThresholds(applicable, gender, displayUnit, displayFactor);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3 text-xs">
      <div>
        <p className="font-semibold text-sm flex items-center gap-1.5">
          <BookOpen size={13} className="text-primary" />
          Why these ranges?
        </p>
        {activeSet ? (
          <p className="text-muted-foreground mt-1">{activeSet.description}</p>
        ) : (
          <p className="text-muted-foreground mt-1">Default clinical reference ranges used by most labs worldwide.</p>
        )}
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60">
              <th className="text-left p-2 pl-3 font-medium text-muted-foreground">Classification</th>
              <th className="text-right p-2 font-medium text-muted-foreground">Value ({displayUnit})</th>
              <th className="text-left p-2 pr-3 font-medium text-muted-foreground hidden sm:table-cell">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {thresholds.map((t, i) => (
              <tr key={i} className="border-t border-border/30">
                <td className="p-2 pl-3 font-medium">{t.label}</td>
                <td className="p-2 text-right tabular-nums font-mono">{t.value}</td>
                <td className="p-2 pr-3 text-muted-foreground hidden sm:table-cell">{t.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Source + Reference links */}
      {(activeSet || biomarker.referenceLinks?.length) && (
        <div className="space-y-1.5">
          {activeSet && (
            <div className="flex items-start gap-1.5 text-muted-foreground">
              <Info size={11} className="mt-0.5 flex-shrink-0" />
              <span>
                Source: {activeSet.source}
                {activeSet.sourceUrl && (
                  <a href={activeSet.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline">
                    View guideline <ExternalLink size={10} />
                  </a>
                )}
              </span>
            </div>
          )}
          {biomarker.referenceLinks && biomarker.referenceLinks.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground/60">References:</span>
              {biomarker.referenceLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline">
                  {link.label} <ExternalLink size={9} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== PLAIN LANGUAGE EXPLAINER CARD =====
function BiomarkerExplainer({ biomarker }: { biomarker: BiomarkerInfo }) {
  if (!biomarker.plainDescription && !biomarker.whyItMatters) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Plain English</p>
      {biomarker.bodySystem && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {BODY_SYSTEM_ICONS[biomarker.bodySystem] || <Activity size={14} />}
          <span>{biomarker.bodySystem}</span>
        </div>
      )}
      {biomarker.plainDescription && (
        <div>
          <p className="text-xs font-medium text-foreground/80 mb-1">What is this?</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{biomarker.plainDescription}</p>
        </div>
      )}
      {biomarker.whyItMatters && (
        <div>
          <p className="text-xs font-medium text-foreground/80 mb-1">Why does it matter?</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{biomarker.whyItMatters}</p>
        </div>
      )}
    </div>
  );
}

// ===== BIOMARKER CARD =====
function BiomarkerCard({
  biomarkerKey, history, biomarkerInfo, gender, profileRefPrefs, onRefSetChange,
}: {
  biomarkerKey: string;
  history: AnalyticsData["byBiomarker"][string];
  biomarkerInfo: BiomarkerInfo | undefined;
  gender?: string;
  profileRefPrefs?: Record<string, string>;
  onRefSetChange?: (biomarkerKey: string, setId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");
  const [showExplanation, setShowExplanation] = useState(false);
  // Use saved preference from profile, fall back to first available set
  const savedSetId = profileRefPrefs?.[biomarkerKey];
  const defaultSetId = savedSetId || (biomarkerInfo?.referenceSets?.[0]?.id ?? "default");
  const [activeSetId, setActiveSetId] = useState<string>(defaultSetId);
  const [useAltUnit, setUseAltUnit] = useState(false);

  if (!biomarkerInfo || history.length === 0) return null;

  const activeSet = biomarkerInfo.referenceSets?.find(s => s.id === activeSetId);
  const activeRanges: ReferenceRange[] = activeSet?.ranges ?? biomarkerInfo.referenceRanges;
  const altUnit = biomarkerInfo.alternateUnits?.[0];
  const displayUnit = useAltUnit && altUnit ? altUnit.unit : biomarkerInfo.canonicalUnit;
  const displayFactor = useAltUnit && altUnit ? altUnit.factor : 1;
  const displayPrecision = useAltUnit && altUnit ? (altUnit.precision ?? 2) : 2;

  const latest = history[history.length - 1];
  const values = history.map(h => h.value);
  const latestFlag = computeFlagStatus(latest.value, activeRanges, gender);
  const isAttention = NEEDS_ATTENTION.has(latestFlag);

  const chartData = history.map(h => ({
    date: new Date(h.testDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }),
    value: parseFloat((h.value * displayFactor).toFixed(displayPrecision)),
    rawValue: h.value,
    flag: computeFlagStatus(h.value, activeRanges, gender),
  }));

  const applicable = activeRanges.filter(r => !r.gender || r.gender === "all" || r.gender === gender);
  const normalRange = applicable.find(r => (r.low !== undefined && r.high !== undefined && r.high < 5000) || r.label === "Normal" || r.label === "Acceptable" || r.label === "Desirable");
  const optRange = applicable.find(r => r.optimalLow !== undefined && r.optimalHigh !== undefined);

  function toDisplay(v: number) { return v * displayFactor; }

  const refAreas: Array<{ y1: number; y2: number; fill: string; opacity: number }> = [];
  if (normalRange && normalRange.low !== undefined && normalRange.high !== undefined) {
    const nLow = normalRange.low;
    const nHigh = Math.min(normalRange.high, Math.max(...values) * 2 + 10);
    if (nLow > 0) refAreas.push({ y1: 0, y2: toDisplay(nLow), fill: "#ef4444", opacity: 0.07 });
    // Normal zone = amber (not blue!)
    refAreas.push({ y1: toDisplay(nLow), y2: toDisplay(nHigh), fill: "#f59e0b", opacity: 0.06 });
    if (optRange?.optimalLow !== undefined && optRange.optimalHigh !== undefined) {
      refAreas.push({ y1: toDisplay(optRange.optimalLow), y2: toDisplay(optRange.optimalHigh), fill: "#10b981", opacity: 0.12 });
    }
    refAreas.push({ y1: toDisplay(nHigh), y2: toDisplay(nHigh) * 1.5 + 1, fill: "#ef4444", opacity: 0.07 });
  }

  const color = CATEGORY_COLORS[biomarkerInfo.category] || "hsl(var(--primary))";

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const zoneColor = FLAG_COLORS[payload.flag]?.dot || "#6b7280";
    return <circle cx={cx} cy={cy} r={5} fill={zoneColor} stroke="#fff" strokeWidth={1.5} />;
  };
  const CustomActiveDot = (props: any) => {
    const { cx, cy, payload } = props;
    const zoneColor = FLAG_COLORS[payload.flag]?.dot || "#6b7280";
    return <circle cx={cx} cy={cy} r={7} fill={zoneColor} stroke="#fff" strokeWidth={2} />;
  };

  const tooltipFormatter = (v: number, _: any, p: any) => {
    const zone = p?.payload?.flag;
    const zoneLabel = zone ? (FLAG_COLORS[zone]?.label ?? zone) : "";
    return [`${v} ${displayUnit}${zoneLabel ? ` · ${zoneLabel}` : ""}`, biomarkerInfo.shortName || biomarkerInfo.name];
  };

  const commonChartProps = { data: chartData, margin: { top: 8, right: 10, bottom: 4, left: -14 } };
  const commonTooltip = (
    <Tooltip
      contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 6, background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
      formatter={tooltipFormatter}
    />
  );
  const commonAxes = (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
      <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} width={44} tickFormatter={(v: number) => v.toFixed(displayFactor === 1 ? 1 : 2)} />
    </>
  );

  // Reference lines — use amber for normal, emerald for optimal
  const refLines: JSX.Element[] = [];
  if (normalRange?.low !== undefined && normalRange.low > 0) {
    refLines.push(
      <ReferenceLine key="nl" y={toDisplay(normalRange.low)} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
        label={{ value: `Normal ≥${toDisplay(normalRange.low).toFixed(displayFactor===1?0:2)}`, position: "insideTopLeft", fontSize: 9, fill: "#f59e0b" }} />
    );
  }
  if (normalRange?.high !== undefined && normalRange.high < 5000) {
    refLines.push(
      <ReferenceLine key="nh" y={toDisplay(normalRange.high)} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
        label={{ value: `Normal ≤${toDisplay(normalRange.high).toFixed(displayFactor===1?0:2)}`, position: "insideTopRight", fontSize: 9, fill: "#f59e0b" }} />
    );
  }
  if (optRange?.optimalHigh !== undefined && optRange.optimalHigh < 9999) {
    refLines.push(
      <ReferenceLine key="oh" y={toDisplay(optRange.optimalHigh)} stroke="#10b981" strokeDasharray="3 2" strokeWidth={1.5}
        label={{ value: `Optimal ≤${toDisplay(optRange.optimalHigh).toFixed(displayFactor===1?0:2)}`, position: "insideTopLeft", fontSize: 9, fill: "#10b981" }} />
    );
  }
  if (optRange?.optimalLow !== undefined && optRange.optimalLow > 0) {
    refLines.push(
      <ReferenceLine key="ol" y={toDisplay(optRange.optimalLow)} stroke="#10b981" strokeDasharray="3 2" strokeWidth={1.5}
        label={{ value: `Opt ≥${toDisplay(optRange.optimalLow).toFixed(displayFactor===1?0:2)}`, position: "insideBottomLeft", fontSize: 9, fill: "#10b981" }} />
    );
  }

  return (
    <Card className={`border transition-all ${isAttention ? "border-orange-300/60 dark:border-orange-700/40" : "border-border/60"}`}>
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
          data-testid={`card-biomarker-${biomarkerKey}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{biomarkerInfo.name}</span>
                <FlagBadge status={latestFlag} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {biomarkerInfo.bodySystem || biomarkerInfo.category}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
            <div className="text-right">
              <span className="font-semibold text-sm tabular-nums">
                {(latest.value * displayFactor).toFixed(displayPrecision)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">{displayUnit}</span>
            </div>
            <TrendIcon values={values} />
            {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-border/40 pt-4 space-y-5">

            {/* Plain language explainer — shown FIRST for non-medical readers */}
            <BiomarkerExplainer biomarker={biomarkerInfo} />

            {/* Controls row */}
            <div className="flex items-center gap-3 flex-wrap">
              {biomarkerInfo.referenceSets && biomarkerInfo.referenceSets.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Reference:</span>
                  <Select value={activeSetId} onValueChange={(val) => {
                    setActiveSetId(val);
                    onRefSetChange?.(biomarkerKey, val);
                  }}>
                    <SelectTrigger className="h-7 text-xs w-52" data-testid={`select-refset-${biomarkerKey}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {biomarkerInfo.referenceSets.map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{s.label}</span>
                            <span className="text-muted-foreground text-[10px] leading-tight whitespace-normal max-w-52">{s.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Show description of active reference set */}
                  {activeSet && (
                    <div className="mt-1 text-[10px] text-muted-foreground leading-tight max-w-xs">
                      <span className="font-medium text-foreground/70">{activeSet.label}:</span> {activeSet.description}
                      {activeSet.sourceUrl ? (
                        <a href={activeSet.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="ml-1 text-primary underline-offset-2 hover:underline">[source]</a>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
              {altUnit && (
                <button
                  onClick={() => setUseAltUnit(!useAltUnit)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                    useAltUnit
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                  }`}
                  data-testid={`button-unit-toggle-${biomarkerKey}`}
                >
                  <ArrowUpDown size={11} />
                  {useAltUnit ? biomarkerInfo.canonicalUnit : altUnit.unit}
                </button>
              )}
            </div>

            {/* Gauge */}
            <BiomarkerGauge
              value={latest.value}
              biomarker={biomarkerInfo}
              gender={gender}
              activeRanges={activeRanges}
              displayUnit={displayUnit}
              displayFactor={displayFactor}
              onShowExplanation={() => setShowExplanation(!showExplanation)}
            />

            {/* Threshold panel */}
            {showExplanation && (
              <ThresholdPanel
                biomarker={biomarkerInfo}
                activeSetId={activeSetId}
                gender={gender}
                displayUnit={displayUnit}
                displayFactor={displayFactor}
              />
            )}

            {/* Chart */}
            {history.length >= 2 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trend over time</span>
                  <div className="flex gap-1">
                    {(["area", "line", "bar"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setChartType(t)}
                        className={`px-2 py-0.5 text-xs rounded ${chartType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart {...commonChartProps}>
                        {refAreas.map((a, i) => <ReferenceArea key={i} y1={a.y1} y2={a.y2} fill={a.fill} fillOpacity={a.opacity} />)}
                        {commonAxes}{commonTooltip}{refLines}
                        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart {...commonChartProps}>
                        {refAreas.map((a, i) => <ReferenceArea key={i} y1={a.y1} y2={a.y2} fill={a.fill} fillOpacity={a.opacity} />)}
                        {commonAxes}{commonTooltip}{refLines}
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                          dot={<CustomDot />} activeDot={<CustomActiveDot />} />
                      </LineChart>
                    ) : (
                      <AreaChart {...commonChartProps}>
                        <defs>
                          <linearGradient id={`grad-${biomarkerKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        {refAreas.map((a, i) => <ReferenceArea key={i} y1={a.y1} y2={a.y2} fill={a.fill} fillOpacity={a.opacity} />)}
                        {commonAxes}{commonTooltip}{refLines}
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5}
                          fill={`url(#grad-${biomarkerKey})`}
                          dot={<CustomDot />} activeDot={<CustomActiveDot />} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Optimal</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Normal</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> High/Low</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical</span>
                  <span className="text-muted-foreground/60">· Dot color = zone at that measurement</span>
                </div>
              </div>
            )}

            {/* Info sections */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs mt-2">
              <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                <p className="font-medium mb-1.5 flex items-center gap-1.5">
                  <Info size={12} className="text-primary" />
                  Clinical Details
                </p>
                <p className="text-muted-foreground leading-relaxed">{biomarkerInfo.relevance}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                <p className="font-medium mb-1.5 flex items-center gap-1.5">
                  <FlaskConical size={12} className="text-primary" />
                  Research Notes
                </p>
                <p className="text-muted-foreground leading-relaxed">{biomarkerInfo.researchNotes}</p>
              </div>
            </div>

            {/* Measurement history */}
            {history.length > 1 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Measurement History</p>
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="text-left p-2 pl-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Value</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-2 pr-3 font-medium text-muted-foreground hidden sm:table-cell">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...history].reverse().map((h, i, arr) => {
                        const prev = arr[i + 1];
                        const delta = prev ? h.value - prev.value : null;
                        const flagHere = computeFlagStatus(h.value, activeRanges, gender);
                        const displayVal = (h.value * displayFactor).toFixed(displayPrecision);
                        return (
                          <tr key={i} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                            <td className="p-2 pl-3 text-muted-foreground">
                              {new Date(h.testDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="p-2 text-right font-medium tabular-nums">
                              {displayVal} {displayUnit}
                            </td>
                            <td className="p-2 text-right"><FlagBadge status={flagHere} /></td>
                            <td className="p-2 pr-3 text-right hidden sm:table-cell">
                              {delta !== null ? (
                                <span className={`tabular-nums font-medium ${Math.abs(delta) < 0.01 ? "text-muted-foreground" : delta > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                                  {delta >= 0 ? "+" : ""}{(delta * displayFactor).toFixed(displayPrecision)}
                                  <span className="text-muted-foreground ml-1">({delta >= 0 ? "+" : ""}{(delta / (prev?.value || 1) * 100).toFixed(1)}%)</span>
                                </span>
                              ) : <span className="text-muted-foreground/50">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== RADAR CHART =====
function HealthRadarChart({ analytics, biomarkerDb, gender }: { analytics: AnalyticsData; biomarkerDb: BiomarkerInfo[]; gender: string }) {
  const biomarkerMap = new Map(biomarkerDb.map(b => [b.key, b]));
  const radarData = Object.entries(analytics.byBiomarker).map(([key, history]) => {
    const info = biomarkerMap.get(key);
    if (!info || !history?.length) return null;
    const latest = history[history.length - 1];
    const flag = computeFlagStatus(latest.value, info.referenceRanges, gender);
    const score = flag === "optimal" ? 95 : flag === "normal" ? 75 : flag === "low" || flag === "high" ? 45 : 20;
    return { subject: info.shortName || info.name.split(" ").slice(0, 2).join(" "), score, fullMark: 100 };
  }).filter(Boolean).slice(0, 12);

  if (radarData.length < 3) return null;
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid className="stroke-border/40" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
          <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ===== UPLOAD MODAL =====
function UploadModal({ profileId, onSuccess }: { profileId: number; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [labName, setLabName] = useState("");
  const [notes, setNotes] = useState("");
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("testDate", testDate);
      if (labName) formData.append("labName", labName);
      if (notes) formData.append("notes", notes);
      const res = await fetch(`/api/profiles/${profileId}/upload`, { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Upload failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Test uploaded", description: `${data.extractedBiomarkers} biomarkers extracted.` });
      onSuccess();
    },
    onError: (err: Error) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
  }, []);

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="button-upload-test" className="gap-2">
        <Upload size={16} />Upload Test
      </Button>
      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setFile(null); setResult(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Upload Blood Test PDF</DialogTitle></DialogHeader>
          {result ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">✓ {result.extractedBiomarkers} biomarkers extracted</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Date: {result.bloodTest.testDate} · Lab: {result.bloodTest.labName}</p>
              </div>
              <Button className="w-full" onClick={() => { setOpen(false); setFile(null); setResult(null); }}>Close</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-pdf"
              >
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)} data-testid="input-file" />
                <FileText size={32} className="mx-auto mb-3 text-muted-foreground/60" />
                {file ? (
                  <div><p className="font-medium text-sm">{file.name}</p><p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p></div>
                ) : (
                  <div><p className="font-medium text-sm">Drop PDF here or click to select</p><p className="text-xs text-muted-foreground mt-1">Supports blood test PDFs from any lab</p></div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Test Date</label>
                  <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" data-testid="input-test-date" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Lab Name (optional)</label>
                  <input type="text" value={labName} onChange={e => setLabName(e.target.value)} placeholder="e.g. Quest Diagnostics"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" data-testid="input-lab-name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Fasting state, medications, etc." rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm resize-none" data-testid="input-upload-notes" />
              </div>
              <div className="pt-1 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="flex-1" disabled={!file || uploadMutation.isPending} onClick={() => uploadMutation.mutate()} data-testid="button-submit-upload">
                  {uploadMutation.isPending ? "Uploading..." : "Upload & Parse"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== MANUAL ENTRY MODAL =====
function ManualEntryModal({ profileId, biomarkerDb, onSuccess }: { profileId: number; biomarkerDb: BiomarkerInfo[]; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [labName, setLabName] = useState("Manual Entry");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Array<{ biomarkerKey: string; value: string; unit: string }>>([
    { biomarkerKey: "", value: "", unit: "" },
  ]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const validRows = rows.filter(r => r.biomarkerKey && r.value && r.unit);
      if (!validRows.length) throw new Error("Add at least one biomarker result");
      const res = await apiRequest("POST", `/api/profiles/${profileId}/manual-entry`, {
        testDate, labName: labName || "Manual Entry", notes,
        biomarkers: validRows.map(r => ({ biomarkerKey: r.biomarkerKey, value: parseFloat(r.value), unit: r.unit })),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Test added", description: `${data.results.length} biomarker(s) saved.` });
      qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] });
      setOpen(false);
      setRows([{ biomarkerKey: "", value: "", unit: "" }]);
      onSuccess();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addRow = () => setRows(r => [...r, { biomarkerKey: "", value: "", unit: "" }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, val: string) => {
    setRows(r => {
      const n = [...r];
      n[i] = { ...n[i], [field]: val };
      // Auto-fill unit from biomarker db
      if (field === "biomarkerKey") {
        const bm = biomarkerDb.find(b => b.key === val);
        if (bm) n[i].unit = bm.canonicalUnit;
      }
      return n;
    });
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2" data-testid="button-manual-entry">
        <Plus size={16} />Add Manually
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Test Results Manually</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Test Date *</label>
                <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Lab / Source</label>
                <input type="text" value={labName} onChange={e => setLabName(e.target.value)} placeholder="e.g. LabCorp"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Fasting, morning draw..." rows={1}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm resize-none" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Biomarker Results</p>
                <Button variant="outline" size="sm" onClick={addRow} className="gap-1 h-7 text-xs">
                  <Plus size={12} /> Add Row
                </Button>
              </div>
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        value={row.biomarkerKey}
                        onChange={e => updateRow(i, "biomarkerKey", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                        data-testid={`select-biomarker-${i}`}
                      >
                        <option value="">Select biomarker...</option>
                        {biomarkerDb.map(b => (
                          <option key={b.key} value={b.key}>{b.name} ({b.category})</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="number" step="any"
                      value={row.value}
                      onChange={e => updateRow(i, "value", e.target.value)}
                      placeholder="Value"
                      className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      data-testid={`input-value-${i}`}
                    />
                    <input
                      type="text"
                      value={row.unit}
                      onChange={e => updateRow(i, "unit", e.target.value)}
                      placeholder="Unit"
                      className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      data-testid={`input-unit-${i}`}
                    />
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(i)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={mutation.isPending} onClick={() => mutation.mutate()} data-testid="button-submit-manual">
                {mutation.isPending ? "Saving..." : "Save Results"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== TEST EDIT MODAL — inline edit test metadata + biomarker values =====
function TestEditModal({
  test, profileId, biomarkerDb, onSuccess,
}: {
  test: AnalyticsData["tests"][0];
  profileId: number;
  biomarkerDb: BiomarkerInfo[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [testDate, setTestDate] = useState(test.testDate);
  const [labName, setLabName] = useState(test.labName || "");
  const [notes, setNotes] = useState(test.notes || "");
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fetch results for this test
  const { data: results = [] } = useQuery<BiomarkerResult[]>({
    queryKey: ["/api/tests", test.id, "results"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tests/${test.id}/results`);
      return res.json();
    },
    enabled: open,
  });

  const [editingValues, setEditingValues] = useState<Record<number, string>>({});

  const updateTestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/tests/${test.id}`, { testDate, labName, notes });
      if (!res.ok) throw new Error("Failed to update test");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Test updated" });
      qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateResultMutation = useMutation({
    mutationFn: async ({ id, value, unit, biomarkerKey }: { id: number; value: number; unit: string; biomarkerKey: string }) => {
      const res = await apiRequest("PATCH", `/api/results/${id}`, { value, unit, biomarkerKey });
      if (!res.ok) throw new Error("Failed to update result");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Value updated" });
      qc.invalidateQueries({ queryKey: ["/api/tests", test.id, "results"] });
      qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteResultMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/results/${id}`);
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "Result deleted" });
      qc.invalidateQueries({ queryKey: ["/api/tests", test.id, "results"] });
      qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] });
    },
  });

  return (
    <>
      <button
        className="p-2 rounded-lg hover:bg-muted hover:text-primary transition-colors text-muted-foreground"
        onClick={() => setOpen(true)}
        data-testid={`button-edit-test-${test.id}`}
        aria-label="Edit test"
      >
        <Pencil size={15} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test — {new Date(test.testDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Metadata */}
            <div className="space-y-3 rounded-xl border border-border/50 p-4 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Test Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Test Date</label>
                  <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Lab Name</label>
                  <input type="text" value={labName} onChange={e => setLabName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm resize-none" />
              </div>
              <Button size="sm" onClick={() => updateTestMutation.mutate()} disabled={updateTestMutation.isPending}
                className="gap-1.5" data-testid="button-save-test-meta">
                <Save size={13} />{updateTestMutation.isPending ? "Saving..." : "Save Info"}
              </Button>
            </div>

            {/* Results */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Biomarker Values ({results.length})</p>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No results found for this test.</p>
              ) : (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="text-left p-2 pl-3 font-medium text-muted-foreground">Biomarker</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Value</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(r => {
                        const bm = biomarkerDb.find(b => b.key === r.biomarkerKey);
                        const editVal = editingValues[r.id];
                        const isEditing = editVal !== undefined;
                        return (
                          <tr key={r.id} className="border-t border-border/30 hover:bg-muted/10">
                            <td className="p-2 pl-3 font-medium">
                              {bm?.name || r.biomarkerKey}
                              <span className="text-muted-foreground ml-1">({r.unit})</span>
                            </td>
                            <td className="p-2 text-right">
                              {isEditing ? (
                                <input
                                  type="number" step="any"
                                  value={editVal}
                                  onChange={e => setEditingValues(v => ({ ...v, [r.id]: e.target.value }))}
                                  className="w-20 rounded border border-primary bg-background px-2 py-0.5 text-right text-xs"
                                  data-testid={`input-edit-result-${r.id}`}
                                />
                              ) : (
                                <span className="tabular-nums font-medium">{r.value.toFixed(2)} {r.unit}</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"
                                      onClick={() => {
                                        const newVal = parseFloat(editVal);
                                        if (!isNaN(newVal)) {
                                          updateResultMutation.mutate({ id: r.id, value: newVal, unit: r.unit, biomarkerKey: r.biomarkerKey });
                                        }
                                        setEditingValues(v => { const n = { ...v }; delete n[r.id]; return n; });
                                      }}
                                      data-testid={`button-save-result-${r.id}`}
                                    >
                                      <Save size={12} />
                                    </button>
                                    <button
                                      className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                                      onClick={() => setEditingValues(v => { const n = { ...v }; delete n[r.id]; return n; })}
                                    >
                                      <X size={12} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                      onClick={() => setEditingValues(v => ({ ...v, [r.id]: r.value.toString() }))}
                                      data-testid={`button-edit-result-${r.id}`}
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button
                                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                      onClick={() => deleteResultMutation.mutate(r.id)}
                                      data-testid={`button-delete-result-${r.id}`}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={() => { setOpen(false); onSuccess(); }}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== MAIN PROFILE PAGE =====
export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const profileId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeTab, setActiveTab] = useState("overview");
  const [attentionFilter, setAttentionFilter] = useState<"all" | "attention" | "optimal">("all");

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profiles", profileId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/profiles/${profileId}`);
      return res.json() as Promise<Profile>;
    },
  });

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/profiles", profileId, "analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/profiles/${profileId}/analytics`);
      return res.json() as Promise<AnalyticsData>;
    },
  });

  const { data: biomarkerData } = useQuery<{ biomarkers: BiomarkerInfo[]; categories: string[] }>({
    queryKey: ["/api/biomarkers"],
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: number) => apiRequest("DELETE", `/api/tests/${testId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] });
      toast({ title: "Test deleted" });
    },
  });

  const biomarkerMap = new Map((biomarkerData?.biomarkers || []).map(b => [b.key, b]));

  const categories = [
    "All",
    ...([...new Set(Object.keys(analytics?.byBiomarker || {}).map(k => biomarkerMap.get(k)?.category || "Other"))]),
  ];

  // Sort: needs-attention FIRST, then optimal, then normal
  const sortedBiomarkers = Object.entries(analytics?.byBiomarker || {})
    .sort(([keyA, histA], [keyB, histB]) => {
      const bmA = biomarkerMap.get(keyA);
      const bmB = biomarkerMap.get(keyB);
      const flagA = histA[histA.length - 1]?.flagStatus ?? "normal";
      const flagB = histB[histB.length - 1]?.flagStatus ?? "normal";
      const priorityA = NEEDS_ATTENTION.has(flagA) ? 0 : flagA === "optimal" ? 2 : 1;
      const priorityB = NEEDS_ATTENTION.has(flagB) ? 0 : flagB === "optimal" ? 2 : 1;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (bmA?.name || keyA).localeCompare(bmB?.name || keyB);
    });

  const filteredBiomarkers = sortedBiomarkers.filter(([key, hist]) => {
    const catMatch = activeCategory === "All" || biomarkerMap.get(key)?.category === activeCategory;
    if (!catMatch) return false;
    if (attentionFilter === "attention") {
      const f = hist[hist.length - 1]?.flagStatus ?? "normal";
      return NEEDS_ATTENTION.has(f);
    }
    if (attentionFilter === "optimal") {
      return hist[hist.length - 1]?.flagStatus === "optimal";
    }
    return true;
  });

  const getAge = () => {
    if (!profile?.dateOfBirth) return "—";
    return Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const flagCounts = analytics?.flagCounts || {};
  const totalFlags = Object.values(flagCounts).reduce((a, b) => a + b, 0);
  const issueCount = (flagCounts.low || 0) + (flagCounts.high || 0) + (flagCounts.critical_low || 0) + (flagCounts.critical_high || 0);
  const optimalCount = flagCounts.optimal || 0;
  const normalCount = flagCounts.normal || 0;

  // Reference set preferences - loaded from profile, updated on change
  const [refPrefs, setRefPrefs] = useState<Record<string, string>>(() => {
    try {
      return profile?.referencePreferences ? JSON.parse(profile.referencePreferences as string) : {};
    } catch { return {}; }
  });

  // Sync refPrefs when profile loads
  useEffect(() => {
    if (profile?.referencePreferences) {
      try { setRefPrefs(JSON.parse(profile.referencePreferences as string)); } catch {}
    }
  }, [profile?.referencePreferences]);

  const handleRefSetChange = async (biomarkerKey: string, setId: string) => {
    const newPrefs = { ...refPrefs, [biomarkerKey]: setId };
    setRefPrefs(newPrefs);
    // Save to profile
    try {
      await apiRequest("PATCH", `/api/profiles/${profileId}`, {
        referencePreferences: JSON.stringify(newPrefs),
      });
      qc.invalidateQueries({ queryKey: ["/api/profiles", profileId] });
    } catch (e) {
      console.warn("Failed to save reference preference", e);
    }
  };

  const handleExportExcel = () => {
    const url = `/api/profiles/${profileId}/export`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `vitalis-export.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Exporting...", description: "Your Excel file is being prepared." });
  };

  const handleExportPDF = () => {
    const url = `/api/profiles/${profileId}/export.pdf`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `vitalis-report.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Generating PDF...", description: "Your health report is being prepared." });
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="text-sm text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" data-testid="button-back">
              <ArrowLeft size={16} />Back
            </Button>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{profile?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="font-medium text-sm">{profile?.name}</span>
              <span className="text-xs text-muted-foreground">{getAge()} yrs · {profile?.gender}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                title="Export all data to Excel"
                data-testid="button-export-excel"
              >
                <Download size={14} />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 text-xs font-medium hover:bg-primary/10 text-primary transition-colors"
                title="Export full PDF health report"
                data-testid="button-export-pdf"
              >
                <FileText size={14} />
                PDF Report
              </button>
            </div>
            {biomarkerData && (
              <ManualEntryModal profileId={profileId} biomarkerDb={biomarkerData.biomarkers} onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] })} />
            )}
            <UploadModal
              profileId={profileId}
              onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] })}
            />
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary KPI cards — clickable to filter */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              {
                label: "Tests Run",
                value: analytics.totalTests,
                icon: FileText,
                color: "text-primary",
                sublabel: "total tests",
                onClick: () => setActiveTab("tests"),
                testId: "kpi-tests",
              },
              {
                label: "Biomarkers",
                value: analytics.totalMarkers,
                icon: Activity,
                color: "text-purple-500",
                sublabel: "tracked markers",
                onClick: () => { setActiveTab("biomarkers"); setAttentionFilter("all"); },
                testId: "kpi-biomarkers",
              },
              {
                label: "Need Attention",
                value: issueCount,
                icon: issueCount > 0 ? AlertTriangle : CheckCircle,
                color: issueCount > 0 ? "text-orange-500" : "text-emerald-500",
                sublabel: issueCount > 0 ? "out of range" : "all within range",
                onClick: () => { setActiveTab("biomarkers"); setAttentionFilter("attention"); },
                testId: "kpi-attention",
                highlight: issueCount > 0,
              },
              {
                label: "Optimal",
                value: optimalCount,
                icon: CheckCircle,
                color: "text-emerald-500",
                sublabel: "in optimal zone",
                onClick: () => { setActiveTab("biomarkers"); setAttentionFilter("optimal"); },
                testId: "kpi-optimal",
              },
            ].map(({ label, value, icon: Icon, color, sublabel, onClick, testId, highlight }) => (
              <Card
                key={label}
                className={`border-border/50 cursor-pointer hover:border-primary/40 transition-all hover:shadow-sm ${highlight ? "border-orange-300/50 dark:border-orange-700/30" : ""}`}
                onClick={onClick}
                data-testid={testId}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon size={18} className={color} />
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="biomarkers" data-testid="tab-biomarkers">
              Biomarkers
              {issueCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold">
                  {issueCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tests" data-testid="tab-tests">Test History</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : analytics?.totalTests === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <FlaskConical size={36} className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-1">No tests uploaded yet</h3>
                <p className="text-sm text-muted-foreground mb-5">Upload a blood test PDF or add results manually to start tracking.</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <UploadModal profileId={profileId} onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] })} />
                  {biomarkerData && <ManualEntryModal profileId={profileId} biomarkerDb={biomarkerData.biomarkers} onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] })} />}
                </div>
              </div>
            ) : (
              <>
                {/* Needs Attention summary */}
                {issueCount > 0 && (
                  <Card className="border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">{issueCount} biomarker{issueCount > 1 ? "s" : ""} need attention</p>
                          <p className="text-xs text-muted-foreground mt-1">These markers are outside the normal reference range and may warrant a conversation with your doctor.</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {sortedBiomarkers
                              .filter(([, hist]) => NEEDS_ATTENTION.has(hist[hist.length - 1]?.flagStatus ?? ""))
                              .slice(0, 8)
                              .map(([key, hist]) => {
                                const bm = biomarkerMap.get(key);
                                const f = hist[hist.length - 1]?.flagStatus;
                                const fc = FLAG_COLORS[f ?? ""] || FLAG_COLORS.normal;
                                return (
                                  <button
                                    key={key}
                                    className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer ${fc.bg} ${fc.text} ${fc.border}`}
                                    onClick={() => { setActiveTab("biomarkers"); setAttentionFilter("attention"); }}
                                  >
                                    {bm?.shortName || bm?.name || key}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Radar chart */}
                {analytics && biomarkerData && Object.keys(analytics.byBiomarker).length >= 3 && (
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Health Overview — Biomarker Status Radar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <HealthRadarChart analytics={analytics} biomarkerDb={biomarkerData.biomarkers} gender={profile?.gender} />
                      <p className="text-xs text-muted-foreground text-center mt-2">Higher score = closer to optimal. Optimal: 95, Normal: 75, Borderline: 45, Critical: 20</p>
                    </CardContent>
                  </Card>
                )}

                {/* Category breakdown */}
                {analytics && biomarkerData && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[...new Set(Object.keys(analytics.byBiomarker).map(k => biomarkerMap.get(k)?.category || "Other"))].map(cat => {
                      const markers = Object.entries(analytics.byBiomarker).filter(([k]) => (biomarkerMap.get(k)?.category || "Other") === cat);
                      const issues = markers.filter(([, h]) => NEEDS_ATTENTION.has(h[h.length - 1]?.flagStatus ?? ""));
                      const color = CATEGORY_COLORS[cat] || "hsl(var(--primary))";

                      // Category descriptions
                      const catDesc: Record<string, string> = {
                        "Metabolic": "How your body processes sugar and energy — diabetes risk markers",
                        "Lipids": "Fats in your blood — key indicators of heart health",
                        "Liver Function": "How well your liver is working — filtering and processing",
                        "Kidney Function": "How well your kidneys are cleaning your blood",
                        "Complete Blood Count": "Red & white blood cells — oxygen delivery and immunity",
                        "Thyroid": "Thyroid hormones control your metabolism and energy levels",
                        "Vitamins & Minerals": "Essential nutrients your body needs to function properly",
                        "Inflammation": "Markers that show whether your body is inflamed",
                        "Hormones": "Chemical messengers that regulate many body functions",
                      };

                      return (
                        <Card key={cat} className="border-border/50 cursor-pointer hover:border-primary/40 transition-colors"
                          onClick={() => { setActiveCategory(cat); setActiveTab("biomarkers"); }}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                <span className="font-medium text-sm">{cat}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {issues.length > 0 && (
                                  <div className="flex items-center gap-1 text-orange-500">
                                    <AlertTriangle size={12} />
                                    <span className="text-xs font-medium">{issues.length}</span>
                                  </div>
                                )}
                                <ChevronDown size={14} className="text-muted-foreground rotate-[-90deg]" />
                              </div>
                            </div>
                            {catDesc[cat] && (
                              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{catDesc[cat]}</p>
                            )}
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {markers.slice(0, 6).map(([key, hist]) => {
                                const info = biomarkerMap.get(key);
                                const f = computeFlagStatus(hist[hist.length - 1].value, info?.referenceRanges ?? [], profile?.gender);
                                const fc = f === "optimal"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                                  : NEEDS_ATTENTION.has(f)
                                  ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400"
                                  : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400";
                                return (
                                  <div key={key} className={`text-xs px-2 py-0.5 rounded-full border ${fc}`}>
                                    {biomarkerMap.get(key)?.shortName || key}
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* BIOMARKERS TAB */}
          <TabsContent value="biomarkers">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : analytics?.totalTests === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Upload a blood test to see your biomarkers here.</div>
            ) : (
              <div>
                {/* Filters row */}
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  {/* Status quick-filter */}
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { id: "all", label: "All" },
                      { id: "attention", label: `Needs Attention (${issueCount})`, highlight: issueCount > 0 },
                      { id: "optimal", label: `Optimal (${optimalCount})` },
                    ] as const).map(f => (
                      <button
                        key={f.id}
                        onClick={() => setAttentionFilter(f.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          attentionFilter === f.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : (f as any).highlight
                            ? "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                        data-testid={`filter-status-${f.id}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Category filter */}
                  <div className="flex gap-1.5 flex-wrap">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          activeCategory === cat
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                        data-testid={`filter-category-${cat}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredBiomarkers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">No biomarkers match the current filter.</div>
                  ) : (
                    filteredBiomarkers.map(([key, history]) => (
                      <BiomarkerCard
                        key={key}
                        biomarkerKey={key}
                        history={history}
                        biomarkerInfo={biomarkerMap.get(key)}
                        gender={profile?.gender}
                        profileRefPrefs={refPrefs}
                        onRefSetChange={handleRefSetChange}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TEST HISTORY TAB */}
          <TabsContent value="tests">
            {isLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : !analytics?.tests.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <FileText size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No tests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.tests.map(test => {
                  // Count results in this test
                  const resultsForTest = Object.values(analytics.byBiomarker).filter(h => h.some(r => r.testId === test.id)).length;
                  return (
                    <Card key={test.id} className="border-border/50" data-testid={`card-test-${test.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText size={18} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {new Date(test.testDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-muted-foreground">{test.labName || "Unknown Lab"}</span>
                                {test.fileName && (
                                  <>
                                    <span className="text-muted-foreground/40">·</span>
                                    <span className="text-xs text-muted-foreground">{test.fileName}</span>
                                  </>
                                )}
                                <span className="text-muted-foreground/40">·</span>
                                <span className="text-xs text-muted-foreground">{resultsForTest} biomarker{resultsForTest !== 1 ? "s" : ""}</span>
                              </div>
                              {test.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{test.notes}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-3">
                            {biomarkerData && (
                              <TestEditModal
                                test={test}
                                profileId={profileId}
                                biomarkerDb={biomarkerData.biomarkers}
                                onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] })}
                              />
                            )}
                            <button
                              className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                              onClick={() => deleteTestMutation.mutate(test.id)}
                              data-testid={`button-delete-test-${test.id}`}
                              aria-label="Delete test"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-16 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Vitalis · Blood Test Tracker</span>
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}
