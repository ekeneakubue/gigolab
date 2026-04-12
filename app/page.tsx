import Link from "next/link";
import Navbar from "@/app/components/Navbar";

// ─── Flask path for hero animation (viewBox 0 0 480 500) ─────────────────────
const FLASK =
  "M 224,52 L 256,52 L 256,132 C 278,152 320,196 322,266 L 325,370 Q 325,388 240,388 Q 155,388 155,370 L 158,266 C 160,196 202,152 224,132 Z";

// DNA helix precomputed wave offsets (sin(i*0.92)*16, rounded)
const DNA_WAVES = [0, 13, 15, 6, -9, -16, -12];

function HeroAnimation() {
  return (
    <div className="relative w-full h-full min-h-[480px]" aria-hidden="true">
      <svg
        viewBox="0 0 480 500"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {/* ── Defs ──────────────────────────────────────────────────── */}
        <defs>
          {/* Flask clip */}
          <clipPath id="hfc">
            <path d={FLASK} />
          </clipPath>
          {/* Tube clip paths (local coords, centered at 0,0) */}
          <clipPath id="htc1">
            <path d="M -14,0 L 14,0 L 14,78 Q 14,96 0,96 Q -14,96 -14,78 Z" />
          </clipPath>
          <clipPath id="htc2">
            <path d="M -12,0 L 12,0 L 12,70 Q 12,86 0,86 Q -12,86 -12,70 Z" />
          </clipPath>
          <clipPath id="htc3">
            <path d="M -10,0 L 10,0 L 10,60 Q 10,74 0,74 Q -10,74 -10,60 Z" />
          </clipPath>
          {/* Glow filter */}
          <filter id="hgg" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hgc" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Background dot grid ────────────────────────────────────── */}
        {Array.from({ length: 7 }, (_, col) =>
          Array.from({ length: 9 }, (_, row) => (
            <circle
              key={`d${col}${row}`}
              cx={28 + col * 72}
              cy={28 + row * 57}
              r="1.2"
              fill="rgba(255,255,255,0.07)"
            />
          ))
        )}

        {/* ── Orbit ring + electron ──────────────────────────────────── */}
        <g transform="rotate(-18, 240, 200)">
          <ellipse
            cx="240"
            cy="200"
            rx="196"
            ry="70"
            fill="none"
            stroke="rgba(74,222,128,0.13)"
            strokeWidth="1.5"
            strokeDasharray="6 12"
          />
          {/* Orbiting electron — animateMotion along ellipse path */}
          <circle r="6" fill="#4ade80" filter="url(#hgg)">
            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              rotate="none"
              path="M 44,200 A 196,70 0 1 1 44.001,200"
            />
          </circle>
        </g>

        {/* ── Flask body fill ────────────────────────────────────────── */}
        <path d={FLASK} fill="rgba(74,222,128,0.03)" />

        {/* ── Liquid (clipped to flask) ─────────────────────────────── */}
        <rect
          x="155"
          y="280"
          width="170"
          height="108"
          fill="rgba(34,211,238,0.17)"
          clipPath="url(#hfc)"
        />

        {/* ── Liquid surface (animated wave) ───────────────────────── */}
        <ellipse
          cx="240"
          cy="278"
          rx="86"
          ry="12"
          fill="rgba(34,211,238,0.44)"
          clipPath="url(#hfc)"
        >
          <animate
            attributeName="rx"
            values="86;92;82;87;86"
            dur="3.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="ry"
            values="12;9;14;10;12"
            dur="3.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="278;275;280;276;278"
            dur="3.4s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* ── Bubbles (clipped to flask) ────────────────────────────── */}
        <g clipPath="url(#hfc)">
          {(
            [
              { cx: 190, cy: 368, r: 5,   dur: "2.8s", begin: "0s"   },
              { cx: 215, cy: 353, r: 3.5, dur: "2.3s", begin: "0.7s" },
              { cx: 242, cy: 375, r: 6,   dur: "3.1s", begin: "1.4s" },
              { cx: 268, cy: 358, r: 4,   dur: "2.6s", begin: "0.4s" },
              { cx: 293, cy: 370, r: 3,   dur: "2.4s", begin: "1.9s" },
              { cx: 228, cy: 382, r: 2.5, dur: "2.0s", begin: "2.6s" },
            ] as { cx: number; cy: number; r: number; dur: string; begin: string }[]
          ).map(({ cx, cy, r, dur, begin }, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="rgba(34,211,238,0.5)">
              <animate
                attributeName="cy"
                values={`${cy};${cy - 100};${cy - 100}`}
                dur={dur}
                repeatCount="indefinite"
                begin={begin}
              />
              <animate
                attributeName="opacity"
                values="0.65;0.3;0"
                dur={dur}
                repeatCount="indefinite"
                begin={begin}
              />
              <animate
                attributeName="r"
                values={`${r};${r * 0.55};${r * 0.3}`}
                dur={dur}
                repeatCount="indefinite"
                begin={begin}
              />
            </circle>
          ))}
        </g>

        {/* ── Flask outline (drawn over liquid) ────────────────────── */}
        <path
          d={FLASK}
          fill="none"
          stroke="#4ade80"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* ── Flask glow pulse ─────────────────────────────────────── */}
        <path d={FLASK} fill="none" stroke="rgba(74,222,128,0.25)" strokeWidth="9">
          <animate
            attributeName="strokeOpacity"
            values="0.12;0.4;0.12"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </path>

        {/* ── Neck stopper ─────────────────────────────────────────── */}
        <rect
          x="216"
          y="38"
          width="48"
          height="16"
          rx="5"
          fill="rgba(74,222,128,0.1)"
          stroke="#4ade80"
          strokeWidth="2"
        />

        {/* ── Measurement marks ────────────────────────────────────── */}
        {(
          [
            { y: 284, label: "250" },
            { y: 308, label: "200" },
            { y: 334, label: "150" },
            { y: 360, label: "100" },
          ] as { y: number; label: string }[]
        ).map(({ y, label }) => (
          <g key={label}>
            <line
              x1="152"
              y1={y}
              x2="170"
              y2={y}
              stroke="#4ade80"
              strokeWidth="1.2"
              opacity="0.38"
            />
            <text
              x="172"
              y={y + 4}
              fill="#4ade80"
              fontSize="9"
              opacity="0.32"
              fontFamily="monospace"
            >
              {label}
            </text>
          </g>
        ))}

        {/* ── Glass glint ──────────────────────────────────────────── */}
        <path
          d="M 253,136 C 262,160 272,200 274,264"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── Test Tube 1 — top-right, upright ─────────────────────── */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="380,50; 380,38; 380,50"
            dur="3.5s"
            repeatCount="indefinite"
            begin="0.5s"
          />
          <path
            d="M -14,0 L 14,0 L 14,78 Q 14,96 0,96 Q -14,96 -14,78 Z"
            fill="rgba(167,139,250,0.07)"
            stroke="#a78bfa"
            strokeWidth="1.8"
          />
          <rect
            x="-18"
            y="-9"
            width="36"
            height="12"
            rx="4"
            fill="rgba(167,139,250,0.1)"
            stroke="#a78bfa"
            strokeWidth="1.5"
          />
          <rect
            x="-12"
            y="64"
            width="24"
            height="32"
            fill="rgba(167,139,250,0.28)"
            clipPath="url(#htc1)"
          />
          <ellipse
            cx="0"
            cy="63"
            rx="12"
            ry="4"
            fill="rgba(167,139,250,0.44)"
            clipPath="url(#htc1)"
          />
          <circle cx="-4" cy="54" r="2.5" fill="rgba(167,139,250,0.5)">
            <animate
              attributeName="cy"
              values="54;18;18"
              dur="2s"
              repeatCount="indefinite"
              begin="0.3s"
            />
            <animate
              attributeName="opacity"
              values="0.6;0.2;0"
              dur="2s"
              repeatCount="indefinite"
              begin="0.3s"
            />
          </circle>
        </g>

        {/* ── Test Tube 2 — bottom-left, tilted 24° ────────────────── */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="62,375; 62,361; 62,375"
            dur="4.2s"
            repeatCount="indefinite"
            begin="1s"
          />
          <g transform="rotate(24)">
            <path
              d="M -12,0 L 12,0 L 12,70 Q 12,86 0,86 Q -12,86 -12,70 Z"
              fill="rgba(244,114,182,0.07)"
              stroke="#f472b6"
              strokeWidth="1.8"
            />
            <rect
              x="-16"
              y="-8"
              width="32"
              height="11"
              rx="3.5"
              fill="rgba(244,114,182,0.1)"
              stroke="#f472b6"
              strokeWidth="1.5"
            />
            <rect
              x="-10"
              y="54"
              width="20"
              height="32"
              fill="rgba(244,114,182,0.22)"
              clipPath="url(#htc2)"
            />
            <ellipse
              cx="0"
              cy="53"
              rx="10"
              ry="3.5"
              fill="rgba(244,114,182,0.38)"
              clipPath="url(#htc2)"
            />
          </g>
        </g>

        {/* ── Test Tube 3 — right side, small, tilted -18° ─────────── */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="420,265; 420,254; 420,265"
            dur="3.9s"
            repeatCount="indefinite"
            begin="2s"
          />
          <g transform="rotate(-18)">
            <path
              d="M -10,0 L 10,0 L 10,60 Q 10,74 0,74 Q -10,74 -10,60 Z"
              fill="rgba(251,191,36,0.07)"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            <rect
              x="-13"
              y="-7"
              width="26"
              height="10"
              rx="3"
              fill="rgba(251,191,36,0.1)"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            <rect
              x="-8"
              y="46"
              width="16"
              height="28"
              fill="rgba(251,191,36,0.22)"
              clipPath="url(#htc3)"
            />
            <ellipse
              cx="0"
              cy="45"
              rx="8"
              ry="3"
              fill="rgba(251,191,36,0.4)"
              clipPath="url(#htc3)"
            />
          </g>
        </g>

        {/* ── Molecule cluster — top-left ───────────────────────────── */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="48,82; 48,69; 48,82"
            dur="4s"
            repeatCount="indefinite"
            begin="0.8s"
          />
          {/* Bonds */}
          {(
            [
              [40, 42, 18, 18],
              [40, 42, 65, 18],
              [40, 42, 14, 63],
              [40, 42, 68, 61],
              [40, 42, 40, 72],
            ] as [number, number, number, number][]
          ).map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#fbbf24"
              strokeWidth="1.2"
              opacity="0.28"
            />
          ))}
          {/* Center atom */}
          <circle cx="40" cy="42" r="10" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.8">
            <animate attributeName="r" values="10;12.5;10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.15;0.32;0.15" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Satellite atoms */}
          {(
            [
              [18, 18, 5.5],
              [65, 18, 5.5],
              [14, 63, 4.5],
              [68, 61, 4.5],
              [40, 72, 4],
            ] as [number, number, number][]
          ).map(([cx, cy, r], i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="rgba(251,191,36,0.1)"
              stroke="#fbbf24"
              strokeWidth="1.3"
            />
          ))}
        </g>

        {/* ── DNA helix — bottom-right ──────────────────────────────── */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="395,292; 395,279; 395,292"
            dur="3.8s"
            repeatCount="indefinite"
            begin="1.5s"
          />
          {DNA_WAVES.map((wave, i) => {
            const y = i * 19;
            return (
              <g key={i}>
                <circle
                  cx={20 + wave} cy={y} r="4"
                  fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="1.3"
                />
                <circle
                  cx={20 - wave} cy={y} r="4"
                  fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="1.3"
                />
                <line
                  x1={20 + wave} y1={y} x2={20 - wave} y2={y}
                  stroke="rgba(34,211,238,0.22)" strokeWidth="1"
                />
              </g>
            );
          })}
        </g>

        {/* ── Scattered particles ───────────────────────────────────── */}
        {(
          [
            { cx: 28,  cy: 408, color: "#4ade80", dur: "2.2s", begin: "0s"   },
            { cx: 452, cy: 162, color: "#22d3ee", dur: "3.1s", begin: "0.5s" },
            { cx: 76,  cy: 458, color: "#a78bfa", dur: "2.7s", begin: "1.2s" },
            { cx: 456, cy: 422, color: "#4ade80", dur: "2.4s", begin: "0.8s" },
            { cx: 130, cy: 484, color: "#f472b6", dur: "3.3s", begin: "1.8s" },
            { cx: 418, cy: 482, color: "#fbbf24", dur: "2.9s", begin: "2.2s" },
            { cx: 40,  cy: 200, color: "#22d3ee", dur: "2.5s", begin: "0.3s" },
            { cx: 464, cy: 285, color: "#4ade80", dur: "2.8s", begin: "1.5s" },
            { cx: 358, cy: 18,  color: "#a78bfa", dur: "3.0s", begin: "0.9s" },
            { cx: 118, cy: 32,  color: "#fbbf24", dur: "2.6s", begin: "2.0s" },
          ] as { cx: number; cy: number; color: string; dur: string; begin: string }[]
        ).map(({ cx, cy, color, dur, begin }, i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill={color}>
            <animate
              attributeName="opacity"
              values="0.12;0.72;0.12"
              dur={dur}
              repeatCount="indefinite"
              begin={begin}
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}

/** Admin Dashboard — grouped into scannable feature cards */
const adminFeatureCards = [
  {
    title: "Registration & catalog",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
    items: [
      "Registration",
      "Managing tests",
      "Managing cultures & antibiotics",
      "Managing tests & cultures price list",
    ],
  },
  {
    title: "Patients, doctors & documents",
    accent: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-200/80",
    dot: "bg-violet-500",
    items: [
      "Referring doctors management",
      "Patient management",
      "Generating patient receipt",
      "Full management of patient test report",
      "Printing patient receipt & test report",
      "Print barcodes",
    ],
  },
  {
    title: "Home visits & notifications",
    accent: "from-sky-500/20 to-blue-500/10",
    border: "border-sky-200/80",
    dot: "bg-sky-500",
    items: [
      "Managing patient home visit requests",
      "Home visit schedule per day",
      "Notification system (messages & home visits)",
    ],
  },
  {
    title: "Team, roles & cloud",
    accent: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
    items: [
      "Contracts with discounts",
      "Multi-user with different roles",
      "Internal chat between lab employees",
      "Monitoring online users (cloud)",
    ],
  },
  {
    title: "Finance, settings & compliance",
    accent: "from-rose-500/20 to-pink-500/10",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
    items: [
      "Accounting: expenses, income, profits & inventory",
      "Laboratory configuration settings",
      "Database backup",
      "Supports RTL & LIS",
    ],
  },
];

const patientFeatureCards = [
  {
    title: "Patient portal",
    accent: "from-cyan-500/20 to-teal-500/10",
    border: "border-cyan-200/80",
    dot: "bg-cyan-500",
    items: [
      "Patient profile management",
      "View patient test reports & receipts",
      "Send patient home visit requests",
    ],
  },
  {
    title: "Outreach & standards",
    accent: "from-indigo-500/20 to-blue-500/10",
    border: "border-indigo-200/80",
    dot: "bg-indigo-500",
    items: [
      "Notify patients with codes & results (email & SMS)",
      "Supports RTL & LIS",
    ],
  },
  {
    title: "Learning & support",
    accent: "from-rose-500/20 to-pink-500/10",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
    items: ["Access training videos"],
  },
];

const stats = [
  { label: "Uptime", value: "99.9%" },
  { label: "Labs Served", value: "1,200+" },
  { label: "Samples Tracked", value: "50M+" },
  { label: "Years Experience", value: "25+" },
];

const statShowcaseThemes = [
  {
    bar: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/15",
    iconBg: "bg-emerald-500/12 text-emerald-700",
  },
  {
    bar: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/15",
    iconBg: "bg-violet-500/12 text-violet-700",
  },
  {
    bar: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/15",
    iconBg: "bg-sky-500/12 text-sky-700",
  },
  {
    bar: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/15",
    iconBg: "bg-amber-500/12 text-amber-800",
  },
];

const dataPillars = [
  {
    step: "01",
    title: "One connected workflow",
    desc: "Registration, tests, cultures, and billing live together—no siloed spreadsheets or duplicate entry.",
    accent:
      "border-emerald-200/80 bg-linear-to-br from-emerald-500/[0.06] to-transparent",
    stepRing: "bg-emerald-500 text-white shadow-emerald-500/25",
  },
  {
    step: "02",
    title: "Integrity by design",
    desc: "Structured records, clear audit trails, and controls that keep every change traceable.",
    accent:
      "border-violet-200/80 bg-linear-to-br from-violet-500/[0.06] to-transparent",
    stepRing: "bg-violet-600 text-white shadow-violet-500/25",
  },
  {
    step: "03",
    title: "Audit-ready compliance",
    desc: "Built with Good Practice in mind—including alignment with 21 CFR Part 11 expectations.",
    accent:
      "border-amber-200/80 bg-linear-to-br from-amber-500/[0.07] to-transparent",
    stepRing: "bg-amber-500 text-white shadow-amber-500/25",
  },
];

const testimonials = [
  {
    quote:
      "The real beauty of Gigolab is the inherent flexibility of the program. This is especially important when your accession procedures or underlying data requirements are subject to unanticipated change.",
    author: "Robert Hanner",
    title: "Former President of ISBER",
    theme: {
      bar: "from-emerald-400 via-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/10",
      avatar: "bg-emerald-500/15 text-emerald-800 ring-2 ring-emerald-500/25",
      quoteTint: "text-emerald-600/90",
    },
  },
  {
    quote:
      "Gigolab has been a lifesaver for us, and we absolutely could not function without it.",
    author: "Susan Arenson",
    title: "LIS Manager",
    theme: {
      bar: "from-violet-400 via-purple-500 to-fuchsia-600",
      glow: "shadow-violet-500/10",
      avatar: "bg-violet-500/15 text-violet-800 ring-2 ring-violet-500/25",
      quoteTint: "text-violet-600/90",
    },
  },
  {
    quote:
      "Our IT department is very pleased with how easy it is to maintain and support. Considering we gave up an Oracle server-based application for Gigolab, they are thrilled.",
    author: "Susan Mason",
    title: "Lab Manager @ AFRIMS, Bangkok",
    theme: {
      bar: "from-amber-400 via-orange-500 to-rose-500",
      glow: "shadow-amber-500/10",
      avatar: "bg-amber-500/15 text-amber-900 ring-2 ring-amber-500/25",
      quoteTint: "text-amber-700/90",
    },
  },
];

function authorInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Hub diagram for “single source of truth” section */
function SingleSourceVisual() {
  const nodes = [
    { x: 160, y: 42, w: 100, h: 36, label: "Samples", rx: 8 },
    { x: 270, y: 132, w: 100, h: 36, label: "Tests", rx: 8 },
    { x: 160, y: 222, w: 100, h: 36, label: "Reports", rx: 8 },
    { x: 50, y: 132, w: 100, h: 36, label: "LIS / RTL", rx: 8 },
  ] as const;
  return (
    <figure
      className="relative mx-auto w-full max-w-md lg:max-w-none"
      aria-hidden
    >
      <div className="absolute -inset-6 rounded-[2.25rem] bg-linear-to-br from-emerald-400/20 via-transparent to-violet-400/15 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white/95 p-6 shadow-2xl shadow-zinc-900/8 backdrop-blur-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-violet-400/10" />
        <svg
          viewBox="0 0 420 300"
          className="relative z-1 w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ssv-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          {nodes.map((n) => (
            <line
              key={n.label}
              x1={210}
              y1={150}
              x2={n.x + n.w / 2}
              y2={n.y + n.h / 2}
              stroke="url(#ssv-line)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.85"
            />
          ))}
          {nodes.map((n) => (
            <g key={n.label}>
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={n.rx}
                fill="#fafafa"
                stroke="#e4e4e7"
                strokeWidth="1.5"
              />
              <text
                x={n.x + n.w / 2}
                y={n.y + n.h / 2 + 5}
                textAnchor="middle"
                className="fill-zinc-700 text-[11px] font-semibold"
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
              >
                {n.label}
              </text>
            </g>
          ))}
          <circle cx="210" cy="150" r="52" fill="#ecfdf5" stroke="#10b981" strokeWidth="2.5" />
          <circle cx="210" cy="150" r="38" fill="#10b981" fillOpacity="0.12" />
          <text
            x="210"
            y="148"
            textAnchor="middle"
            className="fill-zinc-900 text-[13px] font-bold"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            Gigolab
          </text>
          <text
            x="210"
            y="166"
            textAnchor="middle"
            className="fill-zinc-500 text-[9px] font-medium uppercase tracking-wider"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            single record
          </text>
        </svg>
        <figcaption className="relative z-1 mt-4 text-center text-xs text-zinc-500">
          Every touchpoint routes through one authoritative system.
        </figcaption>
      </div>
    </figure>
  );
}

const footerColumns = [
  {
    heading: "Features",
    links: ["Admin dashboard", "Patient portal", "Notifications", "Accounting"],
  },
  {
    heading: "Services",
    links: ["IQ/OQ Validation", "Environment Testing", "On-Site Assistance", "Customization"],
  },
  {
    heading: "Resources",
    links: ["Case Studies", "Blog", "Events", "Support FAQs", "Downloads"],
  },
  {
    heading: "Company",
    links: ["Who We Are", "Careers", "Contact Us", "Privacy Policy"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar activePath="/" />

      {/* ── Hero ── */}
      <section className="bg-zinc-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 gap-0 items-center min-h-[600px]">
          {/* Left — text */}
          <div className="py-24 lg:py-32">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-5">
              Lab Management Platform
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.1] max-w-xl mb-6 tracking-tight">
              Sample management software built from real lab experience.
            </h1>
            <p className="text-zinc-300 text-lg max-w-md mb-10 leading-relaxed">
              Gigolab is crafted by professionals with hands-on lab experience
              since 1998. Trusted by research teams worldwide.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="#demo"
                className="inline-flex items-center gap-2 bg-white text-zinc-900 font-semibold px-7 py-3.5 rounded-lg hover:bg-zinc-100 transition-colors shadow-lg"
              >
                Get a Demo
              </Link>
              <Link
                href="#features"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Explore features →
              </Link>
            </div>
          </div>

          {/* Right — lab animation */}
          <div className="flex items-center justify-center h-full py-8">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* ── Features (full viewport) ── */}
      <section
        id="features"
        className="min-h-dvh flex flex-col bg-linear-to-b from-zinc-100 via-white to-zinc-50 px-6 py-12 md:py-16"
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
          <header className="shrink-0 mb-8 md:mb-10 text-center md:text-left">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.2em] mb-3">
              Gigolab software
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-3">
              Features
            </h2>
            <p className="text-zinc-500 text-base max-w-2xl">
              Everything your lab and patients need — from registration and
              cultures to home visits, accounting, and secure patient access.
            </p>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 -mr-1 [scrollbar-gutter:stable]">
            {/* Admin Dashboard */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white text-sm font-bold shadow-md">
                  A
                </span>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">
                    Admin dashboard
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Full control for lab staff and administrators
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {adminFeatureCards.map((card) => (
                  <article
                    key={card.title}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-xl border ${card.border} bg-white shadow-sm hover:shadow-md transition-shadow duration-300`}
                  >
                    {/* Accent bar */}
                    <div className={`h-1 w-full bg-linear-to-r ${card.dot.replace("bg-", "from-").replace("-500", "-400")} to-transparent`} aria-hidden />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${card.dot}`} aria-hidden />
                        <h4 className="text-base font-semibold text-zinc-800">
                          {card.title}
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {card.items.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm text-zinc-600 leading-relaxed"
                          >
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-400" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Patient Dashboard */}
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 text-zinc-800 text-sm font-bold shadow-sm">
                  P
                </span>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">
                    Patient dashboard
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Self-service for patients and guardians
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
                {patientFeatureCards.map((card) => (
                  <article
                    key={card.title}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-xl border ${card.border} bg-white shadow-sm hover:shadow-md transition-shadow duration-300`}
                  >
                    {/* Accent bar */}
                    <div className={`h-1 w-full bg-linear-to-r ${card.dot.replace("bg-", "from-").replace("-500", "-400")} to-transparent`} aria-hidden />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${card.dot}`} aria-hidden />
                        <h4 className="text-base font-semibold text-zinc-800">
                          {card.title}
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {card.items.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm text-zinc-600 leading-relaxed"
                          >
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-400" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Single Source of Truth ── */}
      <section
        id="data"
        className="relative py-24 md:py-32 px-6 overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-zinc-100 via-white to-zinc-50" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.08), transparent 45%), radial-gradient(circle at 85% 60%, rgba(139,92,246,0.07), transparent 40%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,rgba(24,24,27,0.06)_1px,transparent_0)] bg-size-[20px_20px]"
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center mb-16 md:mb-20">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.22em] mb-4">
                Unified data
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-zinc-900 tracking-tight leading-[1.12] mb-6">
                The single-source of truth for your data.
              </h2>
              <div className="space-y-4 text-zinc-600 text-base md:text-[17px] leading-relaxed max-w-xl">
                <p>
                  Gigolab is developed by people with{" "}
                  <span className="text-zinc-900 font-medium">
                    real-lab experience
                  </span>
                  —so the product matches how diagnostics teams actually work.
                </p>
                <p>
                  The software is designed to save you time, maintain data
                  integrity, and{" "}
                  <strong className="text-zinc-900 font-semibold">
                    keep you focused on research
                  </strong>
                  , not routine tasks.
                </p>
                <p>
                  With over{" "}
                  <span className="text-zinc-900 font-semibold">25 years</span>{" "}
                  of experience, we ensure our products meet Good Practice
                  standards, including{" "}
                  <span className="text-zinc-900 font-semibold">
                    21 CFR Part 11
                  </span>
                  .
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  "21 CFR Part 11",
                  "Good Practice",
                  "Data integrity",
                  "25+ years",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-zinc-200/90 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <SingleSourceVisual />
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-14 md:mb-16">
            {dataPillars.map((p) => (
              <article
                key={p.step}
                className={`group relative rounded-2xl border p-6 md:p-7 shadow-md hover:shadow-xl transition-shadow duration-300 ${p.accent}`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-lg ${p.stepRing}`}
                  >
                    {p.step}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">
                      {p.title}
                    </h3>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {stats.map((stat, i) => {
              const th = statShowcaseThemes[i % statShowcaseThemes.length];
              return (
                <div
                  key={stat.label}
                  className={`relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-lg ${th.glow} transition-transform duration-300 hover:-translate-y-0.5`}
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${th.bar}`}
                    aria-hidden
                  />
                  <div
                    className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${th.iconBg}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials (full viewport) ── */}
      <section
        id="testimonials"
        className="min-h-dvh flex flex-col bg-linear-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-6 py-14 md:py-20 relative overflow-hidden"
      >
        {/* Ambient orbs */}
        <div
          className="pointer-events-none absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-1/4 -right-32 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-size-[24px_24px]"
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center min-h-0">
          <header className="text-center mb-12 md:mb-16 shrink-0">
            <p className="text-xs font-semibold text-emerald-400/90 uppercase tracking-[0.25em] mb-4">
              Voices from the lab
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto leading-tight">
              What teams are saying about Gigolab
            </h2>
            <p className="text-zinc-400 mt-4 text-base md:text-lg max-w-xl mx-auto">
              Real feedback from research leaders and lab operations who rely on
              Gigolab every day.
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {testimonials.map((t) => (
              <blockquote
                key={t.author}
                className={`group relative flex flex-col rounded-3xl bg-zinc-900/70 backdrop-blur-md border border-zinc-700/60 p-8 pt-10 shadow-xl ${t.theme.glow} hover:border-zinc-600 hover:bg-zinc-900/85 transition-all duration-300`}
              >
                {/* Gradient accent bar */}
                <div
                  className={`absolute top-0 left-6 right-6 h-1 rounded-full bg-linear-to-r ${t.theme.bar} opacity-90`}
                  aria-hidden
                />
                {/* Decorative quote */}
                <span
                  className={`font-serif text-7xl leading-none ${t.theme.quoteTint} opacity-40 select-none mb-2`}
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p className="text-zinc-300 text-[15px] leading-relaxed flex-1 mb-8">
                  {t.quote}
                </p>
                <footer className="flex items-center gap-4 pt-6 border-t border-zinc-700/50">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${t.theme.avatar}`}
                    aria-hidden
                  >
                    {authorInitials(t.author)}
                  </div>
                  <div>
                    <cite className="not-italic text-sm font-semibold text-white block">
                      {t.author}
                    </cite>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                      {t.title}
                    </p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features CTA ── */}
      <section className="py-24 px-6 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-2">
              See every feature
            </h2>
            <p className="text-zinc-400">
              Admin and patient dashboards in one platform.
            </p>
          </div>
          <Link
            href="#features"
            className="shrink-0 inline-flex items-center bg-white text-zinc-900 font-semibold px-7 py-3.5 rounded-lg hover:bg-zinc-100 transition-colors shadow-lg"
          >
            View features
          </Link>
        </div>
      </section>

      {/* ── Events ── */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-12 border border-zinc-100 shadow-md text-center">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.2em] mb-4">
              Events & Conferences
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-4">
              Thanks to everyone who joined us for{" "}
              <span className="text-zinc-500">GigoConf 2025</span>!
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
              We host and attend several events, trainings, and conferences
              every year. To see how you can connect with us in person, check
              out our events page by clicking the button below.
            </p>
            <Link
              href="#"
              className="inline-flex items-center bg-zinc-900 text-white font-semibold px-7 py-3.5 rounded-lg hover:bg-zinc-700 transition-colors shadow-md"
            >
              View All Events
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-zinc-900 text-zinc-400 pt-16 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <p className="text-white text-lg font-bold mb-3">gigolab</p>
              <p className="text-sm leading-relaxed">
                123 Lab Street, Suite 100
                <br />
                San Francisco, CA 94107
              </p>
              <p className="text-sm mt-3">Phone | Email Sales | Email Support</p>
            </div>
            {/* Columns */}
            {footerColumns.map((col) => (
              <div key={col.heading}>
                <p className="text-zinc-200 font-semibold text-sm mb-4">
                  {col.heading}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2026 Gigolab. All rights reserved.</p>
            <p className="text-zinc-500">
              Customer Care Program · Careers · Privacy Policy
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
