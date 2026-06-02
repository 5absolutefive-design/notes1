import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Folder, FileText } from "lucide-react";

const COLORS = ["#6366f1", "#0ea5e9", "#10b981"];
const data = [
  { id: 1, label: "ABC", color: COLORS[0], children: ["AAA", "BBB", "CCC"] },
  { id: 2, label: "DEF", color: COLORS[1], children: ["AAA"] },
  { id: 3, label: "IJKLM", color: COLORS[2], children: [] },
];

export function FolderPills() {
  const [expanded, setExpanded] = useState<number[]>([1, 2]);
  const [active, setActive] = useState<string>("ABC");

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-start justify-center pt-10">
      <div className="w-64 bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-bold text-white tracking-wide">Project</span>
          </div>
          <button className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List */}
        <div className="px-2 py-2 flex flex-col gap-1">
          {data.map((p) => {
            const isExpanded = expanded.includes(p.id);
            const isActive = active === p.label;
            return (
              <div key={p.id}>
                {/* Parent pill */}
                <div
                  className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-pointer transition-all border ${
                    isActive
                      ? "border-transparent shadow-sm"
                      : "border-transparent hover:border-slate-100 hover:bg-slate-50"
                  }`}
                  style={isActive ? { backgroundColor: p.color + "15", borderColor: p.color + "40" } : {}}
                  onClick={() => setActive(p.label)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (p.children.length > 0)
                        setExpanded((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                        );
                    }}
                    className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-slate-400"
                  >
                    {p.children.length > 0 ? (
                      isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )
                    ) : null}
                  </button>
                  {/* Color dot + folder icon */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: p.color + "20" }}
                  >
                    <Folder className="w-3.5 h-3.5" style={{ color: p.color }} />
                  </div>
                  <span
                    className="text-xs font-semibold flex-1 truncate"
                    style={{ color: isActive ? p.color : "#374151" }}
                  >
                    {p.label}
                  </span>
                  {p.children.length > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color + "20", color: p.color }}
                    >
                      {p.children.length}
                    </span>
                  )}
                </div>

                {/* Children */}
                {isExpanded &&
                  p.children.map((child) => (
                    <div
                      key={child}
                      onClick={() => setActive(child)}
                      className={`flex items-center gap-2 rounded-lg ml-4 pl-3 pr-2 py-1.5 cursor-pointer transition-all ${
                        active === child ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      }`}
                    >
                      <div className="w-px h-4 bg-slate-200 flex-shrink-0" />
                      <FileText className="w-3 h-3 flex-shrink-0 text-slate-300" />
                      <span className="text-xs truncate">{child}</span>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
