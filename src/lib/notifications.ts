import { useEffect, useRef } from 'react';
import type { AppData } from '@/types';
import { todayKey } from '@/lib/dates';

export function useNotifications(data: AppData) {
  const checkedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Don't auto-prompt; wait for user action
      return;
    }

    const check = () => {
      const now = new Date();
      const today = todayKey();

      for (const task of data.tasks) {
        if (task.status === 'completed' || !task.reminder || !task.time) continue;
        if (task.date !== today) continue;

        const reminderMin = parseInt(task.reminder, 10);
        const [th, tm] = task.time.split(':').map(Number);
        const taskMinutes = th * 60 + tm;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const reminderTime = taskMinutes - reminderMin;

        const checkKey = `${task.id}-${reminderTime}`;
        if (checkedRef.current.has(checkKey)) continue;

        if (nowMinutes >= reminderTime && nowMinutes <= reminderTime + 2) {
          checkedRef.current.add(checkKey);
          if (Notification.permission === 'granted') {
            new Notification('Planner Rieke Reminder', {
              body: `${task.title} ${task.time ? `at ${task.time}` : ''}`,
            });
          }
        }
      }

      for (const event of data.events) {
        if (!event.reminder || !event.startTime) continue;
        if (event.date !== today) continue;

        const reminderMin = parseInt(event.reminder, 10);
        const [eh, em] = event.startTime.split(':').map(Number);
        const eventMinutes = eh * 60 + em;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const reminderTime = eventMinutes - reminderMin;

        const checkKey = `${event.id}-${reminderTime}`;
        if (checkedRef.current.has(checkKey)) continue;

        if (nowMinutes >= reminderTime && nowMinutes <= reminderTime + 2) {
          checkedRef.current.add(checkKey);
          if (Notification.permission === 'granted') {
            new Notification('Planner Rieke Reminder', {
              body: `${event.title} at ${event.startTime}`,
            });
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [data.tasks, data.events]);
}

export function requestNotificationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('Notification' in window)) {
      resolve(false);
      return;
    }
    if (Notification.permission === 'granted') {
      resolve(true);
      return;
    }
    Notification.requestPermission().then((perm) => {
      resolve(perm === 'granted');
    });
  });
}
