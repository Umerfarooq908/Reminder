import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  ListChecks,
  LogOut,
  MapPin,
  Mic,
  MicOff,
  Menu,
  Plus,
  Sparkles,
  Sun,
  Target,
  Trash2,
  X,
} from "lucide-react";

type Language = "en" | "ur";
type Page = "today" | "week" | "month" | "assistant" | "checklist" | "progress" | "settings";
type Priority = "Low" | "Medium" | "High";
type Recurrence = "daily" | "weekly" | "monthly";
type RoutineActivity = { id: string; title: string; time: string; duration: number; recurrence: Recurrence; recurrenceDay: number; recurrenceDays: number[] };
type RoutineProfile = { sleepTime: string; wakeTime: string; workTitle: string; workStart: string; workEnd: string; workDays: number[]; activities: RoutineActivity[] };
type PlannerStep = "sleep" | "wake" | "work" | "activities" | "review";

type Task = {
  id: string;
  title: string;
  time: string;
  duration: number;
  category: string;
  color: string;
  done: boolean;
  doneDates?: string[];
  steps?: ChecklistStep[];
  assistantGenerated?: boolean;
  recurrence?: Recurrence;
  recurrenceDay?: number;
  recurrenceDays?: number[];
  fixed: boolean;
  priority: Priority;
  day: number;
};

type ChecklistStep = { id: string; title: string; doneDates: string[] };

type SpeechResultLike = { isFinal: boolean; 0: { transcript: string } };
type SpeechEventLike = Event & { resultIndex: number; results: ArrayLike<SpeechResultLike> };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type SpeechWindowLike = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type Labels = {
  today: string;
  week: string;
  checklist: string;
  progress: string;
  settings: string;
  greeting: string;
  tasks: string;
  add: string;
  completed: string;
  left: string;
  empty: string;
  save: string;
  cancel: string;
  taskTitle: string;
  time: string;
  duration: string;
  category: string;
  priority: string;
  fixed: string;
  name: string;
  welcome: string;
  start: string;
  language: string;
  upcoming: string;
  minutes: string;
  complete: string;
  delete: string;
  signout: string;
};

const labels: Record<Language, Labels> = {
  en: {
    today: "Today",
    week: "Week",
    checklist: "Checklist",
    progress: "Progress",
    settings: "Settings",
    greeting: "A little progress adds up.",
    tasks: "Your routine",
    add: "Add task",
    completed: "completed",
    left: "to go",
    empty: "No tasks yet. Add one to get started.",
    save: "Save task",
    cancel: "Cancel",
    taskTitle: "What do you need to do?",
    time: "Time",
    duration: "Duration (minutes)",
    category: "Category",
    priority: "Priority",
    fixed: "Fixed commitment",
    name: "Your name",
    welcome: "Welcome to Daywell",
    start: "Open my planner",
    language: "Language",
    upcoming: "Coming up",
    minutes: "min",
    complete: "Completion rate",
    delete: "Delete",
    signout: "Sign out",
  },
  ur: {
    today: "آج",
    week: "ہفتہ",
    checklist: "فہرست",
    progress: "پیش رفت",
    settings: "ترتیبات",
    greeting: "تھوڑی سی پیش رفت بھی اہم ہے۔",
    tasks: "آپ کے کام",
    add: "کام شامل کریں",
    completed: "مکمل",
    left: "باقی",
    empty: "ابھی کوئی کام نہیں۔ شروع کرنے کے لیے ایک شامل کریں۔",
    save: "محفوظ کریں",
    cancel: "منسوخ",
    taskTitle: "آپ کو کیا کرنا ہے؟",
    time: "وقت",
    duration: "دورانیہ (منٹ)",
    category: "قسم",
    priority: "ترجیح",
    fixed: "مقررہ وقت",
    name: "آپ کا نام",
    welcome: "Daywell میں خوش آمدید",
    start: "پلانر کھولیں",
    language: "زبان",
    upcoming: "اگلا کام",
    minutes: "منٹ",
    complete: "تکمیل کی شرح",
    delete: "حذف کریں",
    signout: "سائن آؤٹ",
  },
};

const routineCopy = {
  en: { title: "Let’s build your routine together", intro: "I’ll ask about sleep, wake-up, work, and each activity’s timing and repeat days.", sleep: "First, what time do you usually go to sleep?", sleepLabel: "Usual sleep time", wake: "Thanks. What time do you usually wake up?", wakeLabel: "Usual wake-up time", work: "Do you have regular work, school, or class hours? Enter the hours and days, or skip this.", activity: "What activities should I plan? Add each activity with its time and whether it is daily, on selected weekdays, or monthly.", activityName: "Activity name", frequency: "How often?", addActivity: "Add activity", review: "Review your routine", create: "Create full routine" },
  ur: { title: "آئیے مل کر آپ کا معمول بناتے ہیں", intro: "میں پہلے سونے، جاگنے، کام اور ہر سرگرمی کے وقت اور دن پوچھوں گا۔", sleep: "آپ عام طور پر کس وقت سوتے ہیں؟", sleepLabel: "سونے کا معمول کا وقت", wake: "شکریہ۔ آپ عام طور پر کس وقت جاگتے ہیں؟", wakeLabel: "جاگنے کا معمول کا وقت", work: "کیا آپ کے کام، اسکول یا کلاس کے مقررہ اوقات ہیں؟ وقت اور دن بتائیں یا چھوڑ دیں۔", activity: "کون سی سرگرمیاں شیڈول کروں؟ ہر سرگرمی کا وقت اور روزانہ، ہفتہ وار یا ماہانہ تکرار منتخب کریں۔", activityName: "سرگرمی کا نام", frequency: "کتنی بار؟", addActivity: "سرگرمی شامل کریں", review: "اپنا معمول دیکھیں", create: "پورا معمول بنائیں" },
} satisfies Record<Language, Record<string, string>>;

const starterTasks: Task[] = [];

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isTaskScheduledForDate(task: Task, date: Date): boolean {
  if (task.recurrence === "weekly") return task.recurrenceDays?.length ? task.recurrenceDays.includes(date.getDay()) : (task.recurrenceDay ?? 1) === date.getDay();
  if (task.recurrence === "monthly") {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Math.min(task.recurrenceDay ?? 1, lastDay) === date.getDate();
  }
  return true;
}

function isTaskDone(task: Task, key: string): boolean {
  return task.doneDates?.includes(key) ?? (key === dateKey(new Date()) && task.done);
}

type PrayerSettings = { city: string; country: string; method: string; school: string };
type PrayerData = { date: string; city: string; times: Record<string, string> };

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function clockMinutes(hour: number, minute = 0, suffix?: string): number {
  let adjusted = hour % 12;
  if (suffix?.toLowerCase() === "pm") adjusted += 12;
  return adjusted * 60 + minute;
}

