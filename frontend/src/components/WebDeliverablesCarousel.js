"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, UserCircle, Target, BookOpen, Search, Smartphone, Layout, Mail } from "lucide-react";

const deliverables = [
  {
    id: "web-deliverable-clinic-websites",
    title: "Clinic Websites",
    description: "Simple, professional sites for medical practices.",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
    features: ["Service information", "Team introduction", "Contact details"],
    benefit: "Professional online presence"
  },
  {
    id: "web-deliverable-doctor-brand-sites",
    title: "Personal Brand Sites",
    description: "Showcase your expertise and background.",
    icon: UserCircle,
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-gradient-to-br from-purple-50 to-pink-100",
    features: ["Expertise highlights", "Education & training", "Simple contact"],
    benefit: "Build doctor authority"
  },
  {
    id: "web-deliverable-landing-pages",
    title: "Procedure Pages",
    description: "Simple pages for specific treatments.",
    icon: Target,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-gradient-to-br from-emerald-50 to-teal-100",
    features: ["Treatment overview", "Basic information", "Contact option"],
    benefit: "Inform potential patients"
  },
  {
    id: "web-deliverable-education-pages",
    title: "Educational Content",
    description: "Simple pages to educate patients.",
    icon: BookOpen,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-gradient-to-br from-amber-50 to-orange-100",
    features: ["Condition information", "Treatment basics", "FAQ section"],
    benefit: "Establish trust"
  },
  {
    id: "web-deliverable-seo-basics",
    title: "SEO Basics",
    description: "Simple optimization for better visibility.",
    icon: Search,
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-gradient-to-br from-cyan-50 to-blue-100",
    features: ["Basic keywords", "Mobile friendly", "Clean structure"],
    benefit: "Better search visibility"
  },
  {
    id: "web-deliverable-mobile-friendly",
    title: "Mobile Friendly",
    description: "Works well on phones and tablets.",
    icon: Smartphone,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-gradient-to-br from-violet-50 to-purple-100",
    features: ["Responsive design", "Easy navigation", "Fast loading"],
    benefit: "Reach mobile users"
  },
  {
    id: "web-deliverable-simple-design",
    title: "Clean Design",
    description: "Professional, easy-to-use layouts.",
    icon: Layout,
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-gradient-to-br from-green-50 to-emerald-100",
    features: ["Modern aesthetics", "Clear typography", "Professional colors"],
    benefit: "Make good first impression"
  },
  {
    id: "web-deliverable-basic-contact",
    title: "Contact Pages",
    description: "Simple ways for patients to reach you.",
    icon: Mail,
    color: "from-rose-500 to-red-600",
    bgColor: "bg-gradient-to-br from-rose-50 to-red-100",
    features: ["Contact form", "Location map", "Phone/email"],
    benefit: "Easy patient communication"
  }
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
       <div className="mb-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
           <button
             id="web-deliverables-prev"
             type="button"
             onClick={handlePrev}
             disabled={currentIndex === 0}
             className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
             aria-label="Previous deliverables"
           >
             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
             </svg>
           </button>
           <button
             id="web-deliverables-next"
             type="button"
             onClick={handleNext}
             disabled={currentIndex === maxIndex}
             className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
             aria-label="Next deliverables"
           >
             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
             </svg>
           </button>
         </div>
       </div>

      <div
        id="web-deliverables-track"
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {deliverables.map((item, idx) => {
          const Icon = item.icon;
          return (
            <article
              key={item.id}
              id={item.id}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className="group w-full shrink-0 snap-start rounded-2xl border border-sky-200 bg-sky-100 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:w-[calc((100%-1.25rem)/2)] xl:w-[calc((100%-2.5rem)/3)]"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.bgColor}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-white`}>
                  <Icon size={16} strokeWidth={2} />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-sky-900">{item.title}</h3>
              
              <p className="mt-2 text-sm text-sky-800">{item.description}</p>
              
              <div className="mt-3">
                {item.features.map((feature, i) => (
                  <div key={i} className="mb-1 flex items-center gap-1.5">
                    <svg className="h-3 w-3 flex-shrink-0 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-sky-800">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-sky-200 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs font-medium text-sky-900">Benefit:</span>
                  <span className="text-xs text-sky-800">{item.benefit}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div id="web-deliverables-dots" className="mt-4 flex justify-center gap-1.5">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={`dot-${idx}`}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-8 bg-blue-600" : "w-1.5 bg-slate-300"}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          {currentIndex + 1}-{Math.min(currentIndex + cardsPerView, deliverables.length)} of {deliverables.length}
        </p>
      </div>
    </div>
  );
}
