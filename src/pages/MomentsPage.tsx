import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Pencil, Camera, X, Heart, MoreHorizontal } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { uid } from '@/lib/store';
import {
  type MomentRecord,
  getAllMoments,
  putMoment,
  deleteMoment,
  blobToURL,
  fileToBlob,
} from '@/lib/photoStore';

interface MomentsPageProps {
  // no shared data needed — photos are in IndexedDB
}

interface MomentView {
  id: string;
  caption: string;
  url: string;
  createdAt: number;
}

export default function MomentsPage({}: MomentsPageProps) {
  const [moments, setMoments] = useState<MomentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MomentView | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const urlsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const records = await getAllMoments();
    const views: MomentView[] = records.map((r) => ({
      id: r.id,
      caption: r.caption,
      url: blobToURL(r.blob),
      createdAt: r.createdAt,
    }));
    setMoments(views);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [refresh]);

  const handleUpload = async (file: File, caption: string) => {
    // Compress: cap at 1200px wide, JPEG quality 0.82
    const compressed = await compressImage(file, 1200, 0.82);
    const record: MomentRecord = {
      id: uid(),
      caption: caption.trim(),
      blob: compressed,
      createdAt: Date.now(),
    };
    await putMoment(record);
    setUploadOpen(false);
    refresh();
  };

  const handleEdit = async (id: string, caption: string) => {
    const records = await getAllMoments();
    const existing = records.find((r) => r.id === id);
    if (!existing) return;
    existing.caption = caption.trim();
    await putMoment(existing);
    setEditTarget(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteMoment(id);
    setDeleteId(null);
    refresh();
  };

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-ink">My Moments</h1>
          <p className="text-ink-muted text-sm mt-0.5">Foto keseharian Rieke 💗</p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="w-10 h-10 rounded-full bg-pink-primary text-white flex items-center justify-center shadow-soft active:scale-90 transition-transform"
          aria-label="Add moment"
        >
          <Plus size={22} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-soft border-t-pink-primary rounded-full animate-spin" />
        </div>
      ) : moments.length === 0 ? (
        <EmptyState
          title="No moments yet 💗"
          subtitle="Capture your day and save it here."
          actionLabel="Add Moment"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <div className="space-y-5">
          {moments.map((m) => (
            <MomentCard
              key={m.id}
              moment={m}
              menuOpen={menuId === m.id}
              onToggleMenu={() => setMenuId(menuId === m.id ? null : m.id)}
              onEdit={() => { setMenuId(null); setEditTarget(m); }}
              onDelete={() => { setMenuId(null); setDeleteId(m.id); }}
            />
          ))}
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
      />

      <EditModal
        open={!!editTarget}
        moment={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDialog
        open={!!deleteId}
        message="Are you sure you want to delete this moment?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function MomentCard({
  moment,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}: {
  moment: MomentView;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const date = new Date(moment.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card overflow-hidden animate-slide-up relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-pink-primary text-white flex items-center justify-center font-bold text-sm">
            R
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Rieke</p>
            <p className="text-xs text-ink-muted">{dateStr} · {timeStr}</p>
          </div>
        </div>
        <button
          onClick={onToggleMenu}
          className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-pink-soft active:scale-90 transition-all"
          aria-label="Options"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Menu dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggleMenu} />
          <div className="absolute right-3 top-14 z-50 bg-cream-card rounded-2xl shadow-float border border-pink-soft overflow-hidden animate-scale-in">
            <button
              onClick={onEdit}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-pink-soft/50 w-full text-left"
            >
              <Pencil size={15} className="text-pink-primary" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full text-left"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </>
      )}

      {/* Photo */}
      <img
        src={moment.url}
        alt={moment.caption || 'Moment'}
        className="w-full max-h-[450px] object-cover bg-pink-soft/30"
        loading="lazy"
      />

      {/* Caption + like */}
      <div className="px-4 py-3.5">
        {moment.caption ? (
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap break-words">
            {moment.caption}
          </p>
        ) : (
          <p className="text-sm text-ink-muted italic">No caption</p>
        )}
        <div className="flex items-center gap-1.5 mt-3 text-ink-muted">
          <Heart size={14} className="text-pink-secondary" fill="#FF8FC2" />
          <span className="text-xs">A little moment to remember</span>
        </div>
      </div>
    </div>
  );
}

function UploadModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File, caption: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview('');
      setCaption('');
    }
  }, [open]);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = () => {
    if (!file) return;
    onSubmit(file, caption);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Moment"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-pill bg-pink-soft text-pink-primary font-semibold active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file}
            className="flex-1 py-3 rounded-pill bg-pink-primary text-white font-semibold active:scale-95 transition-transform shadow-soft disabled:opacity-50"
          >
            Post
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Photo picker */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => pickFile(e.target.files?.[0] || null)}
          className="hidden"
        />

        {preview ? (
          <div className="relative rounded-2xl overflow-hidden">
            <img src={preview} alt="Preview" className="w-full max-h-80 object-cover" />
            <button
              onClick={() => { setFile(null); setPreview(''); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center active:scale-90 transition-transform"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full bg-pink-soft/40 rounded-2xl py-10 flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-pink-primary/10 flex items-center justify-center">
              <Camera size={26} className="text-pink-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-ink">Add a photo</p>
              <p className="text-xs text-ink-muted mt-0.5">Tap to choose from gallery or camera</p>
            </div>
          </button>
        )}

        {/* Caption */}
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's happening today?"
            rows={3}
            className="input-field resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

function EditModal({
  open,
  moment,
  onClose,
  onSubmit,
}: {
  open: boolean;
  moment: MomentView | null;
  onClose: () => void;
  onSubmit: (id: string, caption: string) => void;
}) {
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (open && moment) {
      setCaption(moment.caption);
    }
  }, [open, moment]);

  if (!moment) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Caption"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-pill bg-pink-soft text-pink-primary font-semibold active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(moment.id, caption)}
            className="flex-1 py-3 rounded-pill bg-pink-primary text-white font-semibold active:scale-95 transition-transform shadow-soft"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <img
          src={moment.url}
          alt={moment.caption}
          className="w-full max-h-60 object-cover rounded-2xl"
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's happening today?"
          rows={3}
          className="input-field resize-none"
          autoFocus
        />
      </div>
    </Modal>
  );
}

// Compress image to max width, return JPEG blob
function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(fileToBlob(file));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else resolve(fileToBlob(file));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(fileToBlob(file));
    };
    img.src = url;
  });
}
