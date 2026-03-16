import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import {
  User, Plus, Sun, Moon, Activity, Calendar, ChevronRight, Trash2, FlaskConical,
  Heart, Droplets, Cpu, Atom, ZapOff, Filter, BarChart2, TrendingUp, Upload,
  CheckCircle, AlertTriangle, Eye,
} from "lucide-react";
import type { Profile } from "@shared/schema";
import PerplexityAttribution from "@/components/PerplexityAttribution";

function VitalisLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="Vitalis logo" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3Z" fill="hsl(var(--primary))" opacity="0.12" />
      <path d="M10 20 Q13 14 16 20 Q19 26 22 20 Q25 14 28 20" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="13" cy="17" r="2" fill="hsl(var(--primary))" />
      <circle cx="22" cy="20" r="2" fill="hsl(var(--primary))" />
      <line x1="20" y1="6" x2="20" y2="10" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="30" x2="20" y2="34" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ===== CATEGORY EXPLANATIONS for non-medical readers =====
const CATEGORY_INFO: Array<{
  name: string;
  icon: JSX.Element;
  color: string;
  plainName: string;
  description: string;
  examples: string[];
}> = [
  {
    name: "Metabolic",
    plainName: "Blood Sugar",
    icon: <Atom size={20} className="text-teal-500" />,
    color: "from-teal-500/10 to-teal-500/5 border-teal-200 dark:border-teal-900/50",
    description: "How your body processes sugar and energy. High blood sugar over time leads to diabetes — one of the most common and preventable chronic diseases.",
    examples: ["Glucose", "HbA1c", "Fasting Insulin"],
  },
  {
    name: "Lipids",
    plainName: "Heart Fats",
    icon: <Heart size={20} className="text-purple-500" />,
    color: "from-purple-500/10 to-purple-500/5 border-purple-200 dark:border-purple-900/50",
    description: "Fats (cholesterol, triglycerides) in your blood. These are the primary risk factors for heart attacks and strokes — the #1 cause of death worldwide.",
    examples: ["LDL Cholesterol", "HDL Cholesterol", "Triglycerides"],
  },
  {
    name: "Liver Function",
    plainName: "Liver Health",
    icon: <Droplets size={20} className="text-amber-500" />,
    color: "from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-900/50",
    description: "Your liver filters toxins, produces proteins, and helps digest food. These markers show if your liver cells are stressed or damaged.",
    examples: ["ALT", "AST", "Bilirubin"],
  },
  {
    name: "Kidney Function",
    plainName: "Kidney Health",
    icon: <ZapOff size={20} className="text-pink-500" />,
    color: "from-pink-500/10 to-pink-500/5 border-pink-200 dark:border-pink-900/50",
    description: "Your kidneys clean your blood and regulate fluid balance. These markers detect early kidney damage — often before you feel any symptoms.",
    examples: ["Creatinine", "eGFR", "BUN"],
  },
  {
    name: "Complete Blood Count",
    plainName: "Blood Cells",
    icon: <Activity size={20} className="text-blue-500" />,
    color: "from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-900/50",
    description: "Counts your red and white blood cells and platelets. Reveals anemia (low red cells), infections, and immune system activity.",
    examples: ["Hemoglobin", "WBC", "Platelets"],
  },
  {
    name: "Thyroid",
    plainName: "Energy Regulator",
    icon: <Cpu size={20} className="text-cyan-500" />,
    color: "from-cyan-500/10 to-cyan-500/5 border-cyan-200 dark:border-cyan-900/50",
    description: "Your thyroid is a small gland that controls your metabolism — how fast or slow your body burns energy. Thyroid problems affect 1 in 20 people.",
    examples: ["TSH", "Free T4", "Free T3"],
  },
  {
    name: "Vitamins & Minerals",
    plainName: "Nutrients",
    icon: <FlaskConical size={20} className="text-emerald-500" />,
    color: "from-emerald-500/10 to-emerald-500/5 border-emerald-200 dark:border-emerald-900/50",
    description: "Essential nutrients your body can't make itself. Deficiencies are extremely common — Vitamin D deficiency affects over 1 billion people globally.",
    examples: ["Vitamin D", "Vitamin B12", "Ferritin"],
  },
  {
    name: "Inflammation",
    plainName: "Body Inflammation",
    icon: <Filter size={20} className="text-red-500" />,
    color: "from-red-500/10 to-red-500/5 border-red-200 dark:border-red-900/50",
    description: "Inflammation is your body's response to injury or infection. Chronic low-level inflammation is linked to heart disease, diabetes, and cancer.",
    examples: ["hs-CRP", "Homocysteine", "Fibrinogen"],
  },
  {
    name: "Hormones",
    plainName: "Hormones",
    icon: <BarChart2 size={20} className="text-orange-500" />,
    color: "from-orange-500/10 to-orange-500/5 border-orange-200 dark:border-orange-900/50",
    description: "Chemical messengers that control energy, mood, reproduction, and stress response. Imbalances are very common and often go undetected.",
    examples: ["Testosterone", "Estradiol", "Cortisol"],
  },
];

