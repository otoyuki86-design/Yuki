"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ArrowLeft, ExternalLink, Pencil, Trash2, Plus, Check,
  Building2, Banknote, Heart, Laptop, BookOpen,
  CalendarDays, FileText, MessageSquare, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useJobStore } from "@/store/useJobStore";
import {
  ApplicationStatus, STATUS_LABELS, INDUSTRY_LABELS, Event,
  EntrySheet, InterviewNote, EVENT_TYPE_LABELS
} from "@/types";
import { cn } from "@/lib/utils";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const company = useJobStore((s) => s.companies.find((c) => c.id === id));
  const updateCompany = useJobStore((s) => s.updateCompany);
  const deleteCompany = useJobStore((s) => s.deleteCompany);
  const updateStatus = useJobStore((s) => s.updateStatus);
  const addEvent = useJobStore((s) => s.addEvent);
  const toggleEventCompleted = useJobStore((s) => s.toggleEventCompleted);
  const deleteEvent = useJobStore((s) => s.deleteEvent);
  const addEntrySheet = useJobStore((s) => s.addEntrySheet);
  const updateEntrySheet = useJobStore((s) => s.updateEntrySheet);
  const deleteEntrySheet = useJobStore((s) => s.deleteEntrySheet);
  const addInterviewNote = useJobStore((s) => s.addInterviewNote);
  const updateInterviewNote = useJobStore((s) => s.updateInterviewNote);
  const deleteInterviewNote = useJobStore((s) => s.deleteInterviewNote);

  if (!company) {
    return (
      <div className="p-6">
        <p className="text-slate-500">企業が見つかりません</p>
        <Link href="/companies"><Button variant="outline" className="mt-3">一覧に戻る</Button></Link>
      </div>
    );
  }

  function handleDelete() {
    if (confirm(`「${company!.name}」を削除しますか？`)) {
      deleteCompany(id);
      router.push("/companies");
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/companies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <span className="text-amber-500">{"★".repeat(4 - company.priority)}{"☆".repeat(company.priority - 1)}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {INDUSTRY_LABELS[company.industry]}
            {company.jobType ? ` · ${company.jobType}` : ""}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={company.status} />
            {company.tags.map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select
            className="w-36 text-xs h-8"
            value={company.status}
            onChange={(e) => updateStatus(id, e.target.value as ApplicationStatus)}
          >
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <EditCompanyDialog company={company} onSave={(updates) => updateCompany(id, updates as Partial<typeof company>)} />
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {company.officialUrl && <ExternalLinkBtn href={company.officialUrl} label="公式サイト" />}
        {company.mypageUrl && <ExternalLinkBtn href={company.mypageUrl} label="マイページ" color="blue" />}
        {company.jobSiteLinks.mynavi && <ExternalLinkBtn href={company.jobSiteLinks.mynavi} label="マイナビ" />}
        {company.jobSiteLinks.rikunabi && <ExternalLinkBtn href={company.jobSiteLinks.rikunabi} label="リクナビ" />}
        {company.jobSiteLinks.labbase && <ExternalLinkBtn href={company.jobSiteLinks.labbase} label="Labbase" />}
        {company.jobSiteLinks.openwork && <ExternalLinkBtn href={company.jobSiteLinks.openwork} label="OpenWork" />}
        {company.jobSiteLinks.wantedly && <ExternalLinkBtn href={company.jobSiteLinks.wantedly} label="Wantedly" />}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="events">予定 ({company.events.length})</TabsTrigger>
          <TabsTrigger value="es">ES ({company.entrySheets.length})</TabsTrigger>
          <TabsTrigger value="interview">面接メモ ({company.interviewNotes.length})</TabsTrigger>
          <TabsTrigger value="notes">メモ</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Salary */}
            <InfoCard icon={<Banknote className="h-4 w-4" />} title="給与">
              {company.salary.min || company.salary.max ? (
                <p className="font-semibold text-slate-900">
                  {company.salary.min ?? "?"}〜{company.salary.max ?? "?"}万円/年
                </p>
              ) : <p className="text-slate-400 text-sm">未設定</p>}
              {company.salary.note && <p className="text-xs text-slate-500 mt-1">{company.salary.note}</p>}
            </InfoCard>

            {/* Work style */}
            <InfoCard icon={<Laptop className="h-4 w-4" />} title="勤務形態">
              <p className="font-semibold text-slate-900">
                {{ remote: "フルリモート", hybrid: "ハイブリッド", office: "フル出社", unknown: "不明" }[company.workStyle]}
              </p>
              {company.location && <p className="text-xs text-slate-500 mt-1">{company.location}</p>}
            </InfoCard>

            {/* Job description */}
            {company.jobDescription && (
              <InfoCard icon={<Building2 className="h-4 w-4" />} title="仕事内容" className="md:col-span-2">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{company.jobDescription}</p>
              </InfoCard>
            )}

            {/* Philosophy */}
            {company.philosophy && (
              <InfoCard icon={<BookOpen className="h-4 w-4" />} title="企業理念・ビジョン" className="md:col-span-2">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{company.philosophy}</p>
              </InfoCard>
            )}

            {/* Benefits */}
            {company.benefits && (
              <InfoCard icon={<Heart className="h-4 w-4" />} title="福利厚生" className="md:col-span-2">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{company.benefits}</p>
              </InfoCard>
            )}
          </div>
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-4 space-y-3">
          <AddEventDialog companyId={id} onAdd={addEvent} />
          {company.events.length === 0 ? (
            <EmptyState message="予定はまだありません" />
          ) : (
            <div className="space-y-2">
              {[...company.events]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    onToggle={() => toggleEventCompleted(id, e.id)}
                    onDelete={() => deleteEvent(id, e.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        {/* ES */}
        <TabsContent value="es" className="mt-4 space-y-3">
          <AddESDialog companyId={id} onAdd={addEntrySheet} />
          {company.entrySheets.length === 0 ? (
            <EmptyState message="ESはまだありません" />
          ) : (
            <div className="space-y-3">
              {company.entrySheets.map((es) => (
                <ESCard
                  key={es.id}
                  es={es}
                  onUpdate={(updates) => updateEntrySheet(id, es.id, updates)}
                  onDelete={() => deleteEntrySheet(id, es.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* INTERVIEW NOTES */}
        <TabsContent value="interview" className="mt-4 space-y-3">
          <AddInterviewDialog companyId={id} round={company.interviewNotes.length + 1} onAdd={addInterviewNote} />
          {company.interviewNotes.length === 0 ? (
            <EmptyState message="面接メモはまだありません" />
          ) : (
            <div className="space-y-3">
              {[...company.interviewNotes]
                .sort((a, b) => a.round - b.round)
                .map((note) => (
                  <InterviewCard
                    key={note.id}
                    note={note}
                    onUpdate={(updates) => updateInterviewNote(id, note.id, updates)}
                    onDelete={() => deleteInterviewNote(id, note.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes" className="mt-4">
          <NotesEditor
            value={company.generalNotes ?? ""}
            onSave={(v) => updateCompany(id, { generalNotes: v })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExternalLinkBtn({ href, label, color = "slate" }: { href: string; label: string; color?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm" className={cn(color === "blue" && "border-blue-300 text-blue-700")}>
        <ExternalLink className="h-3.5 w-3.5" />
        {label}
      </Button>
    </a>
  );
}

function InfoCard({ icon, title, children, className }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-4 bg-white rounded-xl border border-slate-200", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
      {message}
    </div>
  );
}

function EventRow({ event, onToggle, onDelete }: {
  event: Event;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-white rounded-lg border transition-all",
      event.completed ? "border-slate-200 opacity-60" : "border-slate-200"
    )}>
      <button
        onClick={onToggle}
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
          event.completed ? "bg-green-500 border-green-500 text-white" : "border-slate-300 hover:border-green-400"
        )}
      >
        {event.completed && <Check className="h-3 w-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", event.completed ? "line-through text-slate-400" : "text-slate-900")}>
          {event.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {format(parseISO(event.date), "yyyy年M月d日 (EEE) HH:mm", { locale: ja })} · {EVENT_TYPE_LABELS[event.type]}
        </p>
        {event.note && <p className="text-xs text-slate-400 mt-0.5">{event.note}</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} className="text-slate-400 hover:text-red-500 shrink-0">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function AddEventDialog({ companyId, onAdd }: {
  companyId: string;
  onAdd: (e: Omit<Event, "id">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", date: "", type: "interview" as Event["type"], note: ""
  });
  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" />予定を追加</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>予定を追加</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          onAdd({ companyId, ...form, completed: false });
          setOpen(false);
          setForm({ title: "", date: "", type: "interview", note: "" });
        }} className="space-y-3">
          <Input value={form.title} onChange={set("title")} placeholder="面接・ES締め切りなど" required />
          <Input type="datetime-local" value={form.date} onChange={set("date")} required />
          <Select value={form.type} onChange={set("type")}>
            {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <Textarea value={form.note} onChange={set("note")} placeholder="メモ（任意）" rows={2} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit">追加</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ESCard({ es, onUpdate, onDelete }: {
  es: EntrySheet;
  onUpdate: (updates: Partial<EntrySheet>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(es.answer);
  const charCount = answer.length;
  const overLimit = es.charLimit ? charCount > es.charLimit : false;

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-800">{es.question}</p>
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <Button size="sm" onClick={() => { onUpdate({ answer }); setEditing(false); }}>保存</Button>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {editing ? (
        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} />
      ) : (
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{es.answer || <span className="text-slate-300">未入力</span>}</p>
      )}
      {es.charLimit && (
        <p className={cn("text-xs mt-1 text-right", overLimit ? "text-red-500" : "text-slate-400")}>
          {charCount} / {es.charLimit}字
        </p>
      )}
    </div>
  );
}

function AddESDialog({ companyId, onAdd }: {
  companyId: string;
  onAdd: (es: Omit<EntrySheet, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [charLimit, setCharLimit] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" />ES設問を追加</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>ES設問を追加</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          onAdd({ companyId, question, answer, charLimit: charLimit ? Number(charLimit) : undefined });
          setOpen(false); setQuestion(""); setAnswer(""); setCharLimit("");
        }} className="space-y-3">
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="設問（例：自己PRを書いてください）" required />
          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} placeholder="回答" />
          <Input type="number" value={charLimit} onChange={(e) => setCharLimit(e.target.value)} placeholder="字数制限（任意）" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit">追加</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InterviewCard({ note, onUpdate, onDelete }: {
  note: InterviewNote;
  onUpdate: (updates: Partial<InterviewNote>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ questions: note.questions, memo: note.memo, result: note.result });
  const resultColors = { pass: "bg-green-100 text-green-700", fail: "bg-red-100 text-red-700", pending: "bg-yellow-100 text-yellow-700" };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-slate-900">{note.round}次面接</p>
          {note.date && <p className="text-xs text-slate-500">{format(parseISO(note.date), "yyyy年M月d日", { locale: ja })}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {note.result && (
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", resultColors[note.result])}>
              {{ pass: "通過", fail: "不通過", pending: "結果待ち" }[note.result]}
            </span>
          )}
          {editing ? (
            <Button size="sm" onClick={() => { onUpdate(form); setEditing(false); }}>保存</Button>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">聞かれた質問</label>
            <Textarea value={form.questions} onChange={(e) => setForm((p) => ({ ...p, questions: e.target.value }))} rows={4} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">感想・メモ</label>
            <Textarea value={form.memo} onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))} rows={3} />
          </div>
          <Select value={form.result ?? ""} onChange={(e) => setForm((p) => ({ ...p, result: e.target.value as InterviewNote["result"] || undefined }))}>
            <option value="">結果未確定</option>
            <option value="pass">通過</option>
            <option value="fail">不通過</option>
            <option value="pending">結果待ち</option>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          {note.questions && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">聞かれた質問</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.questions}</p>
            </div>
          )}
          {note.memo && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">感想・メモ</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.memo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddInterviewDialog({ companyId, round, onAdd }: {
  companyId: string;
  round: number;
  onAdd: (note: Omit<InterviewNote, "id" | "createdAt">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", questions: "", memo: "", result: "" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" />面接メモを追加</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{round}次面接メモを追加</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          onAdd({
            companyId, round,
            date: form.date || undefined,
            questions: form.questions,
            memo: form.memo,
            result: (form.result as InterviewNote["result"]) || undefined,
          });
          setOpen(false);
          setForm({ date: "", questions: "", memo: "", result: "" });
        }} className="space-y-3">
          <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          <Textarea value={form.questions} onChange={(e) => setForm((p) => ({ ...p, questions: e.target.value }))} placeholder="聞かれた質問" rows={4} />
          <Textarea value={form.memo} onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))} placeholder="感想・メモ" rows={3} />
          <Select value={form.result} onChange={(e) => setForm((p) => ({ ...p, result: e.target.value }))}>
            <option value="">結果未確定</option>
            <option value="pass">通過</option>
            <option value="fail">不通過</option>
            <option value="pending">結果待ち</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit">追加</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NotesEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(true);
  return (
    <div className="space-y-2">
      <Textarea
        className="min-h-[200px]"
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        placeholder="自由メモ..."
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{saved ? "保存済み" : "未保存"}</span>
        <Button size="sm" onClick={() => { onSave(text); setSaved(true); }}>保存</Button>
      </div>
    </div>
  );
}

function EditCompanyDialog({
  company,
  onSave,
}: {
  company: ReturnType<typeof useJobStore.getState>["companies"][number];
  onSave: (updates: Partial<ReturnType<typeof useJobStore.getState>["companies"][number]>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: company.name,
    industry: company.industry,
    jobType: company.jobType ?? "",
    jobDescription: company.jobDescription ?? "",
    salaryMin: company.salary.min?.toString() ?? "",
    salaryMax: company.salary.max?.toString() ?? "",
    salaryNote: company.salary.note ?? "",
    philosophy: company.philosophy ?? "",
    benefits: company.benefits ?? "",
    workStyle: company.workStyle,
    officialUrl: company.officialUrl ?? "",
    mypageUrl: company.mypageUrl ?? "",
    mynavi: company.jobSiteLinks.mynavi ?? "",
    rikunabi: company.jobSiteLinks.rikunabi ?? "",
    labbase: company.jobSiteLinks.labbase ?? "",
    priority: String(company.priority) as "1" | "2" | "3",
    tags: company.tags.join(", "),
    location: company.location ?? "",
    employeeCount: company.employeeCount ?? "",
  });
  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>企業情報を編集</DialogTitle></DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({
            name: form.name,
            industry: form.industry,
            jobType: form.jobType,
            jobDescription: form.jobDescription,
            salary: {
              min: form.salaryMin ? Number(form.salaryMin) : undefined,
              max: form.salaryMax ? Number(form.salaryMax) : undefined,
              note: form.salaryNote,
            },
            philosophy: form.philosophy,
            benefits: form.benefits,
            workStyle: form.workStyle,
            officialUrl: form.officialUrl,
            mypageUrl: form.mypageUrl,
            jobSiteLinks: { mynavi: form.mynavi, rikunabi: form.rikunabi, labbase: form.labbase },
            priority: Number(form.priority) as 1 | 2 | 3,
            tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
            location: form.location,
            employeeCount: form.employeeCount,
          } as never);
          setOpen(false);
        }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-700 mb-1 block">企業名</label>
              <Input value={form.name} onChange={set("name")} required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">業界</label>
              <Select value={form.industry} onChange={set("industry")}>
                {Object.entries(INDUSTRY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">優先度</label>
              <Select value={form.priority} onChange={set("priority")}>
                <option value="1">★★★ 最高</option>
                <option value="2">★★☆ 普通</option>
                <option value="3">★☆☆ 低</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">職種</label>
              <Input value={form.jobType} onChange={set("jobType")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">勤務形態</label>
              <Select value={form.workStyle} onChange={set("workStyle")}>
                <option value="remote">フルリモート</option>
                <option value="hybrid">ハイブリッド</option>
                <option value="office">フル出社</option>
                <option value="unknown">不明</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">勤務地</label>
              <Input value={form.location} onChange={set("location")} placeholder="東京都千代田区..." />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">従業員数</label>
              <Input value={form.employeeCount} onChange={set("employeeCount")} placeholder="1000人など" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">仕事内容</label>
            <Textarea value={form.jobDescription} onChange={set("jobDescription")} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">給料下限(万)</label>
              <Input type="number" value={form.salaryMin} onChange={set("salaryMin")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">給料上限(万)</label>
              <Input type="number" value={form.salaryMax} onChange={set("salaryMax")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">給料メモ</label>
              <Input value={form.salaryNote} onChange={set("salaryNote")} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">企業理念</label>
            <Textarea value={form.philosophy} onChange={set("philosophy")} rows={2} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">福利厚生</label>
            <Textarea value={form.benefits} onChange={set("benefits")} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">公式サイト</label>
              <Input value={form.officialUrl} onChange={set("officialUrl")} type="url" placeholder="https://" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">マイページ</label>
              <Input value={form.mypageUrl} onChange={set("mypageUrl")} type="url" placeholder="https://" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">マイナビ</label>
              <Input value={form.mynavi} onChange={set("mynavi")} type="url" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">リクナビ</label>
              <Input value={form.rikunabi} onChange={set("rikunabi")} type="url" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Labbase</label>
              <Input value={form.labbase} onChange={set("labbase")} type="url" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">タグ</label>
              <Input value={form.tags} onChange={set("tags")} placeholder="大手, グローバル" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
