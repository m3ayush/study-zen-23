import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pin, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type Note = {
  id: string;
  title: string | null;
  content: string;
  tags: string[] | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (data) setNotes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const { error } = await supabase.from("notes").insert({
      title: formData.title || null,
      content: formData.content,
      tags: tags.length > 0 ? tags : null,
      user_id: user.id,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating note",
        description: error.message,
      });
    } else {
      toast({ title: "Note created successfully!" });
      setOpen(false);
      setFormData({ title: "", content: "", tags: "" });
      loadNotes();
    }
  };

  const togglePin = async (note: Note) => {
    const { error } = await supabase
      .from("notes")
      .update({ pinned: !note.pinned })
      .eq("id", note.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating note",
        description: error.message,
      });
    } else {
      loadNotes();
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting note",
        description: error.message,
      });
    } else {
      toast({ title: "Note deleted" });
      loadNotes();
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notes</h1>
          <p className="text-muted-foreground">Capture your thoughts and study notes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Give your note a title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  placeholder="Start typing your note..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., math, study, important"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary">
                Create Note
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notes.length === 0 ? (
          <Card className="card-shadow col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No notes yet. Create your first note!</p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card
              key={note.id}
              className="card-shadow transition-smooth hover:elevated-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">
                    {note.title || "Untitled Note"}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => togglePin(note)}
                    >
                      <Pin
                        className={`w-4 h-4 ${
                          note.pinned ? "fill-primary text-primary" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {note.content}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}