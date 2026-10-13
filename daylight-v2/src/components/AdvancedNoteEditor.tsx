import { saveDataUrl } from '../services/native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  PenTool,
  Feather,
  Pencil,
  Brush,
  Highlighter,
  Eraser,
  Type,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Download,
  Plus,
  Trash2,
  Save,
  Check,
  Grid,
  AlignJustify,
  Square,
  Rows,
  Palette,
  ChevronDown,
  ChevronUp,
  Hand,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Note, NotePage, DrawingStroke, NoteTextBlock, NoteImageBlock, PenType } from '../types';

interface AdvancedNoteEditorProps {
  isOpen: boolean;
  initialNote?: Note | null;
  onSave: (note: Note) => void;
  onClose: () => void;
}

// 16 Carefully curated artist pigment inks arranged in intuitive tonal groups
const ARTIST_PALETTE = [
  // Neutrals & Monochromes
  { hex: '#0F172A', name: 'Obsidian Black', group: 'Monochrome' },
  { hex: '#334155', name: 'Slate Charcoal', group: 'Monochrome' },
  { hex: '#64748B', name: 'Graphite Grey', group: 'Monochrome' },
  { hex: '#94A3B8', name: 'Silver Ash', group: 'Monochrome' },

  // Blues & Cool Inks
  { hex: '#1D4ED8', name: 'Royal Blue', group: 'Cool' },
  { hex: '#4F46E5', name: 'Indigo Ink', group: 'Cool' },
  { hex: '#0284C7', name: 'Cyan Sky', group: 'Cool' },
  { hex: '#0D9488', name: 'Teal Deep', group: 'Cool' },

  // Greens & Naturals
  { hex: '#059669', name: 'Emerald Forest', group: 'Nature' },
  { hex: '#16A34A', name: 'Spring Foliage', group: 'Nature' },
  { hex: '#65A30D', name: 'Olive Jade', group: 'Nature' },
  { hex: '#CA8A04', name: 'Ochre Gold', group: 'Nature' },

  // Warm, Florals & Accents
  { hex: '#EA580C', name: 'Terracotta Orange', group: 'Warm' },
  { hex: '#DC2626', name: 'Crimson Red', group: 'Warm' },
  { hex: '#E11D48', name: 'Rose Petal', group: 'Warm' },
  { hex: '#9333EA', name: 'Royal Violet', group: 'Warm' },
  { hex: '#FACC15', name: 'Fluorescent Yellow', group: 'Highlight' },
  { hex: '#FFFFFF', name: 'White Eraser/Ink', group: 'Monochrome' },
];

interface PenDefinition {
  id: PenType;
  label: string;
  subtitle: string;
  defaultSize: number;
  icon: React.ComponentType<{ className?: string }>;
}

const PEN_DEFINITIONS: PenDefinition[] = [
  { id: 'pen', label: 'Fine Pen', subtitle: 'Ballpoint', defaultSize: 3, icon: PenTool },
  { id: 'calligraphy', label: 'Fountain', subtitle: 'Chisel', defaultSize: 5, icon: Feather },
  { id: 'pencil', label: 'Pencil', subtitle: 'Graphite', defaultSize: 2, icon: Pencil },
  { id: 'marker', label: 'Marker', subtitle: 'Brush', defaultSize: 8, icon: Brush },
  { id: 'highlighter', label: 'Highlighter', subtitle: 'Translucent', defaultSize: 18, icon: Highlighter },
  { id: 'eraser', label: 'Eraser', subtitle: 'Precision', defaultSize: 14, icon: Eraser },
];

