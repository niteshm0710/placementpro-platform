import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({});
  const [skillsText, setSkillsText] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        department: user.department || "",
        roll_number: user.roll_number || "",
        cgpa: user.cgpa ?? "",
        year: user.year || "",
        phone: user.phone || "",
        bio: user.bio || "",
      });
      setSkillsText((user.skills || []).join(", "));
    }
  }, [user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const payload = { ...form };
    if (payload.cgpa === "" || payload.cgpa === null) delete payload.cgpa;
    else payload.cgpa = parseFloat(payload.cgpa);
    payload.skills = skillsText.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    try {
      await api.put("/profile", payload);
      await refreshUser();
      toast.success("Profile updated");
    } catch (e) { toast.error("Update failed"); }
  };

  const isStudent = user?.role === "student";

  return (
    <div className="space-y-8" data-testid="profile-page">
      <div>
        <div className="overline">Profile Settings</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">{form.name || "Your profile"}</h1>
        <p className="text-muted-foreground mt-2">{user?.email} - {user?.role?.toUpperCase()}</p>
      </div>

      <div className="sharp-card p-6 space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name"><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} className="rounded-sm h-11" data-testid="profile-name" /></Field>
          <Field label="Department"><Input value={form.department || ""} onChange={(e) => set("department", e.target.value)} className="rounded-sm h-11" data-testid="profile-dept" /></Field>
          {isStudent && (
            <>
              <Field label="Roll number"><Input value={form.roll_number || ""} onChange={(e) => set("roll_number", e.target.value)} className="rounded-sm h-11" data-testid="profile-roll" /></Field>
              <Field label="CGPA"><Input type="number" step="0.01" min="0" max="10" value={form.cgpa ?? ""} onChange={(e) => set("cgpa", e.target.value)} className="rounded-sm h-11" data-testid="profile-cgpa" /></Field>
              <Field label="Year"><Input value={form.year || ""} onChange={(e) => set("year", e.target.value)} className="rounded-sm h-11" data-testid="profile-year" /></Field>
            </>
          )}
          <Field label="Phone"><Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} className="rounded-sm h-11" data-testid="profile-phone" /></Field>
        </div>
        {isStudent && (
          <Field label="Skills (comma-separated)"><Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="rounded-sm h-11" data-testid="profile-skills" /></Field>
        )}
        <Field label="Bio"><Textarea value={form.bio || ""} onChange={(e) => set("bio", e.target.value)} rows={4} className="rounded-sm" data-testid="profile-bio" /></Field>
        <Button onClick={save} className="rounded-sm btn-primary-swiss" data-testid="profile-save-btn">Save changes</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider font-semibold">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
