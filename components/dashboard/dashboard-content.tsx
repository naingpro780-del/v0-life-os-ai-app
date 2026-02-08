"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/locale-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare,
  Repeat,
  CalendarDays,
  StickyNote,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
};

type Habit = {
  id: string;
  name: string;
  color: string;
};

type HabitLog = {
  id: string;
  habit_id: string;
};

type Event = {
  id: string;
  title: string;
  start_time: string;
  all_day: boolean;
  color: string;
};

type Note = {
  id: string;
  title: string;
  content: string | null;
  updated_at: string;
  is_pinned: boolean;
};

type Goal = {
  id: string;
  title: string;
  progress: number;
  color: string;
};

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting";
  if (hour < 18) return "greetingAfternoon";
  return "greetingEvening";
}

function useGreeting(t: (k: string) => string) {
  const [greetingKey, setGreetingKey] = useState("greeting");

  useEffect(() => {
    setGreetingKey(getGreetingKey());
  }, []);

  return t(greetingKey);
}

function priorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-accent text-accent-foreground";
    case "medium":
      return "bg-primary/20 text-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getGreeting(t: (k: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("greeting");
  if (hour < 18) return t("greetingAfternoon");
  return t("greetingEvening");
}

export function DashboardContent({
  tasks,
  habits,
  habitLogs,
  events,
  notes,
  goals,
  userName,
}: {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  events: Event[];
  notes: Note[];
  goals: Goal[];
  userName: string;
}) {
  const { t } = useLocale();
  const greeting = useGreeting(t);
  const completedHabitIds = new Set(habitLogs.map((l) => l.habit_id));
  const habitCompletion =
    habits.length > 0
      ? Math.round((completedHabitIds.size / habits.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl text-balance">
          {greeting}, {userName}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("appTagline")}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">
                {tasks.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("todaysTasks")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Repeat className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">
                {habitCompletion}%
              </p>
              <p className="text-xs text-muted-foreground">
                {t("habitProgress")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">
                {events.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("upcomingEvents")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">
                {goals.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("activeGoals")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Tasks */}
        <Card className="bg-card md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <CheckSquare className="h-4 w-4 text-primary" />
              {t("todaysTasks")}
            </CardTitle>
            <Link
              href="/tasks"
              className="text-xs text-primary hover:underline"
            >
              {t("tasks")}
            </Link>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noTasks")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(task.due_date), "MMM d")}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={priorityColor(task.priority)}
                      variant="secondary"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits */}
        <Card className="bg-card md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <Repeat className="h-4 w-4 text-accent" />
              {t("habitProgress")}
            </CardTitle>
            <Link
              href="/habits"
              className="text-xs text-primary hover:underline"
            >
              {t("habits")}
            </Link>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noHabits")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {completedHabitIds.size}/{habits.length} {t("completed")}
                  </span>
                  <span className="text-sm font-medium text-card-foreground">
                    {habitCompletion}%
                  </span>
                </div>
                <Progress value={habitCompletion} className="h-2" />
                <div className="mt-2 flex flex-col gap-2">
                  {habits.slice(0, 4).map((habit) => (
                    <div key={habit.id} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className="flex-1 text-sm text-card-foreground">
                        {habit.name}
                      </span>
                      {completedHabitIds.has(habit.id) ? (
                        <Badge
                          variant="secondary"
                          className="bg-primary/20 text-foreground text-xs"
                        >
                          {t("done")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events */}
        <Card className="bg-card md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {t("upcomingEvents")}
            </CardTitle>
            <Link
              href="/calendar"
              className="text-xs text-primary hover:underline"
            >
              {t("calendar")}
            </Link>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noEvents")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {events.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div
                      className="h-8 w-1 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.all_day
                          ? format(new Date(event.start_time), "MMM d")
                          : format(
                              new Date(event.start_time),
                              "MMM d, h:mm a"
                            )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-card md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <StickyNote className="h-4 w-4 text-primary" />
              {t("recentNotes")}
            </CardTitle>
            <Link
              href="/notes"
              className="text-xs text-primary hover:underline"
            >
              {t("notes")}
            </Link>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noNotes")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {notes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-medium text-card-foreground">
                      {note.title}
                    </p>
                    {note.content && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {note.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="bg-card md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <Target className="h-4 w-4 text-accent" />
              {t("goals")}
            </CardTitle>
            <Link
              href="/goals"
              className="text-xs text-primary hover:underline"
            >
              {t("goals")}
            </Link>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noGoals")}
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {goals.slice(0, 3).map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: goal.color }}
                      />
                      <p className="text-sm font-medium text-card-foreground">
                        {goal.title}
                      </p>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      {goal.progress}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
