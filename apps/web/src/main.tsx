import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  BatteryCharging,
  LayoutList,
  Car,
  FileText,
  Settings,
  ArrowUpRight,
  ArrowLeft,
  Plus,
  Search,
  ChevronRight,
  ShieldCheck,
  Clock,
  Check,
  Upload,
  Copy,
  Activity,
  Zap,
  Camera,
  Lock,
  Users,
  Wrench,
  Briefcase,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Gauge,
  QrCode,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import "./style.css";
import {
  LogoMark,
  Teedle,
  PaperStack,
  Sun,
  SdgCircle,
  Leaf,
  GreenServer,
  PaperNote,
  CarbonFlag,
  BatteryFlash,
  RouteIcon,
  PartsIcon,
} from "./brand";
import { CorrectReading, SourcePanel } from "./EvidenceTools";
import {
  ValuationEditor,
  PolicyEditor,
  WarrantyPanel,
  ExcludeReading,
  type GovernanceVehicle,
} from "./Governance";
type Reading = {
  id: string;
  date: string;
  value: number;
  miles: number;
  source: string;
  pack: string;
  state: string;
  actor: string;
  provenance: string;
  origin?: "service" | "intake";
  attachment?: string;
  method?: string;
  reference_basis?: string;
  exclusion_reason?: string;
  amendment_reason?: string;
};
type LifeThreshold = {
  percent: number;
  label: string;
  state: "projected" | "at_or_below" | "no_measurable_loss" | "not_projectable";
  months_range: number[] | null;
  miles_range: number[] | null;
  beyond_horizon: boolean;
};
type Life = {
  method: string;
  status: "projected" | "stable" | "insufficient_evidence";
  reason: string;
  annual_loss_pp: number | null;
  annual_miles: number | null;
  horizon_months: number;
  thresholds: LifeThreshold[];
  disclaimer: string;
};
type Assessment = {
  as_of: string;
  input_ids: string[];
  exclusions?: { id: string; reason: string }[];
  method?: string;
  interval: number[] | null;
  quality: string;
  reason: string;
  warnings: string[];
  action: string;
  count: number;
  last: Reading | null;
  age_days?: number;
  slope: number | null;
  scenarios: { months: number; interval: number[] }[];
};
type Vehicle = GovernanceVehicle & {
  id: string;
  year: number;
  make: string;
  model: string;
  stock: string;
  vin: string;
  miles: number;
  pack: string;
  scenario: string;
  base: number;
  included: string;
  revision: number;
  assessment: Assessment;
  life: Life;
  readings: Reading[];
  evidence_state?: "none" | "baseline_only" | "history";
  baseline?: {
    reading_id: string;
    date: string;
    value: number;
    source: string;
    method?: string;
    reference_basis?: string;
  } | null;
  events: { id: string; date: string; type: string; notes: string }[];
  decisions: {
    id: string;
    accepted: number;
    at: string;
    newer_evidence: boolean;
    customer_note?: string;
  }[];
  activity: { id: string; action: string; actor: string; at: string }[];
  recommendation: {
    interval: number[] | null;
    reason: string;
    adjustment: number[] | null;
    reserve: number;
  };
};
type Report = {
  newer_evidence?: boolean;
  id: string;
  vehicle: string;
  token: string;
  status: string;
  payload: Payload;
};
type Payload = {
  vehicle: string;
  vin: string;
  version: number;
  interval: number[] | null;
  quality: string;
  reason: string;
  last: { date: string; value: number } | null;
  readings: Reading[];
  pack: string;
  life?: Life;
  warranty: string;
  dealer: string;
  as_of: string;
  generated_at: string;
  evidence_basis?: {
    state: "none" | "baseline_only" | "history";
    intake_readings: number;
    service_readings: number;
  };
  pack_context?: { start_date?: string; verification?: string };
  expires_on?: string;
  limitations: string;
};
const qc = new QueryClient();
const API_BASE = import.meta.env.VITE_API_URL || "";

async function api<T = any>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(API_BASE + "/api" + path, {
    credentials: "include",
    method: body === undefined ? "GET" : "POST",
    headers:
      body instanceof FormData ? {} : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  if (!r.ok) {
    if (
      r.status === 401 &&
      path !== "/session" &&
      !path.startsWith("/public/")
    ) {
      window.dispatchEvent(new Event("battery-session-expired"));
    }
    const e = await r.json().catch(() => ({}));
    throw Error(
      e.detail?.message || "Please check the entered values and retry.",
    );
  }
  return r.json();
}
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const date = (d: string) =>
  new Date(d.length === 10 ? d + "T12:00:00Z" : d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });
const interval = (n: number[] | null) =>
  n ? `${n[0]}–${n[1]}%` : "Not enough evidence";
const monthsLabel = (m: number) =>
  m >= 120 ? `${Math.round(m / 12)} yrs` : `${(m / 12).toFixed(1)} yrs`;
