import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function TpoNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [notes, setNotes] = useState([]);

  const load = () => api.get("/notifications").then((r) => setNotes(r.data || []));
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!title || !message) { toast.error("Title and message required"); return; }
    const payload = { title, message };
    if (target !== "all") payload.target_role = target;
    try {
      await api.post("/notifications", payload);
      toast.success("Notice sent");
      setTitle(""); setMessage(""); setTarget("all");
      load();
    } catch (e) { toast.error("Send failed"); }
  };

  return (
    <div className="space-y-8" data-testid="tpo-notifications-page">
      <div>
        <div className="overline">Broadcast</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Send Notification</h1>
        <p className="text-muted-foreground mt-2">Broadcast announcements to students, HODs, or everyone.</p>
      </div>

      <div className="sharp-card p-6 space-y-4 max-w-2xl">
        <div>
          <Label className="text-xs uppercase tracking-wider font-semibold">Target audience</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="rounded-sm h-11 mt-2" data-testid="notice-target-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="hod">HODs</SelectItem>
              <SelectItem value="tpo">TPOs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-semibold">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-sm h-11 mt-2" data-testid="notice-title-input" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-semibold">Message</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="rounded-sm mt-2" data-testid="notice-message-input" />
        </div>
        <Button onClick={send} className="rounded-sm btn-primary-swiss" data-testid="notice-send-btn">
          <Megaphone size={14} className="mr-2" /> Send notification
        </Button>
      </div>

      <div>
        <div className="overline mb-3">Recent notifications</div>
        <div className="border border-border bg-white">
          {notes.slice(0, 20).map((n) => (
            <div key={n.id} className="border-b border-border p-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">{n.title}</span>
                <span className="text-[10px] uppercase tracking-wider border border-border px-1.5 py-0.5">{n.target_role || "all"}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
          {notes.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No notifications yet.</div>}
        </div>
      </div>
    </div>
  );
}
