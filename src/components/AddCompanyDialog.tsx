"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useJobStore } from "@/store/useJobStore";
import { INDUSTRY_LABELS, Industry } from "@/types";

export function AddCompanyDialog() {
  const addCompany = useJobStore((s) => s.addCompany);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "it" as Industry,
    jobType: "",
    jobDescription: "",
    salaryMin: "",
    salaryMax: "",
    salaryNote: "",
    philosophy: "",
    benefits: "",
    workStyle: "hybrid" as "remote" | "hybrid" | "office" | "unknown",
    officialUrl: "",
    mypageUrl: "",
    mynavi: "",
    rikunabi: "",
    labbase: "",
    priority: "2" as "1" | "2" | "3",
    tags: "",
    generalNotes: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    addCompany({
      name: form.name.trim(),
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
      jobSiteLinks: {
        mynavi: form.mynavi,
        rikunabi: form.rikunabi,
        labbase: form.labbase,
      },
      status: "interested",
      priority: Number(form.priority) as 1 | 2 | 3,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      events: [],
      entrySheets: [],
      interviewNotes: [],
      generalNotes: form.generalNotes,
    });
    setOpen(false);
    setForm({
      name: "", industry: "it", jobType: "", jobDescription: "",
      salaryMin: "", salaryMax: "", salaryNote: "",
      philosophy: "", benefits: "",
      workStyle: "hybrid", officialUrl: "", mypageUrl: "",
      mynavi: "", rikunabi: "", labbase: "",
      priority: "2", tags: "", generalNotes: "",
    });
  }

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          企業を追加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>企業を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">企業名 *</label>
              <Input value={form.name} onChange={set("name")} placeholder="株式会社〇〇" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">業界</label>
              <Select value={form.industry} onChange={set("industry")}>
                {Object.entries(INDUSTRY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">優先度</label>
              <Select value={form.priority} onChange={set("priority")}>
                <option value="1">★★★ 最高</option>
                <option value="2">★★☆ 普通</option>
                <option value="3">★☆☆ 低</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">職種</label>
              <Input value={form.jobType} onChange={set("jobType")} placeholder="エンジニア・営業など" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">勤務形態</label>
              <Select value={form.workStyle} onChange={set("workStyle")}>
                <option value="remote">フルリモート</option>
                <option value="hybrid">ハイブリッド</option>
                <option value="office">フル出社</option>
                <option value="unknown">不明</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">仕事内容</label>
            <Textarea value={form.jobDescription} onChange={set("jobDescription")} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">給料 下限 (万円)</label>
              <Input type="number" value={form.salaryMin} onChange={set("salaryMin")} placeholder="300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">給料 上限 (万円)</label>
              <Input type="number" value={form.salaryMax} onChange={set("salaryMax")} placeholder="500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">給料メモ</label>
              <Input value={form.salaryNote} onChange={set("salaryNote")} placeholder="ボーナス込みなど" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">企業理念・ビジョン</label>
            <Textarea value={form.philosophy} onChange={set("philosophy")} rows={2} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">福利厚生</label>
            <Textarea value={form.benefits} onChange={set("benefits")} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">公式サイト URL</label>
              <Input value={form.officialUrl} onChange={set("officialUrl")} type="url" placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">マイページ URL</label>
              <Input value={form.mypageUrl} onChange={set("mypageUrl")} type="url" placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">マイナビ URL</label>
              <Input value={form.mynavi} onChange={set("mynavi")} type="url" placeholder="https://job.mynavi.jp/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">リクナビ URL</label>
              <Input value={form.rikunabi} onChange={set("rikunabi")} type="url" placeholder="https://job.rikunabi.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Labbase URL</label>
              <Input value={form.labbase} onChange={set("labbase")} type="url" placeholder="https://labbase.jp/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">タグ (カンマ区切り)</label>
              <Input value={form.tags} onChange={set("tags")} placeholder="大手, グローバル, 理系" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">メモ</label>
            <Textarea value={form.generalNotes} onChange={set("generalNotes")} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit">追加する</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
