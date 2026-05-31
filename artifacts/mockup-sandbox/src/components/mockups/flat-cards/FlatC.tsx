import { useState } from "react";

export function FlatC() {
  const pmeta: Record<string, { label: string; color: string; rowBg: string; bar: string }> = {
    low:       { label: "Low",       color: "#16a34a", rowBg: "#f0fdf4", bar: "#22c55e" },
    normal:    { label: "Normal",    color: "#2563eb", rowBg: "#eff6ff", bar: "#3b82f6" },
    medium:    { label: "Medium",    color: "#7c3aed", rowBg: "#faf5ff", bar: "#8b5cf6" },
    important: { label: "Important", color: "#ea580c", rowBg: "#fff7ed", bar: "#f97316" },
    urgent:    { label: "Urgent",    color: "#dc2626", rowBg: "#fef2f2", bar: "#ef4444" },
  };

  const [tasks, setTasks] = useState([
    { id: 1, title: "Design new landing page", time: "10:00 AM", priority: "urgent" as const, progress: 75, done: false, note: "" },
    { id: 2, title: "Review pull request from team", time: "04:50 PM", priority: null, progress: 0, done: false, note: "" },
    { id: 3, title: "Update documentation files", time: "", priority: "low" as const, progress: 100, done: true, note: "Already pushed to main branch." },
    { id: 4, title: "Setup CI/CD pipeline", time: "02:00 PM", priority: "medium" as const, progress: 30, done: false, note: "" },
  ]);

  const [noteOpenId, setNoteOpenId] = useState<number | null>(null);

  const toggleDone = (id: number) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const updateNote = (id: number, note: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, note } : t));

  /* ── Fixed column widths (px) ── */
  const COL = {
    num:      40,   /* T1 */
    check:    44,   /* checkbox */
    title:    260,  /* task title — truncated */
    note:     64,   /* Note */
    time:     96,   /* HH:MM AM */
    priority: 84,   /* Priority */
    progress: 88,   /* Progress % */
    trash:    44,   /* 🗑 */
  };
  const CARD_W = Object.values(COL).reduce((a, b) => a + b, 0); /* 680 */
  const CARD_H = 48;

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-10">
      <div className="flex flex-col gap-2.5" style={{ width: CARD_W }}>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">
          Flat C — Floating Cards · Fixed Size
        </p>

        {tasks.map((task, idx) => {
          const pm = task.priority ? pmeta[task.priority] : null;

          return (
            <div key={task.id} className="relative">
            <div
              className="flex items-center flex-shrink-0 overflow-hidden border border-stone-200 rounded-md"
              style={{
                width: CARD_W,
                height: CARD_H,
                backgroundColor: pm ? pm.rowBg : "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
                opacity: task.done ? 0.2 : 1,
              }}
            >
              {/* Priority accent bar */}
              <div
                className="self-stretch flex-shrink-0"
                style={{ width: 3, backgroundColor: pm ? pm.bar : "#e5e7eb" }}
              />

              {/* T-number */}
              <div
                className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch"
                style={{ width: COL.num - 3 }}>
                <span className="text-[11px] font-semibold text-stone-400">T{idx + 1}</span>
              </div>

              {/* Checkbox */}
              <div
                className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer"
                style={{ width: COL.check }}
                onClick={() => toggleDone(task.id)}>
                <div
                  className="w-[17px] h-[17px] border flex items-center justify-center"
                  style={task.done
                    ? { borderColor: "#1c1917", backgroundColor: "#1c1917" }
                    : { borderColor: "#a8a29e", backgroundColor: "transparent" }}>
                  {task.done && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Title — fixed width, truncated */}
              <div
                className="flex items-center flex-shrink-0 border-r border-stone-200 self-stretch px-3"
                style={{ width: COL.title }}>
                <span
                  className={`text-sm w-full truncate ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}
                  style={{ display: "block" }}>
                  {task.title}
                </span>
              </div>

              {/* Note */}
              <div
                className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none"
                style={{ width: COL.note }}
                onClick={() => setNoteOpenId(noteOpenId === task.id ? null : task.id)}>
                <span className={`text-[11px] font-medium ${task.note ? "text-indigo-500" : "text-stone-400 hover:text-stone-600"}`}>
                  Note{task.note && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block align-middle" />}
                </span>
              </div>

              {/* Time */}
              <div
                className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch"
                style={{ width: COL.time }}>
                <span className={`text-[11px] tabular-nums ${!task.time ? "text-stone-300" : "text-stone-600"}`}>
                  {task.time || "--:-- --"}
                </span>
              </div>

              {/* Priority */}
              <div
                className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch"
                style={{ width: COL.priority }}>
                <span
                  className="text-[11px] font-semibold"
                  style={pm ? { color: pm.color } : { color: "#c8c4bf" }}>
                  {pm ? pm.label : "N/A"}
                </span>
              </div>

              {/* Progress */}
              <div
                className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch px-3"
                style={{ width: COL.progress }}>
                {task.progress > 0 ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <div className="flex-1 h-[3px] bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-500 rounded-full" style={{ width: `${task.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-stone-500 tabular-nums flex-shrink-0">{task.progress}%</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-stone-300">Progress %</span>
                )}
              </div>

              {/* Trash */}
              <div
                className="flex items-center justify-center flex-shrink-0 self-stretch"
                style={{ width: COL.trash }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1.5 3.5h10M4.5 1.5h4M3 3.5l.65 7.5h5.7L10 3.5" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Note popup — opens below the card */}
            {noteOpenId === task.id && (
              <div
                className="absolute z-50 bg-white border border-stone-200 rounded-xl shadow-lg p-3 flex flex-col gap-2"
                style={{ top: CARD_H + 6, left: COL.num + COL.check + COL.title - 4, width: 240 }}>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Note</p>
                <textarea
                  autoFocus
                  value={task.note}
                  onChange={e => updateNote(task.id, e.target.value)}
                  placeholder="Write a note..."
                  rows={3}
                  className="w-full text-xs text-stone-700 border border-stone-200 rounded-lg p-2 outline-none resize-none focus:border-indigo-300 placeholder-stone-300"
                />
                <button
                  onClick={() => setNoteOpenId(null)}
                  className="text-[11px] font-bold text-white bg-stone-800 rounded-lg px-3 py-1.5 hover:bg-stone-700 w-full">
                  Done
                </button>
              </div>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
