import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  Tag,
  ArrowUpDown,
  Trash2,
  StickyNote,
  PenTool,
  X
} from 'lucide-react';
import { Note } from '../types';
import { NOTE_COLORS } from '../components/NoteEditorModal';

interface NotesScreenProps {
  notes: Note[];
  onOpenCreateNote: () => void;
  onOpenCreateAdvancedNote: () => void;
  onOpenEditNote: (note: Note) => void;
  onTogglePin: (id: string) => void;
  onRequestDeleteNote: (id: string) => void;
}

type SortOption = 'edited_desc' | 'created_desc' | 'title_asc';

export const NotesScreen: React.FC<NotesScreenProps> = ({
  notes,
  onOpenCreateNote,
  onOpenCreateAdvancedNote,
  onOpenEditNote,
  onTogglePin,
  onRequestDeleteNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [pinnedOnlyFilter, setPinnedOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('edited_desc');

  // Extract all unique labels
  const allLabels = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.labels?.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [notes]);

  // Filter & Search logic
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesBody = n.body.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBody) return false;
      }
      if (selectedTag && !n.labels?.includes(selectedTag)) {
        return false;
      }
      if (pinnedOnlyFilter && !n.isPinned) {
        return false;
      }
      return true;
    });
  }, [notes, searchQuery, selectedTag, pinnedOnlyFilter]);

  // Sort logic
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (sortBy === 'edited_desc') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'created_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredNotes, sortBy]);

  const pinnedNotes = useMemo(() => sortedNotes.filter((n) => n.isPinned), [sortedNotes]);
  const otherNotes = useMemo(() => sortedNotes.filter((n) => !n.isPinned), [sortedNotes]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-2xl mx-auto w-full pb-24">
      {/* Header bar with New Note & Advanced Note options */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">
            Notes &amp; Sketches
          </h1>
          <p className="text-xs text-slate-500">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved offline
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Advanced Sketch Note */}
          <button
            type="button"
            onClick={onOpenCreateAdvancedNote}
            className="min-h-[40px] px-3.5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
            title="Create an Advanced Note with freehand drawing and stylus support"
          >
            <PenTool className="w-3.5 h-3.5" /> Sketch &amp; Pens
          </button>

          {/* Standard Text Note */}
          <button
            type="button"
            onClick={onOpenCreateNote}
            className="min-h-[40px] px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes by title or content..."
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Chips & Sort Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[70%]">
          <button
            type="button"
            onClick={() => {
              setSelectedTag(null);
              setPinnedOnlyFilter(false);
            }}
            className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
              !selectedTag && !pinnedOnlyFilter
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setPinnedOnlyFilter(!pinnedOnlyFilter)}
            className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              pinnedOnlyFilter
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Pin className="w-3 h-3 fill-amber-500 text-amber-500" /> Pinned
          </button>

          {allLabels.map((lbl) => (
            <button
              key={lbl}
              type="button"
              onClick={() => setSelectedTag(selectedTag === lbl ? null : lbl)}
              className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                selectedTag === lbl
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              #{lbl}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent border-0 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="edited_desc">Recently Edited</option>
            <option value="created_desc">Created Date</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Empty states */}
      {notes.length === 0 ? (
        <div className="py-14 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
            <StickyNote className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No notes or sketches yet
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Capture thoughts, study outlines, or freehand sketches with pen and stylus.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={onOpenCreateNote}
              className="min-h-[42px] px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 cursor-pointer"
            >
              New Text Note
            </button>
            <button
              type="button"
              onClick={onOpenCreateAdvancedNote}
              className="min-h-[42px] px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer"
            >
              🎨 Advanced Sketch
            </button>
          </div>
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No matching notes found
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTag(null);
              setPinnedOnlyFilter(false);
            }}
            className="text-xs font-semibold text-indigo-600 hover:underline pt-2 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned notes */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                <Pin className="w-3.5 h-3.5 fill-amber-500" />
                <span>Pinned ({pinnedNotes.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onOpen={() => onOpenEditNote(note)}
                    onTogglePin={() => onTogglePin(note.id)}
                    onDelete={() => onRequestDeleteNote(note.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other notes */}
          {otherNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Other Notes ({otherNotes.length})
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onOpen={() => onOpenEditNote(note)}
                    onTogglePin={() => onTogglePin(note.id)}
                    onDelete={() => onRequestDeleteNote(note.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NoteCardProps {
  note: Note;
  onOpen: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onOpen, onTogglePin, onDelete }) => {
  const colorObj = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];

  return (
    <div
      onClick={onOpen}
      style={{
        backgroundColor: colorObj.id === 'white' ? undefined : colorObj.bg,
      }}
      className={`group relative rounded-[24px] p-4.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
        colorObj.id === 'white'
          ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          : 'border-slate-200/60 dark:border-slate-700/60'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
              {note.title}
            </h3>
            {note.isAdvanced && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                🎨 Sketch
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className={`p-1 rounded-full transition-colors ${
              note.isPinned ? 'text-amber-600' : 'text-slate-400 hover:text-slate-700'
            }`}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-3 whitespace-pre-line">
          {note.isAdvanced ? (
            <span className="italic text-indigo-600 dark:text-indigo-400">
              Drawing note with {note.advancedPages?.length || 1} page(s)
            </span>
          ) : (
            note.body || <span className="italic text-slate-400">Empty note</span>
          )}
        </p>
      </div>

      <div>
        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {note.labels.slice(0, 3).map((l) => (
              <span
                key={l}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300"
              >
                #{l}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
