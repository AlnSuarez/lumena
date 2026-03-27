"use client";

import React, { useState } from "react";
import { Layers, Target, Clock, MousePointerClick, BarChart3, Layout } from "lucide-react";

export function ExpandableCards() {
    const [expanded, setExpanded] = useState(0);

    const cards = [
        {
            keyword: "Workflow",
            fullTitle: "A structured content workflow",
            desc: "From planning to publishing, every step follows a clear system—so nothing feels random or overwhelming.",
            icon: Layers
        },
        {
            keyword: "Strategy",
            fullTitle: "Clear strategy",
            desc: "We define what to say, how to say it, and who it’s for—so your content has direction from the start.",
            icon: Target
        },
        {
            keyword: "Consistency",
            fullTitle: "Consistent presence",
            desc: "We make sure your content shows up regularly, so you stay visible and top of mind for patients.",
            icon: Clock
        },
        {
            keyword: "Portal",
            fullTitle: "Simple approvals",
            desc: "Review and approve your content in seconds—no back-and-forth, no complexity.",
            icon: MousePointerClick
        },
        {
            keyword: "Insights",
            fullTitle: "What’s working, clearly",
            desc: "Understand what resonates with your patients and improve your content over time.",
            icon: BarChart3
        },
        {
            keyword: "Web",
            fullTitle: "A cohesive online presence",
            desc: "From social to web, everything works together to reflect your expertise clearly.",
            icon: Layout
        }
    ];

    return (
        <div className="mt-8 flex h-[24rem] w-full gap-2 md:h-[28rem] md:gap-4">
            {cards.map((card, idx) => {
                const isExpanded = expanded === idx;
                const num = `0${idx + 1}`;
                const Icon = card.icon;

                return (
                    <article
                        key={idx}
                        onClick={() => setExpanded(idx)}
                        className={`
              relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl
              bg-blue-100/60 ring-1 ring-blue-200 transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)]
              ${isExpanded ? "flex-[6] md:flex-[4]" : "flex-[1] min-w-[50px] md:min-w-[80px] hover:bg-blue-100/90"}
            `}
                    >
                        {/* Graphic accent on background */}
                        <div className={`absolute -bottom-10 -right-10 pointer-events-none transition-all duration-700 ${isExpanded ? 'opacity-20 scale-100' : 'opacity-0 scale-50'}`}>
                            <Icon size={240} className="text-[#3768FF]" strokeWidth={0.5} />
                        </div>

                        {/* Compressed View */}
                        <div
                            className={`absolute inset-0 flex flex-col items-center py-6 transition-opacity duration-300 ${isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
                                }`}
                        >
                            <span className="text-lg md:text-xl font-bold text-blue-900/40 mb-auto">{num}</span>
                            <div className="flex flex-col items-center gap-4 mt-auto">
                                <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#3768FF] uppercase [writing-mode:vertical-rl] rotate-180">
                                    {card.keyword}
                                </span>
                                <Icon size={20} className="text-[#3768FF]/60" />
                            </div>
                        </div>

                        {/* Expanded View */}
                        <div
                            className={`absolute inset-0 flex flex-col p-5 md:p-6 transition-opacity duration-500 delay-150 ${isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}
                        >
                            <div className="flex items-start justify-between flex-1">
                                <span className="text-4xl md:text-5xl font-black text-blue-900/10">{num}</span>
                                <div className="p-3 rounded-2xl bg-white/50 ring-1 ring-[#3768FF]/10 backdrop-blur-sm">
                                    <Icon size={24} className="text-[#3768FF]" />
                                </div>
                            </div>
                            <div className="mt-auto min-w-[200px] max-w-sm relative z-10">
                                <p className="mb-2 text-lg font-semibold leading-[1.04] tracking-tight text-blue-950 md:text-xl">
                                    {card.fullTitle}
                                </p>
                                <p className="text-sm leading-relaxed text-blue-800 md:text-sm">
                                    {card.desc}
                                </p>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
