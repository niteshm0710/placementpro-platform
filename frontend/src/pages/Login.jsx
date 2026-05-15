import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Student", email: "student@demo.com" },
  { role: "HOD", email: "hod@demo.com" },
  { role: "TPO", email: "tpo@demo.com" },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      nav(`/${u.role}`, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (em) => {
    setEmail(em);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <Link to="/" className="flex items-baseline gap-1.5 relative z-10" data-testid="login-brand-link">
          <span className="font-display text-2xl font-bold tracking-tight">Placement</span>
          <span className="font-display text-2xl font-light text-white/60">Pro</span>
        </Link>
        <div className="relative z-10">
          <div className="overline text-background/50 mb-4">Welcome back</div>
          <h2 className="font-display text-4xl xl:text-5xl tracking-tight leading-[1.05] font-bold mb-6 max-w-md">
            Continue your journey to your dream placement.
          </h2>
          <div className="text-sm text-background/70 max-w-sm leading-relaxed">
            Access your dashboard, applications, analytics, and AI tools.
          </div>
        </div>
        <div className="relative z-10 text-xs text-background/40">PlacementPro AI &copy; {new Date().getFullYear()}</div>
      </div>

      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="login-back-home">
            <ArrowLeft size={14} className="mr-1" /> Back to home
          </Link>
          <div className="overline mb-3">Sign in</div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight leading-tight font-bold mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">Enter your credentials to continue.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-2 rounded-sm h-11" data-testid="login-email-input" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="mt-2 rounded-sm h-11" data-testid="login-password-input" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 rounded-sm btn-primary-swiss" data-testid="login-submit-button">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-6">
            <div className="overline mb-3 text-[10px]">Demo accounts (password: password123)</div>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => fillDemo(d.email)}
                  className="text-left px-4 py-2.5 border border-border hover:border-foreground transition-colors text-sm flex items-center justify-between"
                  data-testid={`demo-account-${d.role.toLowerCase()}`}
                >
                  <span className="font-medium">{d.role}</span>
                  <span className="text-muted-foreground text-xs">{d.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-foreground font-medium hover:underline" data-testid="login-to-signup-link">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
