import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bell } from "lucide-react";

export default function Notifications() {
  const [notes, setNotes] = useState([]);

  const load = async () => {
    const r = await api.get("/notifications");
    setNotes(r.data || []);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };

  return (
    <div className="space-y-8" data-testid="notifications-page">
      <div>
        <div className="overline">Notifications</div>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight font-bold mt-2">Stay up to date.</h1>
      </div>

      <div className="border border-border bg-white">
        {notes.length === 0 && <div className="p-10 text-center text-muted-foreground">No notifications yet.</div>}
        {notes.map((n) => (
          <div key={n.id} className={`border-b border-border p-5 flex items-start gap-4 ${n.read ? "opacity-60" : ""}`} data-testid={`note-${n.id}`}>
            <div className="w-10 h-10 flex items-center justify-center bg-secondary"><Bell size={16} /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium">{n.title}</div>
                {!n.read && <span className="text-[10px] uppercase tracking-wider bg-primary text-white px-1.5 py-0.5">New</span>}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
              <div className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.read && (
              <button onClick={() => markRead(n.id)} className="text-xs text-primary hover:underline" data-testid={`mark-read-${n.id}`}>Mark read</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