function formatClock(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function checklistFor(category: string): ChecklistStep[] {
  const templates: Record<string, string[]> = {
    Study: ["Open the assignment or notes", "Work without distractions", "Review what is finished and note the next step"],
    Work: ["Choose the most important work item", "Complete a focused work block", "Review and record the next action"],
    Prayer: ["Prepare for prayer", "Pray at the scheduled time", "Mark this prayer complete"],
    Reading: ["Choose a book or passage", "Read for the planned time", "Save one thought or page number"],
    Wellbeing: ["Get ready and take water", "Walk, stretch, or exercise", "Cool down and note how you feel"],
    Rest: ["Set a gentle alarm", "Rest away from distractions", "Get up slowly and drink water"],
    Personal: ["Get the items you need", "Complete the task", "Mark it done and prepare the next step"],
    Meals: ["Prepare a simple meal", "Eat without rushing", "Drink water and tidy up"],
  };
  return (templates[category] ?? templates.Personal).map((title) => ({ id: makeId(), title, doneDates: [] }));
}

function buildRoutinePlan(request: string, prayerData: PrayerData | null): Task[] {
  const text = request.toLowerCase();
  const has = (pattern: RegExp) => pattern.test(text);
  const fixed: Task[] = [];
  const flexible: { title: string; category: string; duration: number; preferred: number; priority: Priority }[] = [];
  const addFlexible = (title: string, category: string, duration: number, preferred: number, priority: Priority = "Medium") => {
    flexible.push({ title, category, duration, preferred, priority });
  };

  const wakeMatch = /(?:wake(?:\s+up)?|get\s+up|uth(?:na)?|subah\s+uth)\D{0,12}(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?/i.exec(text);
  const sleepMatch = /(?:sleep|bed|sona|so\s+jana|sone)\D{0,12}(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?/i.exec(text);
  const wakeTime = wakeMatch ? clockMinutes(Number(wakeMatch[1]), Number(wakeMatch[2] ?? 0), wakeMatch[3]) : 7 * 60;
  const bedtime = sleepMatch ? clockMinutes(Number(sleepMatch[1]), Number(sleepMatch[2] ?? 0), sleepMatch[3]) : 22 * 60;
  const workOrStudy = has(/work|office|job|school|class|study|assignment|exam|parhai|kaam|homework|imtihan/);
  const workRange = /(?:from\s*)?(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\s*(?:-|to|until|till)\s*(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?/i.exec(text);
  let workEnd = 0;
  if (workOrStudy && workRange) {
    const start = clockMinutes(Number(workRange[1]), Number(workRange[2] ?? 0), workRange[3]);
    let end = clockMinutes(Number(workRange[4]), Number(workRange[5] ?? 0), workRange[6] ?? workRange[3]);
    if (!workRange[6] && end <= start) end += 12 * 60;
    if (end <= start) end += 24 * 60;
    const category = has(/office|job|work|kaam/) ? "Work" : "Study";
    const title = category === "Work" ? "Work / office commitment" : "Class / study commitment";
    fixed.push({ id: makeId(), title, time: formatClock(start), duration: end - start, category, color: category === "Study" ? "violet" : "green", done: false, fixed: true, priority: "High", day: 0, assistantGenerated: true, steps: checklistFor(category) });
    workEnd = end % 1440;
  }

  addFlexible("Morning routine and plan", "Personal", 15, wakeTime + 10);
  addFlexible("Breakfast and water", "Meals", 25, wakeTime + 35);
  if (workOrStudy && !workRange) addFlexible(has(/office|job|work|kaam/) ? "Focused work block" : "Focused study block", has(/office|job|work|kaam/) ? "Work" : "Study", 75, Math.max(9 * 60, wakeTime + 100), "High");
  if (!workOrStudy) addFlexible("Focus on your top priority", "Personal", 50, Math.max(9 * 60, wakeTime + 100), "High");

  const prayerRequested = has(/prayer|salah|namaz|fajr|zuhr|dhuhr|asr|maghrib|isha|namaz|salah/);
  if (prayerData || prayerRequested) {
    if (prayerData) {
      for (const prayer of ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]) {
        const time = prayerData.times[prayer]?.slice(0, 5);
        if (!time) continue;
        fixed.push({ id: `prayer-${prayer.toLowerCase()}`, title: `${prayer} prayer`, time, duration: 15, category: "Prayer", color: "gold", done: false, fixed: true, priority: "High", day: 0, assistantGenerated: true, steps: checklistFor("Prayer") });
      }
    } else {
      addFlexible("Prayer times · set your city in Settings", "Prayer", 15, 12 * 60, "High");
    }
  }

  const quran = has(/qur.?an|tilawat|quran parh/);
  const reading = has(/read|book|reading|kitab|parhna/) || quran;
  if (quran) addFlexible("Quran reading", "Reading", 20, wakeTime + 60);
  if (reading) addFlexible(quran && has(/book|kitab/) ? "Read a book" : "Reading time", "Reading", 25, 20 * 60);
  if (has(/exercise|walk|gym|outdoor|sport|football|khel|activity/)) addFlexible("Outdoor activity or exercise", "Wellbeing", 35, 17 * 60);
  else addFlexible("Movement break · suggested", "Wellbeing", 20, 17 * 60);
  if (has(/podcast|audio/)) addFlexible("Listen to a podcast", "Personal", 30, 19 * 60);
  if (has(/friend|dost|call|talk|baat/)) addFlexible("Call or meet a friend", "Personal", 30, 18 * 60);
  if (has(/nap|rest|break|araam|aram|thakan/)) addFlexible("Rest or short nap", "Rest", 25, 14 * 60);
  else addFlexible("Take a proper rest break · suggested", "Rest", 20, 14 * 60);

  addFlexible("Lunch and a screen break", "Meals", 40, 13 * 60);
  addFlexible("Prepare for tomorrow", "Personal", 10, Math.max(21 * 60, bedtime - 45));
  addFlexible("Wind down and get ready for sleep", "Rest", 20, bedtime - 20);

  const occupied: { start: number; end: number }[] = fixed.map((task) => {
    const [h, m] = task.time.split(":").map(Number);
    return { start: h * 60 + m, end: h * 60 + m + task.duration };
  });
  const planned: Task[] = [...fixed];
  for (const activity of flexible) {
    let start = Math.max(wakeTime, activity.preferred);
    const latest = Math.min(bedtime - activity.duration, 23 * 60);
    while (start <= latest && occupied.some((block) => start < block.end && start + activity.duration > block.start)) start += 15;
    if (start > latest) continue;
    occupied.push({ start, end: start + activity.duration });
    planned.push({ id: makeId(), title: activity.title, time: formatClock(start), duration: activity.duration, category: activity.category, color: activity.category === "Prayer" ? "gold" : activity.category === "Study" ? "violet" : activity.category === "Rest" ? "blue" : "green", done: false, fixed: false, priority: activity.priority, day: 0, assistantGenerated: true, steps: checklistFor(activity.category) });
  }
  return planned.sort((a, b) => a.time.localeCompare(b.time));
}

function categoryForActivity(title: string): string {
  const value = title.toLowerCase();
  if (/prayer|namaz|salah|fajr|dhuhr|asr|maghrib|isha/.test(value)) return "Prayer";
  if (/study|class|school|assignment|exam|parhai/.test(value)) return "Study";
  if (/office|work|job|kaam/.test(value)) return "Work";
  if (/read|book|quran|qur.?an|tilawat|kitab/.test(value)) return "Reading";
  if (/walk|sport|gym|exercise|outdoor|football|khel/.test(value)) return "Wellbeing";
  if (/rest|nap|sleep|break|aram|araam/.test(value)) return "Rest";
  if (/meal|lunch|breakfast|dinner|food/.test(value)) return "Meals";
  return "Personal";
}

function buildRoutineFromAnswers(profile: RoutineProfile, prayerData: PrayerData | null): Task[] {
  const tasks: Task[] = [];
  const add = (title: string, time: string, duration: number, category: string, recurrence: Recurrence = "daily", recurrenceDays?: number[], recurrenceDay?: number, fixed = false) => {
    tasks.push({ id: makeId(), title, time, duration, category, color: category === "Prayer" ? "gold" : category === "Study" ? "violet" : category === "Rest" ? "blue" : "green", done: false, fixed, priority: category === "Prayer" || category === "Study" || category === "Work" ? "High" : "Medium", day: 0, recurrence, recurrenceDays, recurrenceDay, assistantGenerated: true, steps: checklistFor(category) });
  };
  const bedMinutes = Number(profile.sleepTime.slice(0, 2)) * 60 + Number(profile.sleepTime.slice(3, 5));
  add("Wake up and get ready", profile.wakeTime, 20, "Personal", "daily", undefined, undefined, true);
  add("Wind down for sleep", formatClock(bedMinutes - 30), 30, "Rest", "daily", undefined, undefined, true);
  if (profile.workTitle.trim() && profile.workDays.length) {
    const start = Number(profile.workStart.slice(0, 2)) * 60 + Number(profile.workStart.slice(3, 5));
    let end = Number(profile.workEnd.slice(0, 2)) * 60 + Number(profile.workEnd.slice(3, 5));
    if (end <= start) end += 1440;
    const category = categoryForActivity(profile.workTitle);
    add(profile.workTitle.trim(), profile.workStart, end - start, category, "weekly", profile.workDays, undefined, true);
  }
  for (const activity of profile.activities) add(activity.title, activity.time, activity.duration, categoryForActivity(activity.title), activity.recurrence, activity.recurrence === "weekly" ? activity.recurrenceDays : undefined, activity.recurrence === "monthly" ? activity.recurrenceDay : undefined);
  if (prayerData && !profile.activities.some((activity) => categoryForActivity(activity.title) === "Prayer")) {
    for (const prayer of ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]) if (prayerData.times[prayer]) add(`${prayer} prayer`, prayerData.times[prayer].slice(0, 5), 15, "Prayer", "daily", undefined, undefined, true);
  }
  if (!profile.activities.some((activity) => categoryForActivity(activity.title) === "Meals")) add("Lunch and a screen break · suggested", "13:00", 40, "Meals");
  if (!profile.activities.some((activity) => categoryForActivity(activity.title) === "Wellbeing")) add("Movement break · suggested", "17:00", 20, "Wellbeing");
  return tasks.sort((a, b) => a.time.localeCompare(b.time));
}

function readTasks(): Task[] {
  try {
    const savedTasks = localStorage.getItem("dw-tasks");
    const parsed = savedTasks ? (JSON.parse(savedTasks) as Task[]) : starterTasks;
    return parsed.filter((task) => !["task-1", "task-2", "task-3", "task-4", "task-5"].includes(task.id));
  } catch {
    return starterTasks;
  }
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("dw-lang") === "ur" ? "ur" : "en",
  );
  const [name, setName] = useState(() => localStorage.getItem("dw-name") ?? "");
  const [signedIn, setSignedIn] = useState(
    () => localStorage.getItem("dw-user") === "yes",
  );
  const [tasks, setTasks] = useState<Task[]>(readTasks);
  const [page, setPage] = useState<Page>("today");
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [assistantPrompt, setAssistantPrompt] = useState(() => localStorage.getItem("dw-routine-preferences") ?? "");
  const [rememberRoutine, setRememberRoutine] = useState(true);
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantPlan, setAssistantPlan] = useState<Task[]>([]);
  const [plannerStep, setPlannerStep] = useState<PlannerStep>("sleep");
  const [routineProfile, setRoutineProfile] = useState<RoutineProfile>(() => readStored("dw-routine-profile", { sleepTime: "", wakeTime: "", workTitle: "", workStart: "09:00", workEnd: "17:00", workDays: [1, 2, 3, 4, 5], activities: [] }));
  const [activityDraft, setActivityDraft] = useState({ title: "", time: "09:00", duration: "30", recurrence: "daily" as Recurrence, recurrenceDay: 1, recurrenceDays: [new Date().getDay()] });
  const [isListening, setIsListening] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState("");
  const speechRecognition = useRef<SpeechRecognitionLike | null>(null);
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>(() => readStored("dw-prayer-settings", { city: "", country: "", method: "1", school: "1" }));
  const [prayerData, setPrayerData] = useState<PrayerData | null>(() => readStored("dw-prayer-times", null));
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem("dw-reminders") === "yes");
  const firedReminders = useRef<Set<string>>(new Set(readStored<string[]>("dw-fired-reminders", [])));
  const serviceWorkerReady = useRef<Promise<ServiceWorkerRegistration> | null>(null);

  const [form, setForm] = useState({
    title: "",
    time: "09:00",
    duration: "30",
    category: "Personal",
    priority: "Medium" as Priority,
    fixed: false,
    recurrence: "daily" as Recurrence,
    recurrenceDay: new Date().getDay(),
  });

  const text = labels[language];
  const routineText = routineCopy[language];
  const routineDays = language === "ur"
    ? [{ id: 1, name: "پیر" }, { id: 2, name: "منگل" }, { id: 3, name: "بدھ" }, { id: 4, name: "جمعرات" }, { id: 5, name: "جمعہ" }, { id: 6, name: "ہفتہ" }, { id: 0, name: "اتوار" }]
    : [{ id: 1, name: "Mon" }, { id: 2, name: "Tue" }, { id: 3, name: "Wed" }, { id: 4, name: "Thu" }, { id: 5, name: "Fri" }, { id: 6, name: "Sat" }, { id: 0, name: "Sun" }];

  useEffect(() => {
    localStorage.setItem("dw-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("dw-routine-profile", JSON.stringify(routineProfile));
  }, [routineProfile]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      serviceWorkerReady.current = navigator.serviceWorker.register("/Reminder/sw.js").then(() => navigator.serviceWorker.ready);
      serviceWorkerReady.current.catch(() => undefined);
    }
  }, []);

  useEffect(() => () => speechRecognition.current?.stop(), []);

  useEffect(() => {
    localStorage.setItem("dw-prayer-settings", JSON.stringify(prayerSettings));
  }, [prayerSettings]);

  useEffect(() => {
    if (prayerData) localStorage.setItem("dw-prayer-times", JSON.stringify(prayerData));
  }, [prayerData]);

  useEffect(() => {
    localStorage.setItem("dw-reminders", remindersEnabled ? "yes" : "no");
  }, [remindersEnabled]);

  useEffect(() => {
    if (!remindersEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
    const check = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      for (const task of tasks) {
        const key = `${dateKey(now)}:${task.id}`;
        if (isTaskScheduledForDate(task, now) && task.time === currentTime && !isTaskDone(task, dateKey(now)) && !firedReminders.current.has(key)) {
          firedReminders.current.add(key);
          localStorage.setItem("dw-fired-reminders", JSON.stringify([...firedReminders.current]));
          serviceWorkerReady.current?.then((registration) => registration.showNotification(`Daywell · ${task.title}`, { body: `It’s time for your ${task.category.toLowerCase()} task.` })).catch(() => undefined);
        }
      }
    };
    check();
    const timer = window.setInterval(check, 15000);
    return () => window.clearInterval(timer);
  }, [remindersEnabled, tasks]);

  useEffect(() => {
    localStorage.setItem("dw-lang", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  }, [language]);

  const todayKey = dateKey(new Date());
  const monthDays = useMemo(() => Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate() }, (_, index) => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), index + 1)), [selectedMonth]);
  const monthTasks = useMemo(() => tasks.filter((task) => monthDays.some((day) => isTaskScheduledForDate(task, day))), [tasks, monthDays]);
  const weekDates = useMemo(() => {
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index));
  }, []);
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((task) => isTaskScheduledForDate(task, new Date()))
        .map((task) => ({ ...task, done: isTaskDone(task, todayKey) }))
        .sort((first, second) => first.time.localeCompare(second.time)),
    [tasks, todayKey],
  );

  const completedCount = todayTasks.filter((task) => task.done).length;
  const completionRate =
    todayTasks.length === 0
      ? 0
      : Math.round((completedCount / todayTasks.length) * 100);

  const navigation: { id: Page; label: string }[] = [
    { id: "today", label: text.today },
    { id: "week", label: text.week },
    { id: "month", label: "Monthly sheet" },
    { id: "assistant", label: "AI assistant" },
    { id: "checklist", label: text.checklist },
    { id: "progress", label: text.progress },
    { id: "settings", label: text.settings },
  ];

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim() || "Friend";
    setName(cleanName);
    setSignedIn(true);
    localStorage.setItem("dw-name", cleanName);
    localStorage.setItem("dw-user", "yes");
  }

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) return;

    const newTask: Task = {
      id: makeId(),
      title,
      time: form.time,
      duration: Number(form.duration) || 30,
      category: form.category,
      color:
        form.category === "Prayer"
          ? "gold"
          : form.category === "Study"
            ? "violet"
            : form.category === "Rest"
              ? "blue"
              : "green",
      done: false,
      fixed: form.fixed,
      priority: form.priority,
      day: 0,
      recurrence: form.recurrence,
      recurrenceDay: form.recurrenceDay,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
    setForm((currentForm) => ({ ...currentForm, title: "" }));
    setShowForm(false);
    notify("Task added");
  }

  function toggleTask(id: string) {
    toggleTaskForDate(id, todayKey);
  }

  function toggleTaskForDate(id: string, key: string) {
    setTasks((currentTasks) => currentTasks.map((task) => {
      if (task.id !== id) return task;
      const doneDates = new Set(task.doneDates ?? []);
      const wasDone = isTaskDone(task, key);
      if (wasDone) doneDates.delete(key); else doneDates.add(key);
      return { ...task, done: key === todayKey ? !wasDone : task.done, doneDates: [...doneDates] };
    }));
  }

  function toggleChecklistStep(taskId: string, stepId: string, key: string) {
    setTasks((current) => current.map((task) => task.id !== taskId ? task : {
      ...task,
      steps: task.steps?.map((step) => {
        if (step.id !== stepId) return step;
        const dates = new Set(step.doneDates);
        if (dates.has(key)) dates.delete(key); else dates.add(key);
        return { ...step, doneDates: [...dates] };
      }),
    }));
  }

  async function enableReminders() {
    if (!("Notification" in window)) {
      notify("This browser does not support notifications");
      return;
    }
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission === "granted") {
      setRemindersEnabled(true);
      notify("Reminders enabled while Daywell is open");
    } else {
      notify("Allow notifications in your browser settings to continue");
    }
  }

  async function loadPrayerTimes(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const city = prayerSettings.city.trim();
    const country = prayerSettings.country.trim();
    if (!city || !country) {
      notify("Enter a city and country first");
      return;
    }
    try {
      const now = new Date();
      const apiDate = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
      const query = new URLSearchParams({ city, country, method: prayerSettings.method, school: prayerSettings.school });
      const response = await fetch(`https://api.aladhan.com/v1/timingsByCity/${apiDate}?${query}`);
      if (!response.ok) throw new Error("Prayer time service is unavailable");
      const json = await response.json();
      if (json.code !== 200 || !json.data?.timings) throw new Error("Could not find prayer times for that city");
      const timings = json.data.timings as Record<string, string>;
      setPrayerData({ date: todayKey, city: `${city}, ${country}`, times: timings });
      const prayerTasks: Task[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => ({
        id: `prayer-${prayer.toLowerCase()}`, title: `${prayer} prayer`, time: timings[prayer].slice(0, 5), duration: 15,
        category: "Prayer", color: "gold", done: false, fixed: true, priority: "High", day: 0,
      }));
      setTasks((existing) => [...existing.filter((task) => !task.id.startsWith("prayer-")), ...prayerTasks]);
      notify("Prayer times updated for today");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not load prayer times");
    }
  }

  function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = assistantPrompt.trim() || localStorage.getItem("dw-routine-preferences") ||
      tasks.map((task) => `${task.title} at ${task.time}`).join("; ") ||
      "Plan a balanced day with focused work, meals, movement, breaks, and a bedtime routine.";
    if (rememberRoutine && assistantPrompt.trim()) localStorage.setItem("dw-routine-preferences", assistantPrompt.trim());
    const plan = buildRoutinePlan(request, prayerData);
    setAssistantPlan(plan);
    setTasks((current) => {
      const planIds = new Set(plan.map((task) => task.id));
      const oldById = new Map(current.map((task) => [task.id, task]));
      const retained = current.filter((task) => !task.assistantGenerated && !planIds.has(task.id));
      const withSavedPrayerProgress = plan.map((task) => {
        const old = oldById.get(task.id);
        return old ? { ...task, done: old.done, doneDates: old.doneDates } : task;
      });
      return [...retained, ...withSavedPrayerProgress];
    });
    const prayerNote = /prayer|namaz|salah|fajr|zuhr|dhuhr|asr|maghrib|isha/i.test(request) && !prayerData
      ? " Add your city in Settings to insert accurate local prayer times."
      : "";
    setAssistantReply(`I scheduled ${plan.length} tasks around the routine you described, created step-by-step checklist items, and added a few balance suggestions. Your new plan is already in Today and Checklist.${prayerNote}`);
    notify(`${plan.length} tasks and checklists added to your day`);
  }

  function addRoutineActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = activityDraft.title.trim();
    if (!title) return;
    if (activityDraft.recurrence === "weekly" && !activityDraft.recurrenceDays.length) {
      notify("Choose at least one day for a weekly activity");
      return;
    }
    const activity: RoutineActivity = { ...activityDraft, id: makeId(), title, duration: Number(activityDraft.duration) || 30 };
    setRoutineProfile((profile) => ({ ...profile, activities: [...profile.activities, activity] }));
    setActivityDraft((draft) => ({ ...draft, title: "" }));
    notify("Activity added");
  }

  function saveRoutinePlan() {
    if (!routineProfile.sleepTime || !routineProfile.wakeTime) {
      setPlannerStep(!routineProfile.sleepTime ? "sleep" : "wake");
      notify("Answer the sleep and wake-up questions first");
      return;
    }
    if (routineProfile.workTitle.trim() && (!routineProfile.workDays.length || routineProfile.workStart === routineProfile.workEnd)) {
      setPlannerStep("work");
      notify("Choose work days and different start and end times");
      return;
    }
    const plan = buildRoutineFromAnswers(routineProfile, prayerData);
    setAssistantPlan(plan);
    setTasks((current) => {
      const matches = new Map(current.filter((task) => task.assistantGenerated).map((task) => [`${task.title}|${task.time}|${task.recurrence}|${(task.recurrenceDays ?? []).join(",")}|${task.recurrenceDay ?? ""}`, task]));
      const ids = new Set(plan.map((task) => task.id));
      const manual = current.filter((task) => !task.assistantGenerated && !ids.has(task.id));
      const generated = plan.map((task) => {
        const previous = matches.get(`${task.title}|${task.time}|${task.recurrence}|${(task.recurrenceDays ?? []).join(",")}|${task.recurrenceDay ?? ""}`);
        if (!previous) return task;
        const previousSteps = new Map((previous.steps ?? []).map((step) => [step.title, step]));
        return { ...task, id: previous.id, done: previous.done, doneDates: previous.doneDates, steps: task.steps?.map((step) => previousSteps.get(step.title) ?? step) };
      });
      return [...manual, ...generated];
    });
    setAssistantReply(`Your routine is saved with ${plan.length} tasks and step-by-step checklists. It includes your selected days and times; you can edit each task any time.`);
    notify("Full routine and checklists saved");
  }

  function toggleVoiceNote(target: "activity" | "notes" = "activity") {
    if (isListening) {
      speechRecognition.current?.stop();
      setIsListening(false);
      return;
    }
    const speechWindow = window as SpeechWindowLike;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify("Voice input is not supported in this browser. Try an updated Chrome or Edge browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === "ur" ? "ur-PK" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const part = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += part;
        else interimText += part;
      }
      if (finalText.trim()) {
        if (target === "activity") setActivityDraft((current) => ({ ...current, title: `${current.title.trim()}${current.title.trim() ? " " : ""}${finalText.trim()}` }));
        else setAssistantPrompt((current) => `${current.trim()}${current.trim() ? " " : ""}${finalText.trim()}`);
      }
      setVoiceInterim(interimText);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      const message = event.error === "not-allowed" ? "Allow microphone access in your browser to dictate." : event.error === "language-not-supported" ? "Speech recognition for this language is not available in this browser." : "Voice recognition stopped. You can still type your routine.";
      notify(message);
    };
    recognition.onend = () => {
      setIsListening(false);
      setVoiceInterim("");
      speechRecognition.current = null;
    };
    speechRecognition.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      notify("Could not start the microphone. Please try again.");
    }
  }

  function removeTask(id: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id),
    );
  }

  function signOut() {
    localStorage.removeItem("dw-user");
    setSignedIn(false);
  }

  if (!signedIn) {
    return (
      <main className="login-wrap">
        <section className="login-card">
          <Brand />
          <div className="welcome-icon">
            <Sparkles size={24} />
          </div>
          <p className="eyebrow">A LITTLE SPACE FOR YOUR DAY</p>
          <h1>{text.welcome}</h1>
          <p className="muted center">
            Make time for what matters, one small step at a time.
          </p>

          <form className="login-form" onSubmit={handleSignIn}>
            <label>
              {text.name}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Ayesha"
              />
            </label>
            <button className="primary full" type="submit">
              {text.start}
              <ChevronRight size={17} />
            </button>
          </form>

          <div className="trial-box">
            <Sparkles size={17} />
            <div>
              <b>7-day free trial · No card required</b>
              <small>Then $1 for your first month, $5/month after</small>
            </div>
          </div>

          <label className="language-row">
            <span>{text.language}</span>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as Language)
              }
            >
              <option value="en">English</option>
              <option value="ur">اردو</option>
            </select>
          </label>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="side-top">
          <Brand />
          <button
            className="icon-btn mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <div className="profile">
          <div className="avatar">{name.charAt(0).toUpperCase()}</div>
          <div>
            <b>{name}</b>
            <small>Personal planner</small>
          </div>
        </div>

        <p className="nav-label">YOUR SPACE</p>
        <nav>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => {
                setPage(item.id);
                setMenuOpen(false);
              }}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="side-spacer" />
        <div className="side-bottom">
          <span>Your day, your pace</span>
          <button
            className="icon-btn"
            onClick={signOut}
            title={text.signout}
            aria-label={text.signout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div className="crumb">
            Daywell <ChevronRight size={14} />
            <b>{navigation.find((item) => item.id === page)?.label}</b>
          </div>

          <div className="top-actions">
            <button
              className="language-chip"
              onClick={() =>
                setLanguage(language === "en" ? "ur" : "en")
              }
            >
              <Globe2 size={16} />
              {language === "en" ? "EN" : "اردو"}
            </button>
            <button
              className="icon-btn notification"
              onClick={enableReminders}
              aria-label="Notifications"
              title="Enable reminders"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        <section className="content">
          <div className="hello-row">
            <div>
              <p className="eyebrow">
                {new Intl.DateTimeFormat(
                  language === "ur" ? "ur-PK" : "en-US",
                  { weekday: "long", month: "long", day: "numeric" },
                ).format(new Date())}
              </p>
              <h1>
                {page === "today"
                  ? `Good day, ${name} ☀️`
                  : navigation.find((item) => item.id === page)?.label}
              </h1>
              <p className="muted">
                {page === "today"
                  ? text.greeting
                  : "Your routine at a glance."}
              </p>
            </div>

            <button
              className="primary add-top"
              onClick={() => setShowForm(true)}
            >
              <Plus size={17} />
              {text.add}
            </button>
          </div>

          {page === "today" && (
            <>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon green-icon">
                    <Check size={17} />
                  </div>
                  <div>
                    <small>{text.complete}</small>
                    <b>{completionRate}%</b>
                    <span>
                      {completedCount} {text.completed} ·{" "}
                      {todayTasks.length - completedCount} {text.left}
                    </span>
                  </div>
                  <div
                    className="ring"
                    style={
                      { "--percent": `${completionRate * 3.6}deg` } as CSSProperties
                    }
                  >
                    <b>{completionRate}%</b>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon violet-icon">
                    <Clock3 size={17} />
                  </div>
                  <div>
                    <small>Focus time</small>
                    <b>2h 35m</b>
                    <span>Across your planned tasks</span>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon gold-icon">✦</div>
                  <div>
                    <small>Consistency</small>
                    <b>4 days</b>
                    <span>You’re building a rhythm</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <section className="panel routine-panel">
                  <div className="panel-head">
                    <div>
                      <h2>{text.tasks}</h2>
                      <p>{todayTasks.length} tasks planned</p>
                    </div>
                    <button
                      className="primary"
                      onClick={() => setShowForm(true)}
                    >
                      <Plus size={16} />
                      {text.add}
                    </button>
                  </div>

                  <div className="view-tabs">
                    {(["today", "week", "checklist"] as Page[]).map((item) => (
                      <button
                        key={item}
                        className={page === item ? "selected" : ""}
                        onClick={() => setPage(item)}
                      >
                        {navigation.find((navItem) => navItem.id === item)?.label}
                      </button>
                    ))}
                  </div>

                  <div className="task-list">
                    {todayTasks.length === 0 ? (
                      <div className="empty">{text.empty}</div>
                    ) : (
                      todayTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          text={text}
                          onToggle={toggleTask}
                          onDelete={removeTask}
                        />
                      ))
                    )}
                  </div>
                </section>

                <aside className="right-column">
                  <section className="panel ai-panel">
                    <div className="ai-top">
                      <div className="ai-icon">
                        <Sparkles size={18} />
                      </div>
                    <span className="beta">ROUTINE ASSISTANT</span>
                    </div>
                    <h3>Make room for what matters.</h3>
                    <p>Tell the assistant what matters today and get a suggested plan.</p>
                    <button
                      className="primary full"
                      onClick={() => setPage("assistant")}
                    >
                      <Bot size={16} />
                      Open assistant
                    </button>
                  </section>

                  {prayerData && (
                    <section className="panel prayer-panel">
                      <div className="panel-head compact"><div><h3>Prayer times</h3><p><MapPin size={12} /> {prayerData.city}</p></div><Sun size={17} /></div>
                      <div className="prayer-times">
                        {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => <div key={prayer}><span>{prayer}</span><b>{prayerData.times[prayer]?.slice(0, 5) ?? "—"}</b></div>)}
                      </div>
                      <small className="muted">Times are estimates; confirm with your local mosque.</small>
                    </section>
                  )}

                  <section className="panel next-panel">
                    <div className="panel-head compact">
                      <div>
                        <h3>{text.upcoming}</h3>
                        <p>Your next task</p>
                      </div>
                      <Clock3 size={17} />
                    </div>

                    {todayTasks.find((task) => !task.done) ? (
                      <div className="next-task">
                        <div className="category-mark green" />
                        <div>
                          <b>
                            {todayTasks.find((task) => !task.done)?.title}
                          </b>
                          <small>
                            {todayTasks.find((task) => !task.done)?.duration}{" "}
                            {text.minutes}
                          </small>
                        </div>
                        <time>
                          {todayTasks.find((task) => !task.done)?.time}
                        </time>
                      </div>
                    ) : (
                      <p className="muted">All done for today. Take a breath.</p>
                    )}
                  </section>
                </aside>
              </div>
            </>
          )}

          {page === "week" && (
            <section className="panel full-panel">
              <div className="panel-head">
                <div>
                  <h2>{text.week}</h2>
                  <p>Your tasks for the week</p>
                </div>
                <CalendarDays size={20} />
              </div>
              <div className="week-grid">
                {weekDates.map((day) => (
                  <div className="week-day" key={dateKey(day)}>
                    <small>{new Intl.DateTimeFormat(language === "ur" ? "ur-PK" : "en-US", { weekday: "short" }).format(day)}</small>
                    <b>{day.getDate()}</b>
                    <span>{tasks.filter((task) => isTaskScheduledForDate(task, day)).length} tasks</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {page === "month" && (
            <section className="panel full-panel month-panel">
              <div className="panel-head">
                <div><h2>Monthly completion sheet</h2><p>Tap a past or today cell to mark it complete or missed.</p></div>
                <div className="month-controls">
                  <button className="outline icon-btn" aria-label="Previous month" onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
                  <b>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(selectedMonth)}</b>
                  <button className="outline icon-btn" aria-label="Next month" onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
                </div>
              </div>
              <div className="sheet-legend"><span><i className="sheet-done">✓</i> Done</span><span><i className="sheet-missed">×</i> Not done</span><span>— Future date</span></div>
              <div className="month-table-wrap">
                <table className="month-table">
                  <thead><tr><th className="task-heading">Task</th>{monthDays.map((day) => <th key={dateKey(day)}>{day.getDate()}</th>)}</tr></thead>
                  <tbody>{monthTasks.map((task) => <tr key={task.id}>
                    <th className="task-heading"><b>{task.title}</b><small>{task.time} · {task.category} · {task.recurrence ?? "daily"}</small></th>
                    {monthDays.map((day) => {
                      const key = dateKey(day);
                      const scheduled = isTaskScheduledForDate(task, day);
                      const done = isTaskDone(task, key);
                      const future = key > todayKey;
                      return <td key={key}><button className={`sheet-cell ${!scheduled || future ? "sheet-future" : done ? "sheet-done" : "sheet-missed"}`} disabled={!scheduled || future} onClick={() => toggleTaskForDate(task.id, key)} aria-label={`${task.title}, ${key}: ${!scheduled ? "not scheduled" : done ? "done" : future ? "future" : "not done"}`}>{!scheduled || future ? "—" : done ? "✓" : "×"}</button></td>;
                    })}
                  </tr>)}</tbody>
                </table>
                {monthTasks.length === 0 && <div className="empty">Add tasks to see them in your monthly sheet.</div>}
              </div>
              <p className="muted month-note">Your completion history is saved in this browser. Weekly and monthly tasks appear only on their scheduled dates.</p>
            </section>
          )}

          {page === "assistant" && (
            <section className="panel full-panel assistant-page">
              <div className="assistant-title"><div className="ai-icon"><Bot size={20} /></div><div><h2>{routineText.title}</h2><p>{routineText.intro}</p></div></div>
              <div className="assistant-disclosure">Answer each step. Your usual routine is saved on this device. Review the complete schedule before adding it.</div>
              <div className="routine-stepper">{["sleep", "wake", "work", "activities", "review"].map((step, index) => <span key={step} className={plannerStep === step ? "current" : ""}>{index + 1}. {step === "work" ? "Work / study" : step}</span>)}</div>

              {plannerStep === "sleep" && <div className="routine-question"><span className="assistant-bubble">{routineText.sleep}</span><label>{routineText.sleepLabel}<input type="time" value={routineProfile.sleepTime} onChange={(event) => setRoutineProfile({ ...routineProfile, sleepTime: event.target.value })} /></label><button className="primary" disabled={!routineProfile.sleepTime} onClick={() => setPlannerStep("wake")}>{language === "ur" ? "اگلا: جاگنے کا وقت" : "Next: wake-up time"} <ChevronRight size={16} /></button></div>}

              {plannerStep === "wake" && <div className="routine-question"><span className="assistant-bubble">{routineText.wake}</span><label>{routineText.wakeLabel}<input type="time" value={routineProfile.wakeTime} onChange={(event) => setRoutineProfile({ ...routineProfile, wakeTime: event.target.value })} /></label><div className="wizard-actions"><button className="outline" onClick={() => setPlannerStep("sleep")}>{language === "ur" ? "واپس" : "Back"}</button><button className="primary" disabled={!routineProfile.wakeTime} onClick={() => setPlannerStep("work")}>{language === "ur" ? "اگلا: کام یا پڑھائی" : "Next: work or study"} <ChevronRight size={16} /></button></div></div>}

              {plannerStep === "work" && <div className="routine-question"><span className="assistant-bubble">{routineText.work}</span><label>{language === "ur" ? "کام یا پڑھائی کا نام" : "Commitment"}<input value={routineProfile.workTitle} onChange={(event) => setRoutineProfile({ ...routineProfile, workTitle: event.target.value })} placeholder="Office, school, university…" /></label>{routineProfile.workTitle && <><div className="form-row"><label>{language === "ur" ? "شروع" : "Starts"}<input type="time" value={routineProfile.workStart} onChange={(event) => setRoutineProfile({ ...routineProfile, workStart: event.target.value })} /></label><label>{language === "ur" ? "ختم" : "Ends"}<input type="time" value={routineProfile.workEnd} onChange={(event) => setRoutineProfile({ ...routineProfile, workEnd: event.target.value })} /></label></div><p className="frequency-prompt">{language === "ur" ? "کن دنوں میں؟" : "Which days?"}</p><div className="weekday-picks">{routineDays.map((day) => <label key={day.id}><input type="checkbox" checked={routineProfile.workDays.includes(day.id)} onChange={() => setRoutineProfile({ ...routineProfile, workDays: routineProfile.workDays.includes(day.id) ? routineProfile.workDays.filter((d) => d !== day.id) : [...routineProfile.workDays, day.id] })} />{day.name}</label>)}</div></>}<div className="wizard-actions"><button className="outline" onClick={() => setPlannerStep("wake")}>Back</button><button className="outline" onClick={() => { setRoutineProfile({ ...routineProfile, workTitle: "" }); setPlannerStep("activities"); }}>Skip work</button><button className="primary" onClick={() => setPlannerStep("activities")}>Next: activities <ChevronRight size={16} /></button></div></div>}

              {plannerStep === "activities" && <div className="routine-question"><span className="assistant-bubble">{routineText.activity}</span><form className="activity-entry" onSubmit={addRoutineActivity}><label>{routineText.activityName}<div className="activity-name-input"><input required value={activityDraft.title} onChange={(event) => setActivityDraft({ ...activityDraft, title: event.target.value })} placeholder="Prayer, Quran, assignment, walk…" /><button className={`voice-note-button ${isListening ? "is-listening" : ""}`} type="button" onClick={() => toggleVoiceNote("activity")} aria-label={isListening ? "Stop dictation" : "Speak activity"}>{isListening ? <MicOff size={17} /> : <Mic size={17} />}</button></div></label>{isListening && <small className="voice-note-status">Listening… {voiceInterim}</small>}<div className="form-row"><label>Time<input type="time" required value={activityDraft.time} onChange={(event) => setActivityDraft({ ...activityDraft, time: event.target.value })} /></label><label>Duration (minutes)<input type="number" min="5" max="720" value={activityDraft.duration} onChange={(event) => setActivityDraft({ ...activityDraft, duration: event.target.value })} /></label></div><label>{routineText.frequency}<select value={activityDraft.recurrence} onChange={(event) => setActivityDraft({ ...activityDraft, recurrence: event.target.value as Recurrence, recurrenceDay: event.target.value === "monthly" ? new Date().getDate() : activityDraft.recurrenceDay })}>{language === "ur" ? <option value="daily">ہر روز</option> : <option value="daily">Every day</option>}{language === "ur" ? <option value="weekly">منتخب دنوں میں ہر ہفتے</option> : <option value="weekly">Weekly on selected days</option>}{language === "ur" ? <option value="monthly">ہر ماہ منتخب تاریخ</option> : <option value="monthly">Monthly on a date</option>}</select></label>{activityDraft.recurrence === "monthly" && <label>Day of month<input type="number" min="1" max="31" value={activityDraft.recurrenceDay} onChange={(event) => setActivityDraft({ ...activityDraft, recurrenceDay: Math.min(31, Math.max(1, Number(event.target.value) || 1)) })} /></label>}{activityDraft.recurrence === "weekly" && <><p className="frequency-prompt">{language === "ur" ? "دن منتخب کریں:" : "Choose days:"}</p><div className="weekday-picks">{routineDays.map((day) => <label key={day.id}><input type="checkbox" checked={activityDraft.recurrenceDays.includes(day.id)} onChange={() => setActivityDraft({ ...activityDraft, recurrenceDays: activityDraft.recurrenceDays.includes(day.id) ? activityDraft.recurrenceDays.filter((d) => d !== day.id) : [...activityDraft.recurrenceDays, day.id] })} />{day.name}</label>)}</div></>}<button className="primary" type="submit"><Plus size={16} /> {routineText.addActivity}</button></form>
                {routineProfile.activities.map((activity) => <div className="routine-activity-item" key={activity.id}><span>{activity.time}</span><b>{activity.title}</b><small>{activity.recurrence === "daily" ? "Daily" : activity.recurrence === "monthly" ? `Monthly · ${activity.recurrenceDay}` : `Weekly · ${activity.recurrenceDays.map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(", ")}`}</small><button className="delete-btn" onClick={() => setRoutineProfile({ ...routineProfile, activities: routineProfile.activities.filter((item) => item.id !== activity.id) })}><Trash2 size={14} /></button></div>)}
                <div className="wizard-actions"><button className="outline" onClick={() => setPlannerStep("work")}>Back</button><button className="primary" disabled={!routineProfile.activities.length && !routineProfile.workTitle} onClick={() => { setAssistantPlan(buildRoutineFromAnswers(routineProfile, prayerData)); setPlannerStep("review"); }}>{language === "ur" ? "پورا منصوبہ دیکھیں" : "Review full plan"} <ChevronRight size={16} /></button><button className="text-button" onClick={() => { setAssistantPlan(buildRoutineFromAnswers(routineProfile, prayerData)); setPlannerStep("review"); }}>Skip activities</button></div></div>}

              {plannerStep === "review" && <div className="assistant-reply"><b>{routineText.review}</b><p>Check the schedule. Creating it will add all tasks and checklist steps.</p><div className="task-list">{assistantPlan.map((task) => <div className="assistant-plan-row" key={task.id}><time>{task.time}</time><div><b>{task.title}</b><small>{task.category} · {task.duration} min · {task.recurrence === "weekly" ? `Weekly · ${(task.recurrenceDays ?? []).map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(", ")}` : task.recurrence === "monthly" ? `Monthly · day ${task.recurrenceDay}` : "Daily"} · {task.steps?.length ?? 0} checklist steps</small></div></div>)}</div><div className="wizard-actions"><button className="outline" onClick={() => setPlannerStep("activities")}>Edit routine</button><button className="primary" onClick={saveRoutinePlan}><Check size={16} /> {routineText.create}</button></div>{assistantReply && <p className="routine-save-message">{assistantReply}</p>}</div>}
            </section>
          )}

          {page === "checklist" && (
            <section className="panel full-panel">
              <div className="panel-head">
                <div>
                  <h2>{text.checklist}</h2>
                  <p>
                    {completedCount} {text.completed} ·{" "}
                    {todayTasks.length - completedCount} {text.left}
                  </p>
                </div>
              </div>
              <div className="task-list">
                {todayTasks.map((task) => (
                  <div className="checklist-task" key={task.id}>
                    <TaskRow task={task} text={text} onToggle={toggleTask} onDelete={removeTask} />
                    {task.steps?.map((step) => {
                      const done = step.doneDates.includes(todayKey);
                      return <button key={step.id} className={`checklist-step ${done ? "step-done" : ""}`} onClick={() => toggleChecklistStep(task.id, step.id, todayKey)}><span>{done ? "✓" : "○"}</span>{step.title}</button>;
                    })}
                  </div>
                ))}
              </div>
            </section>
          )}

          {page === "progress" && (
            <section className="panel full-panel">
              <h2>{text.progress}</h2>
              <div className="progress-stats">
                <div>
                  <small>Tasks completed</small>
                  <b>{completedCount}</b>
                </div>
                <div>
                  <small>{text.complete}</small>
                  <b>{completionRate}%</b>
                </div>
                <div>
                  <small>Tasks planned</small>
                  <b>{todayTasks.length}</b>
                </div>
              </div>
            </section>
          )}

          {page === "settings" && (
            <section className="panel full-panel settings-panel">
              <h2>{text.settings}</h2>
              <label className="setting-row">
                <span>{text.language}</span>
                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as Language)
                  }
                >
                  <option value="en">English</option>
                  <option value="ur">اردو</option>
                </select>
              </label>
              <div className="settings-section">
                <h3>Phone reminders</h3>
                <p>Allow notifications, then keep Daywell open for scheduled task alerts.</p>
                <button className="primary" onClick={enableReminders}><Bell size={16} /> {remindersEnabled ? "Reminders enabled" : "Allow notifications"}</button>
                <small>Background alerts while the site is fully closed need a push service and server. This GitHub Pages version does not include those.</small>
              </div>
              <form className="settings-section location-form" onSubmit={loadPrayerTimes}>
                <h3>Prayer times and location</h3>
                <p>Enter a city manually; GPS permission is not required. We send the city and country to AlAdhan to retrieve estimated prayer times.</p>
                <div className="form-row">
                  <label>City<input required value={prayerSettings.city} onChange={(event) => setPrayerSettings({ ...prayerSettings, city: event.target.value })} placeholder="e.g. Lahore" /></label>
                  <label>Country<input required value={prayerSettings.country} onChange={(event) => setPrayerSettings({ ...prayerSettings, country: event.target.value })} placeholder="e.g. Pakistan" /></label>
                </div>
                <div className="form-row">
                  <label>Calculation method<select value={prayerSettings.method} onChange={(event) => setPrayerSettings({ ...prayerSettings, method: event.target.value })}><option value="1">Karachi</option><option value="2">ISNA</option><option value="3">Muslim World League</option><option value="4">Umm al-Qura</option><option value="5">Egyptian Survey</option></select></label>
                  <label>Asr method<select value={prayerSettings.school} onChange={(event) => setPrayerSettings({ ...prayerSettings, school: event.target.value })}><option value="0">Standard</option><option value="1">Hanafi</option></select></label>
                </div>
                <button className="primary" type="submit"><MapPin size={16} /> Get today’s prayer times</button>
                {prayerData && <small>Last updated for {prayerData.city} · {prayerData.date}. Confirm timings with your local mosque.</small>}
              </form>
            </section>
          )}

          <footer className="footer">
            <span>© 2026 Daywell</span>
            <span>Made for real life, at your pace.</span>
          </footer>
        </section>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <form className="modal" onSubmit={handleAddTask}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">ADD TO YOUR DAY</p>
                <h2>{text.add}</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <label>
              {text.taskTitle}
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="e.g. Read for 20 minutes"
              />
            </label>

            <div className="form-row">
              <label>
                {text.time}
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) =>
                    setForm({ ...form, time: event.target.value })
                  }
                />
              </label>
              <label>
                {text.duration}
                <input
                  type="number"
                  min="5"
                  max="720"
                  value={form.duration}
                  onChange={(event) =>
                    setForm({ ...form, duration: event.target.value })
                  }
                />
              </label>
            </div>

            <div className="form-row repeat-row">
              <label>
                Repeat
                <select value={form.recurrence} onChange={(event) => { const recurrence = event.target.value as Recurrence; setForm({ ...form, recurrence, recurrenceDay: recurrence === "monthly" ? new Date().getDate() : recurrence === "weekly" ? new Date().getDay() : form.recurrenceDay }); }}>
                  {language === "ur" ? <option value="daily">ہر روز</option> : <option value="daily">Every day</option>}
                  <option value="weekly">Every week</option>
                  <option value="monthly">Every month</option>
                </select>
              </label>
              {form.recurrence === "weekly" ? (
                <label>Day of week<select value={form.recurrenceDay} onChange={(event) => setForm({ ...form, recurrenceDay: Number(event.target.value) })}>{[{ value: 1, label: "Monday" }, { value: 2, label: "Tuesday" }, { value: 3, label: "Wednesday" }, { value: 4, label: "Thursday" }, { value: 5, label: "Friday" }, { value: 6, label: "Saturday" }, { value: 0, label: "Sunday" }].map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
              ) : form.recurrence === "monthly" ? (
                <label>Day of month<input type="number" min="1" max="31" value={Math.max(1, form.recurrenceDay)} onChange={(event) => setForm({ ...form, recurrenceDay: Math.min(31, Math.max(1, Number(event.target.value) || 1)) })} /></label>
              ) : <p className="repeat-help">This task appears on every day.</p>}
            </div>

            <div className="form-row">
              <label>
                {text.category}
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  <option>Personal</option>
                  <option>Study</option>
                  <option>Work</option>
                  <option>Prayer</option>
                  <option>Reading</option>
                  <option>Wellbeing</option>
                  <option>Rest</option>
                </select>
              </label>

              <label>
                {text.priority}
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value as Priority,
                    })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
            </div>

            <label className="check-label">
              <input
                type="checkbox"
                checked={form.fixed}
                onChange={(event) =>
                  setForm({ ...form, fixed: event.target.checked })
                }
              />
              {text.fixed}
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="outline"
                onClick={() => setShowForm(false)}
              >
                {text.cancel}
              </button>
              <button className="primary" type="submit">
                {text.save}
                <ChevronRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {notice && (
        <div className="toast">
          <Check size={16} />
          {notice}
        </div>
      )}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Sun size={19} />
      </div>
      <span>daywell</span>
      <small>YOUR DAY, IN BALANCE</small>
    </div>
  );
}

