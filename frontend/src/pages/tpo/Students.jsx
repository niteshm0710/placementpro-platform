import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";

export default function TpoStudents() {
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => { api.get("/students").then((r) => setStudents(r.data || [])); }, []);

  const filtered = students.filter((s) => {
    if (!q) return true;
    const txt = `${s.name} ${s.email} ${s.roll_number || ""} ${s.department || ""}`.toLowerCase();
    return txt.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-8" data-testid="tpo-students-page">
      <div>
        <div className="overline">Students</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Manage Students</h1>
        <p className="text-muted-foreground mt-2">All registered students across the institute.</p>
      </div>

      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, roll, department, email..." className="rounded-sm h-11 max-w-md" data-testid="student-search-input" />

      <div className="border border-border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-3 overline text-[10px]">Name</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Email</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Roll</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Department</th>
              <th className="text-left px-4 py-3 overline text-[10px]">CGPA</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Skills</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Apps</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Selected</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border" data-testid={`tpo-student-${s.id}`}>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                <td className="px-4 py-3">{s.roll_number || "-"}</td>
                <td className="px-4 py-3">{s.department || "-"}</td>
                <td className="px-4 py-3">{s.cgpa ?? "-"}</td>
                <td className="px-4 py-3">{(s.skills || []).length}</td>
                <td className="px-4 py-3">{s.applications_count}</td>
                <td className="px-4 py-3 font-display font-bold">{s.selected_count}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No students found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
