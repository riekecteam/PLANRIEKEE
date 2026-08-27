export type Category =
  | 'Personal'
  | 'Work'
  | 'Business'
  | 'Study'
  | 'Health'
  | 'Family'
  | 'Other';

export type Priority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'todo' | 'completed';
export type Mood = 'amazing' | 'good' | 'okay' | 'not-good' | 'bad';
export type NoteColor = 'pink' | 'soft-pink' | 'white' | 'light-purple' | 'light-yellow';

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: Category;
  priority: Priority;
  status: TaskStatus;
  notes?: string;
  scope: 'daily' | 'weekly' | 'monthly';
  order?: number;
  reminder?: string | null;
  createdAt: number;
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  category: Category;
  notes?: string;
  reminder?: string | null;
  createdAt: number;
}

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: number;
}

export interface PriorityItem {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  scope: 'daily' | 'weekly' | 'monthly';
}

export interface WeeklyGoal {
  id: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  text: string;
  done: boolean;
}

export interface MonthlyGoal {
  id: string;
  month: string; // YYYY-MM
  name: string;
  deadline?: string; // YYYY-MM-DD
  status: 'todo' | 'in-progress' | 'completed';
  progress: number; // 0-100
}

export interface ImportantDate {
  id: string;
  month: string; // YYYY-MM
  title: string;
  date: string; // YYYY-MM-DD
  type: 'Birthday' | 'Meeting' | 'Deadline' | 'Event' | 'Appointment';
}

export interface DailyData {
  date: string;
  notes: string;
  mood: Mood | null;
  gratitude: [string, string, string];
}

export interface WeeklyData {
  weekStart: string;
  notes: string;
  nextWeekPreview: string;
}

export interface MonthlyData {
  month: string;
  notes: string;
  reflection: {
    wentWell: string;
    couldBeBetter: string;
    proudOf: string;
    nextMonth: string;
  };
}

export interface Settings {
  name: string;
  firstDayOfWeek: 'Sunday' | 'Monday';
  defaultReminder: string | null;
  onboarded: boolean;
}

export interface AppData {
  tasks: Task[];
  events: EventItem[];
  notes: StickyNote[];
  priorities: PriorityItem[];
  weeklyGoals: WeeklyGoal[];
  monthlyGoals: MonthlyGoal[];
  importantDates: ImportantDate[];
  daily: DailyData[];
  weekly: WeeklyData[];
  monthly: MonthlyData[];
  settings: Settings;
}
