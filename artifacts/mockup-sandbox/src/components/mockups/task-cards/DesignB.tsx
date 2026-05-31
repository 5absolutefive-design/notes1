export function DesignB() {
  const tasks = [
    { id: 1, title: "Design new landing page", time: "10:00 AM", priority: "urgent", progress: 75, done: false, note: true },
    { id: 2, title: "Review pull request from team", time: "02:30 PM", priority: "medium", progress: 25, done: false, note: false },
    { id: 3, title: "Update documentation", time: "", priority: "low", progress: 100, done: true, note: false },
    { id: 4, title: "Setup CI/CD pipeline", time: "04:00 PM", priority: "important", progress: 0, done: false, note: true },
  ];

  const priorityMeta: Record<string, { label: string; color: string; bg: string }> = {
    low:       { label: "Low",       color: "#16a34a", bg: "#dcfce7" },
    normal:    { label: "Normal",    color: "#2563eb", bg: "#dbeafe" },
    medium:    { label: "Medium",    color: "#7c3aed", bg: "#ede9fe" },
    important: { label: "Important", color: "#ea580c", bg: "#ffedd5" },
    urgent:    { label: "Urgent",    color: "#dc2626", bg: "#fee2e2" },
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-2">
        <p className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-4">Design B — Compact Pills</p>
        {tasks.map((task, idx) => {
          const pm = priorityMeta[task.priority];
          return (
            <div key={task.id}
              className="bg-white rounded-xl flex items-center gap-3 px-4 py-3 border border-stone-100 hover:border-stone-200 transition-colors">

              <span className="text-[10px] font-bold text-stone-300 w-5 flex-shrink-0 text-center">{idx + 1}</span>

              <button
                className="w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all"
                style={{ borderColor: task.done ? "#6366f1" : "#d0d0d0", backgroundColor: task.done ? "#6366f1" : "transparent" }}>
                {task.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>

              <span className={`flex-1 text-sm font-medium min-w-0 truncate ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}>
                {task.title}
              </span>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {task.time && (
                  <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-1 rounded-full tabular-nums">
                    🕐 {task.time}
                  </span>
                )}
                {task.progress > 0 && (
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-500 px-2 py-1 rounded-full">
                    {task.progress}%
                  </span>
                )}
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: pm.bg, color: pm.color }}>
                  {pm.label}
                </span>
                {task.note && (
                  <span className="text-[10px] bg-amber-50 text-amber-500 px-2 py-1 rounded-full">Note</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
