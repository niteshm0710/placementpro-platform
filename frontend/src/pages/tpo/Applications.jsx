import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["applied", "shortlisted", "interviewed", "selected", "rejected"];
const STATUS_COLORS = {
  applied: "border-foreground", shortlisted: "border-blue-500 bg-blue-50 text-blue-700",
  interviewed: "border-amber-500 bg-amber-50 text-amber-700",
  selected: "border-green-600 bg-green-50 text-green-700",
  rejected: "border-red-500 bg-red-50 text-red-700",
};

export default function TpoApplications() {
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = () => api.get("/applications").then((r) => setApps(r.data || []));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put("/applications/status", { application_id: id, status });
      toast.success("Status updated");
      load();
    } catch (e) { toast.error("Update failed"); }
  };

  const shown = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="space-y-8" data-testid="tpo-applications-page">
      <div>
        <div className="overline">Applications & Shortlisting</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Manage applications</h1>
        <p className="text-muted-foreground mt-2">Update statuses to shortlist, interview, or finalize candidates.</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="overline">Filter</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 rounded-sm h-10" data-testid="app-filter-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({apps.length})</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s} ({apps.filter((a) => a.status === s).length})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-3 overline text-[10px]">Student</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Roll / Dept</th>
              <th className="text-left px-4 py-3 overline text-[10px]">CGPA</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Company</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Role</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Status</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.id} className="border-b border-border" data-testid={`tpo-app-${a.id}`}>
                <td className="px-4 py-3 font-medium">{a.student?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.student?.roll_number} - {a.student?.department}</td>
                <td className="px-4 py-3">{a.student?.cgpa ?? "-"}</td>
                <td className="px-4 py-3 font-medium">{a.drive?.company}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.drive?.role}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase tracking-wider border px-2 py-1 font-semibold ${STATUS_COLORS[a.status] || ""}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                    <SelectTrigger className="w-40 rounded-sm h-9" data-testid={`status-select-${a.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No applications.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
