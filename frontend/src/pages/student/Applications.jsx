import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STATUS_COLORS = {
  applied: "border-foreground text-foreground",
  shortlisted: "border-blue-500 text-blue-700 bg-blue-50",
  interviewed: "border-amber-500 text-amber-700 bg-amber-50",
  selected: "border-green-600 text-green-700 bg-green-50",
  rejected: "border-red-500 text-red-700 bg-red-50",
};

export default function Applications() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    api.get("/applications").then((r) => setApps(r.data || []));
  }, []);

  return (
    <div className="space-y-8" data-testid="applications-page">
      <div>
        <div className="overline">Application Tracker</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Your applications.</h1>
        <p className="text-muted-foreground mt-2">Track status across every drive you applied to.</p>
      </div>

      <div className="border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-3 overline text-[10px]">Company</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Role</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Package</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Drive Date</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Status</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Applied</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} className="border-b border-border" data-testid={`app-row-${a.id}`}>
                <td className="px-4 py-3 font-medium">{a.drive?.company}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.drive?.role}</td>
                <td className="px-4 py-3">{a.drive?.package_lpa} LPA</td>
                <td className="px-4 py-3 text-muted-foreground">{a.drive?.drive_date}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase tracking-wider border px-2 py-1 font-semibold ${STATUS_COLORS[a.status] || ""}`} data-testid={`app-status-${a.id}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(a.applied_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No applications yet. Browse drives to apply.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
