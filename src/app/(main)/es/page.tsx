"use client";
import { useState, useMemo } from "react";
import { Search, Plus, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useJobStore } from "@/store/useJobStore";
import { EntrySheet } from "@/types";
import { cn } from "@/lib/utils";

export default function ESPage() {
  const companies = useJobStore((s) => s.companies);
  const addEntrySheet = useJobStore((s) => s.addEntrySheet);
  const updateEntrySheet = useJobStore((s) => s.updateEntrySheet);
  const deleteEntrySheet = useJobStore((s) => s.deleteEntrySheet);

  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");

  const allES = useMemo(() =>
    companies.flatMap((c) =>
      c.entrySheets.map((es) => ({ ...es, companyName: c.name, companyId: c.id }))
    ),
    [companies]
  );

  const filtered = useMemo(() =>
    allES.filter((es) => {
      if (filterCompany !== "all" && es.companyId !== filterCompany) return false;
      if (search && !es.question.toLowerCase().includes(search.toLowerCase()) &&
        !es.companyName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [allES, search, filterCompany]
  );

  const totalChars = useMemo(() =>
    filtered.reduce((sum, es) => sum + es.answer.length, 0),
    [filtered]
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ES管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">エントリーシート一元管理</p>
        </div>
        <AddESGlobalDialog companies={companies} onAdd={addEntrySheet} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip label="総設問数" value={allES.length} />
        <StatChip label="表示中" value={filtered.length} />
        <StatChip label="総文字数" value={totalChars.toLocaleString()} suffix="字" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-8" placeholder="設問・企業名で検索..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-44" value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
          <option value="all">全企業</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {/* ES List grouped by company */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">ESがありません</p>
          <p className="text-sm mt-1">「ES設問を追加」から設問を登録しましょう</p>
        </div>
      ) : (
        <CompanyGroupedES
          filtered={filtered}
          companies={companies}
          onUpdate={updateEntrySheet}
          onDelete={deleteEntrySheet}
        />
      )}
    </div>
  );
}

function StatChip({ label, value, suffix = "" }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}{suffix}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function CompanyGroupedES({
  filtered,
  companies,
  onUpdate,
  onDelete,
}: {
  filtered: (EntrySheet & { companyName: string; companyId: string })[];
  companies: ReturnType<typeof useJobStore.getState>["companies"];
  onUpdate: (companyId: string, esId: string, updates: Partial<EntrySheet>) => void;
  onDelete: (companyId: string, esId: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: typeof filtered }>();
    for (const es of filtered) {
      if (!map.has(es.companyId)) map.set(es.companyId, { name: es.companyName, items: [] });
      map.get(es.companyId)!.items.push(es);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-4">
      {grouped.map(([companyId, { name, items }]) => (
        <CompanyESGroup
          key={companyId}
          companyId={companyId}
          companyName={name}
          items={items}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function CompanyESGroup({
  companyId, companyName, items, onUpdate, onDelete,
}: {
  companyId: string;
  companyName: string;
  items: (EntrySheet & { companyName: string })[];
  onUpdate: (companyId: string, esId: string, updates: Partial<EntrySheet>) => void;
  onDelete: (companyId: string, esId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const answeredCount = items.filter((es) => es.answer.trim().length > 0).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 rounded-t-xl transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
            {companyName[0]}
          </div>
          <div>
            <Link href={`/companies/${companyId}`} className="font-semibold text-slate-900 hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
              {companyName}
            </Link>
            <p className="text-xs text-slate-500">
              {answeredCount}/{items.length} 設問回答済
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${items.length ? (answeredCount / items.length) * 100 : 0}%` }}
            />
          </div>
          {collapsed ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
        </div>
      </button>
      {!collapsed && (
        <div className="divide-y divide-slate-100">
          {items.map((es) => (
            <ESRow
              key={es.id}
              es={es}
              onUpdate={(updates) => onUpdate(companyId, es.id, updates)}
              onDelete={() => onDelete(companyId, es.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ESRow({
  es, onUpdate, onDelete,
}: {
  es: EntrySheet;
  onUpdate: (updates: Partial<EntrySheet>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(es.answer);
  const charCount = answer.length;
  const overLimit = es.charLimit ? charCount > es.charLimit : false;
  const answered = es.answer.trim().length > 0;

  return (
    <div className="p-4">
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full mt-1.5 shrink-0",
            answered ? "bg-green-500" : "bg-slate-300"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              className="text-sm font-medium text-slate-800 text-left hover:text-blue-600"
              onClick={() => setExpanded((v) => !v)}
            >
              {es.question}
              {es.charLimit && (
                <span className="ml-2 text-xs text-slate-400">({es.charLimit}字)</span>
              )}
            </button>
            <div className="flex gap-1 shrink-0">
              {editing ? (
                <Button size="sm" onClick={() => { onUpdate({ answer }); setEditing(false); }}>保存</Button>
              ) : (
                <Button size="icon" variant="ghost" onClick={() => { setExpanded(true); setEditing(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-2">
              {editing ? (
                <>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={6}
                    className="text-sm"
                  />
                  {es.charLimit && (
                    <p className={cn("text-xs mt-1 text-right", overLimit ? "text-red-500 font-semibold" : "text-slate-400")}>
                      {charCount.toLocaleString()} / {es.charLimit.toLocaleString()}字
                      {overLimit && " ⚠ 超過"}
                    </p>
                  )}
                </>
              ) : (
                <p className={cn("text-sm mt-1", answered ? "text-slate-700 whitespace-pre-wrap" : "text-slate-300 italic")}>
                  {answered ? es.answer : "未記入"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddESGlobalDialog({
  companies,
  onAdd,
}: {
  companies: ReturnType<typeof useJobStore.getState>["companies"];
  onAdd: (es: Omit<EntrySheet, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [charLimit, setCharLimit] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" />ES設問を追加</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>ES設問を追加</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!companyId) return;
          onAdd({ companyId, question, answer, charLimit: charLimit ? Number(charLimit) : undefined });
          setOpen(false); setQuestion(""); setAnswer(""); setCharLimit("");
        }} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">企業</label>
            <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
              {companies.length === 0 && <option value="">先に企業を追加してください</option>}
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">設問</label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="自己PRを書いてください（400字以内）" required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">字数制限</label>
            <Input type="number" value={charLimit} onChange={(e) => setCharLimit(e.target.value)} placeholder="400（任意）" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">回答（任意）</label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} placeholder="回答を入力..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit" disabled={companies.length === 0}>追加</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
