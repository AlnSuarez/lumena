import Link from "next/link";

export function LandingNavbar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <nav className="flex items-center justify-between rounded-full border border-white/70 bg-white/90 px-6 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/"
            className="mr-2 text-xl font-semibold tracking-tight text-[#fbb92a]"
          >
            Lumena
          </Link>
          <Link
            href="/"
            className="ml-6 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Home
          </Link>
          <Link
            href="/web"
            className="ml-3 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Web
          </Link>
        </div>

        <Link
          href="/#contact-form"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Let&apos;s Talk
        </Link>
      </nav>
    </div>
  );
}
