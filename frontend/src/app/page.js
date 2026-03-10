import { LetsTalkForm } from "@/components/LetsTalkForm";
import { ExpandableCards } from "@/components/ExpandableCards";

export const metadata = {
  title: "Systemized Content for Medical Specialists",
  description:
    "Systemized Content. Humanized Medical Brands. An AI-powered platform for social, content, and web growth built for medical specialists.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef3ff_0%,_#f8fafc_48%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-6">
        <nav className="sticky top-4 z-50 flex items-center justify-between rounded-full border border-white/70 bg-white/85 px-6 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xl font-semibold tracking-tight text-[#fbb92a]">
            Lumena
          </p>

          <a
            href="#contact-form"
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Let&apos;s Talk
          </a>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-[108rem] px-4 pb-24 pt-8 md:px-6 md:pt-12">
        <main id="hero" className="scroll-mt-28 flex w-full flex-col gap-12 rounded-[2.75rem] bg-[#3768FF] p-7 md:p-11 lg:flex-row lg:items-stretch lg:gap-16 lg:p-14">
          <section className="lg:w-2/3 flex flex-col justify-center">
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-white md:text-6xl">
              Systemized Content. Humanized Medical Brands.
            </h1>
            <div className="mt-8 space-y-5 border-l-2 border-white/35 pl-5 md:pl-7">
              <p className="max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
                An AI-powered platform for social, content, and web growth
                &mdash; built for medical specialists.
              </p>
              <p className="max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
                Building a strong medical brand online shouldn&apos;t feel
                overwhelming.
              </p>
              <p className="max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
                We combine human strategy with systemized content to help
                medical specialists show up clearly, consistently, and
                confidently &mdash; without wasting time.
              </p>
            </div>
            <a href="#contact-form" className="w-fit mt-9 inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#3768FF] shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-100">
              Book a Strategy Meeting
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3768FF] text-white">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          </section>

          <section className="lg:w-1/3 w-full mt-8 lg:mt-0 flex flex-col">
            <div className="relative overflow-hidden w-full flex-1 min-h-[400px] lg:min-h-full rounded-[2.25rem] border border-white/80 shadow-[0_28px_90px_rgba(15,23,42,0.2)] ring-1 ring-white/50">
              <img
                src="/doctor1.jpg"
                alt="Medical specialist"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </section>
        </main>

        <div className="mt-8 flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
          <section id="portal" className="scroll-mt-28 flex w-full max-w-5xl flex-col gap-7 rounded-[2rem] bg-[#24427f] p-6 ring-1 ring-white/20 md:p-8 lg:flex-row lg:items-center lg:gap-10 lg:p-9">
            <div className="lg:w-[56%]">
              <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
                A client portal that keeps everything simple.
              </h2>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3 text-white/90 md:text-lg">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-cyan-100 ring-1 ring-white/25">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Approve content in minutes
                </li>
                <li className="flex items-start gap-3 text-white/90 md:text-lg">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-cyan-100 ring-1 ring-white/25">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 17V7m6 10V11m6 6V4m4 13H2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  See what&apos;s scheduled and what&apos;s coming
                </li>
                <li className="flex items-start gap-3 text-white/90 md:text-lg">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-cyan-100 ring-1 ring-white/25">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M7 17V9m5 8V5m5 12v-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </span>
                  Track performance and deliverables
                </li>
                <li className="flex items-start gap-3 text-white/90 md:text-lg">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-cyan-100 ring-1 ring-white/25">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </span>
                  Keep communication organized
                </li>
              </ul>
            </div>


          </section>

          <aside className="w-full rounded-[2rem] bg-[#eef4f8] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.12)] ring-1 ring-[#c8d5e3] md:p-8 lg:max-w-xl">
            <div className="rounded-3xl bg-white p-5 ring-1 ring-[#d3e0ff]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f569e]">
                Time-Saving Support
              </p>
              <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#17315f]">
                Save Time. Stay Focused on Your Patients.
              </h3>
            </div>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3 text-sm leading-relaxed text-[#2f4e84] md:text-base">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2f569e] text-white ring-1 ring-[#24427f]/20">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                We know your time is limited &mdash; and your focus belongs with your patients, not chasing trends or planning posts.
              </li>
              <li className="flex items-start gap-3 text-sm leading-relaxed text-[#2f4e84] md:text-base">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2f569e] text-white ring-1 ring-[#24427f]/20">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 17V7m6 10V11m6 6V4m4 13H2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Our team of human experts curates, plans, and builds your content strategy for you.
              </li>
              <li className="flex items-start gap-3 text-sm leading-relaxed text-[#2f4e84] md:text-base">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2f569e] text-white ring-1 ring-[#24427f]/20">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </span>
                We handle the thinking, the structure, and the execution &mdash; so all you need to do is review and approve.
              </li>
            </ul>

            <div className="mt-6 rounded-2xl bg-[#2f569e] px-4 py-3 text-sm font-medium text-white shadow-[0_10px_30px_rgba(36,66,127,0.28)] md:text-base">
              What once felt time-consuming now feels effortless.
            </div>
          </aside>
        </div>

        <section id="features" className="scroll-mt-28 mt-8 w-full rounded-[2.25rem] bg-[#f6f2e8] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] ring-1 ring-[#e4d8c2] md:p-9">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#3768FF]">
              What You Get
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-4xl">
              A clear framework to scale your medical brand online.
            </h3>
          </div>

          <ExpandableCards />
        </section>

        <section
          id="contact-form"
          className="mt-8 w-full scroll-mt-28 rounded-[2.25rem] bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] ring-1 ring-slate-200/80 md:p-9"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#3768FF]">
              Let&apos;s Talk
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Book a strategy meeting
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
              Share your details and we&apos;ll contact you to plan your next steps.
            </p>
          </div>

          <LetsTalkForm />
        </section>
      </div>
    </div>
  );
}
