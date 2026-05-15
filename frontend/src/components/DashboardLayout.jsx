import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, FileText, Target, TrendingUp, MessageSquare, Briefcase,
  ClipboardList, BookOpen, Bell, User, LogOut, Users, BarChart3, Building2,
  Megaphone, GraduationCap, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STUDENT_NAV = [
  { to: "/student", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/student/resume", label: "Resume Analyzer", icon: FileText },
  { to: "/student/skill-gap", label: "Skill Gap", icon: Target },
  { to: "/student/prediction", label: "Placement Prediction", icon: TrendingUp },
  { to: "/student/interview", label: "Mock Interview", icon: MessageSquare },
  { to: "/student/jobs", label: "Job Drives", icon: Briefcase },
  { to: "/student/applications", label: "Applications", icon: ClipboardList },
  { to: "/student/courses", label: "Courses", icon: BookOpen },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/profile", label: "Profile", icon: User },
];

const HOD_NAV = [
  { to: "/hod", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/hod/students", label: "Students", icon: Users },
  { to: "/hod/resumes", label: "Resume Review", icon: FileText },
  { to: "/hod/skill-gap", label: "Skill Gap Overview", icon: Target },
  { to: "/hod/reports", label: "Reports", icon: BarChart3 },
  { to: "/hod/notifications", label: "Notifications", icon: Bell },
];

const TPO_NAV = [
  { to: "/tpo", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/tpo/drives", label: "Placement Drives", icon: Building2 },
  { to: "/tpo/applications", label: "Applications", icon: ClipboardList },
  { to: "/tpo/students", label: "Students", icon: GraduationCap },
  { to: "/tpo/reports", label: "Reports", icon: BarChart3 },
  { to: "/tpo/notifications", label: "Send Notice", icon: Megaphone },
];

function getNav(role) {
  if (role === "hod") return HOD_NAV;
  if (role === "tpo") return TPO_NAV;
  return STUDENT_NAV;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const items = getNav(user?.role);

  const roleLabel = user?.role === "hod" ? "Head of Department" : user?.role === "tpo" ? "Placement Officer" : "Student";

  const onLogout = () => {
    logout();
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-white sticky top-0 h-screen">
        <Link to="/" className="px-7 py-7 border-b border-border" data-testid="sidebar-logo">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight">Placement</span>
            <span className="font-display text-2xl font-light text-primary">Pro</span>
          </div>
          <div className="overline mt-1 text-[10px]">AI Placement Suite</div>
        </Link>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <div className="overline px-4 pb-2 pt-2">{roleLabel} Menu</div>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm rounded-sm transition-colors ${
                  isActive
                    ? "bg-foreground text-background font-medium"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground"
                }`
              }
            >
              <it.icon size={16} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-sm"
            onClick={onLogout}
            data-testid="logout-button"
          >
            <LogOut size={14} className="mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-white flex items-center px-6 lg:px-10 sticky top-0 z-30">
          <div className="lg:hidden font-display font-bold text-lg">PlacementPro</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="overline text-[10px]">Logged in as</span>
              <span className="font-medium text-foreground">{roleLabel}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => nav(`/${user?.role}/notifications`)} data-testid="header-notifications">
              <Bell size={16} />
            </Button>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onLogout} data-testid="mobile-logout">
              <LogOut size={16} />
            </Button>
          </div>
        </header>
        <div className="p-6 lg:p-10 flex-1">
          <Outlet />
        </div>
        <footer className="border-t border-border px-6 lg:px-10 py-4 text-xs text-muted-foreground">
          PlacementPro AI &copy; {new Date().getFullYear()} - Institutional Placement Suite
        </footer>
      </main>
    </div>
  );
}
