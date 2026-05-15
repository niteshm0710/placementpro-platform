import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, CheckCircle2, MapPin, Calendar, IndianRupee } from "lucide-react";

export default function Jobs() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await api.get("/drives");
    setDrives(r.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const apply = async (driveId) => {
    try {
      await api.post("/applications", { drive_id: driveId });
      toast.success("Application submitted");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to apply");
    }
  };

  return (
    <div className="space-y-8" data-testid="jobs-page">
      <div>
        <div className="overline">Placement Drives</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Live job opportunities.</h1>
        <p className="text-muted-foreground mt-2">Browse and apply to current campus drives.</p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading drives...</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border">
        {drives.map((d) => (
          <div key={d.id} className="bg-white p-6 flex flex-col" data-testid={`drive-card-${d.id}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="overline text-[10px]">{d.location}</div>
                <h3 className="font-display text-xl font-bold mt-1">{d.company}</h3>
                <div className="text-sm text-muted-foreground mt-1">{d.role}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold flex items-center gap-1"><IndianRupee size={18} />{d.package_lpa}</div>
                <div className="text-[10px] overline">LPA</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground my-3 line-clamp-2">{d.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(d.skills_required || []).slice(0, 6).map((s) => (
                <span key={s} className="text-[10px] uppercase tracking-wider border border-border px-2 py-0.5">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
              <span className="flex items-center gap-1"><Calendar size={12} /> {d.drive_date}</span>
              <span>CGPA &ge; {d.eligibility_cgpa}</span>
            </div>
            <div className="mt-4">
              {d.applied ? (
                <Button disabled className="w-full rounded-sm" variant="outline" data-testid={`drive-applied-${d.id}`}>
                  <CheckCircle2 size={14} className="mr-2" /> Applied
                </Button>
              ) : (
                <Button onClick={() => apply(d.id)} className="w-full rounded-sm btn-primary-swiss" data-testid={`drive-apply-${d.id}`}>
                  <Briefcase size={14} className="mr-2" /> Apply now
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
