import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SAMPLE = `John Doe
Email: john@example.com | GitHub: github.com/johndoe
SUMMARY
Computer Science final-year student with strong skills in Python, JavaScript, React, and SQL. Passionate about building scalable backend systems and learning new technologies.
EXPERIENCE
Software Engineering Intern - Acme Corp (Summer 2025)
- Built REST APIs with FastAPI and PostgreSQL
- Implemented Redis caching reducing latency by 40%
PROJECTS
Real-time Chat App: React, Node.js, MongoDB, WebSocket
Resume Analyzer: Python, NLP, FastAPI - 500+ users
SKILLS
Python, JavaScript, TypeScript, React, Node.js, FastAPI, MongoDB, SQL, Docker, AWS, Git
EDUCATION
B.Tech Computer Science - CGPA 8.4`;

export default function Resume() {
  const [resume, setResume] = useState(null);
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("resume.txt");
  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.get("/resume").then((r) => {
      if (r.data) {
        setResume(r.data);
        setText(r.data.text || "");
        setFilename(r.data.filename || "resume.txt");
      }
    });
  }, []);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFilename(f.name);
    const name = f.name.toLowerCase();
    const isPdf = name.endsWith(".pdf") || f.type === "application/pdf";

    if (isPdf) {
      // Send to backend for text extraction
      setUploading(true);
      try {
        const buf = await f.arrayBuffer();
        // Convert to base64
        let binary = "";
        const bytes = new Uint8Array(buf);
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        const b64 = btoa(binary);
        const r = await api.post("/resume/extract", { filename: f.name, content_base64: b64 });
        const extracted = (r.data?.text || "").trim();
        if (!extracted) {
          toast.error("Could not extract text. Please paste resume text manually.");
          setText("");
        } else {
          setText(extracted);
          toast.success(`Extracted ${r.data.char_count} characters from PDF`);
        }
      } catch (err) {
        const msg = err?.response?.data?.detail || "Could not extract text. Please paste resume text manually.";
        toast.error(msg);
        setText("");
      } finally {
        setUploading(false);
      }
    } else {
      // Plain text / markdown - read on client
      const reader = new FileReader();
      reader.onload = () => setText(String(reader.result || ""));
      reader.readAsText(f);
    }
  };

  const upload = async () => {
    if (!text.trim()) {
      toast.error("Paste or upload resume content first.");
      return;
    }
    setUploading(true);
    try {
      const r = await api.post("/resume/upload", { filename, content: text, text });
      setResume(r.data);
      toast.success("Resume uploaded.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const r = await api.post("/resume/analyze");
      setAnalysis(r.data);
      toast.success("Analysis complete");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="resume-page">
      <div>
        <div className="overline">AI Resume Analyzer</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Score and improve your resume.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Upload your resume content. We extract skills, score it for ATS friendliness, and give actionable feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sharp-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="overline">Upload resume</div>
            {resume && <span className="text-xs text-muted-foreground">Last uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}</span>}
          </div>
          <Input type="file" accept=".txt,.md,.pdf,.docx" onChange={onFile} className="rounded-sm" data-testid="resume-file-input" />
          <div className="text-xs text-muted-foreground">Or paste the resume content below:</div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder="Paste your resume content..." className="rounded-sm font-mono text-xs" data-testid="resume-text-input" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={upload} disabled={uploading} className="rounded-sm btn-primary-swiss" data-testid="resume-upload-btn">
              {uploading ? <Loader2 className="animate-spin mr-2" size={14} /> : <UploadCloud size={14} className="mr-2" />}
              Save resume
            </Button>
            <Button variant="outline" onClick={() => setText(SAMPLE)} className="rounded-sm" data-testid="resume-load-sample">Load sample</Button>
            <Button onClick={analyze} disabled={analyzing || !resume} className="rounded-sm" variant="secondary" data-testid="resume-analyze-btn">
              {analyzing ? <Loader2 className="animate-spin mr-2" size={14} /> : <Sparkles size={14} className="mr-2" />}
              Run Analysis
            </Button>
          </div>
        </div>

        <div className="sharp-card p-6">
          <div className="overline mb-4">Analysis Result</div>
          {!analysis && (
            <div className="text-center py-16">
              <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
              <div className="text-sm text-muted-foreground">{resume ? "Click 'Run Analysis' to score your resume." : "Save a resume first to enable analysis."}</div>
            </div>
          )}
          {analysis && (
            <div className="space-y-6" data-testid="resume-analysis-result">
              <div className="grid grid-cols-2 gap-4">
                <ScoreCard label="ATS Score" value={analysis.ats_score} testid="ats-score" />
                <ScoreCard label="Quality Score" value={analysis.quality_score} testid="quality-score" />
              </div>

              <div>
                <div className="overline mb-2">Extracted Skills ({analysis.skills.length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.skills.map((s) => (
                    <span key={s} className="text-xs border border-border px-2 py-1 capitalize" data-testid={`skill-${s}`}>{s}</span>
                  ))}
                  {analysis.skills.length === 0 && <span className="text-xs text-muted-foreground">No skills detected.</span>}
                </div>
              </div>

              <div>
                <div className="overline mb-2 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-600" /> Strengths</div>
                <ul className="space-y-1.5 text-sm">
                  {analysis.strengths.map((s, i) => <li key={i} className="text-foreground/80">- {s}</li>)}
                </ul>
              </div>

              <div>
                <div className="overline mb-2 flex items-center gap-1.5"><AlertCircle size={12} className="text-destructive" /> Weaknesses</div>
                <ul className="space-y-1.5 text-sm">
                  {analysis.weaknesses.map((s, i) => <li key={i} className="text-foreground/80">- {s}</li>)}
                </ul>
              </div>

              <div>
                <div className="overline mb-2">Suggestions</div>
                <ul className="space-y-1.5 text-sm">
                  {analysis.suggestions.map((s, i) => <li key={i} className="text-foreground/80">- {s}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, testid }) {
  return (
    <div className="border border-border p-4" data-testid={testid}>
      <div className="overline mb-3 text-[10px]">{label}</div>
      <div className="font-display text-4xl font-bold mb-2">{value}</div>
      <Progress value={value} className="h-1" />
    </div>
  );
}
