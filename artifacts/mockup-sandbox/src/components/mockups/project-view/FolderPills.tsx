import { useState } from "react";
import { Folder, FileText, Plus } from "lucide-react";

type Project = {
  id: string;
  title: string;
  count?: number;
  children?: { id: string; title: string }[];
};

const PROJECTS: Project[] = [
  {
    id: "abc", title: "ABC", count: 3,
    children: [
      { id: "aaa1", title: "AAA" },
      { id: "bbb", title: "BBB" },
      { id: "ccc", title: "CCC" },
    ],
  },
  {
    id: "def", title: "DEF", count: 1,
    children: [
      { id: "aaa2", title: "AAA" },
    ],
  },
  {
    id: "ijklm", title: "IJKLM",
    children: [],
  },
];

export function FolderPills() {
  const [expanded, setExpanded] = useState<string[]>(["abc", "def"]);
  const [active, setActive] = useState("ijklm");

  const toggle = (id: string) =>
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="min-h-screen bg-slate-900 flex items-start justify-center pt-10">
      <div className="w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="bg-slate-800 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
            <Folder className="w-4 h-4 text-slate-300" />
            Project
          </div>
          <button className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List */}
        <div className="bg-slate-900 p-2 flex flex-col gap-1">
          {PROJECTS.map((project) => {
            const isOpen = expanded.includes(project.id);
            const hasChildren = (project.children?.length ?? 0) > 0;
            const isActive = active === project.id;

            return (
              <div key={project.id}>
                <div
                  onClick={() => { setActive(project.id); hasChildren && toggle(project.id); }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? "bg-teal-900/60 border border-teal-500/30"
                      : "hover:bg-slate-800 border border-transparent"
                  }`}
                >
                  {hasChildren ? (
                    <span
                      className={`text-slate-400 text-[9px] transition-transform duration-200 ${
                        isOpen ? "" : "-rotate-90"
                      }`}
                    >
                      ▼
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full border border-slate-500 flex-shrink-0" />
                  )}
                  <Folder
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? "text-teal-400" : "text-slate-500"
                    }`}
                  />
                  <span
                    className={`flex-1 text-sm font-medium truncate ${
                      isActive ? "text-teal-300" : "text-slate-300"
                    }`}
                  >
                    {project.title}
                  </span>
                  {project.count != null && project.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                        isActive
                          ? "bg-teal-500/30 text-teal-300"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {project.count}
                    </span>
                  )}
                </div>

                {/* Children */}
                {isOpen && project.children && project.children.length > 0 && (
                  <div className="ml-4 pl-2 border-l border-slate-700/50 mt-0.5 flex flex-col gap-0.5 mb-1">
                    {project.children.map((child) => {
                      const childActive = active === child.id;
                      return (
                        <div
                          key={child.id}
                          onClick={(e) => { e.stopPropagation(); setActive(child.id); }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                            childActive
                              ? "bg-teal-900/40 text-teal-300"
                              : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                          }`}
                        >
                          <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${childActive ? "text-teal-400" : "text-slate-600"}`} />
                          <span className="text-xs font-medium">{child.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
