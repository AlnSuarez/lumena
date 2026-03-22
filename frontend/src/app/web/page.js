import { LandingNavbar } from "@/components/LandingNavbar";
import { WebDeliverablesCarousel } from "@/components/WebDeliverablesCarousel";
import { WebUnifiedSystemSection } from "@/components/WebUnifiedSystemSection";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Web",
  description: "Web services for medical specialists.",
  alternates: {
    canonical: "/web",
  },
};

export default function WebPage() {
  return (
    <div id="web-page" className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef3ff_0%,_#f8fafc_48%,_#f8fafc_100%)] text-slate-900">
      <div id="web-navbar">
        <LandingNavbar />
      </div>

      <main id="web-main" className="mx-auto w-full max-w-[108rem] px-4 pb-24 pt-32 md:px-6 md:pt-36">
        <section id="web-hero" className="rounded-[2.5rem] border border-white/45 bg-[#3768FF] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.2)] md:p-12 lg:p-14">
          <div id="web-hero-layout" className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-14">
            <div id="web-hero-content" className="lg:w-3/5">
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-white/85">
                Web Services
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-tight text-white md:text-6xl">
                Modern websites for medical practices
              </h1>

              <div className="mt-8 max-w-3xl space-y-5">
                <p className="text-lg leading-relaxed text-white/90 md:text-xl">
                  Your digital presence goes beyond social media.
                </p>
                <p className="text-lg leading-relaxed text-white/90 md:text-xl">
                  We build clean, conversion-focused websites that reinforce
                  credibility and turn visitors into patients.
                </p>
              </div>

              <Link
                href="/#contact-form"
                className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#3768FF] shadow-[0_12px_30px_rgba(23,49,95,0.3)] transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Discuss Your Website
              </Link>
            </div>

            <div id="web-hero-media" className="lg:flex lg:w-2/5">
              <div id="web-hero-media-card" className="relative mx-auto min-h-[460px] w-full max-w-[900px] overflow-hidden rounded-[2rem] md:min-h-[640px] lg:h-full lg:min-h-0">
                <Image
                  src="/doctor2image.png"
                  alt="Medical website analytics illustration"
                  fill
                  className="object-cover object-top [filter:contrast(1.05)_saturate(1.04)_drop-shadow(0_18px_28px_rgba(15,23,42,0.22))]"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="web-foundation" className="mt-8 rounded-[2.25rem] border border-[#d4e0f5] bg-gradient-to-b from-white to-[#f7faff] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4b6aa6]">
            Foundation
          </p>
          <h2 className="mt-2 text-3xl font-semibold leading-[1.04] tracking-tight text-[#17315f] md:text-5xl">
            Why Doctors Need Better Websites
          </h2>

          <div id="web-foundation-layout" className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div id="web-foundation-cards" className="grid grid-cols-1 gap-5 lg:w-1/2">
              <article id="web-foundation-credibility" className="rounded-3xl border border-[#b7ceff] bg-[#dbe8ff] p-6 shadow-[0_12px_35px_rgba(15,23,42,0.07)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3768FF] text-sm font-black text-white">
                    01
                  </span>
                  <svg className="h-6 w-6 text-[#3768FF]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 10.5L12 4l8 6.5v9.5H4v-9.5Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#24427f]">
                  Credibility
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#2f4e84] md:text-lg">
                  Website quality shapes trust in seconds.
                </p>
              </article>

              <article id="web-foundation-clarity" className="rounded-3xl border border-[#b9d4ff] bg-[#e3efff] p-6 shadow-[0_12px_35px_rgba(15,23,42,0.07)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3768FF] text-sm font-black text-white">
                    02
                  </span>
                  <svg className="h-6 w-6 text-[#3768FF]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7h16M4 12h12M4 17h8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#24427f]">
                  Clarity
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#2f4e84] md:text-lg">
                  Patients should quickly understand what you do.
                </p>
              </article>

              <article id="web-foundation-conversion" className="rounded-3xl border border-[#aac7ff] bg-[#d3e4ff] p-6 shadow-[0_12px_35px_rgba(15,23,42,0.07)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3768FF] text-sm font-black text-white">
                    03
                  </span>
                  <svg className="h-6 w-6 text-[#3768FF]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#24427f]">
                  Conversion
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#2f4e84] md:text-lg">
                  Booking a consultation should be simple and clear.
                </p>
              </article>
            </div>

            <div id="web-foundation-media" className="relative overflow-hidden rounded-3xl border border-[#dbe5f7] bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.07)] lg:w-1/2">
              <div className="relative min-h-[360px] w-full md:min-h-[500px] lg:h-full lg:min-h-0">
                <Image
                  src="/webwireframe.png"
                  alt="Website wireframe preview"
                  fill
                  className="object-contain object-center"
                />
              </div>
            </div>
          </div>
        </section>

        <div id="web-unified-section-wrapper">
          <WebUnifiedSystemSection />
        </div>

        <section id="web-deliverables" className="mt-8 rounded-[2.25rem] border border-[#d4e0f5] bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4b6aa6]">
            Deliverables
          </p>
          <h2 className="mt-2 text-3xl font-semibold leading-[1.04] tracking-tight text-[#17315f] md:text-5xl">
            What We Build
          </h2>

          <WebDeliverablesCarousel />
        </section>
      </main>
    </div>
  );
}
