import { useState, useMemo, useEffect } from 'react';
import { Plus, Pin, Search, Pencil, Trash2 } from 'lucide-react';
import type { AppData, StickyNote, NoteColor } from '@/types';
import { NOTE_COLORS } from '@/lib/constants';
import { uid } from '@/lib/store';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';

interface NotesPageProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

const colorBg: Record<NoteColor, string> = {
  pink: '#FFD6E8',
  'soft-pink': '#FFE4F0',
  white: '#FFFFFF',
  'light-purple': '#EDE0FF',
  'light-yellow': '#FFF8D6',
};

export default function NotesPage({ data, update }: NotesPageProps) {
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<{ open: boolean; note?: StickyNote | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? data.notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        )
      : data.notes;
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  }, [data.notes, search]);

  const togglePin = (id: string) =>
    update((d) => {
      const n = d.notes.find((x) => x.id === id);
      if (n) n.pinned = !n.pinned;
      return d;
    });

  const saveNote = (note: StickyNote) =>
    update((d) => {
      const idx = d.notes.findIndex((x) => x.id === note.id);
      if (idx >= 0) d.notes[idx] = note;
      else d.notes.push(note);
      return d;
    });

  const deleteNote = (id: string) =>
    update((d) => {
      d.notes = d.notes.filter((x) => x.id !== id);
      return d;
    });

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-ink">Sticky Notes</h1>
        <button
          onClick={() => setEditor({ open: true })}
          className="w-10 h-10 rounded-full bg-pink-primary text-white flex items-center justify-center shadow-soft active:scale-90 transition-transform"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your notes..."
          className="input-field pl-11"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No notes found' : 'No sticky notes yet.'}
          subtitle={search ? 'Try a different search.' : 'Write down whatever is on your mind.'}
          actionLabel={search ? undefined : 'Create Note'}
          onAction={search ? undefined : () => setEditor({ open: true })}
        />
      ) : (
        <div className="columns-2 gap-3 space-y-3">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="break-inside-avoid rounded-2xl p-4 shadow-card relative animate-scale-in"
              style={{ backgroundColor: colorBg[note.color] }}
            >
              {/* Pin */}
              <button
                onClick={() => togglePin(note.id)}
                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  note.pinned ? 'text-pink-primary' : 'text-ink-muted/40'
                }`}
                aria-label="Pin note"
              >
                <Pin size={14} fill={note.pinned ? 'currentColor' : 'none'} />
              </button>

              <h3 className="font-semibold text-sm text-ink pr-7 mb-1.5">{note.title || 'Untitled'}</h3>
              <p className="text-xs text-ink/80 whitespace-pre-wrap break-words leading-relaxed">
                {note.content}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                <span className="text-[10px] text-ink-muted">
                  {new Date(note.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditor({ open: true, note })}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteId(note.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteEditor
        open={editor.open}
        onClose={() => setEditor({ open: false })}
        onSave={saveNote}
        note={editor.note}
      />
      <ConfirmDialog
        open={!!deleteId}
        message="Are you sure you want to delete this note?"
        onConfirm={() => {
          if (deleteId) deleteNote(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function NoteEditor({
  open,
  onClose,
  onSave,
  note,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (n: StickyNote) => void;
  note?: StickyNote | null;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('pink');

  useEffect(() => {
    if (open) {
      setTitle(note?.title || '');
      setContent(note?.content || '');
      setColor(note?.color || 'pink');
    }
  }, [open, note]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    onSave({
      id: note?.id || uid(),
      title: title.trim(),
      content: content.trim(),
      color,
      pinned: note?.pinned || false,
      createdAt: note?.createdAt || Date.now(),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={note ? 'Edit Note' : 'Create Note'}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-pill bg-pink-soft text-pink-primary font-semibold active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() && !content.trim()}
            className="flex-1 py-3 rounded-pill bg-pink-primary text-white font-semibold active:scale-95 transition-transform shadow-soft disabled:opacity-50"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          className="rounded-2xl p-4 transition-colors"
          style={{ backgroundColor: colorBg[color] }}
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="w-full bg-transparent text-ink font-semibold text-base outline-none placeholder:text-ink-muted/50 mb-2"
            autoFocus
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note Content"
            rows={5}
            className="w-full bg-transparent text-ink text-sm outline-none placeholder:text-ink-muted/50 resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-2 block">Color</label>
          <div className="flex gap-3">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-9 h-9 rounded-full transition-all active:scale-90 ${
                  color === c.value ? 'ring-2 ring-pink-primary ring-offset-2 ring-offset-white' : ''
                }`}
                style={{ backgroundColor: c.bg }}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
