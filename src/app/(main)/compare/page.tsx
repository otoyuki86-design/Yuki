"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, X, ExternalLink, TrendingUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useJobStore } from "@/store/useJobStore";
import { INDUSTRY_LABELS } from "@/types";
import { cn } from "@/lib/utils";

const MAX_COMPARE = 4;

export default function ComparePage() {
  const companies = useJobStore((s) => s.companies);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selected = useMemo(
    () => selectedIds.map((id) => companies.find((c) => c.id === id)).filter(Boolean) as typeof companies,
    [selectedIds, companies]
  );

  function addCompany(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_COMPARE) return;
    setSelectedIds((prev) => [...prev, id]);
  }

  function removeCompany(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  const rows: { label: string; render: (c: typeof companies[0]) => React.ReactNode }[] = [
    {
      label: "ステータス",
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      label: "業界",
      render: (c) => INDUSTRY_LABELS[c.industry],
    },
    {
      label: "職種",
      render: (c) => c.jobType || <span className="text-slate-300">—</span>,
    },
    {
      label: "給与",
      render: (c) =>
        c.salary.min || c.salary.max ? (
          <span className="font-semibold">
            {c.salary.min ?? "?"}〜{c.salary.max ?? "?"}万円
          </span>
        ) : (
          <span className="text-slate-300">未設定</span>
        ),
    },
    {
      label: "勤務形態",
      render: (c) =>
        ({ remote: "フルリモート", hybrid: "ハイブリッド", office: "フル出社", unknown: "不明" }[c.workStyle]),
    },
    {
      label: "勤務地",
      render: (c) => c.location || <span className="text-slate-300">—</span>,
    },
    {
      label: "従業員数",
      render: (c) => c.employeeCount || <span className="text-slate-300">—</span>,
    },
    {
      label: "福利厚生",
      render: (c) =>
        c.benefits ? (
          <p className="text-xs whitespace-pre-wrap text-slate-700">{c.benefits}</p>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      label: "企業理念",
      render: (c) =>
        c.philosophy ? (
          <p className="text-xs whitespace-pre-wrap text-slate-700">{c.philosophy}</p>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      label: "仕事内容",
      render: (c) =>
        c.jobDescription ? (
          <p className="text-xs whitespace-pre-wrap text-slate-700">{c.jobDescription}</p>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      label: "優先度",
      render: (c) => (
        <span className="text-amber-500">
          {"★".repeat(4 - c.priority)}{"☆".repeat(c.priority - 1)}
        </span>
      ),
    },
    {
      label: "ES設問数",
      render: (c) => c.entrySheets.length,
    },
    {
      label: "面接回数",
      render: (c) => c.interviewNotes.length,
    },
    {
      label: "マイページ",
      render: (c) =>
        c.mypageUrl ? (
          <a href={c.mypageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
            <ExternalLink className="h-3 w-3" />開く
          </a>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">企業比較</h1>
        <p className="text-sm text-slate-500 mt-0.5">最大{MAX_COMPARE}社を並べて比較</p>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap gap-2 items-center">
        {selected.map((c) => (
          <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-800">
            {c.name}
            <button onClick={() => removeCompany(c.id)} className="text-blue-400 hover:text-blue-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {selected.length < MAX_COMPARE && (
          <Select
            className="w-48"
            value=""
            onChange={(e) => { if (e.target.value) addCompany(e.target.value); }}
          >
            <option value="">＋ 企業を追加</option>
            {companies
              .filter((c) => !selectedIds.includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </Select>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">企業を選んで比較しましょう</p>
          <p className="text-sm mt-1">上のセレクタから最大{MAX_COMPARE}社を追加できます</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-28 text-left p-3 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  項目
                </th>
                {selected.map((c) => (
                  <th key={c.id} className="p-3 bg-white border border-slate-200 text-center min-w-[160px]">
                    <Link href={`/companies/${c.id}`} className="font-semibold text-slate-900 hover:text-blue-600 text-sm">
                      {c.name}
                    </Link>
                    <button
                      onClick={() => removeCompany(c.id)}
                      className="ml-2 text-slate-300 hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5 inline" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={cn(i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                  <td className="p-3 border border-slate-200 text-xs font-semibold text-slate-600 whitespace-nowrap">
                    {row.label}
                  </td>
                  {selected.map((c) => (
                    <td key={c.id} className="p-3 border border-slate-200 text-sm text-slate-800">
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
