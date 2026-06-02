export function TreeLines() {
  const projects = [
    {
      id: "abc", title: "ABC", color: "#bbf7d0", textColor: "#166534",
      children: [
        { id: "aaa1", title: "AAA", color: "#fecaca", textColor: "#991b1b" },
        { id: "bbb", title: "BBB", color: "#fecaca", textColor: "#991b1b" },
        { id: "ccc", title: "CCC", color: "#fecaca", textColor: "#991b1b" },
      ],
    },
    {
      id: "def", title: "DEF", color: "#bbf7d0", textColor: "#166534",
      children: [
        { id: "aaa2", title: "AAA", color: "#fecaca", textColor: "#991b1b" },
      ],
    },
    {
      id: "ijklm", title: "IJKLM", color: "#bbf7d0", textColor: "#166534",
      children: [],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-10">
      <div className="bg-white rounded-2xl shadow-lg w-72 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <span className="text-blue-700 font-bold text-base tracking-wide">Project</span>
        </div>

        {/* Tree */}
        <div className="p-3 flex flex-col gap-1">
          {projects.map((project, pi) => (
            <div key={project.id}>
              {/* Parent row */}
              <div className="flex items-center gap-0">
                {/* Tree line segment */}
                <div className="flex flex-col items-center w-5 self-stretch">
                  <div className={`w-px flex-1 ${pi === 0 ? "bg-transparent" : "bg-green-400"}`} />
                  <div className="w-2.5 h-px bg-green-400" />
                  <div className={`w-px flex-1 ${pi === projects.length - 1 && project.children.length === 0 ? "bg-transparent" : "bg-green-400"}`} />
                </div>
                <div
                  className="flex-1 rounded-md px-3 py-1.5 text-sm font-semibold"
                  style={{ backgroundColor: project.color, color: project.textColor }}
                >
                  {project.title}
                </div>
              </div>

              {/* Children */}
              {project.children.map((child, ci) => (
                <div key={child.id} className="flex items-center gap-0 mt-1">
                  <div className="flex flex-col items-center w-5 self-stretch">
                    <div className="w-px flex-1 bg-green-400" />
                    <div className="w-2.5 h-px bg-red-300" />
                    <div className={`w-px flex-1 ${ci === project.children.length - 1 ? "bg-transparent" : "bg-green-400"}`} />
                  </div>
                  {/* indent */}
                  <div className="w-3 flex flex-col items-center self-stretch">
                    <div className="w-px flex-1 bg-transparent" />
                    <div className="w-2 h-px bg-red-300" />
                    <div className="w-px flex-1 bg-transparent" />
                  </div>
                  <div
                    className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium"
                    style={{ backgroundColor: child.color, color: child.textColor }}
                  >
                    {child.title}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
