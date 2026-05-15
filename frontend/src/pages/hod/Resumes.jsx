import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function HodResumes() {
  const [items, setItems] = useState([]);

  useEffect(() => { api.get("/resumes/department").then((r) => setItems(r.data || [])); }, []);

  return (
    <div className="space-y-8" data-testid="hod-resumes-page">
      <div>
        <div className="overline">Resume Review</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Student Resumes</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {items.map((it) => (
          <div key={it.student.id} className="bg-white p-5" data-testid={`resume-card-${it.student.id}`}>
            <div className="overline text-[10px] mb-2">{it.student.roll_number || "no roll"}</div>
            <div className="font-medium">{it.student.name}</div>
            <div className="text-xs text-muted-foreground mt-1">CGPA: {it.student.cgpa ?? "-"}</div>
            {it.resume ? (
              <>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span>ATS <strong className="font-display">{it.analysis?.ats_score}</strong></span>
                  <span>Quality <strong className="font-display">{it.analysis?.quality_score}</strong></span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-sm mt-3 w-full" data-testid={`view-resume-${it.student.id}`}><FileText size={12} className="mr-2" /> Review</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{it.student.name} - Resume Review</DialogTitle></DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <Stat label="ATS" value={it.analysis?.ats_score} />
                        <Stat label="Quality" value={it.analysis?.quality_score} />
                      </div>
                      <div>
                        <div className="overline mb-2">Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {(it.analysis?.skills || []).map((s) => <span key={s} className="text-xs border border-border px-2 py-0.5 capitalize">{s}</span>)}
                        </div>
                      </div>
                      <div>
                        <div className="overline mb-2">Strengths</div>
                        <ul>{(it.analysis?.strengths || []).map((s, i) => <li key={i}>- {s}</li>)}</ul>
                      </div>
                      <div>
                        <div className="overline mb-2">Weaknesses</div>
                        <ul>{(it.analysis?.weaknesses || []).map((s, i) => <li key={i}>- {s}</li>)}</ul>
                      </div>
                      <div>
                        <div className="overline mb-2">Resume content</div>
                        <pre className="text-xs whitespace-pre-wrap bg-secondary/30 p-3 max-h-64 overflow-y-auto">{it.resume.text}</pre>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <div className="mt-3 text-xs text-muted-foreground italic">No resume uploaded</div>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="bg-white p-10 col-span-full text-center text-muted-foreground">No students yet.</div>}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border border-border p-3">
      <div className="overline text-[10px]">{label}</div>
      <div className="font-display text-3xl font-bold mt-1">{value ?? "-"}</div>
    </div>
  );
}
