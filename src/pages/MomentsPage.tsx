import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Pencil, Camera, X, Heart, MoreHorizontal,
  Send, MessageCircle, Repeat2, Share,
} from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { uid } from '@/lib/store';
import type { AppData, Tweet } from '@/types';
import {
  type MomentRecord,
  getAllMoments,
  putMoment,
  deleteMoment,
  blobToURL,
  fileToBlob,
} from '@/lib/photoStore';

interface MomentsPageProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

interface MomentView {
  id: string;
  caption: string;
  url: string;
  createdAt: number;
}

type SubTab = 'photos' | 'tweets';

export default function MomentsPage({ data, update }: MomentsPageProps) {
  const [subTab, setSubTab] = useState<SubTab>('tweets');

  // Photo state
  const [moments, setMoments] = useState<MomentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MomentView | null>(null);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const urlsRef = useRef<Set<string>>(new Set());

  // Tweet state
  const [tweetText, setTweetText] = useState('');
  const [tweetMood, setTweetMood] = useState('');
  const [editTweet, setEditTweet] = useState<Tweet | null>(null);
  const [deleteTweetId, setDeleteTweetId] = useState<string | null>(null);
  const [tweetMenuId, setTweetMenuId] = useState<string | null>(null);

  const tweets = [...data.tweets].sort((a, b) => b.createdAt - a.createdAt);

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

  // Photo handlers
  const handleUpload = async (file: File, caption: string) => {
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

  const handlePhotoEdit = async (id: string, caption: string) => {
    const records = await getAllMoments();
    const existing = records.find((r) => r.id === id);
    if (!existing) return;
    existing.caption = caption.trim();
    await putMoment(existing);
    setEditTarget(null);
    refresh();
  };

  const handlePhotoDelete = async (id: string) => {
    await deleteMoment(id);
    setDeletePhotoId(null);
    refresh();
  };

  // Tweet handlers
  const postTweet = () => {
    if (!tweetText.trim()) return;
    update((d) => {
      d.tweets.push({
        id: uid(),
        text: tweetText.trim(),
        mood: tweetMood || undefined,
        createdAt: Date.now(),
      });
      return d;
    });
    setTweetText('');
    setTweetMood('');
  };

  const saveTweetEdit = (id: string, text: string, mood: string) => {
    update((d) => {
      const t = d.tweets.find((x) => x.id === id);
      if (t) {
        t.text = text.trim();
        t.mood = mood || undefined;
      }
      return d;
    });
    setEditTweet(null);
  };

  const deleteTweet = (id: string) => {
    update((d) => {
      d.tweets = d.tweets.filter((t) => t.id !== id);
      return d;
    });
    setDeleteTweetId(null);
  };

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-ink">My Moments</h1>
          <p className="text-ink-muted text-sm mt-0.5">Curhat & foto keseharian Rieke 💗</p>
        </div>
        {subTab === 'photos' && (
          <button
            onClick={() => setUploadOpen(true)}
            className="w-10 h-10 rounded-full bg-pink-primary text-white flex items-center justify-center shadow-soft active:scale-90 transition-transform"
            aria-label="Add moment"
          >
            <Plus size={22} />
          </button>
        )}
      </div>

      {/* Sub-tab switcher */}
      <div className="flex gap-2 bg-pink-soft/50 rounded-pill p-1 mb-5">
        <button
          onClick={() => setSubTab('tweets')}
          className={`flex-1 py-2 rounded-pill text-sm font-semibold transition-all ${
            subTab === 'tweets' ? 'bg-pink-primary text-white shadow-soft' : 'text-ink-muted'
          }`}
        >
          Cuitan
        </button>
        <button
          onClick={() => setSubTab('photos')}
          className={`flex-1 py-2 rounded-pill text-sm font-semibold transition-all ${
            subTab === 'photos' ? 'bg-pink-primary text-white shadow-soft' : 'text-ink-muted'
          }`}
        >
          Photos
        </button>
      </div>

      {/* Tweets tab */}
      {subTab === 'tweets' && (
        <TweetsTab
          tweets={tweets}
          tweetText={tweetText}
          setTweetText={setTweetText}
          tweetMood={tweetMood}
          setTweetMood={setTweetMood}
          onPost={postTweet}
          menuId={tweetMenuId}
          setMenuId={setTweetMenuId}
          onEdit={(t) => { setTweetMenuId(null); setEditTweet(t); }}
          onDelete={(id) => { setTweetMenuId(null); setDeleteTweetId(id); }}
        />
      )}

      {/* Photos tab */}
      {subTab === 'photos' && (
        <>
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
                  onDelete={() => { setMenuId(null); setDeletePhotoId(m.id); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Photo modals */}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSubmit={handleUpload} />
      <EditModal open={!!editTarget} moment={editTarget} onClose={() => setEditTarget(null)} onSubmit={handlePhotoEdit} />
      <ConfirmDialog
        open={!!deletePhotoId}
        message="Are you sure you want to delete this moment?"
        onConfirm={() => deletePhotoId && handlePhotoDelete(deletePhotoId)}
        onCancel={() => setDeletePhotoId(null)}
      />

      {/* Tweet modals */}
      <TweetEditModal
        open={!!editTweet}
        tweet={editTweet}
        onClose={() => setEditTweet(null)}
        onSubmit={saveTweetEdit}
      />
      <ConfirmDialog
        open={!!deleteTweetId}
        message="Are you sure you want to delete this cuitan?"
        onConfirm={() => deleteTweetId && deleteTweet(deleteTweetId)}
        onCancel={() => setDeleteTweetId(null)}
      />
    </div>
  );
}

// ─── TWEETS TAB ──────────────────────────────────────────────

const TWEET_MOODS = [
  { emoji: '😍', label: 'Happy' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😡', label: 'Upset' },
  { emoji: '🥰', label: 'Grateful' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😴', label: 'Tired' },
];

function TweetsTab({
  tweets,
  tweetText,
  setTweetText,
  tweetMood,
  setTweetMood,
  onPost,
  menuId,
  setMenuId,
  onEdit,
  onDelete,
}: {
  tweets: Tweet[];
  tweetText: string;
  setTweetText: (s: string) => void;
  tweetMood: string;
  setTweetMood: (s: string) => void;
  onPost: () => void;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
  onEdit: (t: Tweet) => void;
  onDelete: (id: string) => void;
}) {
  const remaining = 280 - tweetText.length;

  return (
    <div className="animate-fade-in">
      {/* Compose box */}
      <div className="card p-4 mb-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            R
          </div>
          <div className="flex-1">
            <textarea
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value.slice(0, 280))}
              placeholder="What's on your mind, Rieke?"
              rows={3}
              className="w-full bg-transparent outline-none text-sm text-ink placeholder:text-ink-muted/50 resize-none leading-relaxed"
            />
            {/* Mood picker */}
            <div className="flex gap-1.5 flex-wrap mt-2">
              {TWEET_MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setTweetMood(tweetMood === m.emoji ? '' : m.emoji)}
                  className={`px-2.5 py-1 rounded-pill text-xs font-medium transition-all active:scale-90 ${
                    tweetMood === m.emoji
                      ? 'bg-pink-primary text-white'
                      : 'bg-pink-soft text-ink-muted'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-pink-soft/50">
              <span className={`text-xs ${remaining < 20 ? 'text-red-400' : 'text-ink-muted'}`}>
                {remaining} characters left
              </span>
              <button
                onClick={onPost}
                disabled={!tweetText.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-pink-primary text-white rounded-pill text-sm font-semibold active:scale-95 transition-transform shadow-soft disabled:opacity-40"
              >
                <Send size={14} />
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {tweets.length === 0 ? (
        <EmptyState
          title="No cuitan yet 💗"
          subtitle="Share what's on your mind. It's your private space to vent, reflect, and express yourself."
        />
      ) : (
        <div className="space-y-3">
          {tweets.map((t) => (
            <TweetCard
              key={t.id}
              tweet={t}
              menuOpen={menuId === t.id}
              onToggleMenu={() => setMenuId(menuId === t.id ? null : t.id)}
              onEdit={() => onEdit(t)}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TweetCard({
  tweet,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}: {
  tweet: Tweet;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const date = new Date(tweet.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  let timeLabel: string;
  if (diffMin < 1) timeLabel = 'now';
  else if (diffMin < 60) timeLabel = `${diffMin}m`;
  else if (diffHr < 24) timeLabel = `${diffHr}h`;
  else if (diffDay < 7) timeLabel = `${diffDay}d`;
  else timeLabel = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return (
    <div className="card p-4 animate-slide-up relative">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-pink-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          R
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-ink">Rieke</span>
              <span className="text-xs text-ink-muted">@riieke · {timeLabel}</span>
            </div>
            <button
              onClick={onToggleMenu}
              className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-ink-muted hover:bg-pink-soft active:scale-90 transition-all"
              aria-label="Options"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Menu */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={onToggleMenu} />
              <div className="absolute right-2 top-10 z-50 bg-cream-card rounded-2xl shadow-float border border-pink-soft overflow-hidden animate-scale-in">
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-pink-soft/50 w-full text-left"
                >
                  <Pencil size={14} className="text-pink-primary" /> Edit
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}

          {/* Text */}
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap break-words mt-1">
            {tweet.text}
          </p>

          {/* Mood badge */}
          {tweet.mood && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-pink-soft text-xs font-medium text-pink-primary">
                Feeling {tweet.mood}
              </span>
            </div>
          )}

          {/* Action row (decorative — personal diary style) */}
          <div className="flex items-center gap-5 mt-3 text-ink-muted">
            <span className="flex items-center gap-1.5 text-xs">
              <MessageCircle size={15} className="text-pink-secondary/60" />
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <Repeat2 size={15} className="text-pink-secondary/60" />
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <Heart size={15} className="text-pink-secondary/60" fill="#FF8FC2" />
            </span>
            <span className="flex items-center gap-1.5 text-xs ml-auto">
              <Share size={15} className="text-pink-secondary/60" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TweetEditModal({
  open,
  tweet,
  onClose,
  onSubmit,
}: {
  open: boolean;
  tweet: Tweet | null;
  onClose: () => void;
  onSubmit: (id: string, text: string, mood: string) => void;
}) {
  const [text, setText] = useState('');
  const [mood, setMood] = useState('');

  useEffect(() => {
    if (open && tweet) {
      setText(tweet.text);
      setMood(tweet.mood || '');
    }
  }, [open, tweet]);

  if (!tweet) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Cuitan"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-pill bg-pink-soft text-pink-primary font-semibold active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(tweet.id, text, mood)}
            disabled={!text.trim()}
            className="flex-1 py-3 rounded-pill bg-pink-primary text-white font-semibold active:scale-95 transition-transform shadow-soft disabled:opacity-50"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          placeholder="What's on your mind?"
          rows={4}
          className="input-field resize-none"
          autoFocus
        />
        <div className="flex gap-1.5 flex-wrap">
          {TWEET_MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => setMood(mood === m.emoji ? '' : m.emoji)}
              className={`px-2.5 py-1 rounded-pill text-xs font-medium transition-all active:scale-90 ${
                mood === m.emoji ? 'bg-pink-primary text-white' : 'bg-pink-soft text-ink-muted'
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── PHOTO COMPONENTS ────────────────────────────────────────

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

      <img
        src={moment.url}
        alt={moment.caption || 'Moment'}
        className="w-full max-h-[450px] object-cover bg-pink-soft/30"
        loading="lazy"
      />

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
            onClick={() => file && onSubmit(file, caption)}
            disabled={!file}
            className="flex-1 py-3 rounded-pill bg-pink-primary text-white font-semibold active:scale-95 transition-transform shadow-soft disabled:opacity-50"
          >
            Post
          </button>
        </div>
      }
    >
      <div className="space-y-4">
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
