import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Briefcase, Award, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#002fa7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function HodDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get("/analytics/hod").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const statusData = Object.entries(data.applications_by_status || {}).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="space-y-8" data-testid="hod-dashboard">
      <div>
        <div className="overline">{data.department} Department</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Department Overview</h1>
        <p className="text-muted-foreground mt-2">Live placement metrics for your department.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={Users} label="Students" value={data.total_students} testid="hod-tile-students" />
        <Tile icon={Award} label="Placed" value={data.placed_students} testid="hod-tile-placed" />
        <Tile icon={Briefcase} label="Applications" value={data.total_applications} testid="hod-tile-apps" />
        <Tile icon={TrendingUp} label="Avg CGPA" value={data.average_cgpa} testid="hod-tile-cgpa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sharp-card p-6">
          <div className="overline mb-4">Applications by status</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sharp-card p-6">
          <div className="overline mb-4">Placements by company</div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.placements_by_company} dataKey="count" nameKey="company" outerRadius={80} label={(e) => e.company}>
                  {(data.placements_by_company || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="sharp-card p-6">
        <div className="overline mb-4">Top performers</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-3 py-2 overline text-[10px]">Name</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Roll</th>
              <th className="text-left px-3 py-2 overline text-[10px]">CGPA</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Apps</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Selected</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Skills</th>
            </tr>
          </thead>
          <tbody>
            {(data.top_performers || []).map((p) => (
              <tr key={p.id} className="border-b border-border" data-testid={`top-perf-${p.id}`}>
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.roll_number || "-"}</td>
                <td className="px-3 py-2">{p.cgpa ?? "-"}</td>
                <td className="px-3 py-2">{p.applications}</td>
                <td className="px-3 py-2"><span className="font-display font-bold">{p.selected}</span></td>
                <td className="px-3 py-2">{p.skills_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, testid }) {
  return (
    <div className="sharp-card p-6" data-testid={testid}>
      <Icon size={18} className="mb-3 text-muted-foreground" />
      <div className="overline mb-2">{label}</div>
      <div className="font-display text-4xl font-bold">{value}</div>
    </div>
  );
}
