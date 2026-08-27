import { Home, Calendar, NotebookPen, StickyNote, Settings, Image } from 'lucide-react';

export type Tab = 'home' | 'calendar' | 'planner' | 'moments' | 'notes' | 'settings';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const items: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'planner', label: 'Planner', Icon: NotebookPen },
  { id: 'moments', label: 'Moments', Icon: Image },
  { id: 'notes', label: 'Notes', Icon: StickyNote },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-cream-card/95 backdrop-blur-lg border-t border-pink-soft"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {items.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full active:scale-90 transition-transform"
              aria-label={label}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-pink-primary text-white shadow-soft scale-105' : 'text-ink-muted'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-pink-primary' : 'text-ink-muted'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
