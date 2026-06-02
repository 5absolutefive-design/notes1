import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, FolderKanban } from "lucide-react";

const data = [
  { id: 1, label: "ABC", children: ["AAA", "BBB", "CCC"] },
  { id: 2, label: "DEF", children: ["AAA"] },
  { id: 3, label: "IJKLM", children: [] },
];

export function MinimalClean() {
  const [expanded, setExpanded] = useState<number[]>([1, 2]);
  const [active, setActive] = useState<string>("ABC");

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-start justify-center pt-10">
      <div className="w-64 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Nav header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-stone-700">Project</span>
          </div>
          <button className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List */}
        <div className="px-2 py-2 flex flex-col gap-0.5">
          {data.map((p) => {
            const isExpanded = expanded.includes(p.id);
            const isActive = active === p.label;
            return (
              <div key={p.id}>
                {/* Parent row */}
                <div
                  className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
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
                    className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                  >
                    {p.children.length > 0 ? (
                      isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-stone-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-stone-400" />
                      )
                    ) : (
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-indigo-400" : "bg-stone-300"}`} />
                    )}
                  </button>
                  <span className={`text-xs font-medium flex-1 truncate ${isActive ? "font-semibold" : ""}`}>
                    {p.label}
                  </span>
                  <Plus className="w-3 h-3 opacity-0 group-hover:opacity-60 flex-shrink-0 text-stone-400" />
                </div>

                {/* Children */}
                {isExpanded &&
                  p.children.map((child) => (
                    <div
                      key={child}
                      onClick={() => setActive(child)}
                      className={`flex items-center gap-1.5 rounded-lg pl-8 pr-2 py-1.5 cursor-pointer transition-all ${
                        active === child
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                      }`}
                    >
                      <div
                        className={`w-1 h-1 rounded-full flex-shrink-0 ${
                          active === child ? "bg-indigo-400" : "bg-stone-300"
                        }`}
                      />
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