export const AdvancedNoteEditor: React.FC<AdvancedNoteEditorProps> = ({
  isOpen,
  initialNote,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [pages, setPages] = useState<NotePage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Interaction mode: 'draw' (pen draws strokes) | 'pan' (hand scroll / pinch navigation)
  const [interactionMode, setInteractionMode] = useState<'draw' | 'pan'>('draw');

  // View mode: 'scroll' (continuous vertical multi-page scroll) | 'single' (focused one page)
  const [scrollMode, setScrollMode] = useState<'scroll' | 'single'>('scroll');

  // Active Tool & Brush Configuration
  const [activePen, setActivePen] = useState<PenType>('pen');
  const [brushColor, setBrushColor] = useState(ARTIST_PALETTE[0].hex);
  const [brushSize, setBrushSize] = useState(3);
  const [backgroundType, setBackgroundType] = useState<'blank' | 'lined' | 'grid'>('lined');
  const [isColorGridOpen, setIsColorGridOpen] = useState(false);

  // History for Undo / Redo per page
  const [history, setHistory] = useState<{ [pageId: string]: DrawingStroke[][] }>({});
  const [redoHistory, setRedoHistory] = useState<{ [pageId: string]: DrawingStroke[][] }>({});

  // Text block insertion
  const [textInput, setTextInput] = useState('');
  const [isAddingText, setIsAddingText] = useState(false);
  const [textTargetCoords, setTextTargetCoords] = useState<{ pageId: string; x: number; y: number } | null>(null);

  // Active drawing state ref
  const isDrawing = useRef(false);
  const currentStroke = useRef<DrawingStroke | null>(null);
  const activeCanvasPageId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Canvas registry for multiple pages
  const canvasRefs = useRef<{ [pageId: string]: HTMLCanvasElement | null }>({});

  // Initialize note data
  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title || 'Sketch Note');
      if (initialNote.advancedPages && initialNote.advancedPages.length > 0) {
        setPages(JSON.parse(JSON.stringify(initialNote.advancedPages)));
        setBackgroundType(initialNote.advancedPages[0].background || 'lined');
      } else {
        const defaultPage: NotePage = {
          id: 'page_1',
          background: 'lined',
          strokes: [],
          textBlocks: initialNote.body ? [{
            id: 'tb_1',
            text: initialNote.body,
            x: 28,
            y: 44,
            fontSize: 16,
            color: '#0F172A',
          }] : [],
          images: [],
        };
        setPages([defaultPage]);
      }
    } else {
      setTitle('New Sketch Note');
      setPages([
        {
          id: 'page_1',
          background: 'lined',
          strokes: [],
          textBlocks: [],
          images: [],
        },
      ]);
      setBackgroundType('lined');
    }
    setActivePageIndex(0);
    setHistory({});
    setRedoHistory({});
    setInteractionMode('draw');
    setIsColorGridOpen(false);
  }, [initialNote, isOpen]);

  // Adjust default brush size when switching pen types
  const handleSelectPen = (p: PenType) => {
    setActivePen(p);
    setInteractionMode('draw');
    const def = PEN_DEFINITIONS.find((d) => d.id === p);
    if (def) {
      setBrushSize(def.defaultSize);
    }
  };

  // Scroll smoothly to a specific page
  const scrollToPage = (index: number) => {
    if (index < 0 || index >= pages.length) return;
    setActivePageIndex(index);
    if (scrollMode === 'scroll') {
      const pageEl = document.getElementById(`daylight_note_page_${pages[index]?.id}`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Render a specific page canvas
  const redrawPage = useCallback((page: NotePage) => {
    const canvas = canvasRefs.current[page.id];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background texture
    const bg = page.background || backgroundType;
    if (bg === 'lined') {
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      const lineHeight = 32;
      for (let y = 48; y < canvas.height; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (bg === 'grid') {
      ctx.strokeStyle = '#EDF2F7';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw images
    page.images?.forEach((img) => {
      const htmlImg = new Image();
      htmlImg.src = img.dataUrl;
      if (htmlImg.complete) {
        ctx.drawImage(htmlImg, img.x, img.y, img.width, img.height);
      } else {
        htmlImg.onload = () => {
          ctx.drawImage(htmlImg, img.x, img.y, img.width, img.height);
        };
      }
    });

    // Draw strokes with professional brush styles and Bezier curves
    page.strokes?.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.32;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 2.2;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.size * 2.5;
      } else if (stroke.tool === 'pencil') {
        ctx.globalAlpha = 0.72;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      } else if (stroke.tool === 'calligraphy') {
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 1.4;
      } else if (stroke.tool === 'marker') {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 1.8;
      } else {
        // Standard fine pen
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      }

      const pts = stroke.points;
      if (pts.length === 1) {
        // Single dot
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, (stroke.size || 2) / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (pts.length === 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
      } else {
        // Smooth quadratic curve through midpoints
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw text blocks
    page.textBlocks?.forEach((tb) => {
      ctx.save();
      ctx.fillStyle = tb.color || '#0F172A';
      ctx.font = `${tb.fontSize || 16}px system-ui, -apple-system, sans-serif`;
      const lines = tb.text.split('\n');
      lines.forEach((line, idx) => {
        ctx.fillText(line, tb.x, tb.y + idx * ((tb.fontSize || 16) + 6));
      });
      ctx.restore();
    });
  }, [backgroundType]);

  // Redraw all canvases when pages change
  useEffect(() => {
    pages.forEach((p) => redrawPage(p));
  }, [pages, redrawPage]);

  if (!isOpen) return null;

  // Pointer event coordinate translation
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5,
    };
  };

  const handlePointerDown = (pageId: string, e: React.PointerEvent<HTMLCanvasElement>) => {
    // If in Pan / Scroll mode, don't draw strokes
    if (interactionMode === 'pan') return;

    const canvas = canvasRefs.current[pageId];
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const coords = getCanvasCoords(e, canvas);

    isDrawing.current = true;
    activeCanvasPageId.current = pageId;

    currentStroke.current = {
      id: 'stroke_' + Date.now(),
      tool: activePen,
      color: brushColor,
      size: brushSize,
      points: [coords],
    };

    // Live render initial dot
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.lineCap = 'round';
      if (activePen === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize * 1.25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = activePen === 'highlighter' ? 0.35 : activePen === 'pencil' ? 0.72 : 1;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  const handlePointerMove = (pageId: string, e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentStroke.current || activeCanvasPageId.current !== pageId) return;

    const canvas = canvasRefs.current[pageId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e, canvas);
    const pts = currentStroke.current.points;
    const prevPoint = pts[pts.length - 1];

    pts.push(coords);

    // Incremental line draw
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activePen === 'highlighter') {
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize * 2.2;
    } else if (activePen === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.5;
    } else if (activePen === 'pencil') {
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    } else if (activePen === 'calligraphy') {
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize * 1.4;
    } else if (activePen === 'marker') {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize * 1.8;
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }

    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = (pageId: string) => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;

    const completedStroke = currentStroke.current;
    currentStroke.current = null;
    activeCanvasPageId.current = null;

    // Commit to page state & history
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === pageId) {
          const oldStrokes = p.strokes || [];
          setHistory((hist) => ({
            ...hist,
            [pageId]: [...(hist[pageId] || []), oldStrokes],
          }));
          setRedoHistory((redo) => ({ ...redo, [pageId]: [] }));
          return { ...p, strokes: [...oldStrokes, completedStroke] };
        }
        return p;
      })
    );
  };

  // Undo
  const handleUndo = () => {
    const activePage = pages[activePageIndex] || pages[0];
    if (!activePage) return;
    const pageId = activePage.id;
    const pageHist = history[pageId];
    if (!pageHist || pageHist.length === 0) return;

    const previousStrokes = pageHist[pageHist.length - 1];
    const newHist = pageHist.slice(0, -1);

    setRedoHistory((redo) => ({
      ...redo,
      [pageId]: [...(redo[pageId] || []), activePage.strokes || []],
    }));

    setHistory((hist) => ({ ...hist, [pageId]: newHist }));

    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, strokes: previousStrokes } : p))
    );
  };

  // Redo
  const handleRedo = () => {
    const activePage = pages[activePageIndex] || pages[0];
    if (!activePage) return;
    const pageId = activePage.id;
    const pageRedo = redoHistory[pageId];
    if (!pageRedo || pageRedo.length === 0) return;

    const nextStrokes = pageRedo[pageRedo.length - 1];
    const newRedo = pageRedo.slice(0, -1);

    setHistory((hist) => ({
      ...hist,
      [pageId]: [...(hist[pageId] || []), activePage.strokes || []],
    }));

    setRedoHistory((redo) => ({ ...redo, [pageId]: newRedo }));

    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, strokes: nextStrokes } : p))
    );
  };

  // Add new page
  const handleAddNewPage = () => {
    const newPage: NotePage = {
      id: 'page_' + Date.now(),
      background: backgroundType,
      strokes: [],
      textBlocks: [],
      images: [],
    };
    const nextPages = [...pages, newPage];
    setPages(nextPages);
    const newIndex = nextPages.length - 1;
    setActivePageIndex(newIndex);
    setTimeout(() => {
      scrollToPage(newIndex);
    }, 100);
  };

  // Delete page
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    const nextPages = pages.filter((_, idx) => idx !== index);
    setPages(nextPages);
    setActivePageIndex(Math.max(0, index - 1));
  };

  // Confirm text block
  const handleConfirmText = () => {
    if (!textTargetCoords || !textInput.trim()) {
      setIsAddingText(false);
      setTextInput('');
      return;
    }

    const newBlock: NoteTextBlock = {
      id: 'tb_' + Date.now(),
      text: textInput.trim(),
      x: textTargetCoords.x,
      y: textTargetCoords.y,
      fontSize: brushSize * 2.5 + 14,
      color: brushColor,
    };

    setPages((prev) =>
      prev.map((p) =>
        p.id === textTargetCoords.pageId
          ? { ...p, textBlocks: [...(p.textBlocks || []), newBlock] }
          : p
      )
    );
    setIsAddingText(false);
    setTextInput('');
    setTextTargetCoords(null);
  };

  // Insert image onto active page
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const activePage = pages[activePageIndex] || pages[0];
    if (!file || !activePage) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 260;
        const scale = Math.min(1, maxWidth / img.width);
        const newImgBlock: NoteImageBlock = {
          id: 'img_' + Date.now(),
          dataUrl,
          x: 40,
          y: 60,
          width: img.width * scale,
          height: img.height * scale,
        };

        setPages((prev) =>
          prev.map((p) =>
            p.id === activePage.id
              ? { ...p, images: [...(p.images || []), newImgBlock] }
              : p
          )
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Export current page as PNG
  const handleExportPng = () => {
    const targetPage = pages[activePageIndex] || pages[0];
    if (!targetPage) return;
    const canvas = canvasRefs.current[targetPage.id];
    if (!canvas) return;

    saveDataUrl(`${(title.trim() || 'sketch').replace(/\s+/g, '_')}_p${activePageIndex + 1}.png`, canvas.toDataURL('image/png'));
  };

  // Save Note
  const handleSaveFinal = () => {
    const noteToSave: Note = {
      id: initialNote?.id || 'note_' + Date.now(),
      title: title.trim() || 'Sketch Note',
      body:
        pages
          .map((p, i) => `Page ${i + 1}: ${p.textBlocks?.map((t) => t.text).join(' ') || '(Sketch)'}`)
          .join('\n') || 'Handwritten and sketch note',
      color: initialNote?.color || 'white',
      labels: initialNote?.labels || ['Sketch'],
      isPinned: initialNote?.isPinned || false,
      isAdvanced: true,
      advancedPages: pages,
      createdAt: initialNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(noteToSave);
    onClose();
  };

  const visiblePages = scrollMode === 'scroll' ? pages : [pages[activePageIndex] || pages[0]];
  const activeColorObj = ARTIST_PALETTE.find((c) => c.hex.toLowerCase() === brushColor.toLowerCase());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 bg-black/65 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl h-full sm:h-[96vh] bg-white dark:bg-slate-900 sm:rounded-[36px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* ================= TOP HEADER BAR ================= */}
        <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sketch note title..."
              className="text-base sm:text-lg font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none flex-1 truncate"
            />
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Scroll view mode toggle */}
            <button
              type="button"
              onClick={() => setScrollMode(scrollMode === 'scroll' ? 'single' : 'scroll')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                scrollMode === 'scroll'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title={scrollMode === 'scroll' ? 'Multi-page Continuous Scroll' : 'Single Page Focus'}
            >
              <Rows className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {scrollMode === 'scroll' ? 'Continuous Scroll' : 'Single Page'}
              </span>
            </button>

            {/* Export PNG */}
            <button
              type="button"
              onClick={handleExportPng}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Export Current Page as Image (PNG)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Save Note */}
            <button
              type="button"
              onClick={handleSaveFinal}
              className="min-h-[38px] px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Note
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Close without saving"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= PROFESSIONAL TOOLBAR WITH LABELED ICONOGRAPHY ================= */}
        <div className="shrink-0 px-3 py-2 bg-slate-50/95 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2 overflow-x-auto text-xs shadow-xs relative">
          
          {/* Interaction Mode: Draw vs Pan/Scroll */}
          <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
            <button
              type="button"
              onClick={() => setInteractionMode('draw')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                interactionMode === 'draw'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Draw Mode: Use pen, highlighter or eraser"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="text-[11px]">Draw</span>
            </button>
            <button
              type="button"
              onClick={() => setInteractionMode('pan')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                interactionMode === 'pan'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Hand / Scroll Mode: Swipe to scroll pages without drawing"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="text-[11px]">Scroll</span>
            </button>
          </div>

          {/* Professional Labeled Pen Tools with Authentic Icons */}
          <div className="flex items-center gap-1 shrink-0 p-1 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
            {PEN_DEFINITIONS.map((penDef) => {
              const IconComponent = penDef.icon;
              const isSelected = activePen === penDef.id && interactionMode === 'draw';
              return (
                <button
                  key={penDef.id}
                  type="button"
                  onClick={() => handleSelectPen(penDef.id)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm scale-102 ring-2 ring-indigo-400/40'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={`${penDef.label} (${penDef.subtitle})`}
                >
                  <IconComponent className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] whitespace-nowrap">{penDef.label}</span>
                </button>
              );
            })}
          </div>

          {/* Stroke Width Slider & Live dot */}
          <div className="flex items-center gap-2 shrink-0 px-2.5 py-1 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Size</span>
            <input
              type="range"
              min="1"
              max="36"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              className="w-16 accent-indigo-600 cursor-pointer"
            />
            {/* Live Nib preview */}
            <div
              className="rounded-full shrink-0 flex items-center justify-center transition-all border border-black/10 dark:border-white/20"
              style={{
                width: Math.max(10, Math.min(22, brushSize * 1.1)),
                height: Math.max(10, Math.min(22, brushSize * 1.1)),
                backgroundColor: activePen === 'eraser' ? '#E2E8F0' : brushColor,
              }}
            />
          </div>

          {/* ENHANCED COLOR PALETTE BUTTON WITH GRID TOGGLE */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsColorGridOpen(!isColorGridOpen)}
              className={`px-2.5 py-1.5 rounded-2xl border font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isColorGridOpen
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
              }`}
              title="Open Color Palette Grid"
            >
              <div
                className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                style={{ backgroundColor: brushColor }}
              />
              <span className="text-[11px] font-semibold hidden md:inline">
                {activeColorObj?.name || 'Color'}
              </span>
              <Palette className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Page Background Texture */}
          <div className="flex items-center gap-0.5 shrink-0 p-1 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setBackgroundType('lined');
                setPages(pages.map((p) => ({ ...p, background: 'lined' })));
              }}
              className={`p-1.5 rounded-lg ${
                backgroundType === 'lined' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'text-slate-400'
              }`}
              title="Ruled Lines Background"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setBackgroundType('grid');
                setPages(pages.map((p) => ({ ...p, background: 'grid' })));
              }}
              className={`p-1.5 rounded-lg ${
                backgroundType === 'grid' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'text-slate-400'
              }`}
              title="Graph Grid Background"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setBackgroundType('blank');
                setPages(pages.map((p) => ({ ...p, background: 'blank' })));
              }}
              className={`p-1.5 rounded-lg ${
                backgroundType === 'blank' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'text-slate-400'
              }`}
              title="Blank Page"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text, Image & History */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                const targetPage = pages[activePageIndex] || pages[0];
                if (targetPage) {
                  setTextTargetCoords({ pageId: targetPage.id, x: 40, y: 80 });
                  setIsAddingText(true);
                }
              }}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Insert Text Box"
            >
              <Type className="w-4 h-4" />
            </button>

            <label
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Undo Stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Redo Stroke"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================= INTUITIVE COLOR PALETTE GRID PANEL ================= */}
        {isColorGridOpen && (
          <div className="shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg animate-slide-down z-20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Artist Pigments &amp; Color Inks
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">{brushColor}</span>
                <button
                  type="button"
                  onClick={() => setIsColorGridOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Grid of 18 Artistic Colors */}
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 py-1">
              {ARTIST_PALETTE.map((c) => {
                const isSelected = brushColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setBrushColor(c.hex);
                      setIsColorGridOpen(false);
                    }}
                    className={`group relative flex flex-col items-center justify-center p-1.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-sm scale-105'
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/60 dark:bg-slate-800/40'
                    }`}
                    title={`${c.name} (${c.hex})`}
                  >
                    <div
                      className="w-7 h-7 rounded-full shadow-inner border border-black/15 flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 stroke-[3] ${
                            c.hex === '#FFFFFF' || c.hex === '#FACC15' ? 'text-slate-900' : 'text-white'
                          }`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-full mt-1">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pipette */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-6 h-6 rounded-md border border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <span>Custom Spectrum Hex Picker</span>
              </label>
              <button
                type="button"
                onClick={() => setIsColorGridOpen(false)}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ================= CONTINUOUS MULTI-PAGE SCROLLING WORKSPACE ================= */}
        <div
          ref={scrollContainerRef}
          className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 overflow-y-auto overscroll-contain space-y-6 relative flex flex-col items-center"
        >
          {visiblePages.map((page, index) => {
            const pageIndexInFullList = scrollMode === 'scroll' ? index : activePageIndex;
            const pageNumber = pageIndexInFullList + 1;
            return (
              <div
                key={page.id}
                id={`daylight_note_page_${page.id}`}
                className={`w-full max-w-[680px] bg-white rounded-3xl shadow-md border p-2 sm:p-3 relative flex flex-col items-center transition-all ${
                  pageIndexInFullList === activePageIndex
                    ? 'border-indigo-400/80 dark:border-indigo-600 ring-2 ring-indigo-400/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
                onClick={() => setActivePageIndex(pageIndexInFullList)}
              >
                {/* Page Header Bar */}
                <div className="w-full flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Page {pageNumber} of {pages.length}
                    </span>
                    {interactionMode === 'pan' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Scroll Mode Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {pages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(pageIndexInFullList);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* The Responsive Canvas */}
                <canvas
                  ref={(el) => {
                    canvasRefs.current[page.id] = el;
                  }}
                  width={680}
                  height={880}
                  onPointerDown={(e) => handlePointerDown(page.id, e)}
                  onPointerMove={(e) => handlePointerMove(page.id, e)}
                  onPointerUp={() => handlePointerUp(page.id)}
                  className={`bg-white rounded-2xl w-full h-auto shadow-inner ${
                    interactionMode === 'pan' ? 'touch-pan-y cursor-grab' : 'touch-none cursor-crosshair'
                  }`}
                  style={{ aspectRatio: '680/880' }}
                />
              </div>
            );
          })}

          {/* Add Page Button */}
          <div className="py-4 flex items-center justify-center w-full">
            <button
              type="button"
              onClick={handleAddNewPage}
              className="px-6 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-indigo-600" /> Add Page ({pages.length + 1})
            </button>
          </div>
        </div>

        {/* ================= FLOATING PAGE JUMP & SCROLL NAVIGATOR ================= */}
        <div className="shrink-0 px-4 py-2 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollToPage(activePageIndex - 1)}
              disabled={activePageIndex <= 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Page {activePageIndex + 1} / {pages.length}
            </span>
            <button
              type="button"
              onClick={() => scrollToPage(activePageIndex + 1)}
              disabled={activePageIndex >= pages.length - 1}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Page Jump Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {pages.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => scrollToPage(idx)}
                className={`w-6 h-6 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activePageIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddNewPage}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Page
          </button>
        </div>

        {/* Popover text entry modal */}
        {isAddingText && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-30">
            <div className="w-full max-w-sm p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Text to Note
              </h4>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type note text here..."
                rows={3}
                autoFocus
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingText(false);
                    setTextInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmText}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
