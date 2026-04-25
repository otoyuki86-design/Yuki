"use client";
import { useMemo } from "react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Building2, TrendingUp, CalendarDays, CheckCircle2,
  Star, AlertCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { AddCompanyDialog } from "@/components/AddCompanyDialog";
import { useJobStore } from "@/store/useJobStore";
import {
  ACTIVE_STATUSES, ApplicationStatus, STATUS_LABELS,
  EVENT_TYPE_LABELS
} from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const KANBAN_COLUMNS: ApplicationStatus[] = [
  "interested", "es_preparing", "es_submitted", "screening",
  "interview1", "interview2", "final_interview",
];

export default function Dashboard() {
  const companies = useJobStore((s) => s.companies);

  const stats = useMemo(() => {
    const active = companies.filter((c) => ACTIVE_STATUSES.includes(c.status));
    const offered = companies.filter((c) => c.status === "offered");
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const upcoming = companies
      .flatMap((c) => c.events.map((e) => ({ ...e, companyName: c.name })))
      .filter((e) => !e.completed && isAfter(parseISO(e.date), today) && isBefore(parseISO(e.date), nextWeek))
      .sort((a, b) => a.date.localeCompare(b.date));
    const deadlines = companies
      .flatMap((c) => c.events.map((e) => ({ ...e, companyName: c.name })))
      .filter((e) => !e.completed && (e.type === "deadline" || e.type === "es_deadline"))
      .filter((e) => isAfter(parseISO(e.date), today))
      .sort((a, b) => a.date.localeCompare(b.date));
    return { active, offered, upcoming, deadlines };
  }, [companies]);

  const kanbanData = useMemo(() => {
    const map: Record<string, typeof companies> = {};
    for (const col of KANBAN_COLUMNS) {
      map[col] = companies.filter((c) => c.status === col);
    }
    return map;
  }, [companies]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
          <p className="text-sm text-slate-500 mt-1">
            {format(new Date(), "yyyy年M月d日 (EEE)", { locale: ja })}
          </p>
        </div>
        <AddCompanyDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="選考中"
          value={stats.active.length}
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="内定"
          value={stats.offered.length}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard
          title="登録企業数"
          value={companies.length}
          icon={<Building2 className="h-5 w-5 text-slate-600" />}
          color="slate"
        />
        <StatCard
          title="今週の予定"
          value={stats.upcoming.length}
          icon={<CalendarDays className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">今後の予定</h2>
          {stats.upcoming.length === 0 ? (
            <EmptyState message="今後7日間の予定はありません" />
          ) : (
            <div className="space-y-2">
              {stats.upcoming.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-700">
                      {format(parseISO(e.date), "M/d")}
                    </span>
                    <span className="text-[10px] text-blue-500">
                      {format(parseISO(e.date), "EEE", { locale: ja })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.companyName} · {EVENT_TYPE_LABELS[e.type]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deadlines alert */}
          {stats.deadlines.length > 0 && (
            <>
              <h2 className="text-base font-semibold text-slate-900 mt-2">締め切り一覧</h2>
              <div className="space-y-2">
                {stats.deadlines.slice(0, 5).map((e) => {
                  const daysLeft = Math.ceil(
                    (parseISO(e.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={e.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        daysLeft <= 3
                          ? "bg-red-50 border-red-200"
                          : "bg-amber-50 border-amber-200"
                      )}
                    >
                      {daysLeft <= 3 ? (
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{e.companyName}</p>
                        <p className="text-xs text-slate-500">{e.title}</p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold shrink-0",
                          daysLeft <= 3 ? "text-red-600" : "text-amber-700"
                        )}
                      >
                        {daysLeft === 0 ? "今日" : `あと${daysLeft}日`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* High priority companies */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">優先企業</h2>
          {companies.filter((c) => c.priority === 1 && ACTIVE_STATUSES.includes(c.status)).length === 0 ? (
            <EmptyState message="優先度★★★の企業がありません" />
          ) : (
            <div className="space-y-2">
              {companies
                .filter((c) => c.priority === 1 && ACTIVE_STATUSES.includes(c.status))
                .map((c) => (
                  <Link key={c.id} href={`/companies/${c.id}`}>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{c.jobType || "職種未設定"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusBadge status={c.status} />
                          <span className="text-xs text-amber-500">
                            {"★".repeat(4 - c.priority)}{"☆".repeat(c.priority - 1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Kanban overview */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">選考ステータス一覧</h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {KANBAN_COLUMNS.map((col) => {
              const items = kanbanData[col] || [];
              return (
                <div key={col} className="w-40 shrink-0">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{STATUS_LABELS[col]}</span>
                    <span className="text-xs text-slate-400">{items.length}</span>
                  </div>
                  <div className="space-y-1.5 min-h-[60px]">
                    {items.map((c) => (
                      <Link key={c.id} href={`/companies/${c.id}`}>
                        <div className="p-2 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                          <p className="text-xs font-medium text-slate-800 truncate">{c.name}</p>
                          {c.priority === 1 && (
                            <span className="text-[10px] text-amber-500">★★★</span>
                          )}
                        </div>
                      </Link>
                    ))}
                    {items.length === 0 && (
                      <div className="h-10 rounded-lg border-2 border-dashed border-slate-200" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon, color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "slate" | "purple";
}) {
  const bg = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    slate: "bg-slate-100",
    purple: "bg-purple-50",
  }[color];
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-6 text-slate-400 text-sm bg-white rounded-lg border border-dashed border-slate-200">
      {message}
    </div>
  );
}
