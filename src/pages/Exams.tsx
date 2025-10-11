import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, differenceInDays } from "date-fns";

type Exam = {
  id: string;
  course: string;
  title: string;
  exam_date: string;
  location: string | null;
  weight: number | null;
  notes: string | null;
};

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    course: "",
    title: "",
    exam_date: "",
    location: "",
    weight: "",
    notes: "",
  });

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", user.id)
      .order("exam_date", { ascending: true });

    if (data) setExams(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("exams").insert({
      ...formData,
      user_id: user.id,
      weight: formData.weight ? parseFloat(formData.weight) : null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating exam",
        description: error.message,
      });
    } else {
      toast({ title: "Exam added successfully!" });
      setOpen(false);
      setFormData({ course: "", title: "", exam_date: "", location: "", weight: "", notes: "" });
      loadExams();
    }
  };

  const getDaysUntil = (date: string) => {
    return differenceInDays(new Date(date), new Date());
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return "text-muted-foreground";
    if (daysUntil <= 3) return "text-destructive";
    if (daysUntil <= 7) return "text-warning";
    return "text-success";
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Exams</h1>
          <p className="text-muted-foreground">Track your upcoming exams and deadlines</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover">
            <DialogHeader>
              <DialogTitle>Add New Exam</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g., Math 101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Midterm Exam"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam_date">Date & Time</Label>
                <Input
                  id="exam_date"
                  type="datetime-local"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Room 305"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (%)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Chapters to study, topics to review..."
                />
              </div>
              <Button type="submit" className="w-full gradient-primary">
                Add Exam
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exams.length === 0 ? (
          <Card className="card-shadow col-span-full">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No exams scheduled. Add your first exam!</p>
            </CardContent>
          </Card>
        ) : (
          exams.map((exam) => {
            const daysUntil = getDaysUntil(exam.exam_date);
            return (
              <Card
                key={exam.id}
                className="card-shadow transition-smooth hover:elevated-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{exam.course}</CardTitle>
                  <p className="text-sm text-muted-foreground">{exam.title}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm font-medium">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </span>
                  </div>
                  {exam.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Location</span>
                      <span className="text-sm">{exam.location}</span>
                    </div>
                  )}
                  {exam.weight && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Weight</span>
                      <span className="text-sm">{exam.weight}%</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border">
                    <div className={`text-center font-bold ${getUrgencyColor(daysUntil)}`}>
                      {daysUntil < 0 ? (
                        "Past"
                      ) : daysUntil === 0 ? (
                        "Today!"
                      ) : (
                        <>D-{daysUntil}</>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {formatDistanceToNow(new Date(exam.exam_date), { addSuffix: true })}
                    </p>
                  </div>
                  {exam.notes && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">{exam.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}