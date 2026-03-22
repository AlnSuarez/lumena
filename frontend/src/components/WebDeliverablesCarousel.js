"use client";

import { useEffect, useRef, useState } from "react";

const deliverables = [
  { id: "web-deliverable-clinic-websites", label: "clinic websites" },
  { id: "web-deliverable-doctor-brand-sites", label: "personal brand websites for doctors" },
  { id: "web-deliverable-landing-pages", label: "procedure landing pages" },
  { id: "web-deliverable-education-pages", label: "educational content pages" },
  { id: "web-deliverable-seo-structure", label: "SEO-ready website structures" },
];

function getCardsPerView() {
  if (typeof window === "undefined") return 1;
  if (window.innerWidth >= 1280) return 3;
  if (window.innerWidth >= 768) return 2;
  return 1;
}

export function WebDeliverablesCarousel() {
  const [cardsPerView, setCardsPerView] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemRefs = useRef([]);

  useEffect(() => {
    const onResize = () => {
      const next = getCardsPerView();
      setCardsPerView(next);
      setCurrentIndex((prev) => Math.min(prev, Math.max(0, deliverables.length - next)));
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const target = itemRefs.current[currentIndex];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }
  }, [currentIndex]);

  const maxIndex = Math.max(0, deliverables.length - cardsPerView);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));

  return (
    <div id="web-deliverables-carousel" className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#4b6aa6]">Swipe or use arrows</p>
        <div className="flex items-center gap-2">
          <button
            id="web-deliverables-prev"
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d0dcf3] bg-white text-[#3768FF] transition disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous deliverables"
          >
            ←
          </button>
          <button
            id="web-deliverables-next"
            type="button"
            onClick={handleNext}
            disabled={currentIndex === maxIndex}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d0dcf3] bg-white text-[#3768FF] transition disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next deliverables"
          >
            →
          </button>
        </div>
      </div>

      <div
        id="web-deliverables-track"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {deliverables.map((item, idx) => (
          <article
            key={item.id}
            id={item.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className="w-full shrink-0 snap-start rounded-2xl border border-[#dbe5f7] bg-[#f7faff] p-5 text-base font-medium text-[#2f4e84] shadow-[0_10px_28px_rgba(15,23,42,0.06)] md:w-[calc((100%-1rem)/2)] md:text-lg xl:w-[calc((100%-2rem)/3)]"
          >
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#3768FF] text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {item.label}
          </article>
        ))}
      </div>

      <div id="web-deliverables-dots" className="mt-4 flex justify-center gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={`dot-${idx}`}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`h-2.5 rounded-full transition ${idx === currentIndex ? "w-8 bg-[#3768FF]" : "w-2.5 bg-[#c4d4f1]"}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
