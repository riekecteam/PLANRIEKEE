import type { Category, Priority, Mood, NoteColor } from '@/types';

export const CATEGORIES: Category[] = [
  'Personal', 'Work', 'Business', 'Study', 'Health', 'Family', 'Other',
];

export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'amazing', emoji: '😍', label: 'Amazing' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'not-good', emoji: '😔', label: 'Not Good' },
  { value: 'bad', emoji: '😭', label: 'Bad' },
];

export const NOTE_COLORS: { value: NoteColor; bg: string; label: string }[] = [
  { value: 'pink', bg: '#FFD6E8', label: 'Pink' },
  { value: 'soft-pink', bg: '#FFE4F0', label: 'Soft Pink' },
  { value: 'white', bg: '#FFFFFF', label: 'White' },
  { value: 'light-purple', bg: '#EDE0FF', label: 'Light Purple' },
  { value: 'light-yellow', bg: '#FFF8D6', label: 'Light Yellow' },
];

export const REMINDER_OPTIONS = [
  { value: '5', label: '5 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
];

export const categoryColor: Record<Category, string> = {
  Personal: '#F7559D',
  Work: '#5B8DEF',
  Business: '#9B59B6',
  Study: '#27AE60',
  Health: '#E67E22',
  Family: '#E74C3C',
  Other: '#95A5A6',
};

export const priorityDot: Record<Priority, string> = {
  High: '#F7559D',
  Medium: '#FF8FC2',
  Low: '#FFD6E8',
};
