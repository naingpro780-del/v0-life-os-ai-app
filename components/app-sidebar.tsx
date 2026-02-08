"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  StickyNote,
  CalendarDays,
  Target,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "tasks", href: "/tasks", icon: CheckSquare },
  { key: "habits", href: "/habits", icon: Repeat },
  { key: "notes", href: "/notes", icon: StickyNote },
  { key: "calendar", href: "/calendar", icon: CalendarDays },
  { key: "goals", href: "/goals", icon: Target },
  { key: "settings", href: "/settings", icon: Settings },
];

export function AppSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:z-auto md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">
              {t("appName")}
            </h1>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {t("logout")}
          </Button>
        </div>
      </aside>
    </>
  );
}
