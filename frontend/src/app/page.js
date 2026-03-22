import { ContactFormModal } from "@/components/ContactFormModal";
import { ExpandableCards } from "@/components/ExpandableCards";
import { LandingNavbar } from "@/components/LandingNavbar";

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
    <div id="home-page" className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef3ff_0%,_#f8fafc_48%,_#f8fafc_100%)] text-slate-900">
      <div id="landing-navbar">
        <LandingNavbar />
      </div>

      <div id="home-content" className="mx-auto w-full max-w-[108rem] px-4 pb-24 pt-32 md:px-6 md:pt-36">
        <main id="hero" className="scroll-mt-28 flex w-full flex-col gap-12 rounded-[2.75rem] bg-[#334a74] p-7 md:min-h-[680px] md:p-11 lg:min-h-[760px] lg:flex-row lg:items-stretch lg:gap-16 lg:p-14">
          <section id="hero-content" className="lg:w-2/3 flex flex-col justify-center">
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-white md:text-6xl">
              Smarter Content. Stronger Medical Brands.
            </h1>
            <div className="mt-8 space-y-5 border-l-2 border-white/35 pl-5 md:pl-7">
              <p className="max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
                AI tools and a specialized team helping medical practices build
                a clear, consistent digital presence.
              </p>
              <p className="max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
                We handle strategy, production, and publishing, so you can stay
                focused on your patients.
              </p>
            </div>
            <ContactFormModal />
          </section>

          <section id="hero-media" className="lg:w-1/3 w-full mt-8 lg:mt-0 flex flex-col">
            <div id="hero-media-card" className="relative overflow-hidden w-full flex-1 min-h-[400px] lg:min-h-full rounded-[2.25rem] border border-white/80 shadow-[0_28px_90px_rgba(15,23,42,0.2)] ring-1 ring-white/50">
              <img
                src="/doctor1.jpg"
                alt="Medical specialist"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </section>
        </main>

        <section id="features" className="scroll-mt-28 mt-8 w-full rounded-[2.25rem] bg-[#f6f2e8] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] ring-1 ring-[#e4d8c2] md:p-9">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#3768FF]">
              What You Get
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-4xl">
              A practical system to grow your medical brand online.
            </h3>
          </div>

          <ExpandableCards />
        </section>

        <div id="home-mid-row" className="mt-8 flex w-full flex-col gap-6 lg:h-[560px] lg:flex-row lg:items-stretch lg:[&>*]:h-full">
          <aside id="why-lumena" className="w-full rounded-[2rem] bg-[#eef4f8] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.12)] ring-1 ring-[#c8d5e3] md:p-8 lg:flex lg:h-full lg:flex-[1.35]">
            <div id="why-lumena-card" className="rounded-3xl bg-white p-6 ring-1 ring-[#d3e0ff] md:p-7 lg:grid lg:h-full lg:grid-cols-2 lg:items-center lg:gap-8">
              <div id="why-lumena-content">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2f569e]">
                  Why LUMENA
                </p>
                <h3 className="mt-2 text-2xl font-semibold leading-[1.04] tracking-tight text-[#17315f] md:text-3xl">
                  Your medical brand needs a reliable content system.
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[#2f4e84] md:text-lg">
                  We simplify strategy, production, and publishing so your team
                  saves time and your expertise stays visible.
                </p>
              </div>

              <div id="why-lumena-media" className="mt-6 overflow-hidden lg:mt-0">
                <img
                  src="/doctorFeed.png"
                  alt="Doctor feed preview"
                  className="h-64 w-full object-contain object-center md:h-[320px] lg:h-[380px]"
                />
              </div>
            </div>
          </aside>

          <section id="portal" className="scroll-mt-28 flex w-full flex-col gap-7 rounded-[2rem] bg-[#d6e5fb] p-6 ring-1 ring-[#b9d0f2] md:p-8 lg:h-full lg:flex-1 lg:gap-8 lg:p-9">
            <div id="portal-content" className="h-full w-full">
              <ul id="portal-cards" className="grid grid-cols-1 gap-5 lg:h-full">
                <li id="portal-card-focus" className="flex min-h-[145px] flex-col rounded-3xl border border-[#b8d2f5] bg-[#e5f0ff] p-3.5 text-[#111827] shadow-[0_12px_24px_rgba(30,55,102,0.12)] backdrop-blur-sm transition hover:-translate-y-1 hover:bg-[#eff6ff] hover:shadow-[0_18px_34px_rgba(30,55,102,0.18)] md:p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#bed2f1] bg-[#4a72b5] text-[#edf5ff] shadow-[0_8px_20px_rgba(45,74,129,0.35)]">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.9" />
                        <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.9" />
                        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                      </svg>
                    </span>
                    <h3 className="text-lg font-semibold leading-tight tracking-tight text-black md:text-xl">
                      Focus
                    </h3>
                  </div>
                  <p className="mt-3 max-w-[36ch] text-sm leading-[1.55] text-black/80 md:text-base">
                    We remove the complexity so you can focus on patients.
                  </p>
                </li>
                <li id="portal-card-authority" className="flex min-h-[145px] flex-col rounded-3xl border border-[#bdd5f6] bg-[#e9f2ff] p-3.5 text-[#111827] shadow-[0_12px_24px_rgba(30,55,102,0.12)] backdrop-blur-sm transition hover:-translate-y-1 hover:bg-[#f2f8ff] hover:shadow-[0_18px_34px_rgba(30,55,102,0.18)] md:p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#bed2f1] bg-[#4a72b5] text-[#edf5ff] shadow-[0_8px_20px_rgba(45,74,129,0.35)]">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 3.8 14.1 8l4.6.7-3.3 3.3.8 4.6-4.2-2.2-4.2 2.2.8-4.6L5.3 8.7 9.9 8 12 3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                        <path d="M9.7 20h4.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                      </svg>
                    </span>
                    <h3 className="text-lg font-semibold leading-tight tracking-tight text-black md:text-xl">
                      Authority
                    </h3>
                  </div>
                  <p className="mt-3 max-w-[36ch] text-sm leading-[1.55] text-black/80 md:text-base">
                    Your expertise deserves a clear voice online.
                  </p>
                </li>
                <li id="portal-card-understanding" className="flex min-h-[145px] flex-col rounded-3xl border border-[#c2d8f7] bg-[#ecf4ff] p-3.5 text-[#111827] shadow-[0_12px_24px_rgba(30,55,102,0.12)] backdrop-blur-sm transition hover:-translate-y-1 hover:bg-[#f4f9ff] hover:shadow-[0_18px_34px_rgba(30,55,102,0.18)] md:p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#bed2f1] bg-[#4a72b5] text-[#edf5ff] shadow-[0_8px_20px_rgba(45,74,129,0.35)]">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.9" />
                        <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                        <path d="M8.8 11h4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                      </svg>
                    </span>
                    <h3 className="text-lg font-semibold leading-tight tracking-tight text-black md:text-xl">
                      Understanding
                    </h3>
                  </div>
                  <p className="mt-3 max-w-[36ch] text-sm leading-[1.55] text-black/80 md:text-base">
                    We understand how medical reputation is built.
                  </p>
                </li>
              </ul>
            </div>
          </section>
        </div>


      </div>
    </div>
  );
}
