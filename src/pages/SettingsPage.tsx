import { useState, useRef } from 'react';
import { Download, Upload, Trash2, User, Palette, Calendar, Bell, Info } from 'lucide-react';
import type { AppData } from '@/types';
import type { Settings as SettingsType } from '@/types';
import { REMINDER_OPTIONS } from '@/lib/constants';
import { STORAGE_KEY, emptyData } from '@/lib/store';
import ConfirmDialog from '@/components/ConfirmDialog';

interface SettingsPageProps {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  replaceAll: (data: AppData) => void;
}

export default function SettingsPage({ data, update, replaceAll }: SettingsPageProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) =>
    update((d) => {
      d.settings[key] = value;
      return d;
    });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner-rieke-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        const merged: AppData = {
          ...emptyData,
          ...parsed,
          settings: { ...emptyData.settings, ...parsed.settings },
        };
        replaceAll(merged);
        alert('Data imported successfully!');
      } catch {
        alert('Invalid file. Please select a valid Planner Rieke backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    replaceAll(emptyData);
    setConfirmClear(false);
  };

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
      <h1 className="text-xl font-bold text-ink mb-5">Settings</h1>

      {/* Profile */}
      <SettingGroup title="Profile" Icon={User}>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Name</label>
          <input
            type="text"
            value={data.settings.name}
            onChange={(e) => setSetting('name', e.target.value)}
            className="input-field"
          />
        </div>
      </SettingGroup>

      {/* Appearance */}
      <SettingGroup title="Appearance" Icon={Palette}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink">Theme</span>
          <div className="flex gap-2">
            <span className="chip bg-pink-primary text-white">Pink Theme</span>
            <span className="chip bg-pink-soft text-ink-muted">Light Mode</span>
          </div>
        </div>
      </SettingGroup>

      {/* Planner Settings */}
      <SettingGroup title="Planner Settings" Icon={Calendar}>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">First day of week</label>
          <div className="flex gap-2">
            {(['Sunday', 'Monday'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSetting('firstDayOfWeek', d)}
                className={`chip ${
                  data.settings.firstDayOfWeek === d
                    ? 'bg-pink-primary text-white'
                    : 'bg-pink-soft text-ink-muted'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </SettingGroup>

      {/* Default Reminder */}
      <SettingGroup title="Default Reminder" Icon={Bell}>
        <select
          value={data.settings.defaultReminder || ''}
          onChange={(e) => setSetting('defaultReminder', e.target.value || null)}
          className="input-field appearance-none"
        >
          <option value="">No reminder</option>
          {REMINDER_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </SettingGroup>

      {/* Data */}
      <SettingGroup title="Data" Icon={Download}>
        <div className="space-y-2">
          <button
            onClick={exportData}
            className="flex items-center gap-3 w-full bg-pink-soft/50 rounded-2xl p-3.5 active:scale-95 transition-transform"
          >
            <Download size={18} className="text-pink-primary" />
            <span className="text-sm font-medium text-ink flex-1 text-left">Export Data</span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 w-full bg-pink-soft/50 rounded-2xl p-3.5 active:scale-95 transition-transform"
          >
            <Upload size={18} className="text-pink-primary" />
            <span className="text-sm font-medium text-ink flex-1 text-left">Import Data</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={importData}
            className="hidden"
          />
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-3 w-full bg-red-50 rounded-2xl p-3.5 active:scale-95 transition-transform"
          >
            <Trash2 size={18} className="text-red-500" />
            <span className="text-sm font-medium text-red-500 flex-1 text-left">Clear All Data</span>
          </button>
        </div>
      </SettingGroup>

      {/* About */}
      <SettingGroup title="About" Icon={Info}>
        <div className="text-center py-2">
          <p className="text-lg font-bold text-pink-primary">Planner Rieke</p>
          <p className="text-sm text-ink-muted mt-1">Version 1.0.0</p>
          <p className="text-xs text-ink-muted mt-2">💗 Plan your days. Organize your thoughts. Make room for yourself.</p>
        </div>
      </SettingGroup>

      <ConfirmDialog
        open={confirmClear}
        message="Are you sure you want to delete ALL data? This cannot be undone."
        confirmText="Clear All"
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

function SettingGroup({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4 mb-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-pink-soft flex items-center justify-center">
          <Icon size={16} className="text-pink-primary" />
        </div>
        <h2 className="text-sm font-bold text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}
