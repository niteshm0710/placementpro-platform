import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

export default function Prediction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    setLoading(true);
    api.get("/placement-prediction").then((r) => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { run(); }, []);

  const score = data?.placement_probability || 0;
  const chartData = [{ name: "score", value: score, fill: score >= 70 ? "hsl(var(--primary))" : score >= 50 ? "#f59e0b" : "hsl(var(--destructive))" }];

  return (
    <div className="space-y-8" data-testid="prediction-page">
      <div>
        <div className="overline">Placement Prediction</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Your placement readiness, scored.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Calculated from CGPA, skills, projects, and resume completeness.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="sharp-card p-6 lg:col-span-1 flex flex-col items-center">
          <div className="overline mb-2">Probability</div>
          <div className="w-full h-56" data-testid="prediction-gauge">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={chartData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "#f4f4f5" }} dataKey="value" cornerRadius={0} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="font-display text-6xl font-bold -mt-20" data-testid="prediction-score">{score}%</div>
          <div className="overline mt-12">{data?.readiness_level}</div>
          <Button onClick={run} disabled={loading} variant="outline" className="rounded-sm mt-6" data-testid="prediction-refresh-btn">
            {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : <TrendingUp size={14} className="mr-2" />}
            Recalculate
          </Button>
        </div>

        <div className="sharp-card p-6 lg:col-span-2 space-y-6">
          <div>
            <div className="overline mb-3">Improvement areas</div>
            <ul className="space-y-2 text-sm">
              {(data?.improvement_areas || []).map((a, i) => <li key={i} className="border-t border-border pt-2 first:border-t-0 first:pt-0">- {a}</li>)}
            </ul>
          </div>

          <div>
            <div className="overline mb-3">Factor breakdown</div>
            <div className="space-y-3">
              <Factor label="CGPA" value={data?.factors?.cgpa} max={10} />
              <Factor label="Skills count" value={data?.factors?.skills_count} max={20} />
              <Factor label="Projects" value={data?.factors?.projects_count} max={10} />
              <Factor label="Resume uploaded" value={data?.factors?.has_resume ? 1 : 0} max={1} format={(v) => v ? "Yes" : "No"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Factor({ label, value, max, format }) {
  const pct = Math.min(100, ((value || 0) / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="font-medium">{format ? format(value) : value ?? "-"}</span>
      </div>
      <Progress value={pct} className="h-1" />
    </div>
  );
}
