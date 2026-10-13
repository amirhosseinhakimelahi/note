import React, { useState, useEffect } from 'react';
import { X, Pin, Tag, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Note } from '../types';

interface NoteEditorModalProps {
  isOpen: boolean;
  initialNote?: Note | null;
  onSave: (note: Note) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const NOTE_COLORS = [
  { id: 'white', label: 'Default', bg: '#FFFFFF', darkBg: '#1E293B', border: '#E2E8F0' },
  { id: 'peach', label: 'Peach', bg: '#FFF1E6', darkBg: '#43281C', border: '#FDBA74' },
  { id: 'lavender', label: 'Lavender', bg: '#EDE9FE', darkBg: '#2E1065', border: '#C4B5FD' },
  { id: 'mint', label: 'Sage', bg: '#E8F5E9', darkBg: '#143823', border: '#A7F3D0' },
  { id: 'sky', label: 'Sky', bg: '#E0F2FE', darkBg: '#0C4A6E', border: '#BAE6FD' },
  { id: 'sun', label: 'Sand', bg: '#FEF9C3', darkBg: '#422006', border: '#FDE047' },
];

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  initialNote,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState('white');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setBody(initialNote.body);
      setColor(initialNote.color || 'white');
      setLabels(initialNote.labels ? [...initialNote.labels] : []);
      setIsPinned(initialNote.isPinned || false);
    } else {
      setTitle('');
      setBody('');
      setColor('white');
      setLabels([]);
      setIsPinned(false);
    }
    setErrors({});
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleAddLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (!labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
    }
    setNewLabel('');
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((l) => l !== labelToRemove));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() && !body.trim()) {
      setErrors({ title: 'Please provide either a title or body text' });
      return;
    }

    const noteToSave: Note = {
      id: initialNote?.id || 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title.trim() || 'Untitled Note',
      body: body.trim(),
      color,
      labels,
      isPinned,
      createdAt: initialNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(noteToSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg my-auto rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-all max-h-[92vh] flex flex-col">
        {/* Header toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`min-h-[40px] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-600' : ''}`} />
              {isPinned ? 'Pinned' : 'Pin'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {initialNote && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialNote.id)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Note Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({});
              }}
              placeholder="Title..."
              className="w-full text-2xl font-bold bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
              </p>
            )}
          </div>

          {/* Color palette selector */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-xs text-slate-500 font-medium">Color:</span>
            <div className="flex items-center gap-1.5">
              {NOTE_COLORS.map((nc) => (
                <button
                  key={nc.id}
                  type="button"
                  onClick={() => setColor(nc.id)}
                  style={{ backgroundColor: nc.bg }}
                  className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                    color === nc.id
                      ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110 shadow'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                  title={nc.label}
                />
              ))}
            </div>
          </div>

          {/* Note Body */}
          <div>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.title) setErrors({});
              }}
              placeholder="Start writing notes, ideas, study points, or checklists..."
              rows={8}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base leading-relaxed resize-none"
            />
          </div>

          {/* Labels & Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" /> Labels &amp; Tags
            </label>

            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {labels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  #{l}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(l)}
                    className="hover:text-rose-500 transition-colors ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLabel();
                  }
                }}
                placeholder="Add tag (e.g. Study, Idea)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Metadata timestamp */}
          {initialNote && (
            <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-2">
              <Calendar className="w-3.5 h-3.5" />
              Edited: {new Date(initialNote.updatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="min-h-[48px] px-6 py-2 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            {initialNote ? 'Save Changes' : 'Create Note'}
          </button>
        </div>
      </div>
    </div>
  );
};
