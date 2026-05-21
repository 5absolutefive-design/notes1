import { useParams, useLocation, Redirect } from "wouter";
import { ChevronLeft, ChevronRight, Trash2, ArchiveRestore, X, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { store, type Book, type Page } from "@/lib/store";

const FONTS = [
  "Inter", "Roboto", "Lato", "Poppins", "Nunito",
  "Merriweather", "Playfair Display", "EB Garamond",
  "Source Code Pro", "Courier Prime",
];

export default function PageEditor() {
  const { bookId, pageId } = useParams();
  const [, setLocation] = useLocation();
  const bId = parseInt(bookId || "0", 10);
  const pId = parseInt(pageId || "0", 10);

  const [book, setBook] = useState<Book | null>(() => store.getBook(bId) ?? null);
  const [pages, setPages] = useState<Page[]>(() => store.listPages(bId));
  const [page, setPage] = useState<Page | null>(() => store.getPage(bId, pId) ?? null);
  const [trashedPages, setTrashedPages] = useState<Page[]>([]);
  const [content, setContent] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  const [font, setFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [activeFormats, setActiveFormats] = useState({ bold: false, underline: false, strikeThrough: false, overline: false });
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [fontColor, setFontColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [highlightColor, setHighlightColor] = useState("#FFFF00");
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [recentHighlights, setRecentHighlights] = useState<string[]>([]);

  const initializedForId = useRef<number | null>(null);
  const lastSavedContent = useRef("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const refresh = useCallback(() => {
    setBook(store.getBook(bId) ?? null);
    setPages(store.listPages(bId));
    const p = store.getPage(bId, pId);
    setPage(p ?? null);
  }, [bId, pId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (page && initializedForId.current !== pId) {
      initializedForId.current = pId;
      const c = page.content;
      setContent(c);
      setPageTitle(page.title);
      lastSavedContent.current = c;
      if (editorRef.current) {
        editorRef.current.innerHTML = c;
      }
    }
  }, [page, pId]);

  useEffect(() => {
    if (showTrash) setTrashedPages(store.listTrashedPages(bId));
  }, [showTrash, bId]);

  // Close font menu and color picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setShowFontMenu(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target as Node)) {
        setShowHighlightPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const savePage = useCallback(
    (html: string, title?: string) => {
      const resolvedTitle = title ?? pageTitle;
      setSaveStatus("saving");
      store.updatePage(bId, pId, { content: html, title: resolvedTitle });
      setSaveStatus("saved");
      lastSavedContent.current = html;
    },
    [bId, pId, pageTitle]
  );

  const handleEditorInput = () => {
    const html = editorRef.current?.innerHTML ?? "";
    setContent(html);
  };

  useEffect(() => {
    if (initializedForId.current !== pId) return;
    const timer = setTimeout(() => {
      if (content !== lastSavedContent.current) {
        savePage(content);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [content, pId, savePage]);

  const hasSelection = () => {
    const sel = window.getSelection();
    return sel && sel.toString().length > 0;
  };

  const updateActiveFormats = () => {
    const selected = hasSelection();
    setActiveFormats({
      bold: selected ? document.queryCommandState("bold") : false,
      underline: selected ? document.queryCommandState("underline") : false,
      strikeThrough: selected ? document.queryCommandState("strikeThrough") : false,
      overline: false,
    });
    const al = document.queryCommandValue("justifyLeft") === "true"
      ? "left"
      : document.queryCommandValue("justifyCenter") === "true"
      ? "center"
      : document.queryCommandValue("justifyRight") === "true"
      ? "right"
      : "left";
    setAlign(al as "left" | "center" | "right");
  };

  const execInlineFormat = (cmd: string) => {
    if (!hasSelection()) return;
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    // Collapse cursor to end of selection, then turn off format so future typing is clean
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // Toggle off at collapsed cursor — only affects future typing, not selected text
    document.execCommand(cmd, false);
    handleEditorInput();
    setActiveFormats({ bold: false, underline: false, strikeThrough: false, overline: false });
  };

  const execFormat = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleEditorInput();
    updateActiveFormats();
  };

  const handleFontChange = (f: string) => {
    setFont(f);
    setShowFontMenu(false);
    execFormat("fontName", f);
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(8, Math.min(72, fontSize + delta));
    setFontSize(newSize);
    editorRef.current?.focus();
    // Use fontSize 1-7 scale: map pixel to execCommand size
    const size = newSize <= 10 ? 1 : newSize <= 13 ? 2 : newSize <= 16 ? 3 : newSize <= 18 ? 4 : newSize <= 24 ? 5 : newSize <= 32 ? 6 : 7;
    document.execCommand("fontSize", false, String(size));
    handleEditorInput();
  };

  const restoreSelection = () => {
    if (!savedRangeRef.current) return false;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    return true;
  };

  const handleFontColor = (color: string, addToRecent = false) => {
    setFontColor(color);
    setShowColorPicker(false);
    if (addToRecent) {
      setRecentColors(prev => {
        const filtered = prev.filter(c => c !== color);
        return [color, ...filtered].slice(0, 10);
      });
    }
    editorRef.current?.focus();
    // Restore saved selection if current selection is empty
    if (!hasSelection()) {
      if (!restoreSelection()) return;
    }
    document.execCommand("foreColor", false, color);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    savedRangeRef.current = null;
    handleEditorInput();
  };

  const handleHighlightColor = (color: string, addToRecent = false) => {
    setHighlightColor(color);
    setShowHighlightPicker(false);
    if (addToRecent) {
      setRecentHighlights(prev => {
        const filtered = prev.filter(c => c !== color);
        return [color, ...filtered].slice(0, 10);
      });
    }
    editorRef.current?.focus();
    if (!hasSelection()) {
      if (!restoreSelection()) return;
    }
    document.execCommand("hiliteColor", false, color);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    savedRangeRef.current = null;
    handleEditorInput();
  };

  const handleNeutral = () => {
    editorRef.current?.focus();
    document.execCommand("removeFormat", false);
    document.execCommand("justifyLeft", false);
    setActiveFormats({ bold: false, underline: false, strikeThrough: false, overline: false });
    setAlign("left");
    handleEditorInput();
  };

  const handleCopy = async () => {
    const sel = window.getSelection();
    const selectedText = sel?.toString() || editorRef.current?.innerText || "";
    try {
      await navigator.clipboard.writeText(selectedText);
    } catch {
      document.execCommand("copy");
    }
  };

  const handlePaste = async () => {
    editorRef.current?.focus();
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand("insertText", false, text);
      handleEditorInput();
    } catch {
      document.execCommand("paste");
    }
  };

  const handleUndo = () => {
    editorRef.current?.focus();
    document.execCommand("undo");
    handleEditorInput();
    updateActiveFormats();
  };

  const handleRedo = () => {
    editorRef.current?.focus();
    document.execCommand("redo");
    handleEditorInput();
    updateActiveFormats();
  };

  const handleDelete = () => {
    store.deletePage(bId, pId);
    refresh();
    setLocation(`/books/${bId}`);
  };

  const handleCreatePage = () => {
    const newPage = store.createPage(bId, { title: `PAGE ${pages.length + 1}`, content: "" });
    refresh();
    setLocation(`/books/${bId}/pages/${newPage.id}`);
  };

  const handleRestore = (pid: number) => {
    store.restorePage(bId, pid);
    setTrashedPages(store.listTrashedPages(bId));
    refresh();
  };

  const handlePermanentDelete = (pid: number) => {
    if (confirm("Permanently delete this page? This cannot be undone.")) {
      store.permanentDeletePage(bId, pid);
      setTrashedPages(store.listTrashedPages(bId));
    }
  };

  const scrollTabs = (dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
    }
  };

  const currentIndex = pages.findIndex((p) => p.id === pId);
  const prevPage = pages[currentIndex - 1];
  const nextPage = pages[currentIndex + 1];

  if (!page) return <Redirect to="/" />;

  const btnBase = "rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center";
  const btnSq = `w-8 h-8 ${btnBase}`;
  const btnActive = "bg-zinc-200 border-zinc-500";

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* EDIT card */}
      <div className="bg-[#ece9e3] px-4 pt-3 pb-2 shrink-0">
        <div className="bg-[#f5f2ee] border border-zinc-300 rounded-xl px-3 py-3 shadow-sm flex items-start justify-between">
          <div className="inline-flex items-start gap-2">

            {/* Group 1 — Copy, Paste, Undo, Redo */}
            <div className="border border-zinc-400 rounded-lg p-1.5">
              <div className="grid grid-cols-2 gap-1">
                <button onClick={handleCopy} title="Copy" className={`${btnSq} text-base`}>🗐</button>
                <button onClick={handlePaste} title="Paste" className={`${btnSq} text-base`}>📑</button>
                <button onClick={handleUndo} title="Undo" className={`${btnSq} text-base`}>↩</button>
                <button onClick={handleRedo} title="Redo" className={`${btnSq} text-base`}>↪</button>
              </div>
            </div>

            {/* Group 2 — Font, Size, Bold, Underline, Strikethrough */}
            <div className="border border-zinc-400 rounded-lg p-1.5">
              <div className="flex flex-col gap-1">
                {/* Row 1: font picker, font size, big A, small A */}
                <div className="flex items-center gap-1">
                  {/* Font picker */}
                  <div className="relative" ref={fontMenuRef}>
                    <button
                      onClick={() => setShowFontMenu(v => !v)}
                      className="w-36 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors px-2 text-left text-sm font-medium text-zinc-700 truncate"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                    {showFontMenu && (
                      <div className="absolute top-9 left-0 z-50 bg-white border border-zinc-300 rounded-lg shadow-lg overflow-y-auto max-h-52 w-44">
                        {FONTS.map(f => (
                          <button
                            key={f}
                            onClick={() => handleFontChange(f)}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 transition-colors ${font === f ? "bg-zinc-100 font-semibold" : ""}`}
                            style={{ fontFamily: f }}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Font size display */}
                  <div className="w-8 h-8 rounded-md border border-zinc-300 bg-white flex items-center justify-center text-xs font-semibold text-zinc-700 select-none">
                    {fontSize}
                  </div>
                  {/* Big A — increase size */}
                  <button onClick={() => handleFontSizeChange(2)} title="Increase font size" className={btnSq}>
                    <span className="font-bold text-base leading-none">A</span>
                  </button>
                  {/* Small A — decrease size */}
                  <button onClick={() => handleFontSizeChange(-2)} title="Decrease font size" className={btnSq}>
                    <span className="font-bold text-xs leading-none">A</span>
                  </button>
                </div>
                {/* Row 2: font color picker, 2 empty placeholders, Bold, Underline, Strikethrough, Overline */}
                <div className="flex items-center gap-1">
                  {/* Font Color Picker */}
                  <div className="relative" ref={colorPickerRef}>
                    <button
                      onClick={() => setShowColorPicker(v => !v)}
                      title="Font color"
                      className={btnSq}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold text-sm leading-none" style={{ color: fontColor }}>A</span>
                        <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: fontColor }} />
                      </div>
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-9 left-0 z-50 bg-white border border-zinc-300 rounded-lg shadow-xl p-3 w-[220px]">
                        {/* Automatic */}
                        <button
                          onClick={() => handleFontColor("#000000")}
                          className="flex items-center gap-2 w-full px-1 py-1 hover:bg-zinc-100 rounded text-xs text-zinc-700 mb-2 border border-zinc-200"
                        >
                          <div className="w-5 h-5 border border-zinc-400 bg-black shrink-0" />
                          <span className="font-medium">Automatic</span>
                        </button>
                        {/* Theme Colors — rows go light→dark (top→bottom), 10 cols × 6 rows */}
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Theme Colors</div>
                        <div className="grid grid-cols-10 gap-[3px] mb-1">
                          {[
                            // Row 0 — lightest (top)
                            ["#FFFFFF","#F2F2F2","#EEECE1","#DCE6F1","#DBE5F1","#E8D5F0","#F2DCDB","#FDE9D9","#EBF1DE","#DAEEF3"],
                            // Row 1
                            ["#F2F2F2","#D9D9D9","#DDD9C4","#C6D9F1","#B8CCE4","#D198E8","#E6B8B7","#FBBF7C","#D8E4BC","#B7DEE8"],
                            // Row 2 — base colors
                            ["#D9D9D9","#BFBFBF","#C4BD97","#8DB4E2","#95B3D7","#8064A2","#DA9694","#F79646","#C4D79B","#92CDDC"],
                            // Row 3
                            ["#BFBFBF","#808080","#948A54","#548DD4","#4F81BD","#7030A0","#C0504D","#E36C09","#9BBB59","#4BACC6"],
                            // Row 4
                            ["#808080","#595959","#494429","#17375E","#366092","#60497A","#963634","#974806","#76933C","#31849B"],
                            // Row 5 — darkest (bottom)
                            ["#595959","#262626","#1D1B10","#0F243E","#243F60","#3F3151","#632523","#6A3400","#4F6228","#215868"],
                          ].map((row, ri) =>
                            row.map((c, ci) => (
                              <button
                                key={`${ri}-${ci}`}
                                onClick={() => handleFontColor(c)}
                                className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))
                          )}
                        </div>
                        {/* Standard Colors */}
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 mt-2">Standard Colors</div>
                        <div className="flex gap-[3px] mb-2">
                          {["#C00000","#FF0000","#FFC000","#FFFF00","#92D050","#00B050","#00B0F0","#0070C0","#002060","#7030A0"].map(c => (
                            <button
                              key={c}
                              onClick={() => handleFontColor(c)}
                              className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                        {/* Recent Colors */}
                        {recentColors.length > 0 && (
                          <>
                            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 mt-2">Recent Colors</div>
                            <div className="flex gap-[3px] mb-2 flex-wrap">
                              {recentColors.map((c, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleFontColor(c)}
                                  className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform"
                                  style={{ backgroundColor: c }}
                                  title={c}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        {/* More Colors */}
                        <button
                          onClick={() => {
                            // Save selection before native picker steals focus
                            const sel = window.getSelection();
                            if (sel && sel.rangeCount > 0) {
                              savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                            }
                            const input = document.createElement("input");
                            input.type = "color";
                            input.value = fontColor;
                            input.onchange = () => handleFontColor(input.value, true);
                            input.click();
                          }}
                          className="w-full text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded px-2 py-1 text-left border border-zinc-200 transition-colors"
                        >
                          🎨 More Colors...
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Highlight Color Picker */}
                  <div className="relative" ref={highlightPickerRef}>
                    <button
                      onClick={() => setShowHighlightPicker(v => !v)}
                      title="Highlight color"
                      className={btnSq}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold text-sm leading-none text-zinc-700">A</span>
                        <div className="w-5 h-1.5 rounded-sm" style={{ backgroundColor: highlightColor }} />
                      </div>
                    </button>
                    {showHighlightPicker && (
                      <div className="absolute top-9 left-0 z-50 bg-white border border-zinc-300 rounded-lg shadow-xl p-3 w-[220px]">
                        {/* No Fill */}
                        <button
                          onClick={() => handleHighlightColor("transparent")}
                          className="flex items-center gap-2 w-full px-1 py-1 hover:bg-zinc-100 rounded text-xs text-zinc-700 mb-2 border border-zinc-200"
                        >
                          <div className="w-5 h-5 border border-zinc-400 bg-white shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center text-red-400 font-bold text-xs">∅</div>
                          </div>
                          <span className="font-medium">No Fill</span>
                        </button>
                        {/* Theme Colors */}
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Theme Colors</div>
                        <div className="grid grid-cols-10 gap-[3px] mb-1">
                          {[
                            ["#FFFFFF","#F2F2F2","#EEECE1","#DCE6F1","#DBE5F1","#E8D5F0","#F2DCDB","#FDE9D9","#EBF1DE","#DAEEF3"],
                            ["#F2F2F2","#D9D9D9","#DDD9C4","#C6D9F1","#B8CCE4","#D198E8","#E6B8B7","#FBBF7C","#D8E4BC","#B7DEE8"],
                            ["#D9D9D9","#BFBFBF","#C4BD97","#8DB4E2","#95B3D7","#8064A2","#DA9694","#F79646","#C4D79B","#92CDDC"],
                            ["#BFBFBF","#808080","#948A54","#548DD4","#4F81BD","#7030A0","#C0504D","#E36C09","#9BBB59","#4BACC6"],
                            ["#808080","#595959","#494429","#17375E","#366092","#60497A","#963634","#974806","#76933C","#31849B"],
                            ["#595959","#262626","#1D1B10","#0F243E","#243F60","#3F3151","#632523","#6A3400","#4F6228","#215868"],
                          ].map((row, ri) =>
                            row.map((c, ci) => (
                              <button
                                key={`h-${ri}-${ci}`}
                                onClick={() => handleHighlightColor(c)}
                                className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))
                          )}
                        </div>
                        {/* Standard Colors */}
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 mt-2">Standard Colors</div>
                        <div className="flex gap-[3px] mb-2">
                          {["#C00000","#FF0000","#FFC000","#FFFF00","#92D050","#00B050","#00B0F0","#0070C0","#002060","#7030A0"].map(c => (
                            <button
                              key={c}
                              onClick={() => handleHighlightColor(c)}
                              className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                        {/* Recent Highlights */}
                        {recentHighlights.length > 0 && (
                          <>
                            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 mt-2">Recent Colors</div>
                            <div className="flex gap-[3px] mb-2 flex-wrap">
                              {recentHighlights.map((c, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleHighlightColor(c)}
                                  className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform"
                                  style={{ backgroundColor: c }}
                                  title={c}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        {/* More Colors */}
                        <button
                          onClick={() => {
                            const sel = window.getSelection();
                            if (sel && sel.rangeCount > 0) {
                              savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                            }
                            const input = document.createElement("input");
                            input.type = "color";
                            input.value = highlightColor;
                            input.onchange = () => handleHighlightColor(input.value, true);
                            input.click();
                          }}
                          className="w-full text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded px-2 py-1 text-left border border-zinc-200 transition-colors"
                        >
                          🎨 More Colors...
                        </button>
                      </div>
                    )}
                  </div>
                  <button className={btnSq} />
                  {/* Bold */}
                  <button
                    onClick={() => execInlineFormat("bold")}
                    title="Bold (select text first)"
                    className={`${btnSq} ${activeFormats.bold ? btnActive : ""}`}
                  >
                    <span className="font-black text-sm">B</span>
                  </button>
                  {/* Underline — red underline */}
                  <button
                    onClick={() => execInlineFormat("underline")}
                    title="Underline (select text first)"
                    className={`${btnSq} ${activeFormats.underline ? btnActive : ""}`}
                  >
                    <span className="text-sm underline decoration-red-500 decoration-[3px]">U</span>
                  </button>
                  {/* Strikethrough — red line through */}
                  <button
                    onClick={() => execInlineFormat("strikeThrough")}
                    title="Strikethrough (select text first)"
                    className={`${btnSq} ${activeFormats.strikeThrough ? btnActive : ""}`}
                  >
                    <span className="text-sm line-through decoration-red-500 decoration-[3px]">U</span>
                  </button>
                  {/* Overline */}
                  <button
                    onClick={() => execInlineFormat("underline")}
                    title="Overline (select text first)"
                    className={btnSq}
                  >
                    <span className="text-sm" style={{ textDecoration: "overline", textDecorationColor: "red", textDecorationThickness: "3px" }}>U</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Group 3 — Align left, Align right, Align center, Neutral */}
            <div className="border border-zinc-400 rounded-lg p-1.5">
              <div className="grid grid-cols-2 gap-1">
                {/* Align left */}
                <button
                  onClick={() => { execFormat("justifyLeft"); setAlign("left"); }}
                  title="Align left"
                  className={`${btnSq} ${align === "left" ? btnActive : ""}`}
                >
                  <svg viewBox="0 0 16 16" className="w-4 h-4 fill-zinc-600">
                    <rect x="1" y="2" width="14" height="2" rx="1"/>
                    <rect x="1" y="7" width="9" height="2" rx="1"/>
                    <rect x="1" y="12" width="12" height="2" rx="1"/>
                  </svg>
                </button>
                {/* Align right */}
                <button
                  onClick={() => { execFormat("justifyRight"); setAlign("right"); }}
                  title="Align right"
                  className={`${btnSq} ${align === "right" ? btnActive : ""}`}
                >
                  <svg viewBox="0 0 16 16" className="w-4 h-4 fill-zinc-600">
                    <rect x="1" y="2" width="14" height="2" rx="1"/>
                    <rect x="6" y="7" width="9" height="2" rx="1"/>
                    <rect x="3" y="12" width="12" height="2" rx="1"/>
                  </svg>
                </button>
                {/* Align center */}
                <button
                  onClick={() => { execFormat("justifyCenter"); setAlign("center"); }}
                  title="Align center"
                  className={`${btnSq} ${align === "center" ? btnActive : ""}`}
                >
                  <svg viewBox="0 0 16 16" className="w-4 h-4 fill-zinc-600">
                    <rect x="1" y="2" width="14" height="2" rx="1"/>
                    <rect x="3.5" y="7" width="9" height="2" rx="1"/>
                    <rect x="2" y="12" width="12" height="2" rx="1"/>
                  </svg>
                </button>
                {/* Neutral — remove all formatting */}
                <button
                  onClick={handleNeutral}
                  title="Remove all formatting"
                  className={btnSq}
                >
                  <span className="text-sm font-bold text-zinc-600">N</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right side — Delete + Trash */}
          <div className="border border-zinc-400 rounded-lg p-1.5 shrink-0">
            <div className="flex flex-col gap-1">
              <button
                onClick={handleDelete}
                title="Move to trash"
                className={`${btnSq} hover:bg-red-50 hover:border-red-400 active:bg-red-100`}
              >
                <Trash2 className="w-4 h-4 text-zinc-500" />
              </button>
              <button
                onClick={() => setShowTrash(true)}
                title="Open trash"
                className={btnSq}
              >
                <ArchiveRestore className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trash panel */}
      {showTrash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-[#f5f2ee]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-700">Trash</span>
              </div>
              <button
                onClick={() => setShowTrash(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
              {trashedPages.length === 0 ? (
                <div className="px-5 py-8 text-center text-zinc-400 text-sm italic">Trash is empty</div>
              ) : (
                trashedPages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50">
                    <span className="text-sm text-zinc-700 font-medium">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(p.id)}
                        title="Restore page"
                        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 border border-zinc-300 rounded-md hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(p.id)}
                        title="Permanently delete"
                        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 border border-zinc-300 rounded-md hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-[#ece9e3] px-4 pt-0 pb-2 shrink-0">
        <div className="overflow-hidden rounded-xl border border-zinc-700 shadow-sm">
          <div className="bg-[#1a1a1a] text-white flex items-stretch" style={{ minHeight: 44 }}>
            <button
              onClick={() => setLocation("/")}
              className="px-3 flex items-center text-zinc-400 hover:text-white transition-colors border-r border-zinc-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollTabs("left")}
              className="px-2 flex items-center text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={tabsRef}
              className="flex items-stretch overflow-x-auto flex-1"
              style={{ scrollbarWidth: "none" }}
            >
              {pages.map((p, index) => (
                <button
                  key={p.id}
                  onClick={() => setLocation(`/books/${bId}/pages/${p.id}`)}
                  className={`px-5 py-2 text-sm font-semibold uppercase tracking-widest whitespace-nowrap transition-colors border-r border-zinc-700 ${
                    p.id === pId
                      ? "bg-[#2a2a2a] text-white border-b-2 border-b-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  PAGE {index + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollTabs("right")}
              className="px-2 flex items-center text-zinc-400 hover:text-white transition-colors border-l border-zinc-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleCreatePage}
              className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-700 whitespace-nowrap uppercase tracking-wider"
            >
              + NEW PAGE
            </button>
          </div>
        </div>
      </div>

      {/* Paper card */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#ece9e3] px-4 pb-4">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl border border-zinc-300 shadow-sm bg-white">
          <div className="bg-[#f5f2ee] border-b border-zinc-200 px-4 py-1 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Page: <span className="text-zinc-700">PAGE {page.pageNumber}</span>
            </span>
            <span className="text-xs text-zinc-400">
              {saveStatus === "saving" ? "Saving..." : "Saved"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onInput={handleEditorInput}
              onKeyUp={updateActiveFormats}
              onMouseUp={updateActiveFormats}
              className="w-full min-h-full outline-none px-6 py-4 text-zinc-800"
              style={{
                fontFamily: font,
                fontSize: fontSize,
                lineHeight: "1.8",
                minHeight: 600,
                whiteSpace: "pre-wrap",
              }}
              data-placeholder="Start writing..."
            />
          </div>

          <div className="bg-[#f5f2ee] border-t border-zinc-200 px-4 py-1 flex items-center justify-between text-xs text-zinc-500 shrink-0">
            <button
              onClick={() => prevPage && setLocation(`/books/${bId}/pages/${prevPage.id}`)}
              disabled={!prevPage}
              className="disabled:opacity-30 hover:text-zinc-700 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <span className="font-medium">{book?.title}</span>
            <button
              onClick={() => nextPage && setLocation(`/books/${bId}/pages/${nextPage.id}`)}
              disabled={!nextPage}
              className="disabled:opacity-30 hover:text-zinc-700 transition-colors flex items-center gap-1"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
