import { useState, useRef, useEffect } from "react";
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

function AnimatedChildren({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(open ? "auto" : "0px");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open) {
      const scrollH = el.scrollHeight;
      setHeight(`${scrollH}px`);
      setIsAnimating(true);
      const t = setTimeout(() => { setHeight("auto"); setIsAnimating(false); }, 250);
      return () => clearTimeout(t);
    } else {
      const scrollH = el.scrollHeight;
      setHeight(`${scrollH}px`);
      setIsAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight("0px");
        });
      });
      const t = setTimeout(() => setIsAnimating(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        height,
        overflow: "hidden",
        transition: "height 220ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

export function MinimalClean() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ abc: true, def: true });
  const [active, setActive] = useState("aaa1");

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

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
            const hasChildren = (project.children?.length ?? 0) > 0;
            const isOpen = !!expanded[project.id];

            return (
              <div key={project.id}>
                {/* Parent row */}
                <div
                  onClick={() => {
                    setActive(project.id);
                    if (hasChildren) toggle(project.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                    active === project.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {hasChildren ? (
                    <span
                      style={{ transition: "transform 200ms cubic-bezier(0.4,0,0.2,1)" }}
                      className={`text-gray-400 text-[10px] w-3 inline-block ${isOpen ? "" : "-rotate-90"}`}
                    >
                      ▼
                    </span>
                  ) : (
                    <span className="w-3 inline-block">
                      <span className="block w-1 h-1 rounded-full bg-gray-300 mx-auto" />
                    </span>
                  )}
                  <span className="flex-1">{project.title}</span>
                </div>

                {/* Children — animated */}
                {hasChildren && (
                  <AnimatedChildren open={isOpen}>
                    <div className="ml-4 border-l-2 border-indigo-200 pl-2 mb-0.5">
                      {project.children!.map((child) => (
                        <div
                          key={child.id}
                          onClick={(e) => { e.stopPropagation(); setActive(child.id); }}
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
                  </AnimatedChildren>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
