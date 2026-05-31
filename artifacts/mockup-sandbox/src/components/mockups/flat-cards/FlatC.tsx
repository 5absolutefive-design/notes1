import { useState } from "react";

export function FlatC() {
  const pmeta: Record<string, { label: string; color: string; dot: string; rowBg: string; bar: string }> = {
    low:       { label: "Low",       color: "#16a34a", dot: "#22c55e", rowBg: "#f0fdf4", bar: "#22c55e" },
    normal:    { label: "Normal",    color: "#6b7280", dot: "#9ca3af", rowBg: "#f9fafb", bar: "#9ca3af" },
    medium:    { label: "Medium",    color: "#2563eb", dot: "#3b82f6", rowBg: "#eff6ff", bar: "#3b82f6" },
    important: { label: "Important", color: "#ea580c", dot: "#f97316", rowBg: "#fff7ed", bar: "#f97316" },
    urgent:    { label: "Urgent",    color: "#dc2626", dot: "#ef4444", rowBg: "#fef2f2", bar: "#ef4444" },
  };

  type Priority = keyof typeof pmeta;

  const [tasks, setTasks] = useState([
    { id: 1, title: "Design new landing page",    time: "10:00 AM", ampm: "AM" as "AM"|"PM", hour: "10", minute: "00", hasTime: true,  priority: "urgent"  as Priority|null, progress: 75,  done: false, note: "" },
    { id: 2, title: "Review pull request from team", time: "04:50 PM", ampm: "PM" as "AM"|"PM", hour: "04", minute: "50", hasTime: true,  priority: null,                       progress: 0,   done: true,  note: "" },
    { id: 3, title: "Update documentation files", time: "",           ampm: "AM" as "AM"|"PM", hour: "12", minute: "00", hasTime: false, priority: "low"     as Priority|null, progress: 100, done: true,  note: "Already pushed to main branch." },
    { id: 4, title: "Setup CI/CD pipeline",       time: "02:00 PM", ampm: "PM" as "AM"|"PM", hour: "02", minute: "00", hasTime: true,  priority: "medium"  as Priority|null, progress: 30,  done: false, note: "" },
  ]);

  /* ── popup state ── */
  const [noteOpenId,     setNoteOpenId]     = useState<number | null>(null);
  const [timeOpenId,     setTimeOpenId]     = useState<number | null>(null);
  const [priorityOpenId, setPriorityOpenId] = useState<number | null>(null);
  const [progressOpenId, setProgressOpenId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  /* temp time edit */
  const [tempHour,   setTempHour]   = useState("12");
  const [tempMinute, setTempMinute] = useState("00");
  const [tempAmpm,   setTempAmpm]   = useState<"AM"|"PM">("AM");

  const closeAll = () => { setNoteOpenId(null); setTimeOpenId(null); setPriorityOpenId(null); setProgressOpenId(null); setDeleteConfirmId(null); setEditingId(null); };

  const updateTitle = (id: number, title: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t));

  const toggleDone = (id: number) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const updateNote = (id: number, note: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, note } : t));

  const setPriority = (id: number, priority: Priority | null) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, priority } : t));

  const setProgress = (id: number, progress: number) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, progress } : t));

  const confirmTime = (id: number) => {
    const display = `${tempHour}:${tempMinute} ${tempAmpm}`;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, time: display, hour: tempHour, minute: tempMinute, ampm: tempAmpm, hasTime: true } : t));
    setTimeOpenId(null);
  };
  const clearTime = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, time: "", hasTime: false } : t));
    setTimeOpenId(null);
  };

  /* ── Fixed column widths (px) ── */
  const COL = { num: 40, check: 44, title: 384, note: 64, time: 98, priority: 88, progress: 90, trash: 44 };
  const CARD_W = Object.values(COL).reduce((a, b) => a + b, 0);
  const CARD_H = 48;

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-10" onClick={closeAll}>
      <div className="flex flex-col gap-2.5" style={{ width: CARD_W }}>
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1">
          Flat C — Floating Cards · Fixed Size
        </p>

        {tasks.map((task, idx) => {
          const pm = task.priority ? pmeta[task.priority] : null;

          return (
            <div key={task.id} className="relative">
              {/* ── Card ── */}
              <div
                className="flex items-center flex-shrink-0 overflow-hidden border border-stone-200 rounded-md"
                style={{
                  width: CARD_W, height: CARD_H,
                  backgroundColor: pm ? pm.rowBg : "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
                  opacity: task.done ? 0.2 : 1,
                }}>

                {/* accent bar */}
                <div className="self-stretch flex-shrink-0" style={{ width: 3, backgroundColor: pm ? pm.bar : "#e5e7eb" }} />

                {/* T-number */}
                <div className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch" style={{ width: COL.num - 3 }}>
                  <span className="text-[11px] font-semibold text-stone-400">T{idx + 1}</span>
                </div>

                {/* Checkbox */}
                <div className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer" style={{ width: COL.check }} onClick={e => { e.stopPropagation(); toggleDone(task.id); }}>
                  <div className="w-[17px] h-[17px] border flex items-center justify-center"
                    style={task.done ? { borderColor: "#1c1917", backgroundColor: "#1c1917" } : { borderColor: "#a8a29e", backgroundColor: "transparent" }}>
                    {task.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </div>

                {/* Title */}
                <div className="flex items-center flex-shrink-0 border-r border-stone-200 self-stretch px-3" style={{ width: COL.title }}
                  onClick={e => { e.stopPropagation(); closeAll(); setEditingId(task.id); }}>
                  {editingId === task.id ? (
                    <input
                      autoFocus
                      value={task.title}
                      onChange={e => updateTitle(task.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingId(null); }}
                      onClick={e => e.stopPropagation()}
                      className="text-sm w-full text-stone-700 bg-transparent outline-none border-none"
                      style={{ fontFamily: "inherit" }}
                    />
                  ) : (
                    <span className={`text-sm w-full truncate ${task.done ? "line-through text-stone-400" : "text-stone-700"}`} style={{ display: "block" }}>
                      {task.title}
                    </span>
                  )}
                </div>

                {/* Note */}
                <div className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none" style={{ width: COL.note }}
                  onClick={e => { e.stopPropagation(); closeAll(); setNoteOpenId(noteOpenId === task.id ? null : task.id); }}>
                  <span className={`text-[11px] font-medium ${task.note ? "text-indigo-500" : "text-stone-400"}`}>
                    Note{task.note && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block align-middle" />}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none" style={{ width: COL.time }}
                  onClick={e => { e.stopPropagation(); closeAll(); if (timeOpenId !== task.id) { setTempHour(task.hour); setTempMinute(task.minute); setTempAmpm(task.ampm); setTimeOpenId(task.id); } }}>
                  <span className={`text-[11px] tabular-nums ${!task.hasTime ? "text-stone-300" : "text-stone-600"}`}>
                    {task.hasTime ? task.time : "--:-- --"}
                  </span>
                </div>

                {/* Priority */}
                <div className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none" style={{ width: COL.priority }}
                  onClick={e => { e.stopPropagation(); closeAll(); setPriorityOpenId(priorityOpenId === task.id ? null : task.id); }}>
                  <span className="text-[11px] font-semibold" style={pm ? { color: pm.color } : { color: "#c8c4bf" }}>
                    {pm ? pm.label : "N/A"}
                  </span>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none px-3" style={{ width: COL.progress }}
                  onClick={e => { e.stopPropagation(); closeAll(); setProgressOpenId(progressOpenId === task.id ? null : task.id); }}>
                  {task.progress > 0 ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <div className="flex-1 h-[3px] bg-stone-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${task.progress}%`, backgroundColor: task.progress >= 50 ? "#22c55e" : "#ef4444" }} />
                      </div>
                      <span className="text-[10px] text-stone-500 tabular-nums flex-shrink-0">{task.progress}%</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-stone-300">Progress %</span>
                  )}
                </div>

                {/* Trash */}
                <div className="flex items-center justify-center flex-shrink-0 self-stretch cursor-pointer" style={{ width: COL.trash }}
                  onClick={e => { e.stopPropagation(); closeAll(); setDeleteConfirmId(task.id); }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 3.5h10M4.5 1.5h4M3 3.5l.65 7.5h5.7L10 3.5" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* ── Delete confirmation overlay ── */}
              {deleteConfirmId === task.id && (
                <div
                  className="absolute inset-0 z-50 flex items-center justify-center gap-3 rounded-md border border-red-200"
                  style={{ backgroundColor: "rgba(255,241,241,0.97)", backdropFilter: "blur(2px)" }}
                  onClick={e => e.stopPropagation()}>
                  <span className="text-[12px] font-semibold text-red-600">Delete this task?</span>
                  <button
                    onClick={() => { setTasks(prev => prev.filter(t => t.id !== task.id)); setDeleteConfirmId(null); }}
                    className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1 transition-colors">
                    Yes
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-[11px] font-medium text-stone-500 border border-stone-200 hover:border-stone-400 bg-white rounded-lg px-3 py-1 transition-colors">
                    No
                  </button>
                </div>
              )}

              {/* ── Note popup ── */}
              {noteOpenId === task.id && (
                <div className="absolute z-50 bg-white border border-stone-200 rounded-xl shadow-lg p-3 flex flex-col gap-2"
                  style={{ top: CARD_H + 6, left: COL.num + COL.check + COL.title - 4, width: 240 }}
                  onClick={e => e.stopPropagation()}>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Note</p>
                  <textarea autoFocus value={task.note} onChange={e => updateNote(task.id, e.target.value)} placeholder="Write a note..." rows={3}
                    className="w-full text-xs text-stone-700 border border-stone-200 rounded-lg p-2 outline-none resize-none focus:border-indigo-300 placeholder-stone-300" />
                  <button onClick={() => setNoteOpenId(null)} className="text-[11px] font-bold text-white bg-stone-800 rounded-lg px-3 py-1.5 hover:bg-stone-700 w-full">Done</button>
                </div>
              )}

              {/* ── Time popup ── */}
              {timeOpenId === task.id && (
                <div className="absolute z-50 bg-white border border-stone-200 rounded-xl shadow-lg p-3 flex flex-col gap-2.5"
                  style={{ top: CARD_H + 6, left: COL.num + COL.check + COL.title + COL.note - 4, width: 220 }}
                  onClick={e => e.stopPropagation()}>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Time</p>
                  <div className="flex items-center gap-2">
                    <select value={tempHour} onChange={e => setTempHour(e.target.value)} className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1.5 outline-none bg-white text-stone-700">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <span className="text-stone-400 font-bold">:</span>
                    <select value={tempMinute} onChange={e => setTempMinute(e.target.value)} className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1.5 outline-none bg-white text-stone-700">
                      {["00","05","10","15","20","25","30","35","40","45","50","55"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select value={tempAmpm} onChange={e => setTempAmpm(e.target.value as "AM"|"PM")} className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 outline-none bg-white text-stone-700">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => confirmTime(task.id)} className="flex-1 text-[11px] font-bold text-white bg-stone-800 rounded-lg py-1.5 hover:bg-stone-700">Set</button>
                    {task.hasTime && <button onClick={() => clearTime(task.id)} className="text-[11px] text-stone-400 border border-stone-200 rounded-lg px-3 py-1.5 hover:text-stone-600">Clear</button>}
                  </div>
                </div>
              )}

              {/* ── Priority popup ── */}
              {priorityOpenId === task.id && (
                <div className="absolute z-50 bg-white border border-stone-200 rounded-xl shadow-lg py-2"
                  style={{ top: CARD_H + 6, left: COL.num + COL.check + COL.title + COL.note + COL.time - 4, width: 160 }}
                  onClick={e => e.stopPropagation()}>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-3 pb-1.5">Priority</p>
                  {(Object.keys(pmeta) as Priority[]).map(p => (
                    <button key={p} onClick={() => { setPriority(task.id, p); setPriorityOpenId(null); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 text-left ${task.priority === p ? "bg-stone-50" : ""}`}>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pmeta[p].dot }} />
                      <span className="text-[12px] font-medium text-stone-700">{pmeta[p].label}</span>
                    </button>
                  ))}
                  {task.priority && (
                    <button onClick={() => { setPriority(task.id, null); setPriorityOpenId(null); }}
                      className="w-full text-left text-[11px] text-stone-400 px-3 py-1.5 hover:bg-stone-50 border-t border-stone-100 mt-1">
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* ── Progress popup ── */}
              {progressOpenId === task.id && (
                <div className="absolute z-50 bg-white border border-stone-200 rounded-xl shadow-lg py-2"
                  style={{ top: CARD_H + 6, left: COL.num + COL.check + COL.title + COL.note + COL.time + COL.priority - 4, width: 110 }}
                  onClick={e => e.stopPropagation()}>
                  {[0, 10, 25, 50, 75, 90, 100].map(p => (
                    <button key={p} onClick={() => { setProgress(task.id, p); setProgressOpenId(null); }}
                      className={`w-full text-left px-4 py-1.5 hover:bg-stone-50 text-[12px] ${task.progress === p ? "font-bold text-stone-800" : "text-stone-600"}`}>
                      {p}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
