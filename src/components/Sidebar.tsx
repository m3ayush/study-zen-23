import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  Calendar, 
  FileText, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Pomodoro", href: "/pomodoro", icon: Timer },
  { name: "Exams", href: "/exams", icon: Calendar },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-sidebar flex-col hidden lg:flex">
      <div className="p-6 border-b border-sidebar-border rounded">
        <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent rounded text-white pl-14 font-serif">
          Planora
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth font-medium",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}