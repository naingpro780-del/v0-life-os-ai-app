"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";

type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  color: string;
  created_at: string;
};

const EVENT_COLORS = [
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

export function CalendarContent({
  initialEvents,
  serverToday,
}: {
  initialEvents: CalendarEvent[];
  serverToday: string;
}) {
  const initialDate = new Date(serverToday + "T00:00:00");
  const [events, setEvents] = useState(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocale();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setAllDay(false);
    setEventColor(EVENT_COLORS[0]);
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const eventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter((e) => {
      const eventDate = format(new Date(e.start_time), "yyyy-MM-dd");
      return eventDate === dateStr;
    });
  };

  const selectedDateEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const handleCreate = async () => {
    if (!title.trim() || (!allDay && !startTime)) return;
    setIsLoading(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const dateStr = selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : serverToday;
      const startDateTime = allDay
        ? `${dateStr}T00:00:00`
        : `${dateStr}T${startTime}`;
      const endDateTime =
        endTime && !allDay ? `${dateStr}T${endTime}` : null;
      const { data, error } = await supabase
        .from("events")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          start_time: startDateTime,
          end_time: endDateTime,
          all_day: allDay,
          color: eventColor,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      setEvents((prev) => [...prev, data]);
      setDialogOpen(false);
      resetForm();
      toast.success("Event created");
    } catch {
      toast.error("Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Event deleted");
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("calendar")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("calendarDescription")}
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
              {t("addEvent")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>{t("addEvent")}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>{t("eventTitle")}</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("eventTitle")}
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
              <div className="flex items-center gap-3">
                <Switch checked={allDay} onCheckedChange={setAllDay} />
                <Label>{t("allDay")}</Label>
              </div>
              {!allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("startTime")}</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("endTime")}</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("color")}</Label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${eventColor === c ? "scale-110 border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setEventColor(c)}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={isLoading || !title.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? t("loading") : t("create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendar grid */}
        <Card className="bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              aria-label={t("previous")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-base text-card-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              aria-label={t("next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayEvents = eventsForDate(day);
                const isSelected =
                  selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`relative min-h-[3.5rem] rounded-lg p-1 text-left text-sm transition-colors ${
                      !isSameMonth(day, currentMonth)
                        ? "text-muted-foreground/40"
                        : "text-card-foreground"
                    } ${isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50"} ${isSameDay(day, initialDate) ? "font-bold" : ""}`}
                    aria-label={format(day, "MMMM d, yyyy")}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${isSameDay(day, initialDate) ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="mt-0.5 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: ev.color }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected date events */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {selectedDate
                ? format(selectedDate, "EEEE, MMM d")
                : t("calendar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("noEvents")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.all_day
                          ? t("allDay")
                          : format(new Date(event.start_time), "h:mm a")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(event.id)}
                      aria-label={`Delete ${event.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
