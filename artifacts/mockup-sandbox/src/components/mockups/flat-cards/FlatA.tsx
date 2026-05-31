export function FlatA() {
  const tasks = [
    { id: 1, title: "Design new landing page", time: "10:00 AM", priority: "Urgent", progress: 75, done: false },
    { id: 2, title: "Review pull request", time: "04:50 PM", priority: "Priority", progress: 0, done: false },
    { id: 3, title: "Update documentation", time: "--:-- --", priority: "Low", progress: 100, done: true },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-10">
      <div className="w-full max-w-[820px] space-y-2">
        <p className="text-[10px] font-bold tracking-widest text-stone-300 uppercase mb-4">Flat A — Pure Border (Image Match)</p>
        {tasks.map((task, idx) => (
          <div key={task.id} className="flex items-center gap-0 border border-stone-300 rounded-sm">

            {/* T number */}
            <div className="border-r border-stone-300 px-3 py-3 flex-shrink-0">
              <span className={`text-[11px] font-semibold ${task.done ? "text-stone-300" : "text-stone-500"}`}>T{idx + 1}</span>
            </div>

            {/* Checkbox */}
            <div className="border-r border-stone-300 px-3 py-3 flex-shrink-0 flex items-center justify-center">
              <div className={`w-[18px] h-[18px] border flex items-center justify-center flex-shrink-0 ${task.done ? "border-stone-800 bg-stone-800" : "border-stone-400 bg-white"}`}>
                {task.done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>

            {/* Title input */}
            <div className="flex-1 border-r border-stone-300 px-3 py-3">
              <input
                readOnly
                value={task.done ? "" : task.title}
                placeholder={task.done ? task.title : "Task"}
                className={`w-full text-sm outline-none bg-transparent border-b border-stone-200 pb-0.5 placeholder-stone-300 ${task.done ? "line-through text-stone-300" : "text-stone-700"}`}
              />
            </div>

            {/* Note */}
            <div className="border-r border-stone-300 px-4 py-3 flex-shrink-0">
              <span className="text-[11px] text-stone-500">Note</span>
            </div>

            {/* Time */}
            <div className="border-r border-stone-300 px-4 py-3 flex-shrink-0 min-w-[90px] text-center">
              <span className={`text-[11px] tabular-nums ${task.time === "--:-- --" ? "text-stone-300" : "text-stone-600"}`}>{task.time}</span>
            </div>

            {/* Priority */}
            <div className="border-r border-stone-300 px-4 py-3 flex-shrink-0 min-w-[72px] text-center">
              <span className={`text-[11px] font-medium ${task.priority === "Priority" ? "text-stone-300" : "text-stone-600"}`}>{task.priority}</span>
            </div>

            {/* Progress */}
            <div className="border-r border-stone-300 px-4 py-3 flex-shrink-0 min-w-[80px] text-center">
              <span className={`text-[11px] ${task.progress === 0 ? "text-stone-300" : "text-stone-600"}`}>
                {task.progress === 0 ? "Progress %" : `${task.progress}%`}
              </span>
            </div>

            {/* Trash */}
            <div className="px-3 py-3 flex-shrink-0 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5h10M5 1.5h4M3.5 3.5l.7 8h5.6l.7-8" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
