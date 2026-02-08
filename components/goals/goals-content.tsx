"use client";

import React from "react"

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Pause,
  CheckCircle2,
  Play,
} from "lucide-react";
import { toast } from "sonner";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: "active" | "completed" | "paused";
  color: string;
  created_at: string;
};

export function GoalsContent() {
  const { t } = useLocale();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const supabase = createClient();

  const fetchGoals = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setGoals(data || []);
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const goalData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      target_date: (formData.get("target_date") as string) || null,
      progress: Number(formData.get("progress")) || 0,
      status: (formData.get("status") as string) || "active",
      color: (formData.get("color") as string) || "#EF4444",
      user_id: user.id,
    };

    if (editingGoal) {
      const { user_id: _, ...updateData } = goalData;
      const { error } = await supabase
        .from("goals")
        .update(updateData)
        .eq("id", editingGoal.id);
      if (error) {
        toast.error("Failed to update goal");
        return;
      }
      toast.success("Goal updated");
    } else {
      const { error } = await supabase.from("goals").insert(goalData);
      if (error) {
        toast.error("Failed to create goal");
        return;
      }
      toast.success("Goal created");
    }

    setDialogOpen(false);
    setEditingGoal(null);
    fetchGoals();
  }

  async function deleteGoal(id: string) {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete goal");
      return;
    }
    toast.success("Goal deleted");
    fetchGoals();
  }

  async function updateProgress(id: string, progress: number) {
    const status = progress >= 100 ? "completed" : "active";
    const { error } = await supabase
      .from("goals")
      .update({ progress: Math.min(100, Math.max(0, progress)), status })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update progress");
      return;
    }
    fetchGoals();
  }

  async function toggleStatus(
    id: string,
    currentStatus: string
  ) {
    const newStatus = currentStatus === "paused" ? "active" : "paused";
    const { error } = await supabase
      .from("goals")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    fetchGoals();
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "paused":
        return <Pause className="h-4 w-4 text-muted-foreground" />;
      default:
        return <TrendingUp className="h-4 w-4 text-primary" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "paused":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const colors = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("goals")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("goalsDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="completed">{t("completed")}</SelectItem>
              <SelectItem value="paused">{t("paused")}</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingGoal(null)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addGoal")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? t("editGoal") : t("addGoal")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("title")}</Label>
                  <Input
                    name="title"
                    required
                    defaultValue={editingGoal?.title || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("description")}</Label>
                  <Textarea
                    name="description"
                    defaultValue={editingGoal?.description || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("targetDate")}</Label>
                    <Input
                      type="date"
                      name="target_date"
                      defaultValue={editingGoal?.target_date || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("progress")}</Label>
                    <Input
                      type="number"
                      name="progress"
                      min="0"
                      max="100"
                      defaultValue={editingGoal?.progress || 0}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("status")}</Label>
                  <input type="hidden" name="status" value={editingGoal?.status || "active"} id="goal-status-hidden" />
                  <Select
                    defaultValue={editingGoal?.status || "active"}
                    onValueChange={(v) => {
                      const el = document.getElementById("goal-status-hidden") as HTMLInputElement;
                      if (el) el.value = v;
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="completed">
                        {t("completed")}
                      </SelectItem>
                      <SelectItem value="paused">{t("paused")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("color")}</Label>
                  <input type="hidden" name="color" value={editingGoal?.color || "#EF4444"} id="goal-color-hidden" />
                  <div className="flex gap-2">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          borderColor: (editingGoal?.color || "#EF4444") === c ? "hsl(var(--primary))" : "transparent",
                        }}
                        onClick={() => {
                          const el = document.getElementById("goal-color-hidden") as HTMLInputElement;
                          if (el) el.value = c;
                        }}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingGoal ? t("save") : t("addGoal")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {goals.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              {t("noGoals")}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {t("noGoalsDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <Card key={goal.id} className="bg-card overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: goal.color }} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {statusIcon(goal.status)}
                    <CardTitle className="text-base truncate">
                      {goal.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${statusColor(goal.status)}`}
                    >
                      {t(goal.status)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleStatus(goal.id, goal.status)}
                    >
                      {goal.status === "paused" ? (
                        <Play className="h-3.5 w-3.5" />
                      ) : (
                        <Pause className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingGoal(goal);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {goal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {goal.description}
                  </p>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("progress")}
                    </span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  {goal.status === "active" && (
                    <div className="flex gap-1 pt-1">
                      {[10, 25, 50].map((inc) => (
                        <Button
                          key={inc}
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs px-2 bg-transparent"
                          onClick={() =>
                            updateProgress(goal.id, goal.progress + inc)
                          }
                        >
                          +{inc}%
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2 bg-transparent"
                        onClick={() => updateProgress(goal.id, 100)}
                      >
                        100%
                      </Button>
                    </div>
                  )}
                </div>
                {goal.target_date && (
                  <p className="text-xs text-muted-foreground">
                    {t("targetDate")}: {goal.target_date}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
