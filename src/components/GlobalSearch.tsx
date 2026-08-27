import { useState, useMemo } from 'react';
import { Search, X, CheckSquare, Calendar, StickyNote, Target } from 'lucide-react';
import type { AppData } from '@/types';
import { formatTime, formatLongDate, fromKey } from '@/lib/dates';
import Modal from '@/components/Modal';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  data: AppData;
  onResultClick: (type: string, id: string) => void;
}

export default function GlobalSearch({ open, onClose, data }: GlobalSearchProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { tasks: [], events: [], notes: [], goals: [] };

    return {
      tasks: data.tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 5),
      events: data.events.filter((e) => e.title.toLowerCase().includes(q)).slice(0, 5),
      notes: data.notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).slice(0, 5),
      goals: data.monthlyGoals.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [query, data]);

  const total = results.tasks.length + results.events.length + results.notes.length + results.goals.length;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="pt-2">
        <div className="flex items-center gap-2 bg-pink-soft/50 rounded-2xl px-4 py-3 mb-4">
          <Search size={18} className="text-pink-primary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, events, notes..."
            className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-muted/60"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink-muted active:scale-90 transition-transform">
              <X size={16} />
            </button>
          )}
        </div>

        {query && total === 0 && (
          <p className="text-center text-ink-muted text-sm py-8">No results found for "{query}"</p>
        )}

        {!query && (
          <p className="text-center text-ink-muted text-sm py-8">Start typing to search across your planner.</p>
        )}

        <div className="space-y-4">
          {results.tasks.length > 0 && (
            <ResultGroup title="Tasks" Icon={CheckSquare}>
              {results.tasks.map((t) => (
                <ResultItem key={t.id} title={t.title} subtitle={formatLongDate(fromKey(t.date))} />
              ))}
            </ResultGroup>
          )}
          {results.events.length > 0 && (
            <ResultGroup title="Events" Icon={Calendar}>
              {results.events.map((e) => (
                <ResultItem key={e.id} title={e.title} subtitle={`${formatLongDate(fromKey(e.date))} · ${formatTime(e.startTime)}`} />
              ))}
            </ResultGroup>
          )}
          {results.notes.length > 0 && (
            <ResultGroup title="Sticky Notes" Icon={StickyNote}>
              {results.notes.map((n) => (
                <ResultItem key={n.id} title={n.title || 'Untitled'} subtitle={n.content.slice(0, 50)} />
              ))}
            </ResultGroup>
          )}
          {results.goals.length > 0 && (
            <ResultGroup title="Monthly Goals" Icon={Target}>
              {results.goals.map((g) => (
                <ResultItem key={g.id} title={g.name} subtitle={g.status} />
              ))}
            </ResultGroup>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ResultGroup({ title, Icon, children }: { title: string; Icon: typeof Search; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon size={14} className="text-pink-primary" />
        <span className="text-xs font-bold text-ink-muted uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ResultItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <button className="w-full text-left bg-pink-soft/40 rounded-xl p-3 active:scale-95 transition-transform">
      <p className="text-sm font-medium text-ink truncate">{title}</p>
      <p className="text-xs text-ink-muted truncate">{subtitle}</p>
    </button>
  );
}
