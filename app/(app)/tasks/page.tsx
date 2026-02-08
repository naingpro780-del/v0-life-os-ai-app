import { createClient } from "@/lib/supabase/server";
import { TasksContent } from "@/components/tasks/tasks-content";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title")
    .eq("user_id", user!.id)
    .eq("status", "active");

  return <TasksContent initialTasks={tasks || []} goals={goals || []} />;
}
