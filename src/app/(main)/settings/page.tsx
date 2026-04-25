"use client";
import { useRef } from "react";
import { Download, Upload, Trash2, BookmarkPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobStore } from "@/store/useJobStore";

export default function SettingsPage() {
  const companies = useJobStore((s) => s.companies);
  const addCompany = useJobStore((s) => s.addCompany);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExportJSON() {
    const data = JSON.stringify(companies, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-search-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    const headers = ["企業名", "業界", "職種", "ステータス", "給料下限", "給料上限", "勤務形態", "優先度", "タグ", "公式サイト", "マイページ"];
    const rows = companies.map((c) => [
      c.name,
      c.industry,
      c.jobType ?? "",
      c.status,
      c.salary.min ?? "",
      c.salary.max ?? "",
      c.workStyle,
      c.priority,
      c.tags.join(" / "),
      c.officialUrl ?? "",
      c.mypageUrl ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-search-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) throw new Error("Invalid format");
        let imported = 0;
        for (const c of data) {
          const { id, createdAt, updatedAt, ...rest } = c;
          addCompany(rest);
          imported++;
        }
        alert(`${imported}件インポートしました`);
      } catch {
        alert("インポートに失敗しました。正しいJSONファイルを選択してください。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClearAll() {
    if (!confirm("全データを削除しますか？この操作は元に戻せません。")) return;
    if (!confirm("本当に削除しますか？")) return;
    window.localStorage.removeItem("yuki-job-store");
    window.location.reload();
  }

  const bookmarklet = `javascript:(function(){
    var d=prompt('企業名');
    if(!d)return;
    var url='${typeof window !== 'undefined' ? window.location.origin : ''}/companies/new?name='+encodeURIComponent(d)+'&url='+encodeURIComponent(location.href);
    window.open(url,'_blank');
  })();`;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">設定</h1>

      {/* Data */}
      <Section title="データ管理">
        <p className="text-sm text-slate-500 mb-4">
          データはブラウザのLocalStorageに保存されています。定期的にエクスポートしてバックアップを取ることをお勧めします。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="h-4 w-4" />
            JSONでエクスポート
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            CSVでエクスポート
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            JSONからインポート
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          登録企業数: {companies.length} 件
        </p>
      </Section>

      {/* Bookmarklet */}
      <Section title="ブックマークレット（簡易登録）">
        <p className="text-sm text-slate-500 mb-3">
          マイナビ・リクナビ等で企業ページを見ているときに、このブックマークレットを実行すると現在のページURLを自動でコピーして企業登録ダイアログを開きます。
        </p>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 break-all">
          {bookmarklet}
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          上のコードをブラウザのブックマークバーに「javascript:」から始まるURLとして保存してください。
        </p>
      </Section>

      {/* Site links info */}
      <Section title="就活サイト連携について">
        <p className="text-sm text-slate-500">
          マイナビ・リクナビ・Labbase等の就活サイトは非公開APIのため直接連携はできません。
          代わりに各企業の詳細ページ・マイページURLを保存して、ワンクリックでアクセスできます。
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          {[
            ["マイナビ", "https://job.mynavi.jp/"],
            ["リクナビ", "https://job.rikunabi.com/"],
            ["Labbase", "https://labbase.jp/"],
            ["OpenWork", "https://www.openwork.jp/"],
            ["Wantedly", "https://www.wantedly.com/"],
          ].map(([name, url]) => (
            <li key={name} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                {name}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* Danger zone */}
      <Section title="危険な操作" danger>
        <Button variant="destructive" onClick={handleClearAll}>
          <Trash2 className="h-4 w-4" />
          全データを削除
        </Button>
        <p className="text-xs text-red-400 mt-2">この操作は元に戻せません</p>
      </Section>
    </div>
  );
}

function Section({
  title, children, danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`p-5 rounded-xl border ${danger ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-white"}`}>
      <h2 className={`text-base font-semibold mb-3 ${danger ? "text-red-700" : "text-slate-900"}`}>{title}</h2>
      {children}
    </div>
  );
}
