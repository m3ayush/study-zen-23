import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Pomodoro() {
  const [duration, setDuration] = useState(25 * 60); // 25 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      completeSession();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        resetTimer();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isRunning, sessionId]);

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("pomodoro_sessions")
      .select("*")
      .eq("user_id", user.id)
      .gte("started_at", today.toISOString())
      .order("started_at", { ascending: false });

    if (data) setSessions(data);
  };

  const toggleTimer = async () => {
    if (!isRunning && !sessionId) {
      // Start new session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .insert({
          user_id: user.id,
          duration: Math.floor(duration / 60),
          completed: false,
        })
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error starting session",
          description: error.message,
        });
        return;
      }

      setSessionId(data.id);
    }

    setIsRunning(!isRunning);
  };

  const completeSession = async () => {
    if (!sessionId) return;

    const { error } = await supabase
      .from("pomodoro_sessions")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error completing session",
        description: error.message,
      });
    } else {
      toast({
        title: "Session completed! 🎉",
        description: "Great work! Take a 5-minute break.",
      });
      resetTimer();
      loadSessions();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setSessionId(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pomodoro Timer</h1>
        <p className="text-muted-foreground">
          Focus for 25 minutes. Press Space to start/stop, R to reset.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-shadow">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-8">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-64 h-64 transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-secondary"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    className="text-primary transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute">
                  <div className="text-6xl font-bold">{formatTime(timeLeft)}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={toggleTimer}
                  className="w-24 gradient-primary"
                >
                  {isRunning ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetTimer}
                  className="w-24"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Today's Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sessions today. Start your first one!
                </p>
              ) : (
                <>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Focus Time</p>
                    <p className="text-3xl font-bold text-success">
                      {sessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0)} min
                    </p>
                  </div>
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            session.completed ? "bg-success" : "bg-warning"
                          }`}
                        />
                        <span className="text-sm">
                          {session.duration} min session
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.started_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}