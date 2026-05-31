export function DesignD() {
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
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-3">
        <p className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-4">Design D — Card Block (Title Focus)</p>
        {tasks.map((task, idx) => {
          const pm = priorityMeta[task.priority];
          return (
            <div key={task.id}
              className="bg-white rounded-2xl px-5 pt-4 pb-3 shadow-sm border border-stone-100 hover:border-stone-200 transition-colors">

              <div className="flex items-start gap-3 mb-2.5">
                <button
                  className="mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center"
                  style={{ borderColor: task.done ? pm.accent : "#d5d5d5", backgroundColor: task.done ? pm.accent : "transparent" }}>
                  {task.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <p className={`flex-1 text-sm font-semibold leading-snug ${task.done ? "line-through text-stone-400" : "text-stone-800"}`}>
                  {task.title}
                </p>
                <span className="text-[10px] font-bold text-stone-300 flex-shrink-0 mt-0.5">#{idx + 1}</span>
              </div>

              {task.progress > 0 && (
                <div className="mb-2.5 ml-8">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${task.progress}%`, backgroundColor: pm.accent }} />
                    </div>
                    <span className="text-[10px] font-bold text-stone-400">{task.progress}%</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 ml-8">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: pm.bg, color: pm.color }}>
                  {pm.label}
                </span>
                {task.time && (
                  <span className="text-[10px] text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-md tabular-nums">
                    {task.time}
                  </span>
                )}
                {task.note && (
                  <span className="text-[10px] text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                    📝 Note
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
