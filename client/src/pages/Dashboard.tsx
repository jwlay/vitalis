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
  User,
  Plus,
  Sun,
  Moon,
  Activity,
  Calendar,
  ChevronRight,
  Trash2,
  FlaskConical,
} from "lucide-react";
import type { Profile } from "@shared/schema";
import PerplexityAttribution from "@/components/PerplexityAttribution";

function VitalisLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="Vitalis logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon background */}
      <path
        d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3Z"
        fill="hsl(var(--primary))"
        opacity="0.12"
      />
      {/* DNA/pulse icon */}
      <path
        d="M10 20 Q13 14 16 20 Q19 26 22 20 Q25 14 28 20"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Dots at wave peaks */}
      <circle cx="13" cy="17" r="2" fill="hsl(var(--primary))" />
      <circle cx="22" cy="20" r="2" fill="hsl(var(--primary))" />
      {/* Vertical crosses */}
      <line x1="20" y1="6" x2="20" y2="10" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="30" x2="20" y2="34" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

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

  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
  });

  const form = useForm<ProfileFormData>({
    defaultValues: { name: "", dateOfBirth: "", gender: "", ethnicity: "", notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProfileFormData) =>
      apiRequest("POST", "/api/profiles", data),
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
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VitalisLogo size={36} />
            <div>
              <span className="font-semibold text-base text-foreground tracking-tight">Vitalis</span>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">Blood Test Tracker</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle theme"
            data-testid="button-toggle-theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero section */}
        <div className="mb-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-1">Health Profiles</h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Create a profile to upload blood test PDFs, track biomarkers over time, and compare results to clinical reference ranges.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-profile" className="gap-2">
                  <Plus size={16} />
                  New Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Health Profile</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
                  className="space-y-4 mt-2"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Jane Doe"
                      data-testid="input-name"
                      {...form.register("name", { required: true })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        data-testid="input-dob"
                        {...form.register("dateOfBirth", { required: true })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Biological Sex</Label>
                      <Select onValueChange={(v) => form.setValue("gender", v)}>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
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
                    <Input
                      id="ethnicity"
                      placeholder="e.g. European, South Asian..."
                      data-testid="input-ethnicity"
                      {...form.register("ethnicity")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any relevant medical background..."
                      rows={2}
                      data-testid="input-notes"
                      {...form.register("notes")}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-profile"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Profile"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats bar */}
        {profiles.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Profiles", value: profiles.length, icon: User },
              { label: "Total Biomarkers Supported", value: "27+", icon: Activity },
              { label: "Test Categories", value: "8", icon: FlaskConical },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="border-border/50">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Profile cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <User size={24} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No profiles yet</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              Create your first health profile to start tracking blood test results.
            </p>
            <Button onClick={() => setOpen(true)} data-testid="button-create-first">
              <Plus size={16} className="mr-2" /> Create First Profile
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {profiles.map((profile) => (
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
                        <span className="text-sm font-semibold text-primary">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {profile.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {profile.gender === "male" ? "Male" : profile.gender === "female" ? "Female" : "Other"} · {getAge(profile.dateOfBirth)} years old
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(profile.id);
                        }}
                        data-testid={`button-delete-profile-${profile.id}`}
                        aria-label="Delete profile"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="p-1.5 text-muted-foreground">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={11} />
                    <span>Profile created {new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                  {profile.notes && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{profile.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Features section */}
        {profiles.length === 0 && (
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "📄",
                title: "PDF Upload",
                desc: "Upload blood test PDFs from any lab. Text is automatically extracted and biomarkers identified.",
              },
              {
                icon: "📊",
                title: "Trend Visualization",
                desc: "Track how each biomarker changes across multiple tests with clear trend charts.",
              },
              {
                icon: "🧬",
                title: "Research-Backed Info",
                desc: "Each biomarker includes clinical descriptions, optimal ranges, and current research context.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border/50 p-5 bg-card">
                <div className="text-2xl mb-3">{icon}</div>
                <h4 className="font-semibold text-sm mb-1.5">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Profile?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will permanently delete the profile and all its blood test data. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <footer className="border-t mt-16 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Vitalis · Blood Test Tracker</span>
          <PerplexityAttribution />
        </div>
      </footer>
    </div>
  );
}
