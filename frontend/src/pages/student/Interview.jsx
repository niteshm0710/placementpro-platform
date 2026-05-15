import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, MessageSquare, Play, CheckCircle2 } from "lucide-react";

export default function Interview() {
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("medium");
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/interview/history").then((r) => setHistory(r.data || [])).catch(() => {});
  }, []);

  const start = async () => {
    setLoading(true);
    setResults(null);
    try {
      const r = await api.post("/interview/start", { role, difficulty });
      setSession(r.data);
      setAnswers(new Array(r.data.questions.length).fill(""));
      toast.success("Interview started");
    } catch (e) { toast.error("Failed to start"); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const r = await api.post("/interview/submit", { session_id: session.session_id, answers });
      setResults(r.data);
      toast.success(`Interview complete - Score ${r.data.average_score}`);
      const h = await api.get("/interview/history");
      setHistory(h.data || []);
    } catch (e) { toast.error("Submit failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8" data-testid="interview-page">
      <div>
        <div className="overline">Mock Interview</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Practice with AI-scored feedback.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Pick a role and difficulty. Answer the questions. Get instant scored feedback.</p>
      </div>

      {!session && !results && (
        <div className="sharp-card p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end" data-testid="interview-config">
          <div>
            <div className="overline mb-2">Role</div>
            <Input value={role} onChange={(e) => setRole(e.target.value)} className="rounded-sm h-11" data-testid="interview-role-input" />
          </div>
          <div>
            <div className="overline mb-2">Difficulty</div>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="rounded-sm h-11" data-testid="interview-difficulty-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={start} disabled={loading} className="h-11 rounded-sm btn-primary-swiss" data-testid="interview-start-btn">
            {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Play size={14} className="mr-2" />}
            Start interview
          </Button>
        </div>
      )}

      {session && !results && (
        <div className="space-y-4" data-testid="interview-session">
          {session.questions.map((q, i) => (
            <div key={i} className="sharp-card p-6">
              <div className="overline mb-2">Question {i + 1}</div>
              <div className="font-medium mb-3">{q}</div>
              <Textarea
                rows={4}
                value={answers[i]}
                onChange={(e) => {
                  const a = [...answers]; a[i] = e.target.value; setAnswers(a);
                }}
                placeholder="Type your answer..."
                className="rounded-sm"
                data-testid={`interview-answer-${i}`}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={loading} className="rounded-sm btn-primary-swiss" data-testid="interview-submit-btn">
              {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : <CheckCircle2 size={14} className="mr-2" />}
              Submit & Score
            </Button>
            <Button variant="outline" onClick={() => { setSession(null); setAnswers([]); }} className="rounded-sm" data-testid="interview-cancel-btn">Cancel</Button>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-6" data-testid="interview-results">
          <div className="sharp-card p-6 flex items-center justify-between">
            <div>
              <div className="overline">Overall</div>
              <div className="font-display text-2xl font-bold mt-1">{results.overall}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-5xl font-bold" data-testid="interview-overall-score">{results.average_score}</div>
              <div className="text-xs text-muted-foreground mt-1">average score</div>
            </div>
          </div>
          {results.results.map((r, i) => (
            <div key={i} className="sharp-card p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="overline">Question {i + 1}</div>
                <div className="font-display text-xl font-bold">{r.score}</div>
              </div>
              <div className="font-medium mb-2">{r.question}</div>
              <div className="text-sm text-muted-foreground mb-3 italic">"{r.answer || '(empty answer)'}"</div>
              <div className="text-sm border-t border-border pt-3"><span className="overline text-[10px] mr-2">Feedback</span> {r.feedback}</div>
            </div>
          ))}
          <Button onClick={() => { setSession(null); setResults(null); }} className="rounded-sm" variant="outline" data-testid="interview-reset-btn">Start another</Button>
        </div>
      )}

      {history.length > 0 && !session && !results && (
        <div className="sharp-card p-6">
          <div className="overline mb-3">Previous sessions</div>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm border-t border-border pt-2 first:border-t-0 first:pt-0">
                <div>
                  <div className="font-medium">{h.role}</div>
                  <div className="text-xs text-muted-foreground">{h.difficulty} - {new Date(h.started_at).toLocaleDateString()}</div>
                </div>
                <div className="font-display font-bold">{h.average_score ?? "-"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
