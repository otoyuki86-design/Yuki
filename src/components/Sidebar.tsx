"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/companies", label: "企業管理", icon: Building2 },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/es", label: "ES管理", icon: FileText },
  { href: "/compare", label: "企業比較", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 flex flex-col bg-white border-r border-slate-200 h-full">
      <div className="p-4 border-b border-slate-200">
        <h1 className="font-bold text-lg text-slate-900">就活マネージャー</h1>
        <p className="text-xs text-slate-500 mt-0.5">Yuki</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <Settings className="h-4 w-4" />
          設定
        </Link>
      </div>
    </aside>
  );
}
