import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Building2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  company: "", role: "", package_lpa: 10, location: "", eligibility_cgpa: 7,
  eligible_branches: ["Computer Science"], drive_date: "", description: "", skills_required: []
};

export default function TpoDrives() {
  const [drives, setDrives] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => api.get("/drives").then((r) => setDrives(r.data || []));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const payload = {
      ...form,
      package_lpa: parseFloat(form.package_lpa),
      eligibility_cgpa: parseFloat(form.eligibility_cgpa),
      eligible_branches: typeof form.eligible_branches === "string" ? form.eligible_branches.split(",").map((s) => s.trim()) : form.eligible_branches,
      skills_required: typeof form.skills_required === "string" ? form.skills_required.split(",").map((s) => s.trim().toLowerCase()) : form.skills_required,
    };
    try {
      if (editId) {
        await api.put(`/drives/${editId}`, payload);
        toast.success("Drive updated");
      } else {
        await api.post("/drives", payload);
        toast.success("Drive created");
      }
      setOpen(false); setForm(EMPTY); setEditId(null); load();
    } catch (e) { toast.error("Failed"); }
  };

  const startEdit = (d) => {
    setEditId(d.id);
    setForm({
      ...d,
      eligible_branches: (d.eligible_branches || []).join(", "),
      skills_required: (d.skills_required || []).join(", "),
    });
    setOpen(true);
  };

  const remove = async (id) => {
    if (!confirm("Delete this drive?")) return;
    await api.delete(`/drives/${id}`);
    toast.success("Drive deleted");
    load();
  };

  return (
    <div className="space-y-8" data-testid="tpo-drives-page">
      <div className="flex items-start justify-between">
        <div>
          <div className="overline">Placement Drives</div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Manage Drives</h1>
          <p className="text-muted-foreground mt-2">Create, update, and schedule placement drives.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(EMPTY); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-sm btn-primary-swiss" data-testid="add-drive-btn"><Plus size={14} className="mr-2" /> New drive</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit drive" : "Create new drive"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <F label="Company"><Input value={form.company} onChange={(e) => set("company", e.target.value)} className="rounded-sm" data-testid="drive-company-input" /></F>
                <F label="Role"><Input value={form.role} onChange={(e) => set("role", e.target.value)} className="rounded-sm" data-testid="drive-role-input" /></F>
                <F label="Package (LPA)"><Input type="number" step="0.5" value={form.package_lpa} onChange={(e) => set("package_lpa", e.target.value)} className="rounded-sm" data-testid="drive-package-input" /></F>
                <F label="Location"><Input value={form.location} onChange={(e) => set("location", e.target.value)} className="rounded-sm" data-testid="drive-location-input" /></F>
                <F label="Min CGPA"><Input type="number" step="0.1" value={form.eligibility_cgpa} onChange={(e) => set("eligibility_cgpa", e.target.value)} className="rounded-sm" data-testid="drive-cgpa-input" /></F>
                <F label="Drive Date"><Input type="date" value={form.drive_date} onChange={(e) => set("drive_date", e.target.value)} className="rounded-sm" data-testid="drive-date-input" /></F>
              </div>
              <F label="Eligible Branches (comma-separated)"><Input value={form.eligible_branches} onChange={(e) => set("eligible_branches", e.target.value)} className="rounded-sm" data-testid="drive-branches-input" /></F>
              <F label="Skills required (comma-separated)"><Input value={form.skills_required} onChange={(e) => set("skills_required", e.target.value)} className="rounded-sm" data-testid="drive-skills-input" /></F>
              <F label="Description"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="rounded-sm" data-testid="drive-desc-input" /></F>
              <Button onClick={submit} className="w-full rounded-sm btn-primary-swiss" data-testid="drive-save-btn">{editId ? "Update drive" : "Create drive"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border">
        {drives.map((d) => (
          <div key={d.id} className="bg-white p-6" data-testid={`tpo-drive-${d.id}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="overline text-[10px]">{d.location}</div>
                <h3 className="font-display text-xl font-bold mt-1 flex items-center gap-2"><Building2 size={16} />{d.company}</h3>
                <div className="text-sm text-muted-foreground mt-1">{d.role} - {d.package_lpa} LPA</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(d)} data-testid={`edit-drive-${d.id}`}><Edit size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(d.id)} data-testid={`delete-drive-${d.id}`}><Trash2 size={14} className="text-destructive" /></Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{d.description}</p>
            <div className="text-xs text-muted-foreground space-x-3">
              <span>Date: {d.drive_date}</span>
              <span>CGPA &ge; {d.eligibility_cgpa}</span>
              <span>Branches: {(d.eligible_branches || []).join(", ")}</span>
            </div>
          </div>
        ))}
        {drives.length === 0 && <div className="bg-white p-10 text-center text-muted-foreground col-span-full">No drives yet. Create one to get started.</div>}
      </div>
    </div>
  );
}

function F({ label, children }) {
  return <div><Label className="text-xs uppercase tracking-wider font-semibold">{label}</Label><div className="mt-1.5">{children}</div></div>;
}
