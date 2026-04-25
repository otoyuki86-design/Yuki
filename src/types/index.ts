export type ApplicationStatus =
  | "interested"
  | "es_preparing"
  | "es_submitted"
  | "screening"
  | "interview1"
  | "interview2"
  | "final_interview"
  | "offered"
  | "rejected"
  | "declined";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: "気になる",
  es_preparing: "ES準備中",
  es_submitted: "ES提出済",
  screening: "書類選考中",
  interview1: "一次面接",
  interview2: "二次面接",
  final_interview: "最終面接",
  offered: "内定",
  rejected: "不採用",
  declined: "辞退",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  interested: "bg-slate-100 text-slate-700 border-slate-200",
  es_preparing: "bg-blue-100 text-blue-700 border-blue-200",
  es_submitted: "bg-cyan-100 text-cyan-700 border-cyan-200",
  screening: "bg-yellow-100 text-yellow-700 border-yellow-200",
  interview1: "bg-orange-100 text-orange-700 border-orange-200",
  interview2: "bg-amber-100 text-amber-700 border-amber-200",
  final_interview: "bg-purple-100 text-purple-700 border-purple-200",
  offered: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  declined: "bg-gray-100 text-gray-500 border-gray-200",
};

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "interested",
  "es_preparing",
  "es_submitted",
  "screening",
  "interview1",
  "interview2",
  "final_interview",
];

export type WorkStyle = "remote" | "hybrid" | "office" | "unknown";
export type Industry =
  | "it"
  | "finance"
  | "consulting"
  | "trading"
  | "manufacturing"
  | "media"
  | "retail"
  | "healthcare"
  | "education"
  | "government"
  | "other";

export const INDUSTRY_LABELS: Record<Industry, string> = {
  it: "IT・通信",
  finance: "金融・保険",
  consulting: "コンサルティング",
  trading: "商社",
  manufacturing: "メーカー・製造",
  media: "マスコミ・広告",
  retail: "流通・小売",
  healthcare: "医療・福祉",
  education: "教育",
  government: "公務員・団体",
  other: "その他",
};

export interface Salary {
  min?: number;
  max?: number;
  note?: string;
}

export interface JobSiteLinks {
  mynavi?: string;
  rikunabi?: string;
  labbase?: string;
  openwork?: string;
  wantedly?: string;
  custom?: string;
}

export interface Event {
  id: string;
  companyId: string;
  type: "deadline" | "interview" | "es_deadline" | "seminar" | "other";
  title: string;
  date: string;
  note?: string;
  completed: boolean;
}

export const EVENT_TYPE_LABELS: Record<Event["type"], string> = {
  deadline: "締め切り",
  interview: "面接",
  es_deadline: "ES締め切り",
  seminar: "説明会",
  other: "その他",
};

export interface EntrySheet {
  id: string;
  companyId: string;
  question: string;
  answer: string;
  charLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewNote {
  id: string;
  companyId: string;
  round: number;
  date?: string;
  questions: string;
  memo: string;
  result?: "pass" | "fail" | "pending";
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry: Industry;
  logoUrl?: string;

  // Job info
  jobType?: string;
  jobDescription?: string;
  salary: Salary;

  // Company details
  philosophy?: string;
  benefits?: string;
  workStyle: WorkStyle;
  employeeCount?: string;
  location?: string;

  // Links
  officialUrl?: string;
  mypageUrl?: string;
  jobSiteLinks: JobSiteLinks;

  // Application
  status: ApplicationStatus;
  priority: 1 | 2 | 3;
  tags: string[];

  // Progress
  events: Event[];
  entrySheets: EntrySheet[];
  interviewNotes: InterviewNote[];

  // Notes
  generalNotes?: string;

  createdAt: string;
  updatedAt: string;
}
