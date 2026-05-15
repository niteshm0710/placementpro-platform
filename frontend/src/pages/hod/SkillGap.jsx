import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export default function HodSkillGap() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/skill-gap/overview").then((r) => setData(r.data)); }, []);

  if (!data) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8" data-testid="hod-skillgap-page">
      <div>
        <div className="overline">Skill Gap Overview</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Department Skill Landscape</h1>
        <p className="text-muted-foreground mt-2">Aggregate view across {data.student_count} students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sharp-card p-6">
          <div className="overline mb-4">Top skills present</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.top_skills} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="skill" type="category" fontSize={11} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sharp-card p-6">
          <div className="overline mb-4">Most missing skills for {data.target_role}</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.most_missing_skills} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="skill" type="category" fontSize={11} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
