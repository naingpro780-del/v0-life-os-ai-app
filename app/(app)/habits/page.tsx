import { createClient } from "@/lib/supabase/server";
import { HabitsContent } from "@/components/habits/habits-content";

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  // Get last 30 days of logs for streak calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", user!.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", user!.id)
      .gte("completed_at", thirtyDaysAgo.toISOString().split("T")[0]),
  ]);

  return (
    <HabitsContent
      initialHabits={habitsRes.data || []}
      initialLogs={logsRes.data || []}
      today={today}
    />
  );
}
