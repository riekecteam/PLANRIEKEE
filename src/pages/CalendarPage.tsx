import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import type { AppData, EventItem, Category } from '@/types';
import {
  monthKey,
  formatMonthYear,
  monthDays,
  todayKey,
  monthKeyFromDate,
  formatTime,
  shortDayName,
  fromKey,
} from '@/lib/dates';
import { CATEGORIES, categoryColor } from '@/lib/constants';
import { uid } from '@/lib/store';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

interface CalendarPageProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

export default function CalendarPage({ data, update }: CalendarPageProps) {
  const [month, setMonth] = useState(monthKey());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [eventEditor, setEventEditor] = useState<{ open: boolean; event?: EventItem | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const days = useMemo(() => monthDays(month), [month]);

  const hasActivity = (date: string): boolean => {
    return (
      data.tasks.some((t) => t.date === date) ||
      data.events.some((e) => e.date === date) ||
      data.importantDates.some((i) => i.date === date)
    );
  };

  const shiftMonth = (n: number) => {
    const [y, m] = month.split('-').map(Number);
    setMonth(monthKey(new Date(y, m - 1 + n, 1)));
  };

  // Date details
  const dayTasks = data.tasks.filter((t) => t.date === selectedDate);
  const dayEvents = data.events.filter((e) => e.date === selectedDate);
  const dayImportant = data.importantDates.filter((i) => i.date === selectedDate);
  const dayNotes = data.notes.filter((n) => monthKeyFromDate(todayKey()) === month); // not date-specific

  const saveEvent = (event: EventItem) =>
    update((d) => {
      const idx = d.events.findIndex((x) => x.id === event.id);
      if (idx >= 0) d.events[idx] = event;
      else d.events.push(event);
      return d;
    });

  const deleteEvent = (id: string) =>
    update((d) => {
      d.events = d.events.filter((x) => x.id !== id);
      return d;
    });

  const toggleTask = (id: string) =>
    update((d) => {
      const t = d.tasks.find((x) => x.id === id);
      if (t) t.status = t.status === 'completed' ? 'todo' : 'completed';
      return d;
    });

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-ink">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="w-8 h-8 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} className="text-pink-primary" />
          </button>
          <button
            onClick={() => { setMonth(monthKey()); setSelectedDate(todayKey()); }}
            className="px-3 py-1.5 rounded-pill bg-pink-soft text-pink-primary text-xs font-semibold active:scale-95 transition-transform"
          >
            Today
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="w-8 h-8 rounded-full bg-cream-card shadow-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight size={18} className="text-pink-primary" />
          </button>
        </div>
      </div>

      <p className="text-center text-lg font-bold text-pink-primary mb-4">{formatMonthYear(month)}</p>

      {/* Month grid */}
      <div className="card p-3 mb-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-ink-muted py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(({ date, inMonth }) => {
            const isSelected = date === selectedDate;
            const isToday = date === todayKey();
            const active = hasActivity(date);
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 ${
                  isSelected
                    ? 'bg-pink-primary text-white shadow-soft'
                    : inMonth
                    ? 'text-ink hover:bg-pink-soft/50'
                    : 'text-ink-muted/40'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isToday && !isSelected ? 'text-pink-primary font-bold' : ''
                  }`}
                >
                  {fromKey(date).getDate()}
                </span>
                {active && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-pink-primary'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Details */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wide mb-3">
          {fromKey(selectedDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>

        {/* Events */}
        <div className="card p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-ink">Events</h3>
            <button
              onClick={() => setEventEditor({ open: true })}
              className="w-7 h-7 rounded-full bg-pink-primary text-white flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus size={16} />
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="text-center text-ink-muted text-sm py-3">No events.</p>
          ) : (
            <div className="space-y-2">
              {dayEvents
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((e) => (
                  <div key={e.id} className="flex items-center gap-3 bg-pink-soft/40 rounded-2xl p-3">
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryColor[e.category] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{e.title}</p>
                      <p className="text-xs text-ink-muted flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(e.startTime)} - {formatTime(e.endTime)}
                      </p>
                    </div>
                    <button
                      onClick={() => setEventEditor({ open: true, event: e })}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteId(e.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted active:scale-90 transition-transform"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        {dayTasks.length > 0 && (
          <div className="card p-4 mb-3">
            <h3 className="text-sm font-bold text-ink mb-3">Today's Tasks</h3>
            <div className="space-y-2">
              {dayTasks
                .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
                .map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                        t.status === 'completed'
                          ? 'bg-pink-primary text-white'
                          : 'border-2 border-pink-secondary/50'
                      }`}
                    >
                      {t.status === 'completed' && (
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7l4 4 8-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${t.status === 'completed' ? 'task-done' : 'text-ink'}`}>
                      {t.title}
                    </span>
                    {t.time && <span className="text-xs text-ink-muted">{formatTime(t.time)}</span>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Important dates */}
        {dayImportant.length > 0 && (
          <div className="card p-4 mb-3">
            <h3 className="text-sm font-bold text-ink mb-3">Important Dates</h3>
            <div className="space-y-2">
              {dayImportant.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm text-ink">
                  <span className="w-2 h-2 rounded-full bg-pink-primary" />
                  <span className="font-medium">{i.title}</span>
                  <span className="text-ink-muted text-xs">· {i.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayTasks.length === 0 && dayEvents.length === 0 && dayImportant.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-ink-muted text-sm">Nothing scheduled for this day.</p>
          </div>
        )}
      </div>

      <EventEditor
        open={eventEditor.open}
        onClose={() => setEventEditor({ open: false })}
        onSave={saveEvent}
        event={eventEditor.event}
        defaultDate={selectedDate}
      />
      <ConfirmDialog
        open={!!deleteId}
        message="Are you sure you want to delete this event?"
        onConfirm={() => {
          if (deleteId) deleteEvent(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function EventEditor({
  open,
  onClose,
  onSave,
  event,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (e: EventItem) => void;
  event?: EventItem | null;
  defaultDate: string;
}) {
  const [form, setForm] = useState<Omit<EventItem, 'id' | 'createdAt'>>({
    title: '',
    date: defaultDate,
    startTime: '09:00',
    endTime: '10:00',
    category: 'Personal',
    notes: '',
    reminder: null,
  });

  useEffect(() => {
    if (open) {
      if (event) {
        const { id, createdAt, ...rest } = event;
        void id;
        void createdAt;
        setForm(rest);
      } else {
        setForm({
          title: '',
          date: defaultDate,
          startTime: '09:00',
          endTime: '10:00',
          category: 'Personal',
          notes: '',
          reminder: null,
        });
      }
    }
  }, [open, event, defaultDate]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      id: event?.id || uid(),
      createdAt: event?.createdAt || Date.now(),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? 'Edit Event' : 'Add Event'}
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
            disabled={!form.title.trim()}
            className="flex-1 py-3 rounded-pill bg-pink-primary text-white font-semibold active:scale-95 transition-transform shadow-soft disabled:opacity-50"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Event Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Event name..."
            className="input-field"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="input-field"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Start Time</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">End Time</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => set('endTime', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c: Category) => (
              <button
                key={c}
                onClick={() => set('category', c)}
                className={`chip ${
                  form.category === c ? 'bg-pink-primary text-white' : 'bg-pink-soft text-ink-muted'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Notes</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="input-field resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

void shortDayName;