function TaskRow({
  task,
  text,
  onToggle,
  onDelete,
}: {
  task: Task;
  text: Labels;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const repeatLabel = task.recurrence === "weekly"
    ? ` · Weekly · ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][task.recurrenceDay ?? 0]}`
    : task.recurrence === "monthly" ? ` · Monthly · day ${task.recurrenceDay ?? 1}` : " · Daily";
  return (
    <article className={`task-row ${task.done ? "is-done" : ""}`}>
      <button
        className={`task-check ${task.done ? "checked" : ""}`}
        onClick={() => onToggle(task.id)}
        aria-label="Mark task complete"
      >
        {task.done && <Check size={14} />}
      </button>

      <div className={`category-mark ${task.color}`} />

      <div className="task-main">
        <b>{task.title}</b>
        <small>
          {task.category}
          {task.fixed ? " · Fixed" : ""} · {task.duration} {text.minutes}
          {repeatLabel}
        </small>
      </div>

      <time>{task.time}</time>

      <span className={`priority priority-${task.priority.toLowerCase()}`}>
        {task.priority}
      </span>

      <button
        className="delete-btn"
        onClick={() => onDelete(task.id)}
        title={text.delete}
        aria-label={text.delete}
      >
        <Trash2 size={15} />
      </button>
    </article>
  );
}
