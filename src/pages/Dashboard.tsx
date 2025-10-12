import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Calendar, Timer, FileText, Clock } from "lucide-react";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";
import { Badge } from "@/components/ui/badge";

type ScheduleItem = {
  id: string;
  title: string;
  type: "task" | "exam";
  time: string;
  course?: string;
  priority?: string;
  completed?: boolean;
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedToday: 0,
    nextExam: null as any,
    focusMinutes: 0,
  });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false);

    // Load today's completed tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("updated_at", today.toISOString());

    // Load next exam
    const { data: exams } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", user.id)
      .gte("exam_date", new Date().toISOString())
      .order("exam_date", { ascending: true })
      .limit(1);

    // Load today's pomodoro sessions
    const { data: sessions } = await supabase
      .from("pomodoro_sessions")
      .select("duration")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("started_at", today.toISOString());

    const totalMinutes = sessions?.reduce((sum, s) => sum + s.duration, 0) || 0;

    setStats({
      totalTasks: tasks?.length || 0,
      completedToday: completedTasks?.length || 0,
      nextExam: exams?.[0] || null,
      focusMinutes: totalMinutes,
    });

    // Build today's schedule
    const scheduleItems: ScheduleItem[] = [];
    
    // Add today's tasks with due dates
    const todayTasks = tasks?.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return isToday(dueDate) || (new Date(task.due_date) < new Date() && !task.completed);
    }) || [];
    
    todayTasks.forEach(task => {
      scheduleItems.push({
        id: task.id,
        title: task.title,
        type: "task",
        time: task.due_date ? format(new Date(task.due_date), "HH:mm") : "No time",
        course: task.course || undefined,
        priority: task.priority,
        completed: task.completed,
      });
    });

    // Add today's exams
    const todayExams = exams?.filter(exam => 
      isToday(new Date(exam.exam_date)) || isTomorrow(new Date(exam.exam_date))
    ) || [];
    
    todayExams.forEach(exam => {
      scheduleItems.push({
        id: exam.id,
        title: exam.title,
        type: "exam",
        time: format(new Date(exam.exam_date), "HH:mm"),
        course: exam.course,
      });
    });

    // Sort by time
    scheduleItems.sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(scheduleItems);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Here's your study overview for today</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow transition-smooth hover:elevated-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tasks
            </CardTitle>
            <CheckSquare className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedToday} completed today
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow transition-smooth hover:elevated-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Exam
            </CardTitle>
            <Calendar className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            {stats.nextExam ? (
              <>
                <div className="text-2xl font-bold">{stats.nextExam.course}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(stats.nextExam.exam_date), { addSuffix: true })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming exams</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow transition-smooth hover:elevated-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Focus Time Today
            </CardTitle>
            <Timer className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.focusMinutes} min</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.floor(stats.focusMinutes / 25)} sessions completed
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow transition-smooth hover:elevated-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Add
            </CardTitle>
            <FileText className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add a task or note quickly from here
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tasks or exams scheduled for today
            </p>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {item.type === "task" ? (
                      <CheckSquare className={`w-5 h-5 ${item.completed ? "text-success" : "text-primary"}`} />
                    ) : (
                      <Calendar className="w-5 h-5 text-warning" />
                    )}
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.course && (
                        <p className="text-xs text-muted-foreground">{item.course}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.priority && item.type === "task" && (
                      <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                        {item.priority}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}