export function FlatB() {
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
    <div className="min-h-screen bg-white flex items-center justify-center p-10">
      <div className="w-full max-w-[820px] space-y-2">
        <p className="text-[10px] font-bold tracking-widest text-stone-300 uppercase mb-4">Flat B — Priority Color Fill</p>
        {tasks.map((task, idx) => {
          const pm = task.priority ? pmeta[task.priority] : null;
          return (
            <div key={task.id} className="flex items-center gap-0 border border-stone-300 rounded-sm">

              <div className="border-r border-stone-300 px-3 py-3 flex-shrink-0">
                <span className="text-[11px] font-semibold text-stone-500">T{idx + 1}</span>
              </div>

              <div className="border-r border-stone-300 px-3 py-3 flex-shrink-0 flex items-center justify-center">
                <div
                  className="w-[18px] h-[18px] border flex items-center justify-center flex-shrink-0"
                  style={task.done ? { borderColor: "#1c1917", backgroundColor: "#1c1917" } : { borderColor: "#a8a29e", backgroundColor: "white" }}>
                  {task.done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>

              <div className="flex-1 border-r border-stone-300 px-3 py-3">
                <input
                  readOnly
                  value={task.done ? "" : task.title}
                  placeholder={task.done ? task.title : "Task"}
                  className={`w-full text-sm outline-none bg-transparent border-b pb-0.5 placeholder-stone-300 ${task.done ? "line-through text-stone-300 border-stone-100" : "text-stone-700 border-stone-200"}`}
                />
              </div>

              <div className="border-r border-stone-300 px-4 py-3 flex-shrink-0">
                <span className="text-[11px] text-stone-500">Note</span>
              </div>

              <div className="border-r border-stone-300 px-4 py-3 flex-shrink-0 min-w-[90px] text-center">
                <span className={`text-[11px] tabular-nums ${!task.time ? "text-stone-300" : "text-stone-600"}`}>
                  {task.time || "--:-- --"}
                </span>
              </div>

              {/* Priority — filled with color when set */}
              <div
                className="border-r border-stone-300 px-4 py-3 flex-shrink-0 min-w-[80px] text-center"
                style={pm ? { backgroundColor: pm.bg } : {}}>
                <span className="text-[11px] font-semibold" style={pm ? { color: pm.color } : { color: "#c0bdb9" }}>
                  {pm ? pm.label : "Priority"}
                </span>
              </div>

              <div className="border-r border-stone-300 px-4 py-3 flex-shrink-0 min-w-[80px] text-center">
                <span className={`text-[11px] ${task.progress === 0 ? "text-stone-300" : "text-stone-600"}`}>
                  {task.progress === 0 ? "Progress %" : `${task.progress}%`}
                </span>
              </div>

              <div className="px-3 py-3 flex-shrink-0 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 3.5h10M5 1.5h4M3.5 3.5l.7 8h5.6l.7-8" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
