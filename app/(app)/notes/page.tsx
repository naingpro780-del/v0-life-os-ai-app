import { createClient } from "@/lib/supabase/server";
import { NotesContent } from "@/components/notes/notes-content";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user!.id)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  return <NotesContent initialNotes={notes || []} />;
}
