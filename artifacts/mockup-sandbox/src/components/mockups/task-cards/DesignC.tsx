export function DesignC() {
  const tasks = [
    { id: 1, title: "Design new landing page", time: "10:00 AM", priority: "urgent", progress: 75, done: false, note: true },
    { id: 2, title: "Review pull request from team", time: "02:30 PM", priority: "medium", progress: 25, done: false, note: false },
    { id: 3, title: "Update documentation", time: "", priority: "low", progress: 100, done: true, note: false },
    { id: 4, title: "Setup CI/CD pipeline", time: "04:00 PM", priority: "important", progress: 0, done: false, note: true },
  ];

  const priorityMeta: Record<string, { label: string; color: string; bg: string; accent: string }> = {
    low:       { label: "Low",       color: "#16a34a", bg: "#dcfce7", accent: "#22c55e" },
    normal:    { label: "Normal",    color: "#2563eb", bg: "#dbeafe", accent: "#3b82f6" },
    medium:    { label: "Medium",    color: "#7c3aed", bg: "#ede9fe", accent: "#8b5cf6" },
    important: { label: "Important", color: "#ea580c", bg: "#ffedd5", accent: "#f97316" },
    urgent:    { label: "Urgent",    color: "#dc2626", bg: "#fee2e2", accent: "#ef4444" },
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-2.5">
        <p className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-4">Design C — Left Accent Bar</p>
        {tasks.map((task, idx) => {
          const pm = priorityMeta[task.priority];
          return (
            <div key={task.id}
              className="bg-white rounded-xl overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
              <div className="w-1 flex-shrink-0" style={{ backgroundColor: pm.accent }} />
              <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
                <span className="text-[10px] font-bold text-stone-300 w-4 flex-shrink-0">{idx + 1}</span>

                <button
                  className="w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
                  style={{ borderColor: task.done ? pm.accent : "#d0d0d0", backgroundColor: task.done ? pm.accent : "transparent" }}>
                  {task.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.done ? "line-through text-stone-400" : "text-stone-800"}`}>
                    {task.title}
                  </p>
                  {task.progress > 0 && (
                    <div className="mt-1.5 h-1 rounded-full bg-stone-100 overflow-hidden w-32">
                      <div className="h-full rounded-full transition-all" style={{ width: `${task.progress}%`, backgroundColor: pm.accent }} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.time && (
                    <span className="text-[10px] text-stone-400 tabular-nums">{task.time}</span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: pm.bg, color: pm.color }}>
                    {pm.label}
                  </span>
                  {task.note && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
