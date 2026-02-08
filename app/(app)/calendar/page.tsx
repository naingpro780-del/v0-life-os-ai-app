import { createClient } from "@/lib/supabase/server";
import { CalendarContent } from "@/components/calendar/calendar-content";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get events for current month +/- 1 month
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  start.setDate(1);
  const end = new Date();
  end.setMonth(end.getMonth() + 2);
  end.setDate(0);

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user!.id)
    .gte("start_time", start.toISOString())
    .lte("start_time", end.toISOString())
    .order("start_time", { ascending: true });

  const today = new Date().toISOString().split("T")[0];
  return <CalendarContent initialEvents={events || []} serverToday={today} />;
}
