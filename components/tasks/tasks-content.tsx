"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  CheckSquare,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  goal_id: string | null;
  created_at: string;
  updated_at: string;
};

type Goal = { id: string; title: string };

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

function statusIcon(status: string) {
  switch (status) {
    case "done":
      return "bg-primary text-primary-foreground";
    case "in_progress":
      return "bg-primary/30 text-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function TasksContent({
  initialTasks,
  goals,
}: {
  initialTasks: Task[];
  goals: Goal[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocale();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setGoalId("");
    setEditingTask(null);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.due_date || "");
    setGoalId(task.goal_id || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        goal_id: goalId || null,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (editingTask) {
        const { data, error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", editingTask.id)
          .select()
          .single();
        if (error) throw error;
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? data : t))
        );
        toast.success("Task updated");
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert({ ...payload, status: "todo" })
          .select()
          .single();
        if (error) throw error;
        setTasks((prev) => [data, ...prev]);
        toast.success("Task created");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success("Task deleted");
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const renderTaskList = (list: Task[], emptyText: string) => (
    <div className="flex flex-col gap-2">
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        list.map((task) => (
          <Card
            key={task.id}
            className="bg-card cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => openEdit(task)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next =
                    task.status === "todo"
                      ? "in_progress"
                      : task.status === "in_progress"
                        ? "done"
                        : "todo";
                  handleStatusChange(task.id, next);
                }}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${statusIcon(task.status)}`}
                aria-label={`Change status of ${task.title}`}
              >
                {task.status === "done" && (
                  <CheckSquare className="h-3 w-3" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium text-card-foreground truncate ${task.status === "done" ? "line-through opacity-60" : ""}`}
                >
                  {task.title}
                </p>
                {task.due_date && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    {task.due_date}
                  </p>
                )}
              </div>
              <Badge className={priorityColor(task.priority)} variant="secondary">
                {t(task.priority)}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(task.id);
                }}
                aria-label={`Delete ${task.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("tasks")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("noTasksDescription")}
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
              {t("addTask")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? t("editTask") : t("addTask")}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>{t("title")}</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("title")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("description")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("description")}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("priority")}</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("low")}</SelectItem>
                      <SelectItem value="medium">{t("medium")}</SelectItem>
                      <SelectItem value="high">{t("high")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("dueDate")}</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              {goals.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("goals")}</Label>
                  <Select value={goalId} onValueChange={setGoalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Link to goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {goals.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={isLoading || !title.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? t("loading") : editingTask ? t("save") : t("create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="todo">
        <TabsList>
          <TabsTrigger value="todo">
            {t("todo")} ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            {t("in_progress")} ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="done">
            {t("done")} ({doneTasks.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="todo" className="mt-4">
          {renderTaskList(todoTasks, t("noTasks"))}
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          {renderTaskList(inProgressTasks, t("noTasks"))}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {renderTaskList(doneTasks, t("noTasks"))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
