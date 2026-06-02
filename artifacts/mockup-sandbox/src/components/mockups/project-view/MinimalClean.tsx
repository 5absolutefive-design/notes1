import { useState } from "react";
import { FolderOpen, Plus } from "lucide-react";

type Project = {
  id: string;
  title: string;
  children?: { id: string; title: string }[];
};

const PROJECTS: Project[] = [
  {
    id: "abc", title: "ABC",
    children: [
      { id: "aaa1", title: "AAA" },
      { id: "bbb", title: "BBB" },
      { id: "ccc", title: "CCC" },
    ],
  },
  {
    id: "def", title: "DEF",
    children: [
      { id: "aaa2", title: "AAA" },
    ],
  },
  {
    id: "ijklm", title: "IJKLM",
    children: [],
  },
];

export function MinimalClean() {
  const [expanded, setExpanded] = useState<string[]>(["abc", "def"]);
  const [active, setActive] = useState("aaa1");

  const toggle = (id: string) =>
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-10">
      <div className="bg-white rounded-2xl shadow-md w-72 overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
            <FolderOpen className="w-4 h-4 text-gray-400" />
            Project
          </div>
          <button className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List */}
        <div className="p-2">
          {PROJECTS.map((project) => {
            const isOpen = expanded.includes(project.id);
            const hasChildren = (project.children?.length ?? 0) > 0;

            return (
              <div key={project.id}>
                <div
                  onClick={() => hasChildren && toggle(project.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                    active === project.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {hasChildren ? (
                    <span
                      className={`text-gray-400 text-[10px] w-3 inline-block transition-transform duration-200 ${
                        isOpen ? "" : "-rotate-90"
                      }`}
                    >
                      ▼
                    </span>
                  ) : (
                    <span className="w-3 inline-block">
                      <span className="block w-1 h-1 rounded-full bg-gray-300 mx-auto" />
                    </span>
                  )}
                  <span
                    onClick={(e) => { e.stopPropagation(); setActive(project.id); }}
                    className="flex-1"
                  >
                    {project.title}
                  </span>
                  {hasChildren && (
                    <button className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-gray-300 hover:text-indigo-400">
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Children */}
                {isOpen && project.children && project.children.length > 0 && (
                  <div className="ml-4 border-l border-gray-100 pl-2 mb-0.5">
                    {project.children.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => setActive(child.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          active === child.id
                            ? "bg-indigo-50 text-indigo-600 font-medium"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        {child.title}
                      </div>
                    ))}
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
