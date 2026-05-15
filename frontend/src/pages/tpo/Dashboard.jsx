import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Building2, ClipboardList, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#002fa7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function TpoDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/analytics/tpo").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const statusData = Object.entries(data.by_status || {}).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="space-y-8" data-testid="tpo-dashboard">
      <div>
        <div className="overline">Placement Cell</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Institute-wide Overview</h1>
        <p className="text-muted-foreground mt-2">Live placement metrics across the institute.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Tile icon={Users} label="Students" value={data.total_students} testid="tpo-tile-students" />
        <Tile icon={Building2} label="Drives" value={data.total_drives} testid="tpo-tile-drives" />
        <Tile icon={ClipboardList} label="Applications" value={data.total_applications} testid="tpo-tile-apps" />
        <Tile icon={Award} label="Placed" value={data.placed_students} testid="tpo-tile-placed" />
        <Tile icon={Award} label="Avg Package" value={`${data.average_package_lpa} LPA`} testid="tpo-tile-avg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="sharp-card p-6 lg:col-span-2">
          <div className="overline mb-4">Placement by department</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.by_department}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="department" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="total" fill="#e4e4e7" name="Total students" />
                <Bar dataKey="placed" fill="hsl(var(--primary))" name="Placed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="sharp-card p-6">
          <div className="overline mb-4">Status mix</div>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label={(e) => e.name}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="sharp-card p-6">
        <div className="overline mb-4">Selections by company</div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={data.by_company}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="company" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, testid }) {
  return (
    <div className="sharp-card p-6" data-testid={testid}>
      <Icon size={18} className="mb-3 text-muted-foreground" />
      <div className="overline mb-2">{label}</div>
      <div className="font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