function lifeRange(t: LifeThreshold) {
  if (!t.months_range) return "Not projectable";
  if (t.state === "at_or_below") return "At or below now";
  if (t.beyond_horizon) return "Beyond 20 yrs";
  const [lo, hi] = t.months_range;
  if (hi === 0) return "At or below now";
  return lo === 0
    ? `≤ ${monthsLabel(hi)}`
    : `${monthsLabel(lo)} – ${monthsLabel(hi)}`;
}
function lifeMiles(t: LifeThreshold) {
  if (!t.miles_range) return "";
  const k = (n: number) => `${Math.round(n / 1000).toLocaleString()}k mi`;
  const [lo, hi] = t.miles_range;
  if (hi === 0) return "";
  return lo === 0 ? `≤ ${k(hi)}` : `${k(lo)} – ${k(hi)}`;
}
function LifeBlock({
  life,
  variant = "staff",
}: {
  life: Life;
  variant?: "staff" | "buyer";
}) {
  const lead = life.thresholds.find(
    (t) => t.state === "projected" && !t.beyond_horizon,
  );
  return (
    <section
      className={"life-block " + variant}
      aria-label="Projected usable life"
    >
      <div className="life-head">
        <small>PROJECTED USABLE LIFE</small>
        <Badge tone={life.status === "projected" ? "teal" : "amber"}>
          {life.status === "projected"
            ? `${life.annual_loss_pp} pts/yr observed`
            : life.status.replace(/_/g, " ")}
        </Badge>
      </div>
      {life.status === "projected" ? (
        <>
          {lead && (
            <p className="life-lead">
              At the observed rate this pack stays above{" "}
              <strong>{lead.percent}%</strong> for about{" "}
              <strong>{lifeRange(lead)}</strong>
              {lifeMiles(lead) ? ` · ${lifeMiles(lead)}` : ""}.
            </p>
          )}
          <dl className="life-rows">
            {life.thresholds.map((t) => (
              <div key={t.percent}>
                <dt>
                  <strong>{t.percent}%</strong> {t.label}
                </dt>
                <dd>
                  {lifeRange(t)}
                  {t.miles_range && t.state !== "at_or_below" && (
                    <small>{lifeMiles(t)}</small>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="life-lead">{life.reason}</p>
      )}
      <p className="life-note">{life.disclaimer}</p>
    </section>
  );
}
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
function ErrorBox({ error }: { error: string }) {
  return error ? (
    <div role="alert" className="error">
      {error}
    </div>
  ) : null;
}
function Loading() {
  return (
    <div className="card loading" role="status" aria-label="Loading records">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} />
      ))}
    </div>
  );
}
function healthTone(level: number | null | undefined): string {
  if (level == null) return "no";
  if (level >= 90) return "ex";
  if (level >= 75) return "go";
  if (level >= 50) return "fa";
  return "po";
}
function healthColor(level: number | null | undefined): string {
  return "var(--hx-" + healthTone(level) + ")";
}
let meterSeq = 0;
function BatteryMeter({
  level,
  valueText,
  size = 132,
}: {
  level: number | null;
  valueText: string;
  size?: number;
}) {
  const id = "meter-" + ++meterSeq;
  const vbW = 160;
  const vbH = 40;
  const rx = 16;
  const terminal = 8;
  const fillW =
    level == null
      ? 0
      : Math.round(
          (Math.max(0, Math.min(100, level)) / 100) * (vbW - 18 - terminal),
        );
  const color = healthColor(level);
  return (
    <span className="meter-row" data-tone={healthTone(level)}>
      <svg
        className="battery-meter"
        style={{ color }}
        width={size}
        height={(size * vbH) / vbW}
        viewBox={`0 0 ${vbW} ${vbH}`}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
          <clipPath id={id + "-clip"}>
            <rect x={9} y={4} width={fillW} height={vbH - 8} rx={rx} />
          </clipPath>
        </defs>
        <rect
          x={9}
          y={4}
          width={vbW - 18}
          height={vbH - 8}
          rx={rx}
          fill="none"
          stroke="#dce4e3"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {fillW > 0 && (
          <g clipPath={`url(#${id}-clip)`}>
            <rect
              x={9}
              y={4}
              width={vbW - 18}
              height={vbH - 8}
              rx={rx}
              fill="currentColor"
              opacity={0.12}
            />
            <rect
              x={9}
              y={4}
              width={vbW - 18}
              height={vbH - 8}
              rx={rx}
              fill={`url(#${id})`}
            />
            <rect
              x={9}
              y={4}
              width={vbW - 18}
              height={vbH - 8}
              rx={rx}
              fill="currentColor"
            />
          </g>
        )}
        <rect
          x={vbW - terminal - 7}
          y={14}
          width={7}
          height={16}
          rx={3}
          fill={fillW ? color : "#dce4e3"}
        />
      </svg>
      <span className="meter-value">{valueText}</span>
    </span>
  );
}
function HealthGauge({
  interval,
  size = 140,
  explain,
}: {
  interval: number[] | null;
  size?: number;
  explain?: string;
}) {
  const tone = healthTone(
    interval ? Math.round((interval[0] + interval[1]) / 2) : null,
  );
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const text = interval ? `${interval[0]}–${interval[1]}%` : "Needs evidence";
  return (
    <div className="health-gauge-wrap" data-tone={tone}>
      <svg
        className="health-gauge"
        style={{ color: `var(--hx-${tone})` }}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Estimated battery health: ${text}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e9ed"
          strokeWidth={16}
          strokeLinecap="round"
        />
        {interval && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={`${((circ * (interval[0] + interval[1])) / 200).toFixed(2)} ${circ.toFixed(2)}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <div className="health-gauge-val">{text}</div>
      {explain && <span className="health-gauge-sub">{explain}</span>}
    </div>
  );
}
function TrendStrip({
  readings,
  width = 150,
  height = 28,
}: {
  readings: Reading[];
  width?: number;
  height?: number;
}) {
  const pts = readings
    .filter((r) => r.state === "confirmed" && r.value != null)
    .map((r) => ({ v: r.value, t: Date.parse(r.date + "T12:00:00Z") }))
    .sort((a, b) => a.t - b.t);
  if (!pts.length) return null;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const span = max - min || 10;
  const pad = 3;
  const d = pts
    .map((p, i) => {
      const x = pad + (i / Math.max(1, pts.length - 1)) * (width - pad * 2);
      const y = height - pad - ((p.v - min) / span) * (height - pad * 2);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = pts[pts.length - 1];
  const lastX = pts.length > 1 ? width - pad : Math.min(width - pad, pad + 4);
  const lastY = height - pad - ((last.v - min) / span) * (height - pad * 2);
  const id = "trend-" + ++meterSeq;
  return (
    <svg
      className="trend-strip"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Battery health trend over recent confirmed readings"
      style={{ color: healthColor(last.v) }}
    >
      <defs>
        <linearGradient id={id}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill="currentColor" />
    </svg>
  );
}
function WorkflowBanner() {
  const steps = [
    {
      icon: Camera,
      label: "Capture reading",
      hint: "Typed, or pulled from a diagnostic photo by on-device OCR, then reviewed.",
      dot: "dot-1",
    },
    {
      icon: TrendingUp,
      label: "Timeline history",
      hint: "Every reading becomes a dated, sourced observation; the engine makes an honest interval.",
      dot: "dot-2",
    },
    {
      icon: Gauge,
      label: "Appraisal",
      hint: "Evidence quality, warranty headroom and a transparent price breakdown.",
      dot: "dot-3",
    },
    {
      icon: QrCode,
      label: "Buyer report",
      hint: "Privacy-safe summary with a masked VIN and QR code.",
      dot: "dot-4",
    },
  ];
  return (
    <div
      className="workflow-banner"
      role="region"
      aria-label="How the evidence flows through the store"
    >
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className="wf-step">
            <span className={"wf-dot " + s.dot}>
              {React.createElement(s.icon, { size: 15 })}
            </span>
            <strong className="wf-label">{s.label}</strong>
            <span className="wf-hint">{s.hint}</span>
          </div>
          {i < steps.length - 1 && (
            <span className="wf-arrow" aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
function VehicleCard({ v, needs }: { v: Vehicle; needs: boolean }) {
  const h = v.assessment;
  const level = h.interval
    ? Math.round((h.interval[0] + h.interval[1]) / 2)
    : null;
  const target = h.count
    ? "/vehicles/" + v.id
    : "/service/" + v.id + "/capture";
  return (
    <div className="vehicle-card">
      <div className="card-head">
        <Link className="vehicle-name" to={target}>
          <span className="car-icon">
            <Car size={22} />
          </span>
          <span>
            <strong>
              {v.year} {v.make} {v.model}
            </strong>
            <small>
              {v.stock} <span>·</span> {v.miles.toLocaleString()} mi
            </small>
          </span>
        </Link>
        <div className="health-col">
          <BatteryMeter
            level={level}
            valueText={h.interval ? interval(h.interval) : "—"}
            size={132}
          />
          <Badge tone={needs ? "amber" : "teal"}>
            {needs ? "Needs review" : h.quality}
          </Badge>
          <small className="health-sub">
            {h.age_days != null
              ? `${h.age_days} days since the last reading`
              : "Start the Timeline"}
          </small>
        </div>
      </div>
      <div className="card-body">
        <TrendStrip readings={v.readings || []} />
        <div className="card-meta">
          <span>{v.scenario}</span>
          <Link className="row-action" to={target}>
            {h.count
              ? needs
                ? "Review evidence"
                : "Open appraisal"
              : "Capture reading"}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
function readLocalDraft(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  }
}
function EVIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={"ev-illust " + className} viewBox="0 0 320 180" fill="none" aria-hidden="true">
      <rect x="60" y="60" width="200" height="90" rx="20" fill="var(--forest)" opacity="0.12" />
      <rect x="80" y="50" width="160" height="80" rx="16" stroke="var(--green)" strokeWidth="2" opacity="0.3" />
      <rect x="240" y="72" width="10" height="24" rx="4" fill="var(--green)" opacity="0.3" />
      {[95, 90, 85, 78, 70].map((h, i) => (
        <rect key={i} x={94 + i * 26} y={120 - h * 0.6} width={16} height={h * 0.6} rx={3}
          fill={`rgba(22,163,74,${0.25 + i * 0.15})`}
          className="hero-bar" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
      <circle cx="260" cy="40" r="16" fill="var(--green-mint)" opacity="0.15" />
      <path d="M254 40l4-6h4l-4 6h4l-8 10 2-6h-4l4-6z" fill="var(--green)" opacity="0.6" />
      <circle cx="50" cy="100" r="24" fill="var(--green-paper-light)" opacity="0.3" />
      <path d="M42 100 l4-8h4l-2 4h4l-8 12 2-6h-4z" fill="var(--green)" opacity="0.4" />
    </svg>
  );
}
function DashWelcome({ role, name }: { role: string; name: string }) {
  const info: Record<string, { greeting: string; desc: string; Icon: typeof Briefcase }> = {
    manager: { greeting: "Appraisal Desk", desc: "Review evidence, set pricing policy, and publish buyer reports.", Icon: Briefcase },
    technician: { greeting: "Service Lane", desc: "Capture battery readings and build sourced evidence histories.", Icon: Wrench },
    sales: { greeting: "Sales Floor", desc: "Browse vehicle health summaries and share published reports with buyers.", Icon: Users },
  };
  const r = info[role] || info.manager;
  return (
    <div className="dash-welcome">
      <div className="dash-welcome-text">
        <span className="kicker">{name} · {role}</span>
        <h1>{r.greeting}</h1>
        <p>{r.desc}</p>
      </div>
      <div className="dash-welcome-visual">
        <EVIllustration />
      </div>
    </div>
  );
}
function Dashboard() {
  const session = qc.getQueryData(["session"]) as { role: string; dealer_name: string; as_of: string } | undefined;
  const role = session?.role || "manager";
  const q = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api<{ items: Vehicle[]; total: number }>("/vehicles"),
  });
  const rq = useQuery({
    queryKey: ["reports"],
    queryFn: () => api<Report[]>("/reports"),
    enabled: role !== "technician",
  });
  if (q.isPending) return <Loading />;
  const items = q.data?.items || [];
  const reports = rq.data || [];
  const needing = items.filter((v) => v.assessment.quality === "limited").length;
  const healthy = items.filter((v) => v.assessment.interval && v.assessment.interval[1] >= 85).length;
  const noEvidence = items.filter((v) => !v.assessment.interval).length;
  const midpoints = items.flatMap((v) =>
    v.assessment.interval ? [Math.round((v.assessment.interval[0] + v.assessment.interval[1]) / 2)] : [],
  );
  const avg = midpoints.length ? Math.round(midpoints.reduce((a, b) => a + b, 0) / midpoints.length) : 0;
  const pct = (part: number, whole: number) => `${Math.round((part / Math.max(1, whole)) * 100)}%`;
  const publishedReports = reports.filter((r) => r.status === "published").length;
  const draftReports = reports.filter((r) => r.status === "draft").length;

  const HEALTH_COLORS = ["#16a34a", "#22c55e", "#f59e0b", "#ef4444"];
  const healthBuckets = (() => {
    const b = [
      { name: "Excellent (90%+)", value: 0 },
      { name: "Good (80–89%)", value: 0 },
      { name: "Fair (70–79%)", value: 0 },
      { name: "Poor (<70%)", value: 0 },
    ];
    items.forEach((v) => {
      if (!v.assessment.interval) return;
      const mid = (v.assessment.interval[0] + v.assessment.interval[1]) / 2;
      if (mid >= 90) b[0].value++;
      else if (mid >= 80) b[1].value++;
      else if (mid >= 70) b[2].value++;
      else b[3].value++;
    });
    return b.filter((x) => x.value > 0);
  })();
  const makeDistribution = (() => {
    const counts: Record<string, number> = {};
    items.forEach((v) => { counts[v.make] = (counts[v.make] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([make, count]) => ({ make, count }));
  })();
  const monthlyReadings = (() => {
    const months: Record<string, number> = {};
    items.forEach((v) => {
      if (v.assessment.last) {
        const d = new Date(v.assessment.last.date);
        const key = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
        months[key] = (months[key] || 0) + 1;
      }
    });
    return Object.entries(months).slice(-6).map(([month, count]) => ({ month, count }));
  })();

  if (role === "manager") {
    return (
      <div className="dash">
        <DashWelcome role={role} name={session?.dealer_name || "Northline Motors"} />

        <div className="dash-kpi-row">
          <div className="dash-kpi"><span className="dash-kpi-num">{items.length}</span><span className="dash-kpi-label">EVs onboard</span></div>
          <div className="dash-kpi"><span className="dash-kpi-num">{healthy}</span><span className="dash-kpi-label">Healthy packs</span></div>
          <div className="dash-kpi accent"><span className="dash-kpi-num">{needing || 0}</span><span className="dash-kpi-label">Need review</span></div>
          <div className="dash-kpi"><span className="dash-kpi-num">{avg}%</span><span className="dash-kpi-label">Avg health</span></div>
        </div>

        <div className="dash-analytics">
          <div className="dash-chart-card">
            <h3>Fleet Health Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={healthBuckets} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {healthBuckets.map((_, i) => <Cell key={i} fill={HEALTH_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-chart-card">
            <h3>Inventory by Make</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={makeDistribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="make" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--green)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-chart-card">
            <h3>Readings Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyReadings} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-quick-grid">
          <Link to="/vehicles" className="dash-quick-card">
            <div className="dash-quick-icon" style={{ background: "var(--green-paper-light)" }}><Car size={20} color="var(--green-ink)" /></div>
            <div><strong>Vehicle inventory</strong><small>Browse all {items.length} EVs, filter and appraise</small></div>
            <ChevronRight size={16} />
          </Link>
          <Link to="/reports" className="dash-quick-card">
            <div className="dash-quick-icon" style={{ background: "#dbeafe" }}><FileText size={20} color="var(--blue)" /></div>
            <div><strong>Buyer reports</strong><small>{publishedReports} published, {draftReports} drafts pending</small></div>
            <ChevronRight size={16} />
          </Link>
          <Link to="/settings/sources" className="dash-quick-card">
            <div className="dash-quick-icon" style={{ background: "#fef3c7" }}><Settings size={20} color="#92400e" /></div>
            <div><strong>Policy & sources</strong><small>Appraisal policy, warranty rules, data sources</small></div>
            <ChevronRight size={16} />
          </Link>
        </div>

        {needing > 0 && (
          <section className="dash-alert-card">
            <div className="dash-alert-icon"><Clock size={18} /></div>
            <div>
              <strong>{needing} vehicle{needing > 1 ? "s" : ""} need{needing === 1 ? "s" : ""} attention</strong>
              <small>Limited evidence — capture more readings or review existing evidence</small>
            </div>
            <Link to="/vehicles?view=needs" className="btn-minimal">Review →</Link>
          </section>
        )}

        <section className="dash-table-section">
          <div className="section-title">
            <h2>Recent vehicles</h2>
            <Badge>{items.length} in inventory</Badge>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Vehicle</th><th>Pack</th><th>Health</th><th className="num">Last reading</th><th>Appraisal</th><th>Action</th></tr>
              </thead>
              <tbody>
                {items.slice(0, 10).map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.year} {v.make} {v.model}</strong><br /><span className="body-small">{v.stock} · {v.miles.toLocaleString()} mi</span></td>
                    <td><span className="prod-chip">{v.pack}</span></td>
                    <td className="num">{v.assessment.interval ? `${v.assessment.interval[0]}–${v.assessment.interval[1]}%` : "—"}</td>
                    <td className="num">{v.assessment.last ? date(v.assessment.last.date) : "—"}</td>
                    <td>{v.recommendation?.interval ? <Badge tone="teal">Ready</Badge> : <Badge tone="amber">Pending</Badge>}</td>
                    <td><Link to={"/vehicles/" + v.id} className="btn-minimal">Open →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length > 10 && (
            <Link to="/vehicles" className="dash-table-more">View all {items.length} vehicles <ArrowRight size={14} /></Link>
          )}
        </section>
      </div>
    );
  }

  if (role === "technician") {
    const needCapture = items.filter((v) => !v.assessment.interval || v.assessment.quality === "limited");
    const recentlyRead = items.filter((v) => v.assessment.last && v.assessment.age_days != null && v.assessment.age_days <= 30);
    return (
      <div className="dash">
        <DashWelcome role={role} name={session?.dealer_name || "Northline Motors"} />
        <div className="dash-kpi-row">
          <div className="dash-kpi"><span className="dash-kpi-num">{items.length}</span><span className="dash-kpi-label">EVs in lot</span></div>
          <div className="dash-kpi accent"><span className="dash-kpi-num">{needCapture.length}</span><span className="dash-kpi-label">Need capture</span></div>
          <div className="dash-kpi"><span className="dash-kpi-num">{recentlyRead.length}</span><span className="dash-kpi-label">Read this month</span></div>
          <div className="dash-kpi"><span className="dash-kpi-num">{avg}%</span><span className="dash-kpi-label">Avg health</span></div>
        </div>

        <div className="dash-analytics" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="dash-chart-card">
            <h3>Fleet Health Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={healthBuckets} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                  {healthBuckets.map((_, i) => <Cell key={i} fill={HEALTH_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-chart-card">
            <h3>Readings Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyReadings} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-quick-grid">
          <Link to="/vehicles" className="dash-quick-card">
            <div className="dash-quick-icon" style={{ background: "var(--green-paper-light)" }}><Car size={20} color="var(--green-ink)" /></div>
            <div><strong>Vehicle inventory</strong><small>Browse vehicles and capture readings</small></div>
            <ChevronRight size={16} />
          </Link>
          <Link to="/vehicles?view=needs" className="dash-quick-card">
            <div className="dash-quick-icon" style={{ background: "#fef3c7" }}><Camera size={20} color="#92400e" /></div>
            <div><strong>Needs capture</strong><small>{needCapture.length} vehicles need a battery reading</small></div>
            <ChevronRight size={16} />
          </Link>
        </div>
        {needCapture.length > 0 && (
          <section className="dash-table-section">
            <div className="section-title">
              <h2>Capture queue</h2>
              <Badge tone="amber">{needCapture.length} pending</Badge>
            </div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Vehicle</th><th>Pack</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {needCapture.slice(0, 10).map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.year} {v.make} {v.model}</strong><br /><span className="body-small">{v.stock} · {v.miles.toLocaleString()} mi</span></td>
                      <td><span className="prod-chip">{v.pack}</span></td>
                      <td>{!v.assessment.interval ? <Badge tone="amber">No evidence</Badge> : <Badge tone="amber">Limited</Badge>}</td>
                      <td><Link to={v.assessment.count ? "/vehicles/" + v.id : "/service/" + v.id + "/capture"} className="btn-minimal">{v.assessment.count ? "Open →" : "Capture →"}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <section className="dash-table-section">
          <div className="section-title">
            <h2>All vehicles</h2>
            <Badge>{items.length} in inventory</Badge>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Vehicle</th><th>Pack</th><th>Health</th><th className="num">Last reading</th><th>Action</th></tr>
              </thead>
              <tbody>
                {items.slice(0, 10).map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.year} {v.make} {v.model}</strong><br /><span className="body-small">{v.stock} · {v.miles.toLocaleString()} mi</span></td>
                    <td><span className="prod-chip">{v.pack}</span></td>
                    <td className="num">{v.assessment.interval ? `${v.assessment.interval[0]}–${v.assessment.interval[1]}%` : "—"}</td>
                    <td className="num">{v.assessment.last ? date(v.assessment.last.date) : "—"}</td>
                    <td><Link to={"/vehicles/" + v.id} className="btn-minimal">Open →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length > 10 && (
            <Link to="/vehicles" className="dash-table-more">View all {items.length} vehicles <ArrowRight size={14} /></Link>
          )}
        </section>
      </div>
    );
  }

  // Sales role
  return (
    <div className="dash">
      <DashWelcome role={role} name={session?.dealer_name || "Northline Motors"} />
      <div className="dash-kpi-row">
        <div className="dash-kpi"><span className="dash-kpi-num">{items.length}</span><span className="dash-kpi-label">Vehicles available</span></div>
        <div className="dash-kpi"><span className="dash-kpi-num">{healthy}</span><span className="dash-kpi-label">Healthy packs</span></div>
        <div className="dash-kpi"><span className="dash-kpi-num">{avg}%</span><span className="dash-kpi-label">Avg health</span></div>
        <div className="dash-kpi"><span className="dash-kpi-num">{publishedReports}</span><span className="dash-kpi-label">Published reports</span></div>
      </div>

      <div className="dash-analytics" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="dash-chart-card">
          <h3>Fleet Health Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={healthBuckets} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                {healthBuckets.map((_, i) => <Cell key={i} fill={HEALTH_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-card">
          <h3>Inventory by Make</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={makeDistribution} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="make" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--green)" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-quick-grid">
        <Link to="/vehicles" className="dash-quick-card">
          <div className="dash-quick-icon" style={{ background: "var(--green-paper-light)" }}><Car size={20} color="var(--green-ink)" /></div>
          <div><strong>Browse vehicles</strong><small>View health summaries for buyers</small></div>
          <ChevronRight size={16} />
        </Link>
        <Link to="/reports" className="dash-quick-card">
          <div className="dash-quick-icon" style={{ background: "#dbeafe" }}><FileText size={20} color="var(--blue)" /></div>
          <div><strong>Published reports</strong><small>{publishedReports} report{publishedReports !== 1 ? "s" : ""} ready to share with buyers</small></div>
          <ChevronRight size={16} />
        </Link>
      </div>
      {publishedReports > 0 && (
        <section className="dash-table-section">
          <div className="section-title">
            <h2>Buyer-ready reports</h2>
            <Badge tone="teal">{publishedReports} published</Badge>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Vehicle</th><th>Health</th><th>Status</th><th>Generated</th><th>Action</th></tr>
              </thead>
              <tbody>
                {reports.filter((r) => r.status === "published").map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.payload.vehicle}</strong><br /><span className="body-small">v{r.payload.version} · VIN {r.payload.vin}</span></td>
                    <td className="num">{r.payload.interval ? `${r.payload.interval[0]}–${r.payload.interval[1]}%` : "—"}</td>
                    <td><Badge tone="teal">{r.status}</Badge></td>
                    <td className="num">{date(r.payload.as_of)}</td>
                    <td><Link to={"/reports/" + r.id + "/preview"} className="btn-minimal">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="dash-table-section">
        <div className="section-title">
          <h2>Vehicle inventory</h2>
          <Badge>{items.length} vehicles</Badge>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Vehicle</th><th>Health</th><th className="num">Last reading</th><th>Action</th></tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.year} {v.make} {v.model}</strong><br /><span className="body-small">{v.stock} · {v.miles.toLocaleString()} mi</span></td>
                  <td className="num">{v.assessment.interval ? `${v.assessment.interval[0]}–${v.assessment.interval[1]}%` : "—"}</td>
                  <td className="num">{v.assessment.last ? date(v.assessment.last.date) : "—"}</td>
                  <td><Link to={"/vehicles/" + v.id} className="btn-minimal">Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 10 && (
          <Link to="/vehicles" className="dash-table-more">View all {items.length} vehicles <ArrowRight size={14} /></Link>
        )}
      </section>
    </div>
  );
}

function App() {
  const loc = useLocation();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => api("/session"),
    retry: false,
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    const expire = () => setSessionExpired(true);
    window.addEventListener("battery-session-expired", expire);
    return () => window.removeEventListener("battery-session-expired", expire);
  }, []);
  if (loc.pathname.startsWith("/r/"))
    return (
      <Routes>
        <Route path="/r/:token" element={<PublicReport />} />
      </Routes>
    );
  if (session.isPending) return <Loading />;
  if (!session.data || sessionExpired) {
    // An expired staff session returns to sign-in with the unfinished capture preserved.
    if (sessionExpired && loc.pathname !== "/login")
      return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <Login
              sessionExpired={sessionExpired}
              onSignedIn={() => setSessionExpired(false)}
            />
          }
        />
        <Route path="*" element={<Landing sessionExpired={sessionExpired} />} />
      </Routes>
    );
  }
  const NAV = [
    { p: "/work-queue", t: "Dashboard", Icon: BatteryCharging },
    { p: "/vehicles", t: "Vehicles", Icon: Car },
    { p: "/reports", t: "Reports", Icon: FileText },
    { p: "/settings/sources", t: "Sources", Icon: Settings },
  ];
  return (
    <div className="ws">
      <aside className="ws-side" aria-label="Main navigation">
        <Link className="ws-brand" to="/work-queue">
          <VoltVaultLogo size={28} />
          <span>VoltVault</span>
        </Link>
        <nav className="ws-nav">
          {NAV.map(({ p, t, Icon }) => {
            const active =
              loc.pathname === p || loc.pathname.startsWith(p + "/") ||
              (p === "/work-queue" && (loc.pathname === "/" || loc.pathname.startsWith("/service/")));
            return (
              <Link key={p} className={"ws-nav-item" + (active ? " active" : "")} to={p} aria-current={active ? "page" : undefined}>
                <Icon size={18} />
                <span>{t}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ws-side-bottom">
          <div className="ws-dealer">
            <Leaf size={14} />
            <span>Northline Motors</span>
          </div>
          <span className="ws-date">{date(session.data.as_of)}</span>
          <button
            className="ws-logout"
            onClick={async () => {
              await api("/session/logout", {});
              qc.clear();
              location.assign("/");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="ws-main">
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/work-queue" element={<Dashboard />} />
            <Route path="/vehicles" element={<Queue all />} />
            <Route path="/vehicles/:id" element={<Detail />} />
            <Route path="/service/:id/capture" element={<Capture />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:id/preview" element={<Preview />} />
            <Route path="/settings/sources" element={<Sources />} />
            <Route path="*" element={<Navigate to="/work-queue" replace />} />
          </Routes>
        </main>
      </div>
      <nav className="ws-mobile-nav" aria-label="Mobile navigation">
        {NAV.map(({ p, t, Icon }) => {
          const active =
            loc.pathname === p || loc.pathname.startsWith(p + "/") ||
            (p === "/work-queue" && (loc.pathname === "/" || loc.pathname.startsWith("/service/")));
          return (
            <Link key={p} className={"ws-mob-item" + (active ? " active" : "")} to={p}>
              <Icon size={18} />
              <span>{t}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
function Queue({ all = false }: { all?: boolean }) {
  const q = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api<{ items: Vehicle[]; total: number }>("/vehicles"),
  });
  const [sp, setSp] = useSearchParams();
  const filter = sp.get("view") || (all ? "all" : "needs");
  const search = sp.get("q") || "";
  const make = sp.get("make") || "";
  const scenario = sp.get("scenario") || "";
  function set(k: string, v: string) {
    const n = new URLSearchParams(sp);
    n.set(k, v);
    setSp(n);
  }
  const vs = q.data?.items || [];
  const needs = (v: Vehicle) => v.assessment.quality === "limited";
  const shown = vs.filter(
    (v) =>
      (filter === "all" || (filter === "needs" ? needs(v) : !needs(v))) &&
      `${v.stock} ${v.vin} ${v.make} ${v.model}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!make || v.make === make) &&
      (!scenario || v.scenario === scenario),
  );
  return (
    <div className="page">
      <div className="eyebrow">WORK QUEUE</div>
      <div className="page-title">
        <div>
          <h1>{all ? "Vehicle inventory" : "EV battery appraisals"}</h1>
          <p>Turn service-lane evidence into your next informed decision.</p>
        </div>
        <Badge>
          <span className="dot" />{" "}
          {q.data
            ? `${q.data.total} vehicles in inventory`
            : "Loading inventory…"}
        </Badge>
      </div>
      <WorkflowBanner />
      <section className="card queue-card">
        <div className="toolbar">
          <div className="segments">
            {[
              ["needs", "Needs action", vs.filter(needs).length],
              [
                "ready",
                "Ready for appraisal",
                vs.filter((v) => !needs(v)).length,
              ],
              ["all", "All vehicles", vs.length],
            ].map(([key, label, count]) => (
              <button
                key={key}
                aria-pressed={filter === key}
                onClick={() => set("view", String(key))}
                className={filter === key ? "selected" : ""}
              >
                {label}
                <span>{q.data ? count : "—"}</span>
              </button>
            ))}
          </div>
          <div className="search-row">
            <label className="search">
              <Search size={18} />
              <input
                aria-label="Search vehicles"
                placeholder="Search stock, VIN, make or model"
                value={search}
                onChange={(e) => set("q", e.target.value)}
              />
            </label>
            <select
              aria-label="Filter by make"
              value={make}
              onChange={(e) => set("make", e.target.value)}
            >
              <option value="">All makes</option>
              {[...new Set(vs.map((v) => v.make))].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <select
              aria-label="Demo scenario"
              value={scenario}
              onChange={(e) => set("scenario", e.target.value)}
            >
              <option value="">All demo scenarios</option>
              {[...new Set(vs.map((v) => v.scenario))].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>
        {q.isLoading ? (
          <Loading />
        ) : q.error ? (
          <>
            <ErrorBox error={String(q.error)} />
            <button onClick={() => q.refetch()}>Retry</button>
          </>
        ) : (
          <>
            <div className="vehicle-grid">
              {shown.map((v) => (
                <VehicleCard key={v.id} v={v} needs={needs(v)} />
              ))}
            </div>
            {!shown.length && (
              <div className="empty">
                <Search />
                <h2>No matching vehicles</h2>
                <p>Try another search or clear your filters.</p>
                <button onClick={() => setSp({ view: "all" })}>
                  Clear filters
                </button>
              </div>
            )}
            <div className="table-footer">
              Showing {shown.length} of {vs.length} vehicles{" "}
              <span>All distances in miles · USD</span>
            </div>
          </>
        )}
      </section>
      <div className="footnote">
        <ShieldCheck size={16} /> Battery health describes remaining usable
        capacity relative to its reference capacity. It is different from charge
        level.
      </div>
    </div>
  );
}
function Chart({
  readings,
  events = [],
}: {
  readings: Reading[];
  events?: { date: string; type: string }[];
}) {
  const points = [...readings]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ ...r, time: new Date(r.date + "T12:00:00Z").getTime() }));
  const packs = [...new Set(points.map((r) => r.pack || "current"))];
  return (
    <>
      <div
        className="chart"
        role="img"
        aria-label="Confirmed battery health readings by elapsed date, on a zero to one hundred percent scale"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 16, right: 16, bottom: 8, left: -16 }}
          >
            <CartesianGrid
              strokeDasharray="3 4"
              vertical={false}
              stroke="#e5e9eb"
            />
            <XAxis
              type="number"
              dataKey="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("en-US", {
                  timeZone: "America/Chicago",
                  month: "short",
                  year: "2-digit",
                })
              }
              tick={{ fontSize: 11 }}
            />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
            {events.map((e, i) => (
              <ReferenceLine
                key={i}
                x={new Date(e.date + "T12:00:00Z").getTime()}
                stroke="#8a9099"
                strokeDasharray="4 4"
                label={{
                  value: e.type,
                  position: "insideBottomRight",
                  fontSize: 10,
                }}
              />
            ))}
            <Tooltip
              labelFormatter={(v) => date(new Date(Number(v)).toISOString())}
            />
            {packs.map((pack, i) => (
              <Line
                key={pack}
                dataKey={(r) =>
                  (r.pack || "current") === pack ? r.value : null
                }
                name={pack + " pack · health %"}
                connectNulls={false}
                stroke={i ? "#b7bfbf" : "var(--teal)"}
                strokeWidth={2}
                dot={(p: any) => {
                  if (p.value === null || p.value === undefined)
                    return <g key={p.key} />;
                  const independent = p.payload.source === "Independent test";
                  return independent ? (
                    <rect
                      key={p.key}
                      x={p.cx - 4}
                      y={p.cy - 4}
                      width={8}
                      height={8}
                      fill="white"
                      stroke={i ? "#b7bfbf" : "var(--teal)"}
                      strokeWidth={2}
                    />
                  ) : (
                    <circle
                      key={p.key}
                      cx={p.cx}
                      cy={p.cy}
                      r={4}
                      fill="white"
                      stroke={i ? "#b7bfbf" : "var(--teal)"}
                      strokeWidth={2}
                    />
                  );
                }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        <span className="dot" /> ○ Diagnostic / transcription · □ Independent
        test <span>0–100% scale · Pack segments are separate</span>
      </div>
    </>
  );
}
function Detail() {
  const role = (qc.getQueryData(["session"]) as { role: string })?.role;
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => api<Vehicle>("/vehicles/" + id),
  });
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState("Timeline");
  const [notice, setNotice] = useState("");
  const [reportOperation] = useState(() => crypto.randomUUID());
  if (!q.data)
    return q.error ? <ErrorBox error={String(q.error)} /> : <Loading />;
  const v = q.data;
  const h = v.assessment;
  async function decide() {
    setBusy(true);
    try {
      await api("/vehicles/" + id + "/appraisals", {
        revision: v.revision,
        base: v.base,
        included: v.included,
        amount: amount ? Number(amount) : null,
        reason,
        operation_id: crypto.randomUUID(),
        decision_revision: v.decision_revision || 0,
        policy_version: v.policy.version,
      });
      setNotice("Appraisal saved with an immutable evidence snapshot.");
      await q.refetch();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    setBusy(true);
    try {
      const r = await api("/vehicles/" + id + "/reports", {
        operation_id: reportOperation,
        valid_days: 90,
      });
      nav("/reports/" + r.id + "/preview");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function startIntake() {
    setBusy(true);
    setError("");
    try {
      const visit = await api<{ id: string }>(
        "/vehicles/" + id + "/intake-visit",
        {},
      );
      nav("/service/" + visit.id + "/capture");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <Link className="back" to="/work-queue">
        <ArrowLeft size={15} /> Work queue
      </Link>
      <div className="page-title">
        <div>
          <div className="eyebrow">
            {v.stock} · {v.scenario}
          </div>
          <h1>
            {v.year} {v.make} {v.model}
          </h1>
          <p>
            {v.miles.toLocaleString()} mi <span className="divider">·</span> VIN
            •••••••••••{v.vin.slice(-6)}{" "}
            <button
              className="icon-button"
              aria-label="Copy VIN"
              onClick={() => {
                navigator.clipboard.writeText(v.vin);
                setNotice("VIN copied");
              }}
            >
              <Copy size={14} />
            </button>
          </p>
        </div>
        {role !== "sales" &&
          (v.evidence_state === "none" ? (
            <button
              className="button primary"
              onClick={startIntake}
              disabled={busy}
            >
              <Plus size={17} /> Add intake baseline
            </button>
          ) : (
            <Link className="button primary" to={"/service/" + id + "/capture"}>
              <Plus size={17} /> Add reading
            </Link>
          ))}
      </div>
      {role !== "sales" && v.evidence_state === "none" && (
        <div className="info">
          No battery evidence yet. Start with an intake baseline test, then
          capture a reading at each service visit so the buyer sees a history,
          not a single number.
        </div>
      )}
      {role !== "sales" && v.evidence_state === "baseline_only" && (
        <div className="warning">
          Acquisition baseline only — no dealer service history yet. The next
          service reading starts the trend a buyer can actually verify.
        </div>
      )}
      <div className="detail-grid">
        <div>
          <section className="card summary">
            <div className="health-overview">
              <div className="summary-top">
                <span>Estimated battery health</span>
                <div className="badge-row">
                  {v.evidence_state === "baseline_only" && (
                    <Badge tone="amber">Baseline only</Badge>
                  )}
                  <Badge tone={h.quality === "limited" ? "amber" : "teal"}>
                    {h.quality} evidence
                  </Badge>
                </div>
              </div>
              <HealthGauge
                interval={h.interval}
                explain="of reference capacity"
              />
              <p>{h.reason}</p>
              <div className="summary-bottom">
                <div>
                  <small>LAST RECORDED READING</small>
                  <strong>
                    {h.last
                      ? `${h.last.value}% · ${date(h.last.date)}`
                      : "No confirmed reading"}
                  </strong>
                </div>
                <div>
                  <small>NEXT STEP</small>
                  <strong>{h.action}</strong>
                </div>
              </div>
            </div>
            <div className="summary-context">
              <div className="summary-facts">
                <div>
                  <small>INDEPENDENT DATES</small>
                  <strong>
                    {h.count} {h.count === 1 ? "reading" : "readings"}
                  </strong>
                </div>
                <div>
                  <small>OBSERVED TREND</small>
                  <strong>
                    {h.slope !== null
                      ? `${h.slope} pts/yr`
                      : "Needs more history"}
                  </strong>
                </div>
              </div>
              <details>
                <summary>Why this estimate?</summary>
                <p>
                  Current pack, confirmed usable-capacity readings only. Source
                  allowances and age widen the interval. These are product
                  assumptions, not calibrated confidence bounds. Same-day tests
                  count as one independent date.
                </p>
                <p>
                  Selected measurement method:{" "}
                  {h.method || "Not enough evidence"}.{" "}
                  {h.exclusions?.length || 0} readings excluded for incompatible
                  methods or invalid source values.
                </p>
                <p>
                  Trend requires at least 3 comparable dates over 183 days.{" "}
                  {h.slope !== null
                    ? `Observed slope: ${h.slope} percentage points/year.`
                    : "There is not enough consistent evidence for a trend."}
                </p>
                {h.scenarios.map((x) => (
                  <p key={x.months}>
                    {x.months}-month conditional scenario:{" "}
                    {interval(x.interval)}. Assumes continuation of the observed
                    trend.
                  </p>
                ))}
              </details>
              {h.warnings.map((w) => (
                <div className="warning" key={w}>
                  {w}
                </div>
              ))}
              {role === "manager" && (
                <a
                  className="button primary mobile-decision-link"
                  href="#appraisal-decision"
                >
                  Review appraisal <ArrowUpRight size={17} />
                </a>
              )}
            </div>
          </section>
          {v.life && <LifeBlock life={v.life} />}
          <div className="tabs">
            {(role === "sales"
              ? ["Timeline", "Warranty"]
              : ["Timeline", "Warranty", "Sources", "Activity"]
            ).map((t) => (
              <button
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Timeline" ? (
            <section className="card">
              <div className="section-title">
                <h2>Health Timeline</h2>
                <Badge>{v.readings.length} recorded readings</Badge>
              </div>
              <p className="muted">
                A sourced history, from service visit to appraisal.
              </p>
              {v.readings.length ? (
                <Chart
                  events={v.events}
                  readings={v.readings.filter(
                    (r) =>
                      r.state === "confirmed" &&
                      (r.pack !== v.pack || h.input_ids.includes(r.id)),
                  )}
                />
              ) : (
                <div className="empty">
                  <BatteryCharging />
                  <h2>Start this vehicle’s history</h2>
                  <p>A confirmed capacity reading is the first step.</p>
                  {role !== "sales" && (
                    <button
                      className="button primary"
                      onClick={startIntake}
                      disabled={busy}
                    >
                      <Plus size={17} /> Add intake baseline
                    </button>
                  )}
                </div>
              )}
              {v.events.map((e) => (
                <div className="warning" key={e.id}>
                  <strong>
                    {date(e.date)} · {e.type}
                  </strong>
                  <p>{e.notes}</p>
                </div>
              ))}
              <h3>Evidence records</h3>
              <div className="evidence-list">
                {[...v.readings].reverse().map((r) => (
                  <div className="evidence" key={r.id}>
                    <span className="evidence-dot">
                      <Check size={14} />
                    </span>
                    <div>
                      <strong>
                        {r.value}% battery health <Badge>{r.pack} pack</Badge>
                        {r.origin === "intake" && (
                          <Badge tone="teal">Intake baseline</Badge>
                        )}
                      </strong>
                      <p>
                        {r.source} · {date(r.date)} ·{" "}
                        {r.miles.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{" "}
                        mi
                      </p>
                      <small>
                        {r.provenance} · {r.state} ·{" "}
                        {r.actor || "Source confirmed"}
                      </small>
                      {r.state === "confirmed" && role === "manager" ? (
                        <ExcludeReading
                          id={r.id}
                          revision={v.revision}
                          api={api}
                        />
                      ) : r.state !== "confirmed" ? (
                        <Badge tone="amber">
                          {r.state} · excluded from assessment
                        </Badge>
                      ) : null}
                      {role === "manager" &&
                        r.state !== "superseded" &&
                        r.pack === v.pack && (
                          <CorrectReading
                            r={r}
                            revision={v.revision}
                            api={api}
                          />
                        )}
                      <small>
                        {r.method ||
                          "BMS capacity estimate · legacy assumption"}{" "}
                        ·{" "}
                        {r.reference_basis ||
                          "Original usable capacity · legacy assumption"}
                      </small>
                      {r.exclusion_reason && (
                        <p>Exclusion: {r.exclusion_reason}</p>
                      )}
                      {r.amendment_reason && (
                        <p>Correction: {r.amendment_reason}</p>
                      )}
                      {r.attachment && (
                        <a
                          href={"/api/attachments/" + r.attachment}
                          target="_blank"
                        >
                          View original image
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : tab === "Warranty" ? (
            <WarrantyPanel key={v.id + v.revision} v={v} api={api} />
          ) : tab === "Sources" ? (
            <SourcePanel key={v.id + v.revision} v={v} api={api} />
          ) : (
            <section className="card">
              <h2>Activity</h2>
              {v.activity.length ? (
                v.activity.map((e) => (
                  <p key={e.id}>
                    {e.action}
                    <small>
                      {e.actor} · {date(e.at)}
                    </small>
                  </p>
                ))
              ) : (
                <p>No dealer actions recorded yet.</p>
              )}
            </section>
          )}
        </div>
        {role === "manager" ? (
          <div className="appraisal-column">
            <section
              className="card appraisal"
              id="appraisal-decision"
              tabIndex={-1}
            >
              <div className="eyebrow">APPRAISAL DESK</div>
              <h2>Evidence into an offer</h2>
              <p>Illustrative dealer policy · {v.policy.version}</p>
              <div className="price-row">
                <span>Starting dealer appraisal</span>
                <strong>{money(v.base)}</strong>
              </div>
              <small>
                {v.base_source || "Synthetic dealer value"} · as of{" "}
                {date(v.base_effective_date || h.as_of)}
              </small>
              <div className="price-row">
                <span>Battery adjustment</span>
                <strong>
                  {v.recommendation.adjustment
                    ? v.recommendation.adjustment.map(money).join(" to ")
                    : "Pending"}
                </strong>
              </div>
              <div className="price-row">
                <span>Uncertainty reserve</span>
                <strong>{money(v.recommendation.reserve)}</strong>
              </div>
              <div className="offer">
                <small>SUGGESTED APPRAISAL</small>
                <strong>
                  {v.recommendation.interval
                    ? v.recommendation.interval.map(money).join(" – ")
                    : "Obtain more evidence"}
                </strong>
              </div>
              <details>
                <summary>Why this recommendation?</summary>
                <p>{v.recommendation.reason}</p>
                <p>
                  Reference health {v.policy.reference_health}%;{" "}
                  {money(v.policy.dollars_per_point)} per percentage point,
                  capped at ±{money(v.policy.cap)}. Unvalidated dealer demo
                  assumptions. Warranty does not add a premium.
                </p>
                <p>Base already includes battery: {v.included}.</p>
                {v.life?.status === "projected" && v.life.thresholds[0] && (
                  <p>
                    Pack projection: the {v.life.thresholds[0].percent}% pricing
                    reference is about {lifeRange(v.life.thresholds[0])} away at
                    the observed rate. Remaining life informs the decision; it
                    does not change the policy coefficients.
                  </p>
                )}
              </details>
              <ValuationEditor key={v.id + v.revision} v={v} api={api} />
              {h.quality === "limited" && (
                <div className="warning">
                  Obtain more evidence. Proceeding requires a review reason.
                </div>
              )}
              <label>
                Override amount (optional)
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="USD"
                />
              </label>
              <label>
                Review / override reason
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain your decision when review is needed"
                />
              </label>
              <button
                className="primary wide"
                disabled={busy || !v.recommendation.interval}
                onClick={decide}
              >
                {amount ? "Save override" : "Accept appraisal"}
                <Check size={16} />
              </button>
              <ErrorBox error={error} />
              <div role="status" className="success">
                {notice}
              </div>
            </section>
            {v.decisions.map((d) => (
              <section className="card" key={d.id}>
                <Badge tone="teal">Accepted · {money(d.accepted)}</Badge>
                <p>{date(d.at)}</p>
                {d.customer_note && <p className="muted">{d.customer_note}</p>}
                {d.newer_evidence && (
                  <div className="warning">
                    Newer evidence or appraisal inputs are available. This
                    accepted offer is unchanged.
                  </div>
                )}
              </section>
            ))}
            <section className="card report-callout">
              <FileText />
              <h3>Carry the evidence forward</h3>
              <p>Create a privacy-safe buyer report from this assessment.</p>
              <button className="wide" disabled={busy} onClick={preview}>
                Preview battery report <ArrowUpRight size={16} />
              </button>
            </section>
          </div>
        ) : (
          <section className="card">
            <h2>Evidence workspace</h2>
            <p>
              {role === "technician"
                ? "Capture and review service evidence here. Managers handle appraisal decisions and report publication."
                : "Read-only vehicle summary. Open Reports to view published buyer reports."}
            </p>
            <Link className="button" to="/reports">
              View reports
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
function Capture() {
  const asOf =
    (qc.getQueryData(["session"]) as { as_of: string })?.as_of ||
    new Date().toISOString().slice(0, 10);
  const role = (qc.getQueryData(["session"]) as { role: string })?.role;
  const { id } = useParams();
  const nav = useNavigate();
  const visit = useQuery({
    queryKey: ["visit", id],
    queryFn: () =>
      api<{
        id: string;
        vehicle: string;
        ro: string;
        state: string;
        kind?: string;
      }>("/service-visits/" + id),
    enabled: role !== "sales",
  });
  const vehicleId = visit.data?.vehicle || id;
  const isIntake = visit.data?.kind === "intake";
  const q = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => api<Vehicle>("/vehicles/" + vehicleId),
    enabled: !!visit.data,
  });
  const key = "capture-" + id;
  const [f, setF] = useState(
    () =>
      readLocalDraft(key) || {
        value: "",
        measurement: "ambiguous",
        date: asOf,
        odometer: "",
        unit: "mi",
        source: "OEM diagnostic tool",
        basis: "usable capacity",
        notes: "",
        method: "BMS capacity estimate",
        reference_basis: "Original usable capacity",
        temperature_c: "",
        soc_at_measurement: "",
      },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [upload, setUpload] = useState<{
    id: string;
    url: string;
    message: string;
    transcript?: string;
  } | null>(() => readLocalDraft(key + "-attachment"));
  const [captureMethod, setCaptureMethod] = useState<"manual" | "photo">(() =>
    readLocalDraft(key + "-attachment") ? "photo" : "manual",
  );
  const [success, setSuccess] = useState(false);
  function change(k: string, value: string) {
    const n = { ...f, [k]: value };
    setF(n);
    localStorage.setItem(key, JSON.stringify(n));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        ...f,
        value: Number(f.value),
        odometer: Number(f.odometer),
        temperature_c:
          f.temperature_c === "" || f.temperature_c === undefined
            ? null
            : Number(f.temperature_c),
        soc_at_measurement:
          f.soc_at_measurement === "" || f.soc_at_measurement === undefined
            ? null
            : Number(f.soc_at_measurement),
        pack: q.data?.pack,
        attachment: upload?.id || null,
      };
      const fingerprint = JSON.stringify(body);
      const pending = readLocalDraft(key + "-confirmation");
      const d =
        pending?.fingerprint === fingerprint
          ? pending
          : await api("/service-visits/" + id + "/capture-drafts", body);
      localStorage.setItem(
        key + "-confirmation",
        JSON.stringify({ id: d.id, fingerprint }),
      );
      await api("/capture-drafts/" + d.id + "/confirm", {});
      localStorage.removeItem(key);
      localStorage.removeItem(key + "-attachment");
      localStorage.removeItem(key + "-confirmation");
      await qc.invalidateQueries();
      setSuccess(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  if (role === "sales")
    return (
      <div className="card">
        <h1>Read-only access</h1>
        <p>A technician or manager can capture this reading.</p>
        <Link to={"/vehicles/" + vehicleId}>Back to vehicle</Link>
      </div>
    );
  if (visit.error)
    return (
      <div className="card">
        <ErrorBox error={String(visit.error)} />
        <button onClick={() => visit.refetch()}>Retry service visit</button>
      </div>
    );
  if (q.error)
    return (
      <div className="card">
        <ErrorBox error={String(q.error)} />
        <button onClick={() => q.refetch()}>Retry vehicle</button>
      </div>
    );
  if (!q.data) return <Loading />;
  return (
    <div className="capture-page">
      <Link className="back" to={"/vehicles/" + vehicleId}>
        <ArrowLeft size={15} /> Vehicle workspace
      </Link>
      <div className="eyebrow">
        {isIntake ? "ACQUISITION INTAKE" : "SERVICE VISIT"} ·{" "}
        {visit.data?.ro || "Loading visit…"}
      </div>
      <h1>
        {isIntake ? "Record an intake baseline" : "Capture a battery reading"}
      </h1>
      <p>
        {isIntake
          ? "A baseline gives the Timeline a starting point. It is not dealer service history."
          : "Review the source. Confirm the reading. Build the history."}
      </p>
      {q.data && (
        <div className="capture-context">
          <Car />
          <div>
            <strong>
              {q.data.year} {q.data.make} {q.data.model}
            </strong>
            <small>
              {q.data.stock} · {q.data.miles.toLocaleString()} mi ·{" "}
              {q.data.pack} pack
            </small>
          </div>
          <Badge>{visit.data?.state}</Badge>
        </div>
      )}
      {success ? (
        <div className="card empty" role="status">
          <Check size={36} />
          <h2>
            {isIntake
              ? "Baseline added to the Timeline"
              : "Reading added to the Timeline"}
          </h2>
          <p>
            {isIntake
              ? "The baseline is now the starting point for this vehicle's evidence."
              : "The assessment has been recalculated and saved."}
          </p>
          <button
            className="primary"
            onClick={() => nav("/vehicles/" + vehicleId)}
          >
            Open updated appraisal <ArrowUpRight size={17} />
          </button>
        </div>
      ) : (
        <form onSubmit={save}>
          <div
            className="capture-methods"
            role="group"
            aria-label="Input method"
          >
            <button
              type="button"
              aria-pressed={captureMethod === "manual"}
              className={captureMethod === "manual" ? "selected" : ""}
              onClick={() => setCaptureMethod("manual")}
            >
              <FileText size={19} /> Enter reading
            </button>
            <button
              type="button"
              aria-pressed={captureMethod === "photo"}
              className={captureMethod === "photo" ? "selected" : ""}
              onClick={() => setCaptureMethod("photo")}
            >
              <Upload size={19} /> Upload photo
            </button>
          </div>
          <section
            className="card"
            hidden={captureMethod !== "photo" && !upload}
          >
            <div className="step-title">
              <span>1</span>
              <h2>Capture the evidence</h2>
              <Badge>Manual review</Badge>
            </div>
            <label className="upload">
              <Upload size={25} />
              <strong>Photograph or upload a diagnostic screen</strong>
              <span>JPEG, PNG or WebP · up to 8 MB</span>
              <input
                aria-label="Upload diagnostic image"
                type="file"
                disabled={busy || extracting || uploading}
                accept="image/png,image/jpeg,image/webp"
                capture="environment"
                onChange={async (e) => {
                  if (!e.target.files?.[0]) return;
                  setUploading(true);
                  const form = new FormData();
                  form.append("file", e.target.files[0]);
                  try {
                    const uploaded = await api("/uploads", form);
                    setUpload(uploaded);
                    localStorage.setItem(
                      key + "-attachment",
                      JSON.stringify(uploaded),
                    );
                    const next = { ...f, measurement: "ambiguous", value: "" };
                    setF(next);
                    localStorage.setItem(key, JSON.stringify(next));
                  } catch (err) {
                    setError(String(err));
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
            {(uploading || extracting) && (
              <p role="status">
                {uploading
                  ? "Storing the image…"
                  : "Reading the image. Review is required before confirmation."}
              </p>
            )}
            {upload && (
              <>
                <img
                  className="uploaded"
                  src={upload.url}
                  alt="Original uploaded diagnostic evidence"
                />
                <p className="warning">{upload.message}</p>
                {upload.transcript && (
                  <details>
                    <summary>Review extracted text</summary>
                    <pre className="ocr-transcript">{upload.transcript}</pre>
                  </details>
                )}
                <button
                  type="button"
                  disabled={busy || extracting || uploading}
                  onClick={async () => {
                    setExtracting(true);
                    try {
                      const x = await api(
                        "/attachments/" + upload.id + "/extract",
                        {},
                      );
                      const reviewed = {
                        ...upload,
                        message: x.message,
                        transcript: x.transcript,
                      };
                      setUpload(reviewed);
                      localStorage.setItem(
                        key + "-attachment",
                        JSON.stringify(reviewed),
                      );
                      if (x.status === "review") {
                        const n = {
                          ...f,
                          value: x.value === null ? "" : String(x.value),
                          measurement: x.measurement,
                          date: x.date || f.date,
                          odometer:
                            x.odometer !== null
                              ? String(x.odometer)
                              : f.odometer,
                          unit: x.unit || f.unit,
                        };
                        setF(n);
                        localStorage.setItem(key, JSON.stringify(n));
                      }
                    } catch (e) {
                      setError(String(e));
                    } finally {
                      setExtracting(false);
                    }
                  }}
                >
                  Extract with configured OCR
                </button>
              </>
            )}
            <p className="muted">
              Review the original image against the fields below before
              confirming.
            </p>
          </section>
          <section className="card">
            <div className="step-title">
              <span>{captureMethod === "photo" || upload ? "2" : "1"}</span>
              <h2>Review the reading</h2>
            </div>
            <div className="info">
              Battery health is remaining usable capacity. Charge level is how
              full the battery is right now.
            </div>
            <div className="form-grid">
              <label>
                Measurement type
                <select
                  value={f.measurement}
                  onChange={(e) => change("measurement", e.target.value)}
                >
                  <option value="ambiguous">Select measurement type</option>
                  <option value="health">
                    Battery health / usable capacity
                  </option>
                  <option value="charge">State of charge</option>
                </select>
              </label>
              <label>
                Reading (%)
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputMode="decimal"
                  value={f.value}
                  onChange={(e) => change("value", e.target.value)}
                />
              </label>
              <label>
                Reading date
                <input
                  required
                  type="date"
                  value={f.date}
                  onChange={(e) => change("date", e.target.value)}
                />
              </label>
              <label>
                Odometer
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder={String(q.data?.miles || "")}
                  value={f.odometer}
                  onChange={(e) => change("odometer", e.target.value)}
                />
              </label>
              <label>
                Distance unit
                <select
                  value={f.unit}
                  onChange={(e) => change("unit", e.target.value)}
                >
                  <option value="mi">Miles (mi)</option>
                  <option value="km">Kilometers (km)</option>
                </select>
              </label>
              <label>
                Source
                <select
                  value={f.source}
                  onChange={(e) => change("source", e.target.value)}
                >
                  {[
                    "OEM diagnostic tool",
                    "OEM dashboard",
                    "Independent test",
                    "Manual transcription",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Measurement method
              <select
                value={f.method || "BMS capacity estimate"}
                onChange={(e) => change("method", e.target.value)}
              >
                <option>BMS capacity estimate</option>
                <option>Measured usable energy</option>
                <option value="unknown">Unknown — needs review</option>
              </select>
            </label>
            <label>
              Reference capacity
              <select
                value={f.reference_basis || "Original usable capacity"}
                onChange={(e) => change("reference_basis", e.target.value)}
              >
                <option>Original usable capacity</option>
                <option>Documented replacement reference</option>
                <option value="unknown">Unknown — needs review</option>
              </select>
            </label>
            <label>
              Measurement basis
              <select
                value={f.basis}
                onChange={(e) => change("basis", e.target.value)}
              >
                <option value="usable capacity">
                  Usable capacity relative to reference
                </option>
                <option value="unknown">Unknown — needs review</option>
              </select>
            </label>
            <details>
              <summary>Optional measurement conditions</summary>
              <div className="form-grid">
                <label>
                  Battery temperature (°C)
                  <input
                    type="number"
                    min="-50"
                    max="100"
                    step="0.1"
                    value={f.temperature_c || ""}
                    onChange={(e) => change("temperature_c", e.target.value)}
                  />
                </label>
                <label>
                  State of charge at test (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={f.soc_at_measurement || ""}
                    onChange={(e) =>
                      change("soc_at_measurement", e.target.value)
                    }
                  />
                </label>
              </div>
            </details>
            <label>
              Internal notes (optional)
              <textarea
                value={f.notes}
                onChange={(e) => change("notes", e.target.value)}
                placeholder="Measurement conditions, temperature, SOC, or source context if known"
              />
            </label>
            <ErrorBox error={error} />
          </section>
          <div className="confirm-bar">
            <span>Only confirmed health readings affect the assessment.</span>
            <button
              className="primary"
              disabled={busy || extracting || uploading}
            >
              {busy
                ? "Saving and assessing…"
                : isIntake
                  ? "Confirm baseline"
                  : "Confirm and add to Timeline"}
              <Check size={17} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
function Reports() {
  const q = useQuery({
    queryKey: ["reports"],
    queryFn: () => api<Report[]>("/reports"),
  });
  return (
    <div className="page">
      <div className="eyebrow">BUYER HANDOFF</div>
      <h1>Battery reports</h1>
      <p>
        Immutable evidence summaries. Each published version has its own link.
      </p>
      <div className="report-grid">
        {q.data?.length ? (
          q.data.map((r) => (
            <Link
              className="report-card"
              key={r.id}
              to={"/reports/" + r.id + "/preview"}
            >
              <div className="report-card-head">
                <FileText size={20} />
                <div>
                  <strong>{r.payload.vehicle}</strong>
                  <small>
                    Version {r.payload.version} · {date(r.payload.as_of)}
                    {r.newer_evidence ? " · Newer evidence available" : ""}
                  </small>
                </div>
              </div>
              <div className="report-card-meter">
                <BatteryMeter
                  level={
                    r.payload.interval
                      ? Math.round(
                          (r.payload.interval[0] + r.payload.interval[1]) / 2,
                        )
                      : null
                  }
                  valueText={interval(r.payload.interval)}
                  size={130}
                />
                <Badge tone={r.status === "published" ? "teal" : "neutral"}>
                  {r.status}
                </Badge>
              </div>
              <span className="report-card-arrow">
                <ChevronRight size={16} />
              </span>
            </Link>
          ))
        ) : (
          <div className="empty">
            <FileText />
            <h2>No reports yet</h2>
            <p>Open a vehicle to preview its battery report.</p>
            <Link className="button" to="/vehicles">
              Browse vehicles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
function ReportBody({ p, token }: { p: Payload; token?: string }) {
  return (
    <article className="report-paper">
      <div className="report-brand">
        <BatteryCharging />
        <strong>VOLTVAULT</strong>
        <Badge>Dealer-issued evidence summary</Badge>
      </div>
      <h1>Battery Health Report</h1>
      <p>{p.vehicle}</p>
      <small>
        VIN {p.vin} · Version {p.version} · As of {date(p.as_of)}
      </small>
      {p.expires_on && (
        <small>
          Expires {date(p.expires_on)}. Scan the QR for current status.
        </small>
      )}
      <div className="report-health">
        <small>ESTIMATED BATTERY HEALTH</small>
        <HealthGauge interval={p.interval} explain="of reference capacity" />
        <Badge tone="teal">{p.quality} evidence</Badge>
        <p>{p.reason}</p>
        <p>
          Last recorded:{" "}
          {p.last
            ? `${p.last.value}% on ${date(p.last.date)}`
            : "No confirmed readings"}
        </p>
      </div>
      {p.life && <LifeBlock life={p.life} variant="buyer" />}
      {p.evidence_basis?.state === "baseline_only" && (
        <div className="warning">
          Acquisition baseline only. No dealer service history is recorded yet,
          and a single test cannot show a trend.
        </div>
      )}
      <h2>Current-pack history</h2>
      <p>
        Pack: {p.pack}. Earlier pack readings are excluded from this estimate.
        {p.pack_context?.start_date && (
          <>
            {" "}
            Segment start: {date(p.pack_context.start_date)} (
            {p.pack_context.verification}). Replacement coverage is assessed
            separately.
          </>
        )}
      </p>
      {p.readings.length > 0 && <Chart readings={p.readings} />}
      <div className="report-data">
        {p.readings.map((r, i) => (
          <div key={i}>
            <span>{date(r.date)}</span>
            <strong>{r.value}%</strong>
            <span>{r.source}</span>
          </div>
        ))}
      </div>
      <h2>Warranty information</h2>
      <p>{p.warranty}</p>
      <h2>What this report tells you</h2>
      <p>{p.limitations}</p>
      <p>
        Battery health means usable capacity relative to the relevant reference
        capacity. It is different from charge level or driving range.
      </p>
      {token && (
        <div className="qr">
          <img
            src={"/api/public/reports/" + token + "/qr"}
            alt="QR code for this exact report version"
          />
          <div>
            <strong>Keep the evidence with the vehicle</strong>
            <p>
              <a href={"/r/" + token}>Open this published version</a>
            </p>
            <a
              className="button"
              href={"/api/public/reports/" + token + "/pdf"}
            >
              Download PDF <FileText size={16} />
            </a>
          </div>
        </div>
      )}
      <div className="report-footer">
        {p.dealer}
        <br />
        Generated {date(p.generated_at)} · Independent Tek-Qubit concept
      </div>
    </article>
  );
}
function Preview() {
  const canPublish =
    (qc.getQueryData(["session"]) as { role: string })?.role === "manager";
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["reports"],
    queryFn: () => api<Report[]>("/reports"),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const r = q.data?.find((r) => r.id === id);
  async function act(action: string) {
    setBusy(true);
    try {
      await api("/reports/" + id + "/" + action, {});
      await q.refetch();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  if (!r)
    return q.isLoading ? (
      <Loading />
    ) : (
      <div className="card">
        <h2>Report unavailable</h2>
        <p>
          {q.error
            ? String(q.error)
            : "This report does not exist or is not available to your role."}
        </p>
        <Link to="/reports">Back to reports</Link>
      </div>
    );
  return (
    <div className="page">
      <Link to="/reports" className="back">
        <ArrowLeft size={15} /> Reports
      </Link>
      <div className="page-title">
        <div>
          <h1>Report preview</h1>
          <p>Review the buyer-visible snapshot before publication.</p>
        </div>
        <div className="actions">
          <Badge>{r.status}</Badge>
          {r.newer_evidence && (
            <Badge tone="amber">Newer evidence available</Badge>
          )}
          {r.status === "draft" && canPublish ? (
            <button
              className="primary"
              disabled={busy}
              onClick={() => act("publish")}
            >
              Publish report
            </button>
          ) : r.status === "published" ? (
            <>
              <Link className="button" to={"/r/" + r.token}>
                Open public report
              </Link>
              {canPublish && (
                <button disabled={busy} onClick={() => act("revoke")}>
                  Revoke
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
      <ErrorBox error={error} />
      <ReportBody
        p={r.payload}
        token={r.status === "published" ? r.token : undefined}
      />
    </div>
  );
}
function PublicReport() {
  const { token } = useParams();
  const q = useQuery({
    queryKey: ["public", token],
    queryFn: () => api<Payload>("/public/reports/" + token),
    retry: false,
  });
  return (
    <div className="public">
      {q.error ? (
        <div className="card">
          <h1>Report unavailable</h1>
          <ErrorBox error={String(q.error)} />
        </div>
      ) : q.data ? (
        <ReportBody p={q.data} token={token} />
      ) : (
        <Loading />
      )}
    </div>
  );
}
function Sources() {
  const q = useQuery({ queryKey: ["sources"], queryFn: () => api("/sources") });
  return (
    <div className="page">
      <div className="eyebrow">GOVERNANCE</div>
      <h1>Sources & settings</h1>
      <p>Know where the evidence comes from, and where its limits are.</p>
      <div className="settings-grid">
        <section className="card">
          <h2>Demo environment</h2>
          <Badge tone="amber">{q.data?.mode || "Loading"} data mode</Badge>
          <p>
            {q.data?.vehicle_count ?? "…"} synthetic vehicles. Assessment clock:{" "}
            {q.data?.as_of ? date(q.data.as_of) : "…"}. Dealer timezone:
            America/Chicago. Currency: USD.
          </p>
          <p>
            Public-data adapters use explicit fixture/live configuration.
            Optional local Tesseract OCR proposes fields for review; manual
            capture always works.
          </p>
          <h3>Source registry</h3>
          {q.data?.sources.map((s: any) => (
            <p key={s.title}>
              <a href={s.url}>{s.title} ↗</a>
              <small>{s.status}</small>
            </p>
          ))}
        </section>
        {q.data?.policy && (
          <PolicyEditor
            key={q.data.policy.version}
            policy={q.data.policy}
            api={api}
          />
        )}
      </div>
    </div>
  );
}
const PIPELINE = [
  {
    icon: Camera,
    key: "Capture",
    role: "Technician",
    title: "Capture at the service lane",
    body: "A technician records one battery-health reading on an open visit — typed, or pulled from a diagnostic photo by on-device OCR — and confirms it once.",
  },
  {
    icon: TrendingUp,
    key: "Timeline",
    role: "Evidence",
    title: "Build a sourced history",
    body: "Every reading becomes a dated, sourced observation on the right battery pack. A deterministic engine turns it into an honest health interval — never a single made-up number.",
  },
  {
    icon: Gauge,
    key: "Appraisal",
    role: "Manager",
    title: "Turn evidence into an offer",
    body: "A manager sees evidence quality, warranty headroom and a transparent price breakdown, then accepts or overrides — saved as an immutable, explainable decision.",
  },
  {
    icon: QrCode,
    key: "Report",
    role: "Buyer",
    title: "Hand the buyer the proof",
    body: "Publish a privacy-safe report with a masked VIN, QR code and PDF. No internal pricing, no re-typing — the same evidence, carried all the way through.",
  },
];
const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Evidence before interpretation",
    body: "Observation, estimate and conditional scenario stay separately labeled. An honest “not enough evidence” beats a precise-looking guess.",
  },
  {
    icon: Zap,
    title: "Deterministic, inspectable engine",
    body: "Health intervals, trends and warranty headroom are plain, versioned Python — no black-box model deciding what a battery is worth.",
  },
  {
    icon: Activity,
    title: "Pack-aware continuity",
    body: "A replacement pack starts a fresh segment. Trends never draw a line straight through an installation event as if nothing changed.",
  },
  {
    icon: Lock,
    title: "Privacy-safe by construction",
    body: "Buyer reports are an allow-listed snapshot — no customer data, no base price, no override reasons. Served from a dedicated public schema.",
  },
];
const ROLES = [
  {
    role: "manager",
    icon: Briefcase,
    title: "Used-car manager",
    blurb:
      "Review evidence, set policy, accept or override appraisals, publish buyer reports.",
    can: [
      "Full appraisal desk",
      "Warranty & pricing policy",
      "Publish & revoke reports",
    ],
  },
  {
    role: "technician",
    icon: Wrench,
    title: "Service technician",
    blurb:
      "Capture and confirm battery readings from the service lane, by hand or photo.",
    can: [
      "Capture & confirm readings",
      "Photo upload + OCR",
      "Review the Timeline",
    ],
  },
  {
    role: "sales",
    icon: Users,
    title: "Sales associate",
    blurb:
      "Show a buyer the evidence — sanitized summaries and published reports only.",
    can: [
      "Read-only vehicle view",
      "Published buyer reports",
      "No internal pricing",
    ],
  },
];
function Sparkline() {
  const pts = [62, 70, 74, 78, 83, 86, 89, 91];
  const w = 220,
    h = 64;
  const max = 100;
  const d = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      className="spark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00a392" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#00a392" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#sg)" />
      <path d={d} fill="none" stroke="#00897b" strokeWidth="2.5" />
      <circle
        cx={w}
        cy={h - (pts[pts.length - 1] / max) * h}
        r="4"
        fill="#fff"
        stroke="#00897b"
        strokeWidth="2.5"
      />
    </svg>
  );
}
function HeroBattery() {
  const bars = [92, 88, 85, 79, 74];
  return (
    <svg className="hero-batt" viewBox="0 0 200 120" fill="none" aria-hidden="true">
      <rect x="10" y="20" width="160" height="90" rx="14" stroke="#2be3a1" strokeWidth="2.5" opacity="0.4" />
      <rect x="170" y="45" width="12" height="30" rx="4" fill="#2be3a1" opacity="0.3" />
      {bars.map((h, i) => (
        <rect key={i} x={24 + i * 28} y={94 - h * 0.7} width={18} height={h * 0.7} rx={4}
          fill={`rgba(43,227,161,${0.3 + i * 0.15})`}
          className="hero-bar" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
      <path d="M24 90 L150 90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    </svg>
  );
}
function SDGWheel({ size = 80 }: { size?: number }) {
  const goals = [
    { n: 7, c: "#FCC30B", l: "Affordable Energy" },
    { n: 9, c: "#F36D25", l: "Industry & Innovation" },
    { n: 11, c: "#F99D26", l: "Sustainable Cities" },
    { n: 12, c: "#CF8D2A", l: "Responsible Consumption" },
    { n: 13, c: "#48773E", l: "Climate Action" },
  ];
  const r = size / 2 - 4;
  const cx = size / 2, cy = size / 2;
  const slice = (2 * Math.PI) / goals.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sdg-wheel" aria-label="UN SDG alignment">
      {goals.map((g, i) => {
        const a1 = i * slice - Math.PI / 2;
        const a2 = (i + 1) * slice - Math.PI / 2;
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        return (
          <path key={g.n}
            d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
            fill={g.c} opacity="0.85" />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.45} fill="var(--forest)" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">SDG</text>
    </svg>
  );
}
function VoltVaultLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="VoltVault logo">
      <defs>
        <linearGradient id="vv-bg" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#vv-bg)" />
      <path d="M14 14 L24 34 L34 14" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 14 L24 22 L28 14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
      <path d="M22 28 l2-4h2l-1.5 2.5h2l-4 5.5 .8-2.5h-2z" fill="#FCC30B" />
    </svg>
  );
}
function Landing({ sessionExpired }: { sessionExpired?: boolean }) {
  const nav = useNavigate();
  const go = () => nav("/login");
  const STEPS = [
    { num: "01", icon: Camera, title: "Capture", desc: "Record battery health at every visit" },
    { num: "02", icon: TrendingUp, title: "Timeline", desc: "Build a sourced, auditable history" },
    { num: "03", icon: Gauge, title: "Appraise", desc: "Turn evidence into a fair offer" },
    { num: "04", icon: QrCode, title: "Report", desc: "Hand the buyer verifiable proof" },
  ];
  const THEME = [
    { icon: GreenServer, title: "EV Readiness Advisor", desc: "Score a dealership's readiness for EV sales and service", ours: false },
    { icon: CarbonFlag, title: "Carbon Footprint Tracker", desc: "Track and visualize emissions from dealership operations", ours: false },
    { icon: PartsIcon, title: "Circular Parts Marketplace", desc: "Match recyclable or reconditioned parts across a dealer network", ours: false },
    { icon: PaperNote, title: "Paperless Deal Jacket", desc: "Quantify paper savings from e-contracting adoption", ours: false },
    { icon: BatteryFlash, title: "EV Trade-In Battery Estimator", desc: "Estimate battery health and remaining life for fair trade-in pricing", ours: true },
    { icon: RouteIcon, title: "Green Delivery Optimizer", desc: "Optimize routing for loaner and delivery vehicles", ours: false },
  ];
  const SDGS = [
    { n: 7, title: "Affordable & Clean Energy", color: "#FCC30B", desc: "Supporting EV adoption through transparent battery health data" },
    { n: 9, title: "Industry, Innovation & Infrastructure", color: "#F36D25", desc: "Deterministic assessment engine for automotive retail" },
    { n: 11, title: "Sustainable Cities & Communities", color: "#F99D26", desc: "Extending EV battery life reduces urban waste" },
    { n: 12, title: "Responsible Consumption & Production", color: "#CF8D2A", desc: "Evidence-based decisions reduce premature battery disposal" },
    { n: 13, title: "Climate Action", color: "#48773E", desc: "Keeping used EVs on the road lowers carbon footprint" },
  ];
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link className="lp-brand" to="/">
            <VoltVaultLogo size={30} /> <span>VoltVault</span>
          </Link>
          <nav className="lp-nav-links">
            <a href="#how">How it works</a>
            <a href="#theme">Theme</a>
            <a href="#sdgs">SDGs</a>
            <a href="#roles">Roles</a>
            <a href="#insights">Insights</a>
          </nav>
          <button className="btn primary" onClick={go}>
            Launch demo <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {sessionExpired && (
        <div className="lp-alert" role="status">
          Session expired — sign back in to continue.
        </div>
      )}

      {/* ---- Hero: image-driven ---- */}
      <section className="lp-hero">
        <div className="lp-hero-split">
          <div className="lp-hero-content">
            <span className="kicker">VoltVault by Tekion</span>
            <h1 className="lp-h1">
              Know your EV battery.<br />
              <span className="lp-accent">Trust the proof.</span>
            </h1>
            <p className="lp-hero-sub">
              From service lane to buyer report — every reading sourced, every decision auditable.
            </p>
            <div className="lp-hero-cta">
              <button className="btn primary lg" onClick={go}>
                <BatteryCharging size={19} /> Try the live demo
              </button>
              <button className="btn outline lg" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
                See how it works
              </button>
            </div>
          </div>
          <div className="lp-hero-img">
            <img src="/img/ev-charging.png" alt="Electric vehicle charging at a green station" />
          </div>
        </div>
      </section>

      {/* ---- Image strip ---- */}
      <section className="lp-img-strip">
        <div className="lp-img-strip-inner">
          <img src="/img/ev-green-car.png" alt="Electric vehicle made of green leaves" />
          <img src="/img/ev-solar-station.png" alt="EVs at a solar-powered charging station" />
          <img src="/img/green-innovation.png" alt="Green technology and sustainability innovation" />
        </div>
      </section>

      {/* ---- How it works: visual pipeline ---- */}
      <section id="how" className="lp-section">
        <div className="lp-section-head">
          <h2 className="lp-h2">Four steps. Zero guesswork.</h2>
        </div>
        <div className="lp-pipeline">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              {i > 0 && <div className="lp-pipe-arrow"><ChevronRight size={22} /></div>}
              <div className="lp-pipe-step">
                <div className="lp-pipe-icon">{React.createElement(s.icon, { size: 24 })}</div>
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ---- Theme: visual grid with real images ---- */}
      <section id="theme" className="lp-section lp-section-dark">
        <div className="lp-theme-row">
          <div className="lp-theme-left">
            <span className="kicker" style={{ color: "var(--green-mint)" }}>Theme 4 · Sustainability</span>
            <h2 className="lp-h2" style={{ color: "#fff" }}>Green Tech for Automotive Retail</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, lineHeight: 1.6, marginTop: 8 }}>
              Six problem statements. VoltVault is the live prototype for <strong style={{ color: "#2be3a1" }}>EV Trade-In Battery Estimator</strong> — and touches every theme.
            </p>
            <img src="/img/ev-wireframe.png" alt="Digital wireframe of an electric vehicle" className="lp-theme-img" />
          </div>
          <div className="lp-theme-cards">
            {THEME.map((t) => (
              <div className="lp-theme-chip" key={t.title}>
                <span className="lp-theme-chip-icon">{React.createElement(t.icon as typeof Camera, { size: 18 })}</span>
                <div className="lp-theme-chip-text">
                  <span>{t.title}</span>
                  <small>{t.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- SDG Goals section ---- */}
      <section id="sdgs" className="lp-section lp-section-cream">
        <div className="lp-section-head">
          <span className="kicker">United Nations Sustainable Development Goals</span>
          <h2 className="lp-h2">Aligned with 5 SDGs</h2>
          <p style={{ maxWidth: 560, margin: "0 auto", color: "var(--muted)", fontSize: 16, lineHeight: 1.6 }}>
            VoltVault directly contributes to these global sustainability targets by keeping EV batteries in service longer and making trade-in decisions evidence-based.
          </p>
        </div>
        <div className="lp-sdg-row">
          {[7, 9, 11, 12, 13].map((n) => (
            <img key={n} src={`/img/sdg-${n}.png`} alt={`UN SDG ${n}`} className="lp-sdg-img" />
          ))}
        </div>
      </section>

      {/* ---- Impact numbers with visual ---- */}
      <section className="lp-section">
        <div className="lp-impact-hero">
          <img src="/img/ev-solar-station.png" alt="EVs at solar charging station" className="lp-impact-img" />
          <div className="lp-impact-content">
            <h2 className="lp-h2">Built for trust, not guesswork.</h2>
            <div className="lp-impact">
              {[
                { num: "0", label: "Re-typed values", sub: "Every reading flows from source" },
                { num: "100%", label: "Auditable decisions", sub: "Immutable evidence snapshots" },
                { num: "3", label: "Role-based views", sub: "Manager · Technician · Sales" },
                { num: "< 2 min", label: "Capture to appraisal", sub: "Photo OCR or manual entry" },
              ].map((s) => (
                <div className="lp-impact-tile" key={s.label}>
                  <strong>{s.num}</strong>
                  <span>{s.label}</span>
                  <small>{s.sub}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Roles ---- */}
      <section id="roles" className="lp-section lp-section-cream">
        <div className="lp-section-head">
          <h2 className="lp-h2">Three roles. One workflow.</h2>
          <p style={{ maxWidth: 480, margin: "0 auto", color: "var(--muted)", fontSize: 16, lineHeight: 1.6 }}>
            Each role sees exactly what they need — no more, no less.
          </p>
        </div>
        <div className="lp-roles">
          {ROLES.map((r) => (
            <button className="lp-role" key={r.role} onClick={go}>
              <div className="lp-role-icon">{React.createElement(r.icon, { size: 22 })}</div>
              <h3>{r.title}</h3>
              <ul className="lp-role-can">
                {r.can.map((c) => <li key={c}><Check size={13} /> {c}</li>)}
              </ul>
              <span className="lp-role-go">Try it <ArrowRight size={14} /></span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- Green Insights / News ---- */}
      <section id="insights" className="lp-section">
        <div className="lp-section-head">
          <span className="kicker">Green Insights</span>
          <h2 className="lp-h2">Latest in EV Sustainability</h2>
          <p style={{ maxWidth: 520, margin: "0 auto", color: "var(--muted)", fontSize: 16, lineHeight: 1.6 }}>
            Stay informed with the latest developments in EV battery technology, sustainability initiatives, and green automotive innovation.
          </p>
        </div>
        <div className="lp-news-grid">
          {[
            {
              img: "/img/ev-charging.png",
              tag: "Battery Technology",
              title: "EV Battery Lifespan: How Long Do They Really Last?",
              desc: "Modern EV batteries are designed to last 15–20 years, but real-world conditions vary. Transparent health data is key to extending usable life.",
              url: "https://www.energy.gov/eere/vehicles/articles/fotw-1272-january-9-2023-electric-vehicle-battery-pack-costs-2022-are",
            },
            {
              img: "/img/ev-solar-station.png",
              tag: "Renewable Energy",
              title: "Solar-Powered Charging: The Future of EV Infrastructure",
              desc: "Dealerships adopting solar charging stations reduce grid dependency and demonstrate commitment to UN SDG 7: Affordable & Clean Energy.",
              url: "https://www.iea.org/reports/global-ev-outlook-2024",
            },
            {
              img: "/img/green-innovation.png",
              tag: "Circular Economy",
              title: "Second-Life Batteries: From Cars to Grid Storage",
              desc: "Used EV batteries retain 70–80% capacity — enough for stationary energy storage, reducing e-waste and supporting SDG 12.",
              url: "https://www.weforum.org/stories/2024/02/how-second-life-ev-batteries-could-transform-the-energy-sector/",
            },
          ].map((article) => (
            <a key={article.title} href={article.url} target="_blank" rel="noopener noreferrer" className="lp-news-card">
              <img src={article.img} alt="" className="lp-news-img" />
              <div className="lp-news-body">
                <span className="lp-news-tag">{article.tag}</span>
                <h3>{article.title}</h3>
                <p>{article.desc}</p>
                <span className="lp-news-link">Read more <ArrowRight size={14} /></span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="lp-section lp-section-dark lp-cta-section">
        <Teedle size={56} />
        <h2 className="lp-h2" style={{ color: "#fff" }}>Ready to see it in action?</h2>
        <button className="btn primary" onClick={go}>
          Open the demo <ArrowRight size={16} />
        </button>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <LogoMark size={20} /> <span>VoltVault</span>
          </div>
          <p>Tek-Qubit Hackathon · Northline Motors · Synthetic inventory</p>
        </div>
      </footer>
    </div>
  );
}

function Login({
  sessionExpired,
  onSignedIn,
}: {
  sessionExpired?: boolean;
  onSignedIn: () => void;
}) {
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function pick(role: string) {
    setBusy(role);
    setError("");
    try {
      await api("/session", { role });
      qc.clear();
      onSignedIn();
      window.location.assign(from || "/work-queue");
    } catch (e) {
      setError(String(e));
      setBusy("");
    }
  }
  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <VoltVaultLogo size={44} />
          <h1 className="login-headline">VoltVault</h1>
          <p className="login-lead">EV battery evidence workspace</p>
          <HeroBattery />
          <Link className="btn outline" to="/" style={{ alignSelf: "flex-start", marginTop: 16 }}>
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-card-title">Select your role</h2>
          {sessionExpired && (
            <div className="error" role="status" style={{ marginBottom: 12 }}>
              Session expired — your draft is saved locally.
            </div>
          )}
          <div className="login-roles">
            {ROLES.map((r) => (
              <button key={r.role} className="login-role-btn" disabled={!!busy} onClick={() => pick(r.role)}>
                <div className="login-role-icon">
                  {React.createElement(r.icon, { size: 20 })}
                </div>
                <div className="login-role-info">
                  <strong>{r.title}</strong>
                </div>
                <div className="login-role-arrow">
                  {busy === r.role ? "Opening…" : <ArrowRight size={16} />}
                </div>
              </button>
            ))}
          </div>
          <ErrorBox error={error} />
        </div>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={qc}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>,
);
