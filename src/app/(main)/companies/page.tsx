"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List, ExternalLink, Star, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { AddCompanyDialog } from "@/components/AddCompanyDialog";
import { useJobStore } from "@/store/useJobStore";
import {
  ApplicationStatus, ACTIVE_STATUSES, STATUS_LABELS,
  INDUSTRY_LABELS, Industry
} from "@/types";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "kanban";

const KANBAN_COLS: ApplicationStatus[] = [
  "interested", "es_preparing", "es_submitted", "screening",
  "interview1", "interview2", "final_interview", "offered",
];

export default function CompaniesPage() {
  const companies = useJobStore((s) => s.companies);
  const updateStatus = useJobStore((s) => s.updateStatus);

  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");
  const [filterIndustry, setFilterIndustry] = useState<Industry | "all">("all");
  const [showRejected, setShowRejected] = useState(false);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (!showRejected && (c.status === "rejected" || c.status === "declined")) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterIndustry !== "all" && c.industry !== filterIndustry) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [companies, search, filterStatus, filterIndustry, showRejected]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">企業管理</h1>
        <AddCompanyDialog />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-8"
            placeholder="企業名を検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          className="w-40"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | "all")}
        >
          <option value="all">全ステータス</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        <Select
          className="w-36"
          value={filterIndustry}
          onChange={(e) => setFilterIndustry(e.target.value as Industry | "all")}
        >
          <option value="all">全業界</option>
          {Object.entries(INDUSTRY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        <Button
          variant={showRejected ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowRejected((v) => !v)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showRejected ? "不採用を非表示" : "不採用も表示"}
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} 件</p>

      {view === "list" ? (
        <ListView companies={filtered} />
      ) : (
        <KanbanView companies={filtered} onStatusChange={updateStatus} />
      )}
    </div>
  );
}

function PriorityStars({ priority }: { priority: 1 | 2 | 3 }) {
  return (
    <span className="text-xs text-amber-500">
      {"★".repeat(4 - priority)}{"☆".repeat(priority - 1)}
    </span>
  );
}

function ListView({ companies }: { companies: ReturnType<typeof useJobStore.getState>["companies"] }) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg font-medium">企業が見つかりません</p>
        <p className="text-sm mt-1">「企業を追加」から最初の企業を登録しましょう</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {companies.map((c) => (
        <Link key={c.id} href={`/companies/${c.id}`}>
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold text-sm">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900 truncate">{c.name}</p>
                <PriorityStars priority={c.priority} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {INDUSTRY_LABELS[c.industry]} {c.jobType ? `· ${c.jobType}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {c.salary.min && (
                <span className="text-xs text-slate-600 hidden sm:block">
                  {c.salary.min}〜{c.salary.max ?? ""}万円
                </span>
              )}
              <StatusBadge status={c.status} />
              {c.mypageUrl && (
                <a
                  href={c.mypageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-400 hover:text-blue-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function KanbanView({
  companies,
  onStatusChange,
}: {
  companies: ReturnType<typeof useJobStore.getState>["companies"];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {KANBAN_COLS.map((col) => {
          const items = companies.filter((c) => c.status === col);
          return (
            <div key={col} className="w-52 shrink-0">
              <div className="mb-2 px-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">{STATUS_LABELS[col]}</span>
                <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-[120px] p-2 bg-slate-100 rounded-lg">
                {items.map((c) => (
                  <KanbanCard key={c.id} company={c} onStatusChange={onStatusChange} />
                ))}
                {items.length === 0 && (
                  <div className="h-10 rounded border-2 border-dashed border-slate-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  company,
  onStatusChange,
}: {
  company: ReturnType<typeof useJobStore.getState>["companies"][0];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between gap-1">
        <Link href={`/companies/${company.id}`} className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 truncate">{company.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{INDUSTRY_LABELS[company.industry]}</p>
        </Link>
        <PriorityStars priority={company.priority} />
      </div>
      <div className="mt-2">
        <Select
          className="text-[11px] h-6 py-0 px-1"
          value={company.status}
          onChange={(e) => onStatusChange(company.id, e.target.value as ApplicationStatus)}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}
