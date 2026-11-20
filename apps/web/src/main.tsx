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
  attachment?: string;
  method?: string;
  reference_basis?: string;
  exclusion_reason?: string;
  amendment_reason?: string;
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
  readings: Reading[];
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
  warranty: string;
  dealer: string;
  as_of: string;
  generated_at: string;
  pack_context?: { start_date?: string; verification?: string };
  expires_on?: string;
  limitations: string;
};
const qc = new QueryClient();
async function api<T = any>(path: string, body?: unknown): Promise<T> {
  const r = await fetch("/api" + path, {
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
function Dashboard() {
  const q = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api<{ items: Vehicle[]; total: number }>("/vehicles"),
  });
  if (q.isPending) return <Loading />;
  const items = q.data?.items || [];
  const needing = items.filter(
    (v) => v.assessment.quality === "limited",
  ).length;
  const healthy = items.filter(
    (v) => v.assessment.interval && v.assessment.interval[1] >= 85,
  ).length;
  const midpoints = items.flatMap((v) =>
    v.assessment.interval
      ? [Math.round((v.assessment.interval[0] + v.assessment.interval[1]) / 2)]
      : [],
  );
  const avg = midpoints.length
    ? Math.round(midpoints.reduce((a, b) => a + b, 0) / midpoints.length)
    : 0;
  const stats = [
    { num: String(items.length), label: "EVs onboard", tone: "" },
    { num: String(healthy), label: "Healthy packs", tone: "" },
    { num: needing ? String(needing) : "—", label: "Needs review", tone: "" },
    { num: `${avg}%`, label: "Avg battery health", tone: "" },
  ];
  return (
    <div className="forest">
      <section
        style={{ background: "var(--forest)", color: "#fff" }}
        aria-label="Portal overview"
      >
        <div className="section">
          <div className="page-head">
            <span className="kicker">Portal · Northline Motors</span>
            <span className="display display-light">
              Your green readiness, in one glance.
            </span>
            <p style={{ color: "#fff7e4", fontSize: 19, maxWidth: 540 }}>
              Visible EV readiness for dealers: availability, supply health, and
              readiness posture at a glance.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "var(--s4)",
            }}
          >
            <Teedle size={52} />
          </div>
        </div>
      </section>
      <div className="section">
        <div className="bento" aria-label="Portal overview metrics">
          {stats.map((s) => (
            <div className="col stat-tile num-green" key={s.label}>
              <span className="num num-green" style={{ fontSize: "3.2rem" }}>
                {s.num}
              </span>
              <span className="label" style={{ marginTop: 8 }}>
                {s.label}
              </span>
              {s.num !== "—" && (
                <div className="bar" style={{ marginTop: 8 }}>
                  <div className="bar-fills" style={{ width: "100%" }}>
                    <div
                      className="bar-fill bar-fill-w"
                      style={{ width: s.num }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="section cta">
        <Link to="/work-queue" className="btn primary">
          <BatteryCharging size={17} /> Work queue
        </Link>
        <Link to="/vehicles" className="btn secondary">
          Inventory
        </Link>
      </div>
      <section className="section">
        <div className="page-head">
          <span className="kicker">Inventory</span>
          <span className="headline-sm">Vehicles in inventory</span>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Pack</th>
                <th>Estimated health</th>
                <th className="num">Last reading</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>
                      {v.year} {v.make} {v.model}
                    </strong>
                    <br />
                    <span className="body-small">
                      {v.stock} · {v.miles.toLocaleString()} mi
                    </span>
                  </td>
                  <td>
                    <span className="prod-chip">{v.pack}</span>
                  </td>
                  <td className="num">
                    {v.assessment.interval
                      ? `${v.assessment.interval[0]}–${v.assessment.interval[1]}%`
                      : "No evidence"}
                  </td>
                  <td className="num">
                    {v.assessment.last ? date(v.assessment.last.date) : "—"}
                  </td>
                  <td>
                    <Link to={"/vehicles/" + v.id} className="btn-minimal">
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  if (!session.data || sessionExpired)
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
  return (
    <div className="shell">
      <header className="hdr hdr-dark">
        <Link className="wordmark" to="/work-queue">
          <LogoMark size={30} />
          <span>Battery Timeline</span>
        </Link>
        <div className="hdr-right">
          <span
            style={{
              fontSize: 13,
              color: "#fff7e4",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Leaf size={16} />
            Northline Motors · {date(session.data.as_of)}
          </span>
          <button
            className="btn white-btn"
            style={{ minHeight: 38, padding: "0 16px", fontSize: 13 }}
            onClick={async () => {
              await api("/session/logout", {});
              qc.clear();
              location.assign("/");
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <nav className="nav-dock" aria-label="Main navigation">
        {[
          { p: "/work-queue", t: "Dashboard", Icon: BatteryCharging },
          { p: "/vehicles", t: "Vehicles", Icon: Car },
          { p: "/reports", t: "Reports", Icon: FileText },
          { p: "/settings/sources", t: "Sources", Icon: Settings },
        ].map(({ p, t, Icon }) => {
          const active =
            loc.pathname === p || (p === "/work-queue" && loc.pathname === "/");
          return (
            <Link
              key={p}
              className={active ? "active" : ""}
              to={p}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={16} />
              {t}
            </Link>
          );
        })}
      </nav>
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
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <LogoMark size={26} />
            <span>Battery Timeline</span>
          </div>
          <p className="footer-tagline">
            EV battery evidence, kept faithful from the service lane to the
            buyer report. Production concept — synthetic inventory.
          </p>
        </div>
        <div className="footer-bottom">
          <span>
            Portal · Northline Motors · Demo day {date(session.data.as_of)}
          </span>
          <Link
            className="btn-minimal"
            to="/work-queue"
            style={{ fontSize: 12 }}
          >
            Work queue
          </Link>
        </div>
      </footer>
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
    <>
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
    </>
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
  return (
    <>
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
        {role !== "sales" && (
          <Link className="button primary" to={"/service/" + id + "/capture"}>
            <Plus size={17} /> Add reading
          </Link>
        )}
      </div>
      <div className="detail-grid">
        <div>
          <section className="card summary">
            <div className="health-overview">
              <div className="summary-top">
                <span>Estimated battery health</span>
                <Badge tone={h.quality === "limited" ? "amber" : "teal"}>
                  {h.quality} evidence
                </Badge>
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
                <h2>Battery Timeline</h2>
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
    </>
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
      api<{ id: string; vehicle: string; ro: string; state: string }>(
        "/service-visits/" + id,
      ),
    enabled: role !== "sales",
  });
  const vehicleId = visit.data?.vehicle || id;
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
        SERVICE VISIT · {visit.data?.ro || "Loading visit…"}
      </div>
      <h1>Capture a battery reading</h1>
      <p>Review the source. Confirm the reading. Build the history.</p>
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
          <h2>Reading added to the Timeline</h2>
          <p>The assessment has been recalculated and saved.</p>
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
              {busy ? "Saving and assessing…" : "Confirm and add to Timeline"}
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
    <>
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
    </>
  );
}
function ReportBody({ p, token }: { p: Payload; token?: string }) {
  return (
    <article className="report-paper">
      <div className="report-brand">
        <BatteryCharging />
        <strong>BATTERY TIMELINE</strong>
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
    <>
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
    </>
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
    <>
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
    </>
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
function LandingHeader({ onSignIn }: { onSignIn: () => void }) {
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-nav">
        <div className="lp-brand">
          <span className="logo">
            <BatteryCharging size={20} />
          </span>
          <span>Battery Timeline</span>
        </div>
        <nav className="lp-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#features">Why it's different</a>
          <a href="#roles">Roles</a>
        </nav>
        <button className="primary" onClick={onSignIn}>
          Launch demo <ArrowRight size={16} />
        </button>
      </div>
    </header>
  );
}
function Landing({ sessionExpired }: { sessionExpired?: boolean }) {
  const nav = useNavigate();
  const go = () => nav("/login");
  const themePoints = [
    {
      id: "green",
      icon: GreenServer,
      title: "EV Readiness Advisor",
      desc: "Scores a dealership's availability, charging, technician and parts supply for EV sales.",
    },
    {
      id: "paper",
      icon: PaperNote,
      title: "Paperless Deal Jacket",
      desc: "E-contract adoption, savings from going paperless, and a leaderboard of incentives.",
    },
    {
      id: "carbon",
      icon: CarbonFlag,
      title: "Carbon Tracker",
      desc: "Visualizes emissions from facilities, loans and logistics with reduction recommendations.",
    },
    {
      id: "tradein",
      icon: BatteryFlash,
      title: "Trade-In Battery Estimator",
      desc: "Turns diagnostic + service history into a fairer, explainable trade-in battery estimate.",
    },
    {
      id: "delivery",
      icon: RouteIcon,
      title: "Green Delivery Optimizer",
      desc: "Optimizes routes for EV shuttles and delivery vehicles to cut emissions and fuel cost.",
    },
    {
      id: "parts",
      icon: PartsIcon,
      title: "Circular Parts Marketplace",
      desc: "Matches reconditioned or recyclable parts across the dealer network to cut repair costs.",
    },
  ];
  return (
    <div className="landing-page">
      <header className="hdr landing-nav">
        <Link className="wordmark" to="/">
          <LogoMark size={28} />
          <span>Battery Timeline</span>
        </Link>
        <nav className="lp-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#green">Green tech</a>
          <a href="#sdg">SDGs</a>
          <a href="#paper">Paperless</a>
          <a href="#theme">Theme coverage</a>
        </nav>
        <button className="btn primary" onClick={go}>
          Open demo <ArrowRight size={16} />
        </button>
      </header>
      {sessionExpired && (
        <div
          className="page-head"
          style={{
            background: "var(--red-light)",
            color: "var(--red)",
            textAlign: "center",
            padding: "10px 16px",
          }}
        >
          Your demo session expired — sign back in to continue.
        </div>
      )}
      {/* ---- Hero: forest, muted, big type ---- */}
      <section id="hero" className="hero-green">
        <div className="page-head">
          <span className="kicker">
            EV battery evidence — green readiness for dealers
          </span>
        </div>
        <h1
          style={{
            color: "#fff",
            fontSize: "clamp(52px, 9vw, 86px)",
            letterSpacing: "-2px",
            lineHeight: 1.03,
          }}
        >
          From the service lane, <br />
          to the <span style={{ color: "#2be3a1", fontWeight: 700 }}>
            sold
          </span>{" "}
          — visibly.
        </h1>
        <p
          style={{
            color: "#fff7e4",
            fontSize: 19,
            lineHeight: 1.7,
            maxWidth: 620,
            marginTop: 24,
          }}
        >
          Battery Timeline makes dealer readiness visible: every battery readout
          is sourced, every decision audited, and every buyer report carries the
          same truthful evidence — nothing typed twice.
        </p>
        <div className="cta">
          <button className="btn primary" onClick={go}>
            <BatteryCharging size={18} /> Open the live demo
            <ArrowRight size={16} />
          </button>
          <button
            className="btn white-btn"
            onClick={() =>
              document
                .getElementById("how")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            See how it works
          </button>
        </div>
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 40 }}
        >
          <Teedle size={64} />
        </div>
      </section>

      {/* ---- How it works: crisp, production ---- */}
      <section id="how" className="section">
        <div className="page-head">
          <span className="kicker">The handoff</span>
          <span className="headline-sm">
            One record. Four steps. No re-typing.
          </span>
          <p className="body-muted" style={{ maxWidth: 640 }}>
            The same vehicle record is written by the service lane and read by
            the appraisal desk.
          </p>
        </div>
        <div className="bento" aria-label="Workflow steps">
          {[
            {
              icon: Camera,
              title: "Capture at the lane",
              body: "One reading, typed or photo-reviewed, confirmed once.",
            },
            {
              icon: TrendingUp,
              title: "Timeline history",
              body: "Every reading becomes a dated, sourced observation.",
            },
            {
              icon: Gauge,
              title: "Turn evidence into an offer",
              body: "Transparent price breakdown, saved as an immutable decision.",
            },
            {
              icon: QrCode,
              title: "Hand the buyer the proof",
              body: "Privacy-safe report with masked VIN, QR, and PDF.",
            },
          ].map((s) => (
            <div className="card" key={s.title} style={{ flex: 1 }}>
              <span className="badge green" style={{ marginBottom: 12 }}>
                {React.createElement(s.icon, { size: 20 })} {s.title}
              </span>
              <p
                className="body-muted"
                style={{ fontSize: 14, lineHeight: 1.6 }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Green tech section: motion + green ---- */}
      <section id="green" className="section green-panel">
        <div className="page-head">
          <span className="kicker" style={{ color: "var(--green-ink)" }}>
            EV Readiness Advisor
          </span>
          <span className="headline-sm" style={{ color: "var(--green-ink)" }}>
            Green tech that scores itself.
          </span>
        </div>
        <div className="grid grid-2" style={{ marginTop: 48 }}>
          <div>
            <p className="body-muted">
              A dealership’s EV readiness, in one number: availability, charging
              capability, technician supply and parts availability.
            </p>
            <div className="cta">
              <button className="btn white-btn">
                Learn the readiness score
              </button>
            </div>
          </div>
          <GreenServer />
        </div>
      </section>

      {/* ---- SDG 4: Quality Education — visual centerpiece ---- */}
      <section
        id="sdg"
        className="section"
        style={{
          background:
            "linear-gradient(140deg, #0c1f1a 0%, #13532c 45%, #23d399 100%)",
          color: "#fff",
        }}
      >
        <div className="page-head">
          <span className="kicker" style={{ color: "#fff" }}>
            SDG 4 · Quality Education
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 24,
          }}
        >
          <Sun size={92} />
          <span
            className="display-light"
            style={{
              color: "#fff",
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            4
          </span>
        </div>
        <h2
          style={{
            color: "#fff",
            fontSize: 34,
            margin: "12px auto 0",
            maxWidth: 620,
            textAlign: "center",
            lineHeight: 1.25,
          }}
        >
          Ahead-of-the-curve training for EV technicians and managers.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--s3)",
            maxWidth: 900,
            margin: "var(--s5) auto 0",
            textAlign: "center",
          }}
        >
          {[
            {
              icon: BatteryFlash,
              title: "Certification upgrades",
              body: "Deliver technician certification upgrades in new EVs so the network adds skilled talent.",
            },
            {
              icon: Car,
              title: "Transition all staff",
              body: "Support every technician on EV platforms, from senior service staff to new hires.",
            },
            {
              icon: RouteIcon,
              title: "Pipeline to sold vehicles",
              body: "Build the pipeline that puts more EVs on the road — every certified technician, every EV sold.",
            },
          ].map((s) => (
            <div
              key={s.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "24px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
              }}
            >
              {React.createElement(s.icon as typeof Car, {
                size: 26,
                color: "#2be3a1",
              })}
              <h3 style={{ color: "#fff", fontSize: 18, margin: 0 }}>
                {s.title}
              </h3>
              <p
                style={{
                  color: "#fff7e4",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
        <div
          className="sdg-strip"
          style={{ marginTop: "var(--s4)", justifyContent: "center" }}
          aria-label="SDG 1 through 17 indicator strip"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(
            (n) => (
              <div className="sdg-item" key={n} aria-label={`SDG ${n}`}>
                <SdgCircle tone={n === 4 ? "green" : "forest"} size={44} />
                <div className="sdg-num">{n}</div>
              </div>
            ),
          )}
        </div>
      </section>

      {/* ---- Paperless section: motion paper ---- */}
      <section id="paper" className="section paper">
        <div className="page-head">
          <span className="kicker">
            Paperless Deal Jacket — from paper to pixels
          </span>
          <span className="headline-sm">Real savings, real impact.</span>
        </div>
        <div
          className="paper-stack"
          style={{ marginTop: 40, justifyContent: "flex-end" }}
        >
          <PaperStack size={52} />
          <div className="grid grid-2">
            <div>
              <p className="body-muted" style={{ color: "#4a433a" }}>
                When dealerships adopt e-contracts, every paper savings and
                checkmark compounds into dealer leadership — with incentives to
                drive adoption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Theme coverage section ---- */}
      <section id="theme" className="section">
        <div className="page-head">
          <span className="kicker">Theme coverage</span>
          <span className="headline-sm">
            Green tech, paperless, and EV readiness, covered.
          </span>
          <p className="body-muted" style={{ maxWidth: 640 }}>
            A production design, purpose-built for dealer sustainability and
            readiness.
          </p>
        </div>
        <div className="theme-grid" style={{ marginTop: 40 }}>
          {themePoints.map((t) => (
            <div className={t.id} key={t.id}>
              <div className="theme-icon" style={{ height: 40 }}>
                {React.createElement(t.icon as typeof Car, {
                  size: 22,
                  color:
                    t.id === "green"
                      ? "#fff"
                      : t.id === "paper"
                        ? "#4a433a"
                        : "var(--green-ink)",
                })}
              </div>
              <h3 className="theme-title">{t.title}</h3>
              <p className="theme-desc">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Footer ---- */}
      <div className="cta">
        <button className="btn primary" onClick={go} style={{ width: "auto" }}>
          Open the demo <ArrowRight size={18} />
        </button>
        <div
          className="footer-green"
          style={{
            width: "100%",
            marginTop: 64,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 32,
          }}
        >
          <div className="footer-grid">
            <div>
              <div className="footer-brand-wrap">
                <LogoMark size={28} />
                <span>Battery Timeline</span>
              </div>
              <p>
                Production concept · EV battery evidence, green tech, and
                paperless dealer readiness. Synthetic inventory.
              </p>
            </div>
            <div>
              <h4>How it works</h4>
              <a href="#how">Workflow steps</a>
              <a href="#green">Green tech</a>
              <a href="#sdg">SDGs</a>
              <a href="#paper">Paperless</a>
              <a href="#theme">Theme coverage</a>
            </div>
            <div>
              <h4>Follow</h4>
              <p>A Teedle-built portal, from the service lane to the sold.</p>
              <a href="/r/token" target="_blank">
                Buyer report
              </a>
            </div>
          </div>
          <div className="footer-row">
            <span>
              Battery Timeline · Independent Tek-Qubit concept · Northline
              Motors — Chicago, Illinois
            </span>
            <a
              href="#how"
              onClick={() =>
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get started
            </a>
          </div>
        </div>
      </div>
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
  const nav = useNavigate();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function pick(role: string) {
    setBusy(role);
    setError("");
    try {
      await api("/session", { role });
      await qc.cancelQueries();
      qc.clear();
      await qc.fetchQuery({
        queryKey: ["session"],
        queryFn: () => api("/session"),
      });
      onSignedIn();
      nav("/work-queue", { replace: true });
    } catch (e) {
      setError(String(e));
      setBusy("");
    }
  }
  return (
    <div className="login-page">
      <div className="hero">
        <div className="page-head">
          <span className="kicker">Northline Motors</span>
          <span
            className="display-light"
            style={{
              color: "#fff",
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Enter the EV
            <br /> sales studio.
          </span>
        </div>
        <p
          className="body-large"
          style={{ color: "#fff7e4", marginTop: "var(--s4)" }}
        >
          Choose your role to step into the workflow: capture battery evidence,
          review appraisals, and hand buyers trustworthy reports.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "var(--s5)",
          }}
        >
          <Link className="btn outline" to="/">
            Back to home
          </Link>
        </div>
      </div>
      <div className="login-panel">
        <h1 style={{ fontSize: 28, letterSpacing: -0.6, fontWeight: 700 }}>
          Choose your role
        </h1>
        <p
          style={{
            color: "#5b665e",
            fontSize: 14,
            marginTop: 8,
            marginBottom: "var(--s5)",
          }}
        >
          Access is validated on the server. Switch any time by signing out.
        </p>
        {sessionExpired && (
          <div
            style={{
              background: "var(--red-light)",
              color: "var(--red)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: "var(--s4)",
            }}
          >
            Your session expired. Sign in again — your unfinished capture is
            saved on this browser.
          </div>
        )}
        <div className="grid grid-2">
          {ROLES.map((r) => (
            <button
              key={r.role}
              className="login-panel-role"
              disabled={!!busy}
              onClick={() => pick(r.role)}
            >
              {React.createElement(r.icon as typeof Car, {
                size: 22,
                color: "var(--green-ink)",
              })}
              <div className="copy">
                <div className="role-title">{r.title}</div>
                <div className="role-desc">{r.blurb}</div>
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--forest-dark)",
                  flexShrink: 0,
                }}
              >
                {busy === r.role ? "Opening…" : <ArrowRight size={18} />}
              </span>
            </button>
          ))}
        </div>
        <ErrorBox error={error} />
      </div>
      <div className="login-page-footer">
        Battery Timeline · EV battery evidence · Synthetic inventory
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
