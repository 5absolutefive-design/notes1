export function DesignA() {
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
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-3">
        <p className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-4">Design A — Clean Row (Neumorphic)</p>
        {tasks.map((task, idx) => {
          const pm = priorityMeta[task.priority];
          return (
            <div key={task.id}
              className="rounded-2xl flex items-center gap-3 px-5 py-4"
              style={{ background: "#f0f0f0", boxShadow: "6px 6px 14px #d0d0d0, -6px -6px 14px #ffffff" }}>

              <span className="text-[11px] font-bold text-stone-400 w-6 flex-shrink-0 text-center">T{idx + 1}</span>

              <button
                className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
                style={task.done
                  ? { background: "#6366f1", boxShadow: "inset 2px 2px 5px #4f52c7, inset -2px -2px 5px #7779ff" }
                  : { background: "#f0f0f0", boxShadow: "inset 3px 3px 6px #d0d0d0, inset -3px -3px 6px #ffffff" }}>
                {task.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>

              <div className="flex-1 min-w-0">
                <span className={`text-sm ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}>{task.title}</span>
                {task.progress > 0 && (
                  <div className="mt-1.5 h-1 rounded-full bg-stone-200 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${task.progress}%` }} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {task.time && (
                  <span className="text-[11px] text-stone-500 tabular-nums px-2.5 py-2 rounded-xl"
                    style={{ background: "#f0f0f0", boxShadow: "3px 3px 7px #d0d0d0, -3px -3px 7px #ffffff" }}>
                    {task.time}
                  </span>
                )}
                <span className="text-[10px] font-bold px-2.5 py-2 rounded-xl"
                  style={{ backgroundColor: pm.bg, color: pm.color }}>
                  {pm.label}
                </span>
                {task.note && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
