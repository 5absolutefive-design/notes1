export function FlatD() {
  const pmeta: Record<string, { label: string; color: string; bg: string }> = {
    low:       { label: "Low",       color: "#16a34a", bg: "#dcfce7" },
    normal:    { label: "Normal",    color: "#2563eb", bg: "#dbeafe" },
    medium:    { label: "Medium",    color: "#7c3aed", bg: "#ede9fe" },
    important: { label: "Important", color: "#ea580c", bg: "#ffedd5" },
    urgent:    { label: "Urgent",    color: "#dc2626", bg: "#fee2e2" },
  };
  const tasks = [
    { id: 1, title: "Design new landing page", time: "10:00 AM", priority: "urgent" as const, progress: 75, done: false },
    { id: 2, title: "Review pull request", time: "04:50 PM", priority: null, progress: 0, done: false },
    { id: 3, title: "Update documentation", time: "", priority: "low" as const, progress: 100, done: true },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-10">
      <div className="w-full max-w-[820px]">
        <p className="text-[10px] font-bold tracking-widest text-stone-300 uppercase mb-4">Flat D — Divided Table (No outer box)</p>

        {/* Header row */}
        <div className="flex items-center gap-0 border-b-2 border-stone-800 pb-1.5 mb-0">
          <div className="w-10 flex-shrink-0" />
          <div className="w-8 flex-shrink-0" />
          <div className="flex-1 px-3">
            <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase">Task</span>
          </div>
          <div className="px-4 flex-shrink-0 min-w-[56px] text-center">
            <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase">Note</span>
          </div>
          <div className="px-4 flex-shrink-0 min-w-[90px] text-center">
            <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase">Time</span>
          </div>
          <div className="px-4 flex-shrink-0 min-w-[80px] text-center">
            <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase">Priority</span>
          </div>
          <div className="px-4 flex-shrink-0 min-w-[80px] text-center">
            <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase">Progress</span>
          </div>
          <div className="w-10 flex-shrink-0" />
        </div>

        {tasks.map((task, idx) => {
          const pm = task.priority ? pmeta[task.priority] : null;
          return (
            <div key={task.id} className={`flex items-center gap-0 border-b border-stone-200 hover:bg-stone-50 transition-colors ${idx === 0 ? "border-t border-stone-200" : ""}`}>

              <div className="w-10 flex-shrink-0 flex items-center justify-center py-3">
                <span className="text-[11px] font-semibold text-stone-400">T{idx + 1}</span>
              </div>

              <div className="w-8 flex-shrink-0 flex items-center justify-center py-3">
                <div
                  className="w-[16px] h-[16px] border flex items-center justify-center flex-shrink-0"
                  style={task.done ? { borderColor: "#1c1917", backgroundColor: "#1c1917" } : { borderColor: "#c0bdb9", backgroundColor: "transparent" }}>
                  {task.done && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>

              <div className="flex-1 px-3 py-3">
                <input
                  readOnly
                  value={task.done ? "" : task.title}
                  placeholder={task.done ? task.title : "Task name..."}
                  className={`w-full text-sm outline-none bg-transparent placeholder-stone-300 ${task.done ? "line-through text-stone-300" : "text-stone-700"}`}
                />
              </div>

              <div className="px-4 py-3 flex-shrink-0 min-w-[56px] text-center">
                <span className="text-[11px] text-stone-500">Note</span>
              </div>

              <div className="px-4 py-3 flex-shrink-0 min-w-[90px] text-center">
                <span className={`text-[11px] tabular-nums ${!task.time ? "text-stone-300" : "text-stone-600"}`}>
                  {task.time || "--:-- --"}
                </span>
              </div>

              <div className="px-4 py-3 flex-shrink-0 min-w-[80px] text-center">
                {pm ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm" style={{ color: pm.color, backgroundColor: pm.bg }}>
                    {pm.label}
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-300">Priority</span>
                )}
              </div>

              <div className="px-4 py-3 flex-shrink-0 min-w-[80px] text-center">
                {task.progress > 0 ? (
                  <div className="flex items-center gap-1.5 justify-center">
                    <div className="w-12 h-1 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-600 rounded-full" style={{ width: `${task.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-stone-500">{task.progress}%</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-stone-300">—</span>
                )}
              </div>

              <div className="w-10 flex-shrink-0 flex items-center justify-center py-3">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1.5 3.5h10M4.5 1.5h4M3 3.5l.65 7.5h5.7L10 3.5" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
