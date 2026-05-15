import { Link } from "react-router-dom";
import { ArrowUpRight, Brain, FileText, Target, TrendingUp, MessageSquare, Building2, BarChart3, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_IMG = "https://images.unsplash.com/photo-1664273891579-22f28332f3c4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwbW9kZXJufGVufDB8fHx8MTc3ODgyMjg0MHww&ixlib=rb-4.1.0&q=85";
const STUDENT_IMG = "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudCUyMGxhcHRvcHxlbnwwfHx8fDE3Nzg4MjI4NDB8MA&ixlib=rb-4.1.0&q=85";
const INTERVIEW_IMG = "https://images.unsplash.com/photo-1758520144426-edf40a58f299?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwyfHxqb2IlMjBpbnRlcnZpZXclMjBvZmZpY2V8ZW58MHx8fHwxNzc4ODIyODQwfDA&ixlib=rb-4.1.0&q=85";

const FEATURES = [
  { icon: FileText, title: "Resume Analyzer", desc: "AI-powered ATS scoring, quality analysis, and tailored improvement suggestions." },
  { icon: Target, title: "Skill Gap Analyzer", desc: "Identify the exact skills needed for your dream role with curated course paths." },
  { icon: TrendingUp, title: "Placement Prediction", desc: "Data-driven placement probability and readiness scoring across multiple factors." },
  { icon: MessageSquare, title: "Mock Interview", desc: "Practice with realistic technical and HR questions with instant scored feedback." },
  { icon: Building2, title: "Drive Management", desc: "Centralised placement drives with eligibility filters and one-click apply." },
  { icon: BarChart3, title: "Department Analytics", desc: "Live dashboards for HOD and TPO with placement statistics and reports." },
];

const ROLES = [
  { icon: GraduationCap, title: "Student", desc: "Upload your resume, analyze gaps, predict placement readiness, practice interviews, and apply to drives.", color: "bg-foreground text-background" },
  { icon: Users, title: "HOD", desc: "Monitor department performance, track placements, review resumes, and download branch-level reports.", color: "bg-primary text-white" },
  { icon: Building2, title: "TPO", desc: "Manage drives, shortlist candidates, broadcast notices, and analyse institute-wide placement metrics.", color: "bg-foreground text-background" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-baseline gap-1.5" data-testid="brand-link">
            <span className="font-display text-xl font-bold tracking-tight">Placement</span>
            <span className="font-display text-xl font-light text-primary">Pro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-foreground/70 hover:text-foreground transition-colors">Features</a>
            <a href="#roles" className="text-foreground/70 hover:text-foreground transition-colors">Roles</a>
            <a href="#how" className="text-foreground/70 hover:text-foreground transition-colors">How It Works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm" data-testid="header-login-btn">Login</Button></Link>
            <Link to="/signup"><Button size="sm" className="rounded-sm btn-primary-swiss" data-testid="header-signup-btn">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero (Tetris Grid) */}
      <section className="border-b border-border bg-grid-soft">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <div className="overline mb-6">Institutional Placement Suite / AI Powered</div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[0.95] font-bold mb-6">
              The complete operating system for college placements.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
              PlacementPro unifies students, heads of department, and training & placement officers in one calm, data-driven interface. Resume scoring, mock interviews, drive management, and analytics — all in one platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup"><Button size="lg" className="rounded-sm btn-primary-swiss" data-testid="hero-cta-signup">
                Start free trial <ArrowUpRight size={16} className="ml-2" />
              </Button></Link>
              <Link to="/login"><Button size="lg" variant="outline" className="rounded-sm" data-testid="hero-cta-login">
                Sign in to your account
              </Button></Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              <Stat value="92%" label="Placement match accuracy" />
              <Stat value="50+" label="Skill tracks supported" />
              <Stat value="3" label="Integrated roles" />
            </div>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 content-start">
            <div className="col-span-2 aspect-[16/10] bg-secondary border border-border overflow-hidden">
              <img src={HERO_IMG} alt="Campus" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-square sharp-card p-5 flex flex-col justify-between">
              <Brain size={22} />
              <div>
                <div className="text-2xl font-display font-bold">ATS 89</div>
                <div className="text-xs text-muted-foreground mt-1">Demo resume score</div>
              </div>
            </div>
            <div className="aspect-square bg-foreground text-background p-5 flex flex-col justify-between">
              <TrendingUp size={22} />
              <div>
                <div className="text-2xl font-display font-bold">82%</div>
                <div className="text-xs text-background/70 mt-1">Placement probability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            <div className="lg:col-span-5">
              <div className="overline mb-4">Capabilities</div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight font-bold">
                Every tool a placement cell needs, built in.
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 text-muted-foreground leading-relaxed">
              From the first resume upload to the final offer, PlacementPro replaces spreadsheets, emails, and disconnected systems with one cohesive, role-aware platform.
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white p-8 hover:bg-secondary/50 transition-colors group" data-testid={`feature-card-${i}`}>
                <f.icon size={22} className="mb-6" />
                <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-b border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="overline mb-4">Built for three roles</div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight font-bold mb-12 max-w-3xl">
            One platform. Three perfectly tailored experiences.
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ROLES.map((r, i) => (
              <div key={i} className="border border-border bg-white p-8 flex flex-col" data-testid={`role-card-${r.title.toLowerCase()}`}>
                <div className={`inline-flex w-11 h-11 items-center justify-center ${r.color} mb-6`}>
                  <r.icon size={20} />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-3">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{r.desc}</p>
                <Link to="/signup" className="mt-6 inline-flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
                  Sign up as {r.title} <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 lg:sticky lg:top-24 self-start">
            <div className="overline mb-4">Workflow</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight font-bold mb-6">
              From resume upload to job offer in four clear steps.
            </h2>
            <img src={STUDENT_IMG} alt="Student" className="w-full aspect-[4/3] object-cover border border-border mt-8" />
          </div>
          <div className="lg:col-span-6 lg:col-start-7 space-y-px bg-border border border-border">
            {[
              ["01", "Onboard & upload", "Sign up with your role. Students upload their resume. HODs and TPOs get instant dashboards."],
              ["02", "Analyse & predict", "AI scores your resume, surfaces skill gaps, and predicts your placement readiness."],
              ["03", "Practice & prepare", "Run mock interviews, follow curated learning paths, and apply to relevant drives."],
              ["04", "Track & report", "TPOs shortlist candidates; HODs receive live placement reports for their department."],
            ].map(([n, t, d], i) => (
              <div key={i} className="bg-white p-8 grid grid-cols-12 gap-4">
                <div className="col-span-2 font-display text-3xl font-bold text-primary">{n}</div>
                <div className="col-span-10">
                  <h3 className="font-display text-xl font-semibold mb-2">{t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <div className="overline text-background/60 mb-4">Get Started</div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[0.95] font-bold">
              Set your campus up for the best placement season yet.
            </h2>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-3">
            <Link to="/signup"><Button size="lg" className="w-full rounded-sm bg-background text-foreground hover:bg-background/90" data-testid="cta-signup">
              Create your account
            </Button></Link>
            <Link to="/login"><Button size="lg" variant="outline" className="w-full rounded-sm border-background/30 text-background hover:bg-background/10 hover:text-background" data-testid="cta-login">
              Sign in
            </Button></Link>
            <div className="text-xs text-background/60 mt-2">Demo accounts available - try the platform instantly.</div>
          </div>
        </div>
        <div className="border-t border-background/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background/60">
            <div>PlacementPro AI &copy; {new Date().getFullYear()}</div>
            <div>Institutional Placement Suite</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{label}</div>
    </div>
  );
}
