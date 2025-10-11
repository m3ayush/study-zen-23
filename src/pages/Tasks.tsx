import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

type Task = {
  id: string;
  title: string;
  description: string | null;
  course: string | null;
  due_date: string | null;
  priority: string;
  completed: boolean;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course: "",
    due_date: "",
    priority: "medium",
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    if (data) setTasks(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("tasks").insert({
      ...formData,
      user_id: user.id,
      due_date: formData.due_date || null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating task",
        description: error.message,
      });
    } else {
      toast({ title: "Task created successfully!" });
      setOpen(false);
      setFormData({ title: "", description: "", course: "", due_date: "", priority: "medium" });
      loadTasks();
    }
  };

  const toggleComplete = async (task: Task) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating task",
        description: error.message,
      });
    } else {
      loadTasks();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tasks</h1>
          <p className="text-muted-foreground">Manage your to-dos and coursework</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g., Math 101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full gradient-primary">
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tasks yet. Create your first task to get started!</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card
              key={task.id}
              className={`card-shadow transition-smooth hover:elevated-shadow ${
                task.completed ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleComplete(task)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${task.completed ? "line-through" : ""}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          {task.course && (
                            <span className="px-2 py-1 bg-secondary rounded-md">
                              {task.course}
                            </span>
                          )}
                          <span className={getPriorityColor(task.priority)}>
                            {task.priority} priority
                          </span>
                          {task.due_date && (
                            <span className="text-muted-foreground">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}