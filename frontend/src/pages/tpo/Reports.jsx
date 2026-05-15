import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function TpoReports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/analytics/tpo").then((r) => setData(r.data)); }, []);

  const download = () => {
    if (!data) return;
    const csv = [
      "Metric,Value",
      `Total Students,${data.total_students}`,
      `Total Drives,${data.total_drives}`,
      `Total Applications,${data.total_applications}`,
      `Placed Students,${data.placed_students}`,
      `Average Package (LPA),${data.average_package_lpa}`,
      "",
      "Department,Total,Placed",
      ...(data.by_department || []).map((d) => `${d.department},${d.total},${d.placed}`),
      "",
      "Company,Selections",
      ...(data.by_company || []).map((c) => `${c.company},${c.count}`),
      "",
      "Status,Count",
      ...Object.entries(data.by_status || {}).map(([k, v]) => `${k},${v}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "placement-report.csv";
    a.click();
  };

  if (!data) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const placementRate = data.total_students > 0 ? Math.round((data.placed_students / data.total_students) * 100) : 0;

  return (
    <div className="space-y-8" data-testid="tpo-reports-page">
      <div className="flex items-start justify-between">
        <div>
          <div className="overline">Reports</div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Institute Placement Report</h1>
          <p className="text-muted-foreground mt-2">Download or export complete placement metrics.</p>
        </div>
        <Button onClick={download} className="rounded-sm" data-testid="tpo-download-report"><Download size={14} className="mr-2" /> Download CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card label="Placement Rate" value={`${placementRate}%`} />
        <Card label="Students" value={data.total_students} />
        <Card label="Placed" value={data.placed_students} />
        <Card label="Drives" value={data.total_drives} />
        <Card label="Avg Package" value={`${data.average_package_lpa} LPA`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sharp-card p-6">
          <div className="overline mb-4">By department</div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-3 py-2 overline text-[10px]">Department</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Total</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Placed</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Rate</th>
            </tr></thead>
            <tbody>
              {(data.by_department || []).map((d) => (
                <tr key={d.department} className="border-b border-border">
                  <td className="px-3 py-2 font-medium">{d.department}</td>
                  <td className="px-3 py-2">{d.total}</td>
                  <td className="px-3 py-2">{d.placed}</td>
                  <td className="px-3 py-2">{d.total > 0 ? Math.round((d.placed/d.total)*100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sharp-card p-6">
          <div className="overline mb-4">By company</div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-3 py-2 overline text-[10px]">Company</th>
              <th className="text-left px-3 py-2 overline text-[10px]">Selections</th>
            </tr></thead>
            <tbody>
              {(data.by_company || []).map((c) => (
                <tr key={c.company} className="border-b border-border">
                  <td className="px-3 py-2 font-medium">{c.company}</td>
                  <td className="px-3 py-2 font-display font-bold">{c.count}</td>
                </tr>
              ))}
              {(!data.by_company || data.by_company.length === 0) && <tr><td colSpan={2} className="text-center py-6 text-muted-foreground">No placements yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="sharp-card p-6">
      <div className="overline mb-2">{label}</div>
      <div className="font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
