import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const [tasksRes, habitsRes, habitLogsRes, eventsRes, notesRes, goalsRes] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user!.id)
        .neq("status", "done")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_archived", false),
      supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed_at", today),
      supabase
        .from("events")
        .select("*")
        .eq("user_id", user!.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(5),
      supabase
        .from("notes")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(4),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .limit(3),
    ]);

  return (
    <DashboardContent
      tasks={tasksRes.data || []}
      habits={habitsRes.data || []}
      habitLogs={habitLogsRes.data || []}
      events={eventsRes.data || []}
      notes={notesRes.data || []}
      goals={goalsRes.data || []}
      userName={profile?.display_name || user?.email?.split("@")[0] || "User"}
    />
  );
}
