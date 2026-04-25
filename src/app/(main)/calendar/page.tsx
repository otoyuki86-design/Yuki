"use client";
import { useState, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobStore } from "@/store/useJobStore";
import { EVENT_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

const EVENT_TYPE_DOT_COLORS: Record<string, string> = {
  interview: "bg-blue-500",
  deadline: "bg-red-500",
  es_deadline: "bg-orange-500",
  seminar: "bg-purple-500",
  other: "bg-slate-400",
};

export default function CalendarPage() {
  const companies = useJobStore((s) => s.companies);
  const toggleEventCompleted = useJobStore((s) => s.toggleEventCompleted);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const allEvents = useMemo(() =>
    companies.flatMap((c) =>
      c.events.map((e) => ({ ...e, companyName: c.name, companyId: c.id }))
    ),
    [companies]
  );

  const daysInGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof allEvents>();
    for (const e of allEvents) {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [allEvents]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return allEvents
      .filter((e) => isSameDay(parseISO(e.date), selectedDay))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedDay, allEvents]);

  const upcomingEvents = useMemo(() =>
    allEvents
      .filter((e) => !e.completed && parseISO(e.date) >= new Date())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10),
    [allEvents]
  );

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">カレンダー</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => subMonths(d, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold text-slate-900">
              {format(currentDate, "yyyy年M月", { locale: ja })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => addMonths(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
              <div
                key={d}
                className={cn(
                  "text-center text-xs font-medium py-1",
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-500"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden">
            {daysInGrid.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const events = eventsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, currentDate);
              const todayFlag = isToday(day);
              const selected = selectedDay && isSameDay(day, selectedDay);
              const dayOfWeek = day.getDay();

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay((d) => (d && isSameDay(d, day) ? null : day))}
                  className={cn(
                    "min-h-[64px] p-1 text-left bg-white hover:bg-blue-50 transition-colors",
                    !inMonth && "bg-slate-50",
                    selected && "bg-blue-50 ring-2 ring-inset ring-blue-400",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium",
                      todayFlag && "bg-blue-600 text-white",
                      !inMonth && "text-slate-300",
                      !todayFlag && inMonth && dayOfWeek === 0 && "text-red-500",
                      !todayFlag && inMonth && dayOfWeek === 6 && "text-blue-500",
                      !todayFlag && inMonth && dayOfWeek > 0 && dayOfWeek < 6 && "text-slate-700",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {events.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          e.completed ? "bg-slate-300" : EVENT_TYPE_DOT_COLORS[e.type]
                        )}
                      />
                    ))}
                    {events.length > 3 && (
                      <span className="text-[9px] text-slate-400">+{events.length - 3}</span>
                    )}
                  </div>
                  {events.slice(0, 1).map((e) => (
                    <p key={e.id} className={cn("text-[10px] truncate mt-0.5 leading-none", e.completed ? "text-slate-300" : "text-slate-600")}>
                      {e.companyName}
                    </p>
                  ))}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(EVENT_TYPE_DOT_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
                <span className="text-xs text-slate-500">{EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {selectedDay && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">
                {format(selectedDay, "M月d日 (EEE)", { locale: ja })}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-slate-400">予定はありません</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((e) => (
                    <EventItem key={e.id} event={e} onToggle={() => toggleEventCompleted(e.companyId, e.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">直近の予定</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-400">予定はありません</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((e) => (
                  <EventItem key={e.id} event={e} onToggle={() => toggleEventCompleted(e.companyId, e.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventItem({
  event,
  onToggle,
}: {
  event: { id: string; title: string; date: string; type: string; companyName: string; completed: boolean; note?: string };
  onToggle: () => void;
}) {
  return (
    <div className={cn("flex items-start gap-2", event.completed && "opacity-50")}>
      <button
        onClick={onToggle}
        className={cn(
          "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0",
          event.completed ? "bg-green-500 border-green-500 text-white" : "border-slate-300 hover:border-green-400"
        )}
      >
        {event.completed && <Check className="w-2.5 h-2.5" />}
      </button>
      <div className="min-w-0">
        <p className={cn("text-xs font-medium", event.completed ? "line-through text-slate-400" : "text-slate-800")}>
          {event.title}
        </p>
        <p className="text-[10px] text-slate-500">
          {event.companyName} · {format(parseISO(event.date), "M/d HH:mm")}
        </p>
        <span className={cn("inline-block text-[10px] px-1.5 py-0.5 rounded mt-0.5", EVENT_TYPE_DOT_COLORS[event.type]?.replace("bg-", "bg-").replace("500", "100"), "text-slate-700")}>
          {EVENT_TYPE_LABELS[event.type as keyof typeof EVENT_TYPE_LABELS]}
        </span>
      </div>
    </div>
  );
}
