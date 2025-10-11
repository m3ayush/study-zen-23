import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Settings() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your StudyHub experience</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <Button className="gradient-primary">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Pomodoro Timer</CardTitle>
            <CardDescription>Customize your focus session lengths</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="focus">Focus Duration (minutes)</Label>
              <Input id="focus" type="number" defaultValue="25" min="1" max="60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break">Break Duration (minutes)</Label>
              <Input id="break" type="number" defaultValue="5" min="1" max="30" />
            </div>
            <Button className="gradient-primary">Save Timer Settings</Button>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export or import your study data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline">Export Data (JSON)</Button>
              <Button variant="outline">Import Data</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}