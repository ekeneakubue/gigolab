import Link from "next/link";

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

const editions = [
  {
    name: "Base",
    desc: "Everything you need in a sample management solution for individual teams.",
  },
  {
    name: "Ascent",
    desc: "For multi-group organizations who need expanded features in security, roles, shipping, and requisitions.",
  },
  {
    name: "Summit",
    desc: "A multi-tenancy solution with organism-level hierarchy, group-assigned fields, and test results management.",
  },
  {
    name: "Pinnacle",
    desc: "A powerful, multi-group, study management solution with visit modeling, metrics, and more.",
  },
];

const stats = [
  { label: "Uptime", value: "99.9%" },
  { label: "Labs Served", value: "1,200+" },
  { label: "Samples Tracked", value: "50M+" },
  { label: "Years Experience", value: "25+" },
];

const testimonials = [
  {
    quote:
      "The real beauty of Gigolab is the inherent flexibility of the program. This is especially important when your accession procedures or underlying data requirements are subject to unanticipated change.",
    author: "Robert Hanner",
    title: "Former President of ISBER",
  },
  {
    quote:
      "Gigolab has been a lifesaver for us, and we absolutely could not function without it.",
    author: "Susan Arenson",
    title: "LIS Manager",
  },
  {
    quote:
      "Our IT department is very pleased with how easy it is to maintain and support. Considering we gave up an Oracle server-based application for Gigolab, they are thrilled.",
    author: "Susan Mason",
    title: "Lab Manager @ AFRIMS, Bangkok",
  },
];

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Services", href: "#services" },
  { label: "Industries", href: "#industries" },
  { label: "Resources", href: "#resources" },
  { label: "About", href: "#about" },
];

const footerColumns = [
  {
    heading: "Product",
    links: ["Gigolab", "Base", "Ascent", "Summit", "Pinnacle"],
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
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-zinc-900 select-none"
            >
              gigolab
            </Link>
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="#demo"
            className="bg-zinc-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Get a Demo
          </Link>
        </div>
      </header>

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
                href="#product"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                View editions →
              </Link>
            </div>
          </div>

          {/* Right — lab animation */}
          <div className="flex items-center justify-center h-full py-8">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* ── Four Editions ── */}
      <section id="product" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">
            Four editions, fully configurable.
          </h2>
          <p className="text-zinc-400 text-sm mb-12">
            Choose the plan that fits your lab&apos;s scale and workflow.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {editions.map((edition) => (
              <div
                key={edition.name}
                className="bg-white rounded-2xl p-7 shadow-md hover:shadow-xl transition-shadow duration-300 border border-zinc-100 flex flex-col"
              >
                <h3 className="text-lg font-bold text-zinc-900 mb-3">
                  {edition.name}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed flex-1 mb-7">
                  {edition.desc}
                </p>
                <Link
                  href="#"
                  className="text-sm font-semibold text-zinc-900 hover:underline underline-offset-4"
                >
                  Explore {edition.name} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Single Source of Truth ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-start">
          {/* Left column */}
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 mb-6 tracking-tight">
              The single-source of truth for your data.
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Gigolab is developed by people with real-lab experience.
            </p>
            <p className="text-zinc-600 leading-relaxed mb-4">
              The software is designed to save you time, maintain data
              integrity, and{" "}
              <strong className="text-zinc-900 font-semibold">
                keep you focused on research
              </strong>
              , not routine tasks.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              With over 25 years of experience, we ensure our products meet
              Good Practice standards, including 21 CFR part 11.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 shadow-sm"
                >
                  <p className="text-2xl font-bold text-zinc-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Testimonials */}
          <div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-8">
              What teams are saying about Gigolab
            </h3>
            <div className="flex flex-col gap-5">
              {testimonials.map((t) => (
                <blockquote
                  key={t.author}
                  className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <p className="text-zinc-600 text-sm leading-relaxed mb-5">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer>
                    <p className="text-sm font-semibold text-zinc-900">
                      — {t.author}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{t.title}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Find Your Edition CTA ── */}
      <section className="py-24 px-6 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-2">
              Find Your Edition
            </h2>
            <p className="text-zinc-400">Get started below.</p>
          </div>
          <Link
            href="#product"
            className="shrink-0 inline-flex items-center bg-white text-zinc-900 font-semibold px-7 py-3.5 rounded-lg hover:bg-zinc-100 transition-colors shadow-lg"
          >
            Learn more
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
