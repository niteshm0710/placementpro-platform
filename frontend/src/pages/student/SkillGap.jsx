import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ExternalLink, Target } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function SkillGap() {
  const [roles, setRoles] = useState([]);
  const [target, setTarget] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/skill-gap/roles").then((r) => setRoles(r.data || []));
  }, []);

  const analyze = async () => {
    setLoading(true);
    try {
      const r = await api.post("/skill-gap", { target_role: target, current_skills: [] });
      setResult(r.data);
    } catch (e) {
      toast.error("Failed to analyse skill gap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="skillgap-page">
      <div>
        <div className="overline">Skill Gap Analyzer</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Match your skills to a target role.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">We compare your current skill set against the target role and recommend curated courses.</p>
      </div>

      <div className="sharp-card p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <div className="overline mb-2">Target role</div>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="rounded-sm h-11" data-testid="skillgap-role-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={analyze} disabled={loading} className="h-11 rounded-sm btn-primary-swiss" data-testid="skillgap-analyze-btn">
          {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Target size={14} className="mr-2" />}
          Analyse Gap
        </Button>
      </div>

      {result && (
        <div className="space-y-6" data-testid="skillgap-result">
          <div className="sharp-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="overline">Match score for</div>
                <div className="font-display text-2xl font-bold">{result.target_role}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl font-bold">{result.match_percentage}%</div>
                <div className="text-xs text-muted-foreground mt-1">skill match</div>
              </div>
            </div>
            <Progress value={result.match_percentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="sharp-card p-6">
              <div className="overline mb-3 text-green-700">Matched skills ({result.matched_skills.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {result.matched_skills.map((s) => (
                  <span key={s} className="text-xs border border-green-200 bg-green-50 text-green-800 px-2 py-1 capitalize" data-testid={`matched-${s}`}>{s}</span>
                ))}
                {result.matched_skills.length === 0 && <span className="text-sm text-muted-foreground">No skills matched yet.</span>}
              </div>
            </div>

            <div className="sharp-card p-6">
              <div className="overline mb-3 text-destructive">Missing skills ({result.missing_skills.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {result.missing_skills.map((s) => (
                  <span key={s} className="text-xs border border-red-200 bg-red-50 text-red-800 px-2 py-1 capitalize" data-testid={`missing-${s}`}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="sharp-card p-6">
            <div className="overline mb-4">Recommended courses</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
              {result.course_recommendations.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" className="bg-white p-5 hover:bg-secondary/40 transition-colors group" data-testid={`course-rec-${i}`}>
                  <div className="overline text-[10px] mb-2 capitalize">{c.skill}</div>
                  <div className="font-medium mb-1 flex items-start gap-1">{c.title} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1" /></div>
                  <div className="text-xs text-muted-foreground">{c.provider}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
