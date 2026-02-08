"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Pin, PinOff, Trash2, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export function NotesContent({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocale();

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        n.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTagsInput("");
    setEditingNote(null);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || "");
    setTagsInput(note.tags.join(", "));
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
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title: title.trim(),
        content: content.trim() || null,
        tags,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      if (editingNote) {
        const { data, error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", editingNote.id)
          .select()
          .single();
        if (error) throw error;
        setNotes((prev) =>
          prev.map((n) => (n.id === editingNote.id ? data : n))
        );
        toast.success("Note updated");
      } else {
        const { data, error } = await supabase
          .from("notes")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setNotes((prev) => [data, ...prev]);
        toast.success("Note created");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Note deleted");
  };

  const handleTogglePin = async (note: Note) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notes")
      .update({ is_pinned: !note.is_pinned })
      .eq("id", note.id)
      .select()
      .single();
    if (error) {
      toast.error("Failed to update");
      return;
    }
    setNotes((prev) =>
      prev
        .map((n) => (n.id === note.id ? data : n))
        .sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          );
        })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("notes")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("notesDescription")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchNotes")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
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
                {t("addNote")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? t("editNote") : t("addNote")}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>{t("title")}</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("noteTitle")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("content")}</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("content")}
                    rows={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("tags")}</Label>
                  <Input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder={t("tagsPlaceholder")}
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !title.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading
                    ? t("loading")
                    : editingNote
                      ? t("save")
                      : t("create")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <StickyNote className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-lg font-medium">
            {searchQuery ? "No matching notes" : t("noNotes")}
          </p>
          {!searchQuery && (
            <p className="text-muted-foreground text-sm mt-1">
              {t("noNotesDescription")}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="bg-card cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => openEdit(note)}
            >
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {note.is_pinned && (
                      <Pin className="h-3 w-3 text-primary shrink-0" />
                    )}
                    <h3 className="text-sm font-semibold text-card-foreground truncate">
                      {note.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(note);
                      }}
                      aria-label={note.is_pinned ? t("unpin") : t("pin")}
                    >
                      {note.is_pinned ? (
                        <PinOff className="h-3 w-3" />
                      ) : (
                        <Pin className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      aria-label={`Delete ${note.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {note.content && (
                  <p className="mb-3 line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                    {note.content}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.updated_at), "MMM d")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
