export function DesignE() {
  const tasks = [
    { id: 1, title: "Design new landing page", time: "10:00 AM", priority: "urgent", progress: 75, done: false, note: true },
    { id: 2, title: "Review pull request from team", time: "02:30 PM", priority: "medium", progress: 25, done: false, note: false },
    { id: 3, title: "Update documentation", time: "", priority: "low", progress: 100, done: true, note: false },
    { id: 4, title: "Setup CI/CD pipeline", time: "04:00 PM", priority: "important", progress: 0, done: false, note: true },
  ];

  const priorityMeta: Record<string, { label: string; color: string; dot: string }> = {
    low:       { label: "Low",       color: "#16a34a", dot: "#22c55e" },
    normal:    { label: "Normal",    color: "#2563eb", dot: "#3b82f6" },
    medium:    { label: "Medium",    color: "#7c3aed", dot: "#8b5cf6" },
    important: { label: "Important", color: "#ea580c", dot: "#f97316" },
    urgent:    { label: "Urgent",    color: "#dc2626", dot: "#ef4444" },
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <p className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-5">Design E — Minimal Flat</p>

        <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
          {tasks.map((task, idx) => {
            const pm = priorityMeta[task.priority];
            return (
              <div key={task.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors group">
                <span className="text-[10px] font-bold text-stone-300 w-4 flex-shrink-0 text-right">{idx + 1}</span>

                <button
                  className="w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center"
                  style={{ borderColor: task.done ? "#6366f1" : "#d5d5d5", backgroundColor: task.done ? "#6366f1" : "transparent" }}>
                  {task.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 2L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>

                <span className={`flex-1 text-sm min-w-0 truncate ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}>
                  {task.title}
                </span>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {task.progress > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-400 tabular-nums">{task.progress}%</span>
                    </div>
                  )}

                  {task.time && (
                    <span className="text-[11px] text-stone-400 tabular-nums">{task.time}</span>
                  )}

                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pm.dot }} />
                    <span className="text-[11px] font-medium" style={{ color: pm.color }}>{pm.label}</span>
                  </div>

                  {task.note && <span className="text-[10px] text-amber-400">●</span>}

                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 1h2M3.5 3l.5 7h4l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