// ===== HOW IT WORKS STEPS =====
const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Create a profile",
    desc: "Enter your basic information. This helps Vitalis give you age and gender-specific reference ranges.",
    icon: <User size={20} className="text-primary" />,
  },
  {
    step: "2",
    title: "Add your test results",
    desc: "Upload a PDF from your lab, or type in the values manually. Vitalis reads the numbers automatically.",
    icon: <Upload size={20} className="text-primary" />,
  },
  {
    step: "3",
    title: "Understand your results",
    desc: "Each biomarker is shown with plain-English explanations, color-coded zones, and trend charts over time.",
    icon: <Eye size={20} className="text-primary" />,
  },
  {
    step: "4",
    title: "Track your progress",
    desc: "Run tests regularly and Vitalis shows you whether you're improving, stable, or need attention.",
    icon: <TrendingUp size={20} className="text-primary" />,
  },
];

interface ProfileFormData {
  name: string;
  dateOfBirth: string;
  gender: string;
  ethnicity: string;
  notes: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const { data: profiles = [], isLoading } = useQuery<Profile[]>({ queryKey: ["/api/profiles"] });

  const form = useForm<ProfileFormData>({
    defaultValues: { name: "", dateOfBirth: "", gender: "", ethnicity: "", notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => apiRequest("POST", "/api/profiles", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profiles"] });
      setOpen(false);
      form.reset();
      toast({ title: "Profile created", description: "Your health profile is ready." });
    },
    onError: () => toast({ title: "Error", description: "Could not create profile.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/profiles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profiles"] });
      setDeleteConfirm(null);
      toast({ title: "Profile deleted" });
    },
  });

  function getAge(dob: string) {
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  const visibleCategories = showAllCategories ? CATEGORY_INFO : CATEGORY_INFO.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VitalisLogo size={36} />
            <div>
              <span className="font-semibold text-base text-foreground tracking-tight">Vitalis</span>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">Personal Blood Test Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-profile" className="gap-2">
                  <Plus size={16} />New Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create Health Profile</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="e.g. Jane Doe" data-testid="input-name" {...form.register("name", { required: true })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" type="date" data-testid="input-dob" {...form.register("dateOfBirth", { required: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Biological Sex</Label>
                      <Select onValueChange={v => form.setValue("gender", v)}>
                        <SelectTrigger data-testid="select-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ethnicity">Ethnicity (optional)</Label>
                    <Input id="ethnicity" placeholder="e.g. European, South Asian..." data-testid="input-ethnicity" {...form.register("ethnicity")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea id="notes" placeholder="Any relevant medical background..." rows={2} data-testid="input-notes" {...form.register("notes")} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-profile">
                    {createMutation.isPending ? "Creating..." : "Create Profile"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Toggle theme" data-testid="button-toggle-theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Hero — plain language for first-time visitors */}
        <div className="mb-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="max-w-xl">
              <h1 className="text-xl font-semibold text-foreground mb-2">Your Personal Blood Test Dashboard</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Blood tests are one of the most powerful tools to understand your health — but the numbers can be confusing.
                Vitalis explains each result in plain language, shows you where you stand compared to healthy ranges, and helps you track changes over time.
              </p>
            </div>
          </div>
        </div>

        {/* Profiles */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <User size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Get Started</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              Create a profile for yourself or a family member to start tracking blood test results.
            </p>
            <Button onClick={() => setOpen(true)} data-testid="button-create-first">
              <Plus size={16} className="mr-2" /> Create Your Profile
            </Button>
          </div>
        ) : (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Profiles</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {profiles.map(profile => (
                <Card
                  key={profile.id}
                  className="group border-border/60 hover:border-primary/40 transition-all cursor-pointer hover:shadow-md"
                  onClick={() => navigate(`/profile/${profile.id}`)}
                  data-testid={`card-profile-${profile.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">{profile.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{profile.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {profile.gender === "male" ? "Male" : profile.gender === "female" ? "Female" : "Other"} · {getAge(profile.dateOfBirth)} years old
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(profile.id); }}
                          data-testid={`button-delete-profile-${profile.id}`}
                          aria-label="Delete profile"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="p-1.5 text-muted-foreground"><ChevronRight size={16} /></div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={11} />
                      <span>Created {new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                    {profile.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{profile.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-5">How It Works</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="rounded-xl border border-border/50 p-4 bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">Step {step.step}</span>
                </div>
                <h4 className="font-semibold text-sm mb-1.5">{step.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What we measure — categories explained in plain English */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">What Gets Measured</h2>
              <p className="text-xs text-muted-foreground mt-1">Click any category to learn what those markers tell you about your body.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCategories.map(cat => (
              <div
                key={cat.name}
                className={`rounded-xl border bg-gradient-to-br p-4 ${cat.color}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-background/70 flex items-center justify-center flex-shrink-0">
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{cat.name}</h4>
                      <span className="text-xs text-muted-foreground">({cat.plainName})</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {cat.examples.map(ex => (
                        <span key={ex} className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border/40 text-muted-foreground">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {CATEGORY_INFO.length > 6 && (
            <button
              className="mt-3 text-xs text-primary hover:underline"
              onClick={() => setShowAllCategories(v => !v)}
            >
              {showAllCategories ? "Show less" : `Show all ${CATEGORY_INFO.length} categories`}
            </button>
          )}
        </div>

        {/* Understanding your results — color coding explained */}
        <div className="mb-12 rounded-xl border border-border/50 p-6 bg-card">
          <h2 className="text-sm font-semibold mb-4">Understanding Your Results</h2>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            Every biomarker is shown with a color-coded status based on established medical guidelines. Here's what each color means:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                color: "bg-emerald-500",
                label: "Optimal",
                desc: "Your result is in the best possible range — associated with lowest disease risk and best long-term health outcomes.",
              },
              {
                color: "bg-amber-400",
                label: "Normal",
                desc: "Within the medically accepted normal range. Not ideal, but not a cause for alarm. Worth monitoring.",
              },
              {
                color: "bg-orange-500",
                label: "High / Low",
                desc: "Outside the normal range. This doesn't mean something is seriously wrong, but discuss with your doctor.",
              },
              {
                color: "bg-red-500",
                label: "Critical",
                desc: "Well outside the safe range. This warrants prompt medical attention.",
              },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${item.color}`} />
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/40">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Important:</strong> Vitalis provides educational information only. It is not a medical device and does not provide diagnoses. Always discuss your results with a qualified healthcare provider before making any health decisions.
            </p>
          </div>
        </div>

      </main>

      {/* Delete confirm */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete Profile?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will permanently delete the profile and all its blood test data. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <footer className="border-t mt-16 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Vitalis · Personal Blood Test Tracker</span>
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}
