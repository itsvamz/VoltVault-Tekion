// Brand + theme assets: logo mark, mascot ("Teedle"), and SVG illustrations
// used by the landing and portal pages.
import { useId } from "react";

export function LogoMark({
  size = 26,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={"logo-mark " + className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Battery Timeline logo"
    >
      <path
        d="M12 2.5L2 8.3v7.4l10 5.8 10-5.8V8.3L12 2.5z"
        fill="url(#logo-trip)"
        stroke="url(#logo-trip)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.2v9.6M9.4 13h5.2"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 11h2.2a2.5 2.5 0 1 1 0 5h-2.2"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="logo-trip" x1="2" y1="2.5" x2="22" y2="20.5">
          <stop stopColor="#0A7F5E" />
          <stop offset="1" stopColor="#21C88C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// A tiny animated mascot: a green, slightly round creature "Teedle" holding a leaf.
export function Teedle({
  size = 44,
  animated = true,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const id = useId();
  const k = animated ? "-anim" : "";
  return (
    <svg
      className={"teedle " + className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Teedle mascot"
    >
      <defs>
        <linearGradient id={id + "m1"} x1="6" y1="2" x2="34" y2="38">
          <stop stopColor="#0F8A66" />
          <stop offset="1" stopColor="#2ED3A0" />
        </linearGradient>
        <linearGradient id={id + "m2"} x1="20" y1="0" x2="20" y2="40">
          <stop stopColor="#F4F7F3" />
          <stop offset="1" stopColor="#D9E2DA" />
        </linearGradient>
        <linearGradient id={id + "m3"} x1="10" y1="12" x2="30" y2="30">
          <stop stopColor="#1FA870" />
          <stop offset="1" stopColor="#4CE3B0" />
        </linearGradient>
      </defs>
      <path
        className="teedle-leaf"
        d="M26 20.4c4.6-.2 7.4-2.5 7.2-5.6-.6-2.5-3-4.5-6.6-5.1-2.7-.5-5.6.4-7.6 2l-.6-2.8c3.4-1.7 7-2 10.2-1.2C29.4 6.4 31 10 30 13.3c-.4 1.8-.6 3.6-.6 5.1"
        fill="none"
        stroke="#1A7F5A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className={`teedle-leaf-body${k}`}
        d="M34.4 26.6c0-1.3-.5-2.5-1.4-3.3L16.6 9.2c-.6-.5-1.6-.5-2.2 0L4.2 19.3c-.9.8-1.4 2-1.4 3.3 0 1.9 2.2 4.4 7.3 7.2a8.2 8.2 0 0 0 6 0c1.4-1.2 2.2-2.4 2.2-3.7v-.3z"
        fill="url(#m1)"
        stroke="#0A5F46"
        strokeWidth="1"
      />
      <circle
        cx="26.5"
        cy="28.2"
        r="4.8"
        fill="url(#m2)"
        stroke="#5BB39D"
        strokeWidth="1.5"
      />
      <circle cx="23" cy="26.5" r="1.6" fill="#173F36" />
      <circle cx="30.2" cy="26.2" r="1.6" fill="#173F36" />
      <path
        className="teedle-mouth"
        d="M23.8 30.6c.8.8 2.2.8 3 0"
        fill="none"
        stroke="#173F36"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        className={`teedle-glow${k}`}
        d="M25 12v14"
        stroke="url(#m3)"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        className={`teedle-buzz${k}`}
        d="M14 3.6l8 4-8 4"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Leaf silhouette (production vector used on green backgrounds).
export function Leaf({
  size = 26,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="Leaf"
    >
      <path
        d="M12 2c5 0 9 4 9 9s-4 9-9 9S3 14 3 9c0-5 4-9 9-9Z"
        opacity="0.3"
      />
      <path d="M12 3.5A7.5 7.5 0 1 0 12 19a7.5 7.5 0 0 0 0-15Z" />
    </svg>
  );
}

// Sun symbol for SDG greens.
export function Sun({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="Sun"
    >
      <circle
        cx="12"
        cy="12"
        r="5.5"
        fill="#FBF1CF"
        stroke="#E8B54F"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" fill="#FCF1B5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <line
          key={i}
          x1="12"
          y1="0.5"
          x2="12"
          y2="3.6"
          stroke="#E8B54F"
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${a} 12 12)`}
        />
      ))}
    </svg>
  );
}

// Paper stack used in the paperless section — stacks of paper with a leaf, drawn flat.
export function PaperStack({
  size = 52,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="Paper stack"
    >
      <defs>
        <linearGradient id="paper-grad" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#F5F0E6" />
          <stop offset="1" stopColor="#ECE4D4" />
        </linearGradient>
        <clipPath id="paper-cut">
          <path d="M6 5.5h28c4 0 6 3 6 7v22c0 2-2 4-6 4H6c-4 0-6-2-6-4V12.5c0-4 2-7 6-7Z" />
        </clipPath>
      </defs>
      <path
        className="paper-top"
        d="M6 5.5h28c4 0 6 3 6 7v22c0 2-2 4-6 4H6c-4 0-6-2-6-4V12.5c0-4 2-7 6-7Z"
        fill="url(#paper-grad)"
        stroke="#B4AB9F"
        strokeWidth="1.2"
      />
      <path
        d="M10 12h18M10 15h18M10 18h13"
        stroke="#5D5343"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M14 22.5 20.4 27.5 27.5 22.5"
        stroke="#1FA870"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ----- Theme illustration SVGs -----

// Battery charging station with motion flash (EV theme).
export function GreenServer({
  size = 34,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 7v7" />
      <path d="M16 9l-4 7-4-7" />
      <path d="M12 5a7 7 0 0 0 0-4" />
      <path d="M12 2v3" />
      <path d="M9 22v-3" />
      <circle cx="10" cy="12" r="2.6" />
    </svg>
  );
}

// Paper note with pencil (paperless deal jacket theme).
export function PaperNote({
  size = 34,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h7" />
      <path d="M8 12h6" />
      <path d="M8 16h5" />
      <path d="m18 17 2 2-6 6" />
    </svg>
  );
}

// Carbon flag (carbon tracking theme).
export function CarbonFlag({
  size = 34,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3v4l2 2-2 2V3zM5 5v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H7" />
      <path d="M4 9h8" />
      <path d="M12 9h7a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-4" />
    </svg>
  );
}

// Battery with lightning (EV/EV trade-in theme).
export function BatteryFlash({
  size = 34,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="7" width="16" height="11" rx="2.2" />
      <path d="M8 11.5 12 5l4 7" />
      <rect x="9" y="2" width="6" height="2.2" rx="1" />
      <path d="M11.5 16v1.5H13" strokeWidth="1.2" />
    </svg>
  );
}

// Winding road path (green delivery theme).
export function RouteIcon({
  size = 34,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3 9h14v3H3z" />
      <path d="m16 9 3 3-3 3" />
      <path d="M9 14a2 2 0 0 1-2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2" />
      <circle cx="18.5" cy="6" r="1.3" />
    </svg>
  );
}

// Interlocking parts (circular parts marketplace theme).
export function PartsIcon({
  size = 34,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8.5" cy="11.5" r="3.2" />
      <circle cx="15.5" cy="11.5" r="3.2" />
      <path d="M8.5 14.7v5.2" />
      <path d="M15.5 8.8v5.2" />
      <path d="M11.8 11.5h4.4" />
    </svg>
  );
}

// SDG sunburst: the classic SDG 17 "symbolic" mark in a small circle.
export function SdgCircle({
  size = 30,
  tone = "green",
}: {
  size?: number;
  tone?: string;
}) {
  const colors =
    tone === "green"
      ? { a: "#34D399", b: "#059669", c: "#14B8A6" }
      : tone === "blue"
        ? { a: "#38BDF8", b: "#2563EB", c: "#0EA5E9" }
        : { a: "#A855F7", b: "#6D28D9", c: "#8B5CF6" };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      role="img"
      aria-label="Sustainable Development Goals"
    >
      <circle
        cx="15"
        cy="15"
        r="13"
        fill="#fff"
        stroke="#DDD4C2"
        strokeWidth="1.2"
      />
      <path d="M15 2v13l9.7 5.6-2.3-8.5-7.4-5.1z" fill={colors.a} />
      <path d="M4.3 15H17.3L15.7 8.6z" fill={colors.b} />
      <circle cx="13" cy="19.5" r="1.8" fill={colors.c} />
    </svg>
  );
}
