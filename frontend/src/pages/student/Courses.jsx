import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ExternalLink } from "lucide-react";

export default function Courses() {
  const [recs, setRecs] = useState(null);
  const [all, setAll] = useState([]);

  useEffect(() => {
    api.get("/courses/recommend").then((r) => setRecs(r.data));
    api.get("/courses").then((r) => setAll(r.data || []));
  }, []);

  return (
    <div className="space-y-8" data-testid="courses-page">
      <div>
        <div className="overline">Course Recommendations</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Learn what's missing.</h1>
        <p className="text-muted-foreground mt-2">Curated learning paths based on your skill gaps.</p>
      </div>

      {recs && recs.courses?.length > 0 && (
        <div className="sharp-card p-6">
          <div className="overline mb-4">Recommended for {recs.based_on_role}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {recs.courses.map((c, i) => <CourseCard key={i} c={c} testid={`rec-course-${i}`} />)}
          </div>
        </div>
      )}

      <div className="sharp-card p-6">
        <div className="overline mb-4">Full catalog</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {all.map((c, i) => <CourseCard key={i} c={c} testid={`course-${i}`} />)}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ c, testid }) {
  return (
    <a href={c.url} target="_blank" rel="noreferrer" className="bg-white p-5 hover:bg-secondary/40 transition-colors group" data-testid={testid}>
      <div className="overline text-[10px] capitalize mb-2">{c.skill}</div>
      <div className="font-medium mb-1 flex items-start gap-1">{c.title} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1" /></div>
      <div className="text-xs text-muted-foreground">{c.provider}</div>
    </a>
  );
}
