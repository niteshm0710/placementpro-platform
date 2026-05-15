import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function HodStudents() {
  const [students, setStudents] = useState([]);
  useEffect(() => { api.get("/students").then((r) => setStudents(r.data || [])); }, []);

  return (
    <div className="space-y-8" data-testid="hod-students-page">
      <div>
        <div className="overline">Student Performance</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Department Students</h1>
        <p className="text-muted-foreground mt-2">Detailed performance tracking.</p>
      </div>

      <div className="border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-3 overline text-[10px]">Name</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Roll</th>
              <th className="text-left px-4 py-3 overline text-[10px]">CGPA</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Year</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Skills</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Applications</th>
              <th className="text-left px-4 py-3 overline text-[10px]">Selected</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-border" data-testid={`student-row-${s.id}`}>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.roll_number || "-"}</td>
                <td className="px-4 py-3">{s.cgpa ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.year || "-"}</td>
                <td className="px-4 py-3">{(s.skills || []).length}</td>
                <td className="px-4 py-3">{s.applications_count}</td>
                <td className="px-4 py-3 font-display font-bold">{s.selected_count}</td>
              </tr>
            ))}
            {students.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No students in your department yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
