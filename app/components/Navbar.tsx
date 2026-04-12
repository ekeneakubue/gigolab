import Link from "next/link";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Services", href: "/#services" },
  { label: "Industries", href: "/#industries" },
  { label: "Resources", href: "/#resources" },
  { label: "About", href: "/#about" },
];

export default function Navbar({ activePath = "/" }: { activePath?: string }) {
  return (
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
                className={`text-sm font-medium transition-colors ${
                  activePath === link.href
                    ? "text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link
          href="/#demo"
          className="bg-zinc-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors shadow-sm"
        >
          Get a Demo
        </Link>
      </div>
    </header>
  );
}
