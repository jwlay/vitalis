import { useState, useRef, useCallback } from "react";
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
  ReferenceLine, Legend,
} from "recharts";
import {
  ArrowLeft, Upload, Sun, Moon, Activity, FlaskConical,
  TrendingUp, TrendingDown, Minus, Info, X, ChevronDown, ChevronUp,
  Calendar, FileText, Trash2, BarChart2, CheckCircle, AlertTriangle, AlertCircle,
} from "lucide-react";
import type { Profile, BloodTest, BiomarkerResult } from "@shared/schema";
import PerplexityAttribution from "@/components/PerplexityAttribution";

// ===== TYPES =====
interface BiomarkerInfo {
  key: string;
  name: string;
  shortName?: string;
  category: string;
  canonicalUnit: string;
  description: string;
  relevance: string;
  researchNotes: string;
  referenceRanges: Array<{
    label: string;
    gender?: string;
    low?: number;
    high?: number;
    optimalLow?: number;
    optimalHigh?: number;
    criticalLow?: number;
    criticalHigh?: number;
  }>;
}

interface AnalyticsData {
  totalTests: number;
  totalMarkers: number;
  latestTest: BloodTest | null;
  flagCounts: Record<string, number>;
  byBiomarker: Record<string, Array<{
    value: number;
    unit: string;
    testDate: string;
    flagStatus: string | null;
    testId: number;
  }>>;
  tests: Array<{ id: number; testDate: string; labName: string | null; fileName: string | null }>;
}

// ===== COLOR MAP =====
const FLAG_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  optimal:       { bg: "bg-emerald-50 dark:bg-emerald-950/30",  text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", label: "Optimal" },
  normal:        { bg: "bg-blue-50 dark:bg-blue-950/30",        text: "text-blue-700 dark:text-blue-400",       border: "border-blue-200 dark:border-blue-800",       label: "Normal"   },
  low:           { bg: "bg-amber-50 dark:bg-amber-950/30",      text: "text-amber-700 dark:text-amber-400",     border: "border-amber-200 dark:border-amber-800",     label: "Low"      },
  high:          { bg: "bg-orange-50 dark:bg-orange-950/30",    text: "text-orange-700 dark:text-orange-400",   border: "border-orange-200 dark:border-orange-800",   label: "High"     },
  critical_low:  { bg: "bg-red-50 dark:bg-red-950/30",         text: "text-red-700 dark:text-red-400",         border: "border-red-200 dark:border-red-800",         label: "Critical Low" },
  critical_high: { bg: "bg-red-50 dark:bg-red-950/30",         text: "text-red-700 dark:text-red-400",         border: "border-red-200 dark:border-red-800",         label: "Critical High" },
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#f43f5e",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Metabolic": "#01696f",
  "Lipids": "#8b5cf6",
  "Complete Blood Count": "#3b82f6",
  "Liver Function": "#f59e0b",
  "Kidney Function": "#ec4899",
  "Thyroid": "#06b6d4",
  "Vitamins & Minerals": "#10b981",
  "Inflammation": "#ef4444",
  "Hormones": "#f97316",
};

