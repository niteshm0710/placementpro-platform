import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const DEPTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical", "Information Technology"];

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "student", department: "Computer Science",
    roll_number: "", cgpa: "", year: "Final Year"
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.cgpa) payload.cgpa = parseFloat(payload.cgpa);
      else delete payload.cgpa;
      if (form.role !== "student") {
        delete payload.roll_number;
        delete payload.cgpa;
        delete payload.year;
      }
      const u = await signup(payload);
      toast.success(`Welcome, ${u.name}`);
      nav(`/${u.role}`, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      <div className="flex flex-col justify-center p-6 sm:p-10 order-2 lg:order-1">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8" data-testid="signup-back-home">
            <ArrowLeft size={14} className="mr-1" /> Back to home
          </Link>
          <div className="overline mb-3">Create account</div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight leading-tight font-bold mb-2">Join PlacementPro</h1>
          <p className="text-sm text-muted-foreground mb-8">Set up your role-based account in seconds.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider font-semibold">Role</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger className="mt-2 rounded-sm h-11" data-testid="signup-role-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student" data-testid="role-option-student">Student</SelectItem>
                  <SelectItem value="hod" data-testid="role-option-hod">HOD (Head of Department)</SelectItem>
                  <SelectItem value="tpo" data-testid="role-option-tpo">TPO (Training & Placement Officer)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider font-semibold">Full name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required className="mt-2 rounded-sm h-11" data-testid="signup-name-input" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider font-semibold">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className="mt-2 rounded-sm h-11" data-testid="signup-email-input" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider font-semibold">Password</Label>
              <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={6} className="mt-2 rounded-sm h-11" data-testid="signup-password-input" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider font-semibold">Department</Label>
              <Select value={form.department} onValueChange={(v) => set("department", v)}>
                <SelectTrigger className="mt-2 rounded-sm h-11" data-testid="signup-department-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider font-semibold">Roll Number</Label>
                  <Input value={form.roll_number} onChange={(e) => set("roll_number", e.target.value)} className="mt-2 rounded-sm h-11" data-testid="signup-roll-input" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider font-semibold">CGPA</Label>
                  <Input type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={(e) => set("cgpa", e.target.value)} className="mt-2 rounded-sm h-11" data-testid="signup-cgpa-input" />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-sm btn-primary-swiss mt-2" data-testid="signup-submit-button">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground font-medium hover:underline" data-testid="signup-to-login-link">Sign in</Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-white relative overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 bg-grid opacity-[0.08]" />
        <div className="relative z-10 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold tracking-tight">Placement</span>
          <span className="font-display text-2xl font-light text-white/60">Pro</span>
        </div>
        <div className="relative z-10">
          <div className="overline text-white/60 mb-4">Three roles. One platform.</div>
          <h2 className="font-display text-4xl xl:text-5xl tracking-tight leading-[1.05] font-bold mb-6 max-w-md">
            Built specifically for your role on campus.
          </h2>
          <ul className="space-y-3 text-white/80 max-w-sm">
            <li className="flex gap-3"><span className="font-display font-bold w-8">01</span> Students: AI resume, mock interviews, applications.</li>
            <li className="flex gap-3"><span className="font-display font-bold w-8">02</span> HODs: Department analytics & branch reports.</li>
            <li className="flex gap-3"><span className="font-display font-bold w-8">03</span> TPOs: Drive management & institute-wide insights.</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-white/40">PlacementPro AI</div>
      </div>
    </div>
  );
}
