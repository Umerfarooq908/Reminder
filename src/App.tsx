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

type Task = {
  id: string;
  title: string;
  time: string;
  duration: number;
  category: string;
  color: string;
  done: boolean;
  doneDates?: string[];
  fixed: boolean;
  priority: Priority;
  day: number;
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

const starterTasks: Task[] = [
  {
    id: "task-1",
    title: "Morning prayer",
    time: "05:30",
    duration: 20,
    category: "Prayer",
    color: "gold",
    done: true,
    fixed: true,
    priority: "High",
    day: 0,
  },
  {
    id: "task-2",
    title: "Plan your day",
    time: "07:15",
    duration: 15,
    category: "Personal",
    color: "blue",
    done: false,
    fixed: false,
    priority: "Medium",
    day: 0,
  },
  {
    id: "task-3",
    title: "Focus session · coursework",
    time: "09:00",
    duration: 90,
    category: "Study",
    color: "violet",
    done: false,
    fixed: true,
    priority: "High",
    day: 0,
  },
  {
    id: "task-4",
    title: "Take a lunch break",
    time: "12:30",
    duration: 45,
    category: "Rest",
    color: "green",
    done: false,
    fixed: false,
    priority: "Low",
    day: 0,
  },
  {
    id: "task-5",
    title: "Read a few pages",
    time: "16:00",
    duration: 30,
    category: "Reading",
    color: "rose",
    done: false,
    fixed: false,
    priority: "Medium",
    day: 0,
  },
];

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function readTasks(): Task[] {
  try {
    const savedTasks = localStorage.getItem("dw-tasks");
    return savedTasks ? (JSON.parse(savedTasks) as Task[]) : starterTasks;
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
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantPlan, setAssistantPlan] = useState<Task[]>([]);
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>(() => readStored("dw-prayer-settings", { city: "", country: "", method: "1", school: "1" }));
  const [prayerData, setPrayerData] = useState<PrayerData | null>(() => readStored("dw-prayer-times", null));
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem("dw-reminders") === "yes");
  const firedReminders = useRef<Set<string>>(new Set(readStored<string[]>("dw-fired-reminders", [])));

  const [form, setForm] = useState({
    title: "",
    time: "09:00",
    duration: "30",
    category: "Personal",
    priority: "Medium" as Priority,
    fixed: false,
  });

  const text = labels[language];

  useEffect(() => {
    localStorage.setItem("dw-tasks", JSON.stringify(tasks));
  }, [tasks]);

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
        if (task.day === 0 && task.time === currentTime && !isTaskDone(task, dateKey(now)) && !firedReminders.current.has(key)) {
          new Notification(`Daywell · ${task.title}`, { body: `It’s time for your ${task.category.toLowerCase()} task.` });
          firedReminders.current.add(key);
          localStorage.setItem("dw-fired-reminders", JSON.stringify([...firedReminders.current]));
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
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.day === 0)
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
    const request = assistantPrompt.trim();
    if (!request) return;
    const lower = request.toLowerCase();
    const plan: Task[] = [];
    const addPlanTask = (title: string, time: string, duration: number, category: string) => plan.push({
      id: makeId(), title, time, duration, category, color: category === "Prayer" ? "gold" : category === "Study" ? "violet" : "green",
      done: false, fixed: false, priority: category === "Study" || category === "Work" ? "High" : "Medium", day: 0,
    });
    addPlanTask("Plan the day", "08:00", 10, "Personal");
    if (/work|office|job|school|class|study|assignment|exam/.test(lower)) addPlanTask("Focused work or study", "09:00", 60, lower.includes("work") || lower.includes("office") ? "Work" : "Study");
    if (/prayer|salah|namaz|quran|qur'an|quaran/.test(lower)) addPlanTask("Prayer and quiet reflection", "12:30", 20, "Prayer");
    if (/walk|exercise|gym|outdoor|play|sport/.test(lower)) addPlanTask("Outdoor movement", "17:00", 30, "Wellbeing");
    if (/read|book|quran|qur'an|quaran/.test(lower)) addPlanTask("Reading time", "20:00", 25, "Reading");
    if (/sleep|nap|rest|break/.test(lower)) addPlanTask("Rest and reset", "14:00", 25, "Rest");
    addPlanTask("Prepare for tomorrow", "21:00", 10, "Personal");
    setAssistantPlan(plan);
    setAssistantReply(`I made a balanced starter plan from your priorities. It includes ${plan.length} suggested tasks. Adjust the times to fit your real commitments before adding it.`);
  }

  function addAssistantPlan() {
    setTasks((current) => [...current, ...assistantPlan]);
    setAssistantPlan([]);
    setAssistantPrompt("");
    notify("Suggested routine added to your day");
    setPage("today");
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
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, index) => (
                    <div className="week-day" key={day}>
                      <small>{day}</small>
                      <b>{index + 1}</b>
                      <span>
                        {tasks.filter((task) => task.day === index).length} tasks
                      </span>
                    </div>
                  ),
                )}
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
                  <thead><tr><th className="task-heading">Task</th>{Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate() }, (_, i) => <th key={i}>{i + 1}</th>)}</tr></thead>
                  <tbody>{tasks.filter((task) => task.day === 0).map((task) => <tr key={task.id}>
                    <th className="task-heading"><b>{task.title}</b><small>{task.time} · {task.category}</small></th>
                    {Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
                      const day = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1);
                      const key = dateKey(day);
                      const done = isTaskDone(task, key);
                      const future = key > todayKey;
                      return <td key={key}><button className={`sheet-cell ${done ? "sheet-done" : future ? "sheet-future" : "sheet-missed"}`} disabled={future} onClick={() => toggleTaskForDate(task.id, key)} aria-label={`${task.title}, ${key}: ${done ? "done" : future ? "future" : "not done"}`}>{done ? "✓" : future ? "—" : "×"}</button></td>;
                    })}
                  </tr>)}</tbody>
                </table>
                {tasks.filter((task) => task.day === 0).length === 0 && <div className="empty">Add tasks to see them in your monthly sheet.</div>}
              </div>
              <p className="muted month-note">Your completion history is saved in this browser. Tasks repeat daily in this sheet.</p>
            </section>
          )}

          {page === "assistant" && (
            <section className="panel full-panel assistant-page">
              <div className="assistant-title"><div className="ai-icon"><Bot size={20} /></div><div><h2>Routine assistant</h2><p>Describe your commitments and priorities; get an editable starter plan.</p></div></div>
              <div className="assistant-disclosure">This starter assistant runs in your browser and uses simple matching rules. It does not send your text to an AI service.</div>
              <form className="assistant-form" onSubmit={askAssistant}>
                <label htmlFor="assistant-prompt">What should your day include?</label>
                <textarea id="assistant-prompt" rows={4} value={assistantPrompt} onChange={(event) => setAssistantPrompt(event.target.value)} placeholder="For example: I have office work, want time for prayer and Quran reading, a walk, and an early night." />
                <button className="primary" type="submit"><Sparkles size={16} /> Suggest my routine</button>
              </form>
              {assistantReply && <div className="assistant-reply"><b>Suggested plan</b><p>{assistantReply}</p><div className="task-list">{assistantPlan.map((task) => <div className="assistant-plan-row" key={task.id}><time>{task.time}</time><b>{task.title}</b><span>{task.duration} min</span></div>)}</div><button className="primary" onClick={addAssistantPlan}>Add these tasks to today</button></div>}
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
                  <TaskRow
                    key={task.id}
                    task={task}
                    text={text}
                    onToggle={toggleTask}
                    onDelete={removeTask}
                  />
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
