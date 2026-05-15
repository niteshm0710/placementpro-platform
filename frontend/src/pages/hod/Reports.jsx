import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function HodReports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/analytics/hod").then((r) => setData(r.data)); }, []);

  const download = () => {
    if (!data) return;
    const csv = [
      "Metric,Value",
      `Department,${data.department}`,
      `Total Students,${data.total_students}`,
      `Placed Students,${data.placed_students}`,
      `Total Applications,${data.total_applications}`,
      `Average CGPA,${data.average_cgpa}`,
      "",
      "Status,Count",
      ...Object.entries(data.applications_by_status || {}).map(([k, v]) => `${k},${v}`),
      "",
      "Company,Selections",
      ...((data.placements_by_company || []).map((c) => `${c.company},${c.count}`)),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.department}-placement-report.csv`;
    a.click();
  };

  if (!data) return <div className="text-sm text-muted-foreground">Loading...</div>;
  const placementRate = data.total_students > 0 ? Math.round((data.placed_students / data.total_students) * 100) : 0;

  return (
    <div className="space-y-8" data-testid="hod-reports-page">
      <div className="flex items-start justify-between">
        <div>
          <div className="overline">Reports</div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Placement Report - {data.department}</h1>
          <p className="text-muted-foreground mt-2">Generate or download branch-wise placement reports.</p>
        </div>
        <Button onClick={download} className="rounded-sm" data-testid="download-report-btn"><Download size={14} className="mr-2" /> Download CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card label="Placement Rate" value={`${placementRate}%`} />
        <Card label="Students" value={data.total_students} />
        <Card label="Placed" value={data.placed_students} />
        <Card label="Avg CGPA" value={data.average_cgpa} />
      </div>

      <div className="sharp-card p-6">
        <div className="overline mb-4">Companies hiring from {data.department}</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-3 py-2 overline text-[10px]">Company</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Selections</th>
            </tr>
          </thead>
          <tbody>
            {(data.placements_by_company || []).map((c, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-3 py-2 font-medium">{c.company}</td>
                <td className="px-3 py-2 font-display font-bold">{c.count}</td>
              </tr>
            ))}
            {(!data.placements_by_company || data.placements_by_company.length === 0) && <tr><td colSpan={2} className="text-center py-6 text-muted-foreground">No placements yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="sharp-card p-6">
      <div className="overline mb-2">{label}</div>
      <div className="font-display text-4xl font-bold">{value}</div>
    </div>
  );
}
