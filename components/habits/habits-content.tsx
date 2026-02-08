"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Check, Flame } from "lucide-react";
import { toast } from "sonner";

type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  frequency: string;
  target_count: number;
  is_archived: boolean;
  created_at: string;
};

type HabitLog = {
  id: string;
  habit_id: string;
  completed_at: string;
  count: number;
};

const COLORS = [
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#06B6D4",
];

function calculateStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs
    .filter((l) => l.habit_id === habitId)
    .map((l) => l.completed_at)
    .sort()
    .reverse();
  if (habitLogs.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (habitLogs.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function HabitsContent({
  initialHabits,
  initialLogs,
  today,
}: {
  initialHabits: Habit[];
  initialLogs: HabitLog[];
  today: string;
}) {
  const [habits, setHabits] = useState(initialHabits);
  const [logs, setLogs] = useState(initialLogs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [color, setColor] = useState(COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocale();

  const todayLogs = logs.filter((l) => l.completed_at === today);
  const completedIds = new Set(todayLogs.map((l) => l.habit_id));

  const resetForm = () => {
    setName("");
    setDescription("");
    setFrequency("daily");
    setColor(COLORS[0]);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("habits")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          frequency,
          color,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      setHabits((prev) => [data, ...prev]);
      setDialogOpen(false);
      resetForm();
      toast.success("Habit created");
    } catch {
      toast.error("Failed to create habit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (habitId: string) => {
    const supabase = createClient();
    const isCompleted = completedIds.has(habitId);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (isCompleted) {
        const logToRemove = todayLogs.find((l) => l.habit_id === habitId);
        if (logToRemove) {
          await supabase.from("habit_logs").delete().eq("id", logToRemove.id);
          setLogs((prev) => prev.filter((l) => l.id !== logToRemove.id));
        }
      } else {
        const { data, error } = await supabase
          .from("habit_logs")
          .insert({ habit_id: habitId, user_id: user.id, completed_at: today })
          .select()
          .single();
        if (error) throw error;
        setLogs((prev) => [...prev, data]);
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setHabits((prev) => prev.filter((h) => h.id !== id));
    toast.success("Habit deleted");
  };

  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split("T")[0]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("habits")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("habitsDescription")}
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              {t("addHabit")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>{t("addHabit")}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>{t("name")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("habitName")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("description")}</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("description")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("frequency")}</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t("daily")}</SelectItem>
                    <SelectItem value="weekly">{t("weekly")}</SelectItem>
                    <SelectItem value="monthly">{t("monthly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("color")}</Label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${color === c ? "scale-110 border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={isLoading || !name.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? t("loading") : t("create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Flame className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-lg font-medium">
            {t("noHabits")}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {t("noHabitsDescription")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => {
            const isCompleted = completedIds.has(habit.id);
            const streak = calculateStreak(habit.id, logs);
            return (
              <Card key={habit.id} className="bg-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <button
                    type="button"
                    onClick={() => handleToggle(habit.id)}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? "border-transparent text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary"
                    }`}
                    style={
                      isCompleted
                        ? { backgroundColor: habit.color }
                        : undefined
                    }
                    aria-label={`Toggle ${habit.name}`}
                  >
                    {isCompleted && <Check className="h-5 w-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium text-card-foreground ${isCompleted ? "line-through opacity-60" : ""}`}
                    >
                      {habit.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(habit.frequency)}
                      {streak > 0 && (
                        <span className="ml-2 text-primary">
                          <Flame className="mb-0.5 inline h-3 w-3" /> {streak}{" "}
                          {t("streakDays")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="hidden items-center gap-1 md:flex">
                    {last7Days.map((day) => {
                      const hasLog = logs.some(
                        (l) =>
                          l.habit_id === habit.id && l.completed_at === day
                      );
                      return (
                        <div
                          key={day}
                          className="h-5 w-5 rounded-sm"
                          style={{
                            backgroundColor: hasLog
                              ? habit.color
                              : "hsl(var(--muted))",
                            opacity: hasLog ? 1 : 0.4,
                          }}
                          title={day}
                        />
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(habit.id)}
                    aria-label={`Delete ${habit.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
