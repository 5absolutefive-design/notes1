export function TreeLines() {
  const data = [
    { id: 1, label: "ABC", children: ["AAA", "BBB", "CCC"] },
    { id: 2, label: "DEF", children: ["AAA"] },
    { id: 3, label: "IJKLM", children: [] },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-start justify-center pt-10">
      <div className="w-64 bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#dbeafe] px-4 py-3">
          <span className="text-base font-bold text-[#1e3a5f]">Project</span>
        </div>

        {/* Tree */}
        <div className="px-3 py-3 flex flex-col gap-0">
          {data.map((project, pi) => (
            <div key={project.id} className="relative">
              {/* Vertical line from header down */}
              <div className="flex items-center gap-0 relative">
                {/* Left gutter with vertical line */}
                <div className="relative flex flex-col items-center w-5 self-stretch">
                  {/* vertical line */}
                  <div
                    className="absolute left-2 top-0 bottom-0 w-px bg-gray-300"
                    style={{
                      top: pi === 0 ? "50%" : "0",
                      bottom: pi === data.length - 1 && project.children.length === 0 ? "50%" : "0",
                    }}
                  />
                  {/* horizontal tick */}
                  <div className="absolute left-2 top-1/2 w-3 h-px bg-gray-300" />
                </div>
                <div className="flex-1 bg-[#dcfce7] rounded-xl px-3 py-2 my-1 cursor-pointer hover:bg-[#bbf7d0] transition-colors">
                  <span className="text-sm font-semibold text-[#166534]">{project.label}</span>
                </div>
              </div>

              {/* Children */}
              {project.children.map((child, ci) => (
                <div key={child + ci} className="flex items-center gap-0 relative pl-5">
                  {/* vertical line for children group */}
                  <div className="relative flex flex-col items-center w-5 self-stretch">
                    <div
                      className="absolute left-2 top-0 bottom-0 w-px bg-gray-300"
                      style={{
                        top: 0,
                        bottom: ci === project.children.length - 1 ? "50%" : "0",
                      }}
                    />
                    <div className="absolute left-2 top-1/2 w-3 h-px bg-gray-300" />
                  </div>
                  <div className="flex-1 bg-[#fee2e2] rounded-xl px-3 py-1.5 my-0.5 cursor-pointer hover:bg-[#fecaca] transition-colors">
                    <span className="text-xs font-medium text-[#991b1b]">{child}</span>
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