function FlagIcon({ status }: { status: string | null }) {
  if (!status) return <Minus size={14} className="text-muted-foreground" />;
  if (status === "optimal") return <CheckCircle size={14} className="text-emerald-500" />;
  if (status === "normal") return <CheckCircle size={14} className="text-blue-500" />;
  if (status === "low" || status === "high") return <AlertTriangle size={14} className="text-amber-500" />;
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

// ===== GAUGE COMPONENT =====
function BiomarkerGauge({
  value,
  biomarker,
  gender,
}: {
  value: number;
  biomarker: BiomarkerInfo;
  gender?: string;
}) {
  const ranges = biomarker.referenceRanges.filter(
    (r) => !r.gender || r.gender === "all" || r.gender === gender
  );

  // Find normal range for gauge bounds
  const normalRange = ranges.find((r) => r.label === "Normal" || (r.low !== undefined && r.high !== undefined));
  if (!normalRange || normalRange.low === undefined || normalRange.high === undefined) return null;

  const { low, high } = normalRange;
  const optRange = ranges.find((r) => r.optimalLow !== undefined && r.optimalHigh !== undefined);
  const range = high - low;
  const padding = range * 0.3;

  const minVal = Math.max(0, low - padding);
  const maxVal = high + padding;
  const totalRange = maxVal - minVal;

  const clampedValue = Math.min(Math.max(value, minVal), maxVal);
  const pct = ((clampedValue - minVal) / totalRange) * 100;

  const optLow = optRange?.optimalLow ?? low;
  const optHigh = optRange?.optimalHigh ?? high;
  const optLowPct = ((Math.max(optLow, minVal) - minVal) / totalRange) * 100;
  const optHighPct = ((Math.min(optHigh, maxVal) - minVal) / totalRange) * 100;
  const normalLowPct = ((Math.max(low, minVal) - minVal) / totalRange) * 100;
  const normalHighPct = ((Math.min(high, maxVal) - minVal) / totalRange) * 100;

  return (
    <div className="w-full mt-3">
      <div className="relative h-6 rounded-full overflow-hidden bg-muted">
        {/* Red zones */}
        <div className="absolute inset-y-0 left-0 bg-red-200/70 dark:bg-red-900/30" style={{ width: `${normalLowPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-red-200/70 dark:bg-red-900/30" style={{ left: `${normalHighPct}%` }} />
        {/* Normal zone */}
        <div
          className="absolute inset-y-0 bg-amber-100 dark:bg-amber-900/20"
          style={{ left: `${normalLowPct}%`, width: `${normalHighPct - normalLowPct}%` }}
        />
        {/* Optimal zone */}
        <div
          className="absolute inset-y-0 bg-emerald-200/80 dark:bg-emerald-900/40"
          style={{ left: `${optLowPct}%`, width: `${optHighPct - optLowPct}%` }}
        />
        {/* Value indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/80 shadow-sm transition-all duration-500"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1.5 tabular-nums">
        <span>{minVal.toFixed(1)}</span>
        <span className="font-medium text-foreground">
          {value.toFixed(2)} {biomarker.canonicalUnit}
        </span>
        <span>{maxVal.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-emerald-200 dark:bg-emerald-900/40 inline-block" />
          Optimal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-amber-100 dark:bg-amber-900/20 inline-block" />
          Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-red-200/70 dark:bg-red-900/30 inline-block" />
          Out of range
        </span>
      </div>
    </div>
  );
}

// ===== BIOMARKER CARD =====
function BiomarkerCard({
  biomarkerKey,
  history,
  biomarkerInfo,
  gender,
}: {
  biomarkerKey: string;
  history: AnalyticsData["byBiomarker"][string];
  biomarkerInfo: BiomarkerInfo | undefined;
  gender?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");

  if (!biomarkerInfo || history.length === 0) return null;

  const latest = history[history.length - 1];
  const values = history.map((h) => h.value);
  const latestFlag = latest.flagStatus;

  const chartData = history.map((h) => ({
    date: new Date(h.testDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }),
    value: parseFloat(h.value.toFixed(3)),
    flag: h.flagStatus,
  }));

  // Determine reference range for chart line
  const normalRange = biomarkerInfo.referenceRanges.find(
    (r) => !r.gender || r.gender === "all" || r.gender === gender
  );
  const optRange = biomarkerInfo.referenceRanges.find(
    (r) => (r.optimalLow !== undefined || r.optimalHigh !== undefined) &&
    (!r.gender || r.gender === "all" || r.gender === gender)
  );

  const color = CATEGORY_COLORS[biomarkerInfo.category] || "hsl(var(--primary))";

  return (
    <Card className={`border ${latestFlag && latestFlag !== "normal" && latestFlag !== "optimal" ? "border-amber-300/60 dark:border-amber-700/40" : "border-border/60"} transition-all`}>
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
          data-testid={`card-biomarker-${biomarkerKey}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{biomarkerInfo.name}</span>
                <FlagBadge status={latestFlag} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{biomarkerInfo.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
            <div className="text-right">
              <span className="font-semibold text-sm tabular-nums">
                {latest.value.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">{latest.unit}</span>
            </div>
            <TrendIcon values={values} />
            {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-border/40 pt-4 space-y-4">
            {/* Gauge */}
            <BiomarkerGauge value={latest.value} biomarker={biomarkerInfo} gender={gender} />

            {/* Chart - only show if multiple data points */}
            {history.length >= 2 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trend over time</span>
                  <div className="flex gap-1">
                    {(["area", "line", "bar"] as const).map((t) => (
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
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 6, background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                          formatter={(v: number) => [`${v.toFixed(2)} ${biomarkerInfo.canonicalUnit}`, biomarkerInfo.shortName || biomarkerInfo.name]}
                        />
                        {optRange?.optimalLow !== undefined && (
                          <ReferenceLine y={optRange.optimalLow} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} />
                        )}
                        {optRange?.optimalHigh !== undefined && (
                          <ReferenceLine y={optRange.optimalHigh} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} />
                        )}
                        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 6, background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                          formatter={(v: number) => [`${v.toFixed(2)} ${biomarkerInfo.canonicalUnit}`, biomarkerInfo.shortName || biomarkerInfo.name]}
                        />
                        {optRange?.optimalLow !== undefined && (
                          <ReferenceLine y={optRange.optimalLow} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Opt Low", position: "right", fontSize: 9 }} />
                        )}
                        {optRange?.optimalHigh !== undefined && (
                          <ReferenceLine y={optRange.optimalHigh} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Opt High", position: "right", fontSize: 9 }} />
                        )}
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                        <defs>
                          <linearGradient id={`grad-${biomarkerKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 6, background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                          formatter={(v: number) => [`${v.toFixed(2)} ${biomarkerInfo.canonicalUnit}`, biomarkerInfo.shortName || biomarkerInfo.name]}
                        />
                        {optRange?.optimalLow !== undefined && (
                          <ReferenceLine y={optRange.optimalLow} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} />
                        )}
                        {optRange?.optimalHigh !== undefined && (
                          <ReferenceLine y={optRange.optimalHigh} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} />
                        )}
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#grad-${biomarkerKey})`} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Info sections */}
            <div className="grid gap-3 sm:grid-cols-3 text-xs mt-2">
              <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                <p className="font-medium mb-1.5 flex items-center gap-1.5">
                  <Info size={12} className="text-primary" />
                  About
                </p>
                <p className="text-muted-foreground leading-relaxed">{biomarkerInfo.description}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                <p className="font-medium mb-1.5 flex items-center gap-1.5">
                  <Activity size={12} className="text-primary" />
                  Clinical Relevance
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

            {/* History table */}
            {history.length > 1 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">History</p>
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="text-left p-2 pl-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Value</th>
                        <th className="text-right p-2 pr-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...history].reverse().map((h, i) => (
                        <tr key={i} className="border-t border-border/30">
                          <td className="p-2 pl-3 text-muted-foreground">
                            {new Date(h.testDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="p-2 text-right font-medium tabular-nums">
                            {h.value.toFixed(2)} {h.unit}
                          </td>
                          <td className="p-2 pr-3 text-right">
                            <FlagBadge status={h.flagStatus} />
                          </td>
                        </tr>
                      ))}
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

// ===== RADAR / OVERVIEW CHART =====
function HealthRadarChart({
  analytics,
  biomarkerDb,
  gender,
}: {
  analytics: AnalyticsData;
  biomarkerDb: BiomarkerInfo[];
  gender: string;
}) {
  const biomarkerMap = new Map(biomarkerDb.map((b) => [b.key, b]));

  // Calculate a 0-100 "score" for each biomarker based on its latest value
  const radarData = Object.entries(analytics.byBiomarker).map(([key, history]) => {
    const info = biomarkerMap.get(key);
    if (!info || !history || history.length === 0) return null;
    const latest = history[history.length - 1];
    if (!latest) return null;
    const flag = latest.flagStatus;
    const score = flag === "optimal" ? 95 : flag === "normal" ? 75 : flag === "low" || flag === "high" ? 45 : 20;
    return {
      subject: info.shortName || info.name.split(" ").slice(0, 2).join(" "),
      score,
      fullMark: 100,
    };
  }).filter(Boolean).slice(0, 12);

  if (radarData.length < 3) return null;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid className="stroke-border/40" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
          <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ===== UPLOAD MODAL =====
function UploadModal({
  profileId,
  onSuccess,
}: {
  profileId: number;
  onSuccess: () => void;
}) {
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
      const res = await fetch(`/api/profiles/${profileId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Test uploaded",
        description: `${data.extractedBiomarkers} biomarkers extracted successfully.`,
      });
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
  }, []);

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="button-upload-test" className="gap-2">
        <Upload size={16} />
        Upload Test
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setFile(null); setResult(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Blood Test PDF</DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  ✓ {result.extractedBiomarkers} biomarkers extracted
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                  Test date: {result.bloodTest.testDate} · Lab: {result.bloodTest.labName}
                </p>
              </div>
              {result.results.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Extracted biomarkers:</p>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {result.results.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1 text-xs">
                        <span className="font-medium">{r.biomarkerKey.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground tabular-nums">{r.value.toFixed(1)} {r.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={() => { setOpen(false); setFile(null); setResult(null); }}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-pdf"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  data-testid="input-file"
                />
                <FileText size={32} className="mx-auto mb-3 text-muted-foreground/60" />
                {file ? (
                  <div>
                    <p className="font-medium text-sm text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-sm">Drop PDF here or click to select</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports blood test PDFs from any lab</p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Test Date</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    data-testid="input-test-date"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Lab Name (optional)</label>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="e.g. Quest Diagnostics"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    data-testid="input-lab-name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Fasting state, medications taken, etc."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm resize-none"
                  data-testid="input-upload-notes"
                />
              </div>

              <div className="pt-1 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!file || uploadMutation.isPending}
                  onClick={() => uploadMutation.mutate()}
                  data-testid="button-submit-upload"
                >
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

  const biomarkerMap = new Map((biomarkerData?.biomarkers || []).map((b) => [b.key, b]));

  const categories = [
    "All",
    ...([...new Set(
      Object.keys(analytics?.byBiomarker || {}).map(
        (k) => biomarkerMap.get(k)?.category || "Other"
      )
    )]),
  ];

  const filteredBiomarkers = Object.entries(analytics?.byBiomarker || {}).filter(([key]) => {
    if (activeCategory === "All") return true;
    return biomarkerMap.get(key)?.category === activeCategory;
  });

  const getAge = () => {
    if (!profile?.dateOfBirth) return "—";
    return Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  // Status summary for latest test
  const flagCounts = analytics?.flagCounts || {};
  const totalFlags = Object.values(flagCounts).reduce((a, b) => a + b, 0);
  const issueCount = (flagCounts.low || 0) + (flagCounts.high || 0) + (flagCounts.critical_low || 0) + (flagCounts.critical_high || 0);

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
              <ArrowLeft size={16} />
              Back
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
            <UploadModal
              profileId={profileId}
              onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] })}
            />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary KPI cards */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Tests", value: analytics.totalTests, icon: FileText, color: "text-primary" },
              { label: "Biomarkers", value: analytics.totalMarkers, icon: Activity, color: "text-purple-500" },
              {
                label: issueCount > 0 ? "Need Attention" : "All Normal",
                value: issueCount > 0 ? issueCount : totalFlags - issueCount,
                icon: issueCount > 0 ? AlertTriangle : CheckCircle,
                color: issueCount > 0 ? "text-amber-500" : "text-emerald-500",
              },
              {
                label: "Optimal",
                value: flagCounts.optimal || 0,
                icon: CheckCircle,
                color: "text-emerald-500",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="border-border/50">
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
            <TabsTrigger value="biomarkers" data-testid="tab-biomarkers">Biomarkers</TabsTrigger>
            <TabsTrigger value="tests" data-testid="tab-tests">Test History</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : analytics?.totalTests === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <FlaskConical size={36} className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-1">No tests uploaded yet</h3>
                <p className="text-sm text-muted-foreground mb-5">Upload a blood test PDF to start tracking your biomarkers.</p>
                <UploadModal
                  profileId={profileId}
                  onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "analytics"] })}
                />
              </div>
            ) : (
              <>
                {/* Radar chart */}
                {analytics && biomarkerData && Object.keys(analytics.byBiomarker).length >= 3 && (
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Health Overview — Biomarker Status Radar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <HealthRadarChart analytics={analytics} biomarkerDb={biomarkerData.biomarkers} gender={profile?.gender} />
                      <p className="text-xs text-muted-foreground text-center mt-2">Higher score = closer to optimal range. Optimal: 95, Normal: 75, Borderline: 45, Critical: 20</p>
                    </CardContent>
                  </Card>
                )}

                {/* Category breakdown */}
                {analytics && biomarkerData && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[...new Set(Object.keys(analytics.byBiomarker).map((k) => biomarkerMap.get(k)?.category || "Other"))].map((cat) => {
                      const markers = Object.entries(analytics.byBiomarker).filter(([k]) => (biomarkerMap.get(k)?.category || "Other") === cat);
                      const issues = markers.filter(([, h]) => {
                        const f = h[h.length - 1].flagStatus;
                        return f === "low" || f === "high" || f === "critical_low" || f === "critical_high";
                      });
                      const color = CATEGORY_COLORS[cat] || "hsl(var(--primary))";
                      return (
                        <Card key={cat} className="border-border/50 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setActiveCategory(cat); setActiveTab("biomarkers"); }}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                <span className="font-medium text-sm">{cat}</span>
                              </div>
                              <ChevronDown size={14} className="text-muted-foreground rotate-[-90deg]" />
                            </div>
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-xl font-semibold tabular-nums">{markers.length}</p>
                                <p className="text-xs text-muted-foreground">markers</p>
                              </div>
                              {issues.length > 0 && (
                                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <AlertTriangle size={13} />
                                  <span className="text-xs font-medium">{issues.length} need attention</span>
                                </div>
                              )}
                            </div>
                            {/* Mini sparklines */}
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                              {markers.slice(0, 6).map(([key, hist]) => {
                                const f = hist[hist.length - 1].flagStatus;
                                return (
                                  <div
                                    key={key}
                                    className={`text-xs px-2 py-0.5 rounded-full border ${
                                      f === "optimal" ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400" :
                                      f === "normal" ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400" :
                                      "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
                                    }`}
                                  >
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
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : analytics?.totalTests === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Upload a blood test to see your biomarkers here.
              </div>
            ) : (
              <div>
                {/* Category filter */}
                <div className="flex gap-2 flex-wrap mb-5">
                  {categories.map((cat) => (
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

                <div className="space-y-3">
                  {filteredBiomarkers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No biomarkers found in this category for the uploaded tests.
                    </div>
                  ) : (
                    filteredBiomarkers.map(([key, history]) => (
                      <BiomarkerCard
                        key={key}
                        biomarkerKey={key}
                        history={history}
                        biomarkerInfo={biomarkerMap.get(key)}
                        gender={profile?.gender}
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
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : !analytics?.tests.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <FileText size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No tests uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.tests.map((test) => (
                  <Card key={test.id} className="border-border/50" data-testid={`card-test-${test.id}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(test.testDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{test.labName || "Unknown Lab"}</span>
                            {test.fileName && (
                              <>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="text-xs text-muted-foreground">{test.fileName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                        onClick={() => deleteTestMutation.mutate(test.id)}
                        data-testid={`button-delete-test-${test.id}`}
                        aria-label="Delete test"
                      >
                        <Trash2 size={15} />
                      </button>
                    </CardContent>
                  </Card>
                ))}
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
