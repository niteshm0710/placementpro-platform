import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowUpRight, FileText, Target, TrendingUp, MessageSquare, Briefcase, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState(null);
  const [drives, setDrives] = useState([]);
  const [apps, setApps] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    api.get("/placement-prediction").then((r) => setPrediction(r.data)).catch(() => {});
    api.get("/drives").then((r) => setDrives(r.data || [])).catch(() => {});
    api.get("/applications").then((r) => setApps(r.data || [])).catch(() => {});
    api.get("/notifications").then((r) => setNotes(r.data || [])).catch(() => {});
  }, []);

  const upcoming = drives.filter((d) => !d.applied).slice(0, 3);

  return (
    <div className="space-y-8" data-testid="student-dashboard">
      <div>
        <div className="overline">Welcome back</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Hello, {user?.name?.split(" ")[0]}.</h1>
        <p className="text-muted-foreground mt-2">Here's a snapshot of your placement journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Placement readiness" value={prediction ? `${prediction.placement_probability}%` : "-"} sub={prediction?.readiness_level || "Run analysis"} testid="tile-readiness" />
        <Tile label="Active applications" value={apps.length} sub={`${apps.filter((a)=>a.status==='shortlisted').length} shortlisted`} testid="tile-applications" />
        <Tile label="Available drives" value={drives.length} sub={`${upcoming.length} you haven't applied to`} testid="tile-drives" />
        <Tile label="Skill count" value={user?.skills?.length || 0} sub="From your latest resume" testid="tile-skills" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
        <QuickAction to="/student/resume" icon={FileText} title="Analyse Resume" desc="Get ATS score, strengths, weaknesses." testid="quick-resume" />
        <QuickAction to="/student/skill-gap" icon={Target} title="Skill Gap" desc="Compare with target role requirements." testid="quick-skillgap" />
        <QuickAction to="/student/prediction" icon={TrendingUp} title="Predict Placement" desc="View probability & readiness factors." testid="quick-prediction" />
        <QuickAction to="/student/interview" icon={MessageSquare} title="Mock Interview" desc="Practice with scored feedback." testid="quick-interview" />
        <QuickAction to="/student/jobs" icon={Briefcase} title="Browse Drives" desc="Apply to eligible placements." testid="quick-jobs" />
        <QuickAction to="/student/notifications" icon={Bell} title="Notifications" desc="Latest announcements & updates." testid="quick-notes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sharp-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="overline">Upcoming Drives</div>
            <Link to="/student/jobs" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 && <div className="text-sm text-muted-foreground">No upcoming drives.</div>}
            {upcoming.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-t border-border pt-3 first:border-t-0 first:pt-0" data-testid={`upcoming-drive-${d.id}`}>
                <div>
                  <div className="font-medium">{d.company}</div>
                  <div className="text-xs text-muted-foreground">{d.role} - {d.package_lpa} LPA</div>
                </div>
                <div className="text-xs text-muted-foreground">{d.drive_date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sharp-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="overline">Recent Notifications</div>
            <Link to="/student/notifications" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {notes.slice(0, 4).map((n) => (
              <div key={n.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
              </div>
            ))}
            {notes.length === 0 && <div className="text-sm text-muted-foreground">No notifications yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, sub, testid }) {
  return (
    <div className="sharp-card p-6" data-testid={testid}>
      <div className="overline mb-3">{label}</div>
      <div className="font-display text-4xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-2">{sub}</div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc, testid }) {
  return (
    <Link to={to} className="bg-white p-6 hover:bg-secondary/40 transition-colors group flex items-start gap-4" data-testid={testid}>
      <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center"><Icon size={18} /></div>
      <div className="flex-1">
        <div className="font-display font-semibold flex items-center gap-1">{title} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      </div>
    </Link>
  );
}
