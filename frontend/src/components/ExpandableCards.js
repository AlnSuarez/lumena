"use client";

import React, { useState } from "react";
import { Layers, Target, Clock, MousePointerClick, BarChart3, Layout } from "lucide-react";

export function ExpandableCards() {
    const [expanded, setExpanded] = useState(0);

    const cards = [
        {
            keyword: "Workflow",
            fullTitle: "A clear, systemized content workflow",
            desc: "From planning and creation to approvals and publishing — everything follows a proven system.",
            icon: Layers
        },
        {
            keyword: "Strategy",
            fullTitle: "On-brand messaging & strategic positioning",
            desc: "Content designed to reflect your expertise, build trust, and position you clearly within your specialty.",
            icon: Target
        },
        {
            keyword: "Consistency",
            fullTitle: "Consistent, high-quality content delivery",
            desc: "A reliable posting cadence that keeps your brand visible and relevant — without last-minute scrambling.",
            icon: Clock
        },
        {
            keyword: "Portal",
            fullTitle: "Fast, centralized approvals through your client portal",
            desc: "Review and approve content in one place, saving time and avoiding endless back-and-forth.",
            icon: MousePointerClick
        },
        {
            keyword: "Insights",
            fullTitle: "Performance tracking & monthly insights",
            desc: "Clear reporting and strategic insights to understand what's working and how your presence is evolving.",
            icon: BarChart3
        },
        {
            keyword: "Web",
            fullTitle: "Optional web support",
            desc: "Landing pages, website updates, and digital touchpoints aligned with your brand and content strategy.",
            icon: Layout
        }
    ];

    return (
        <div className="mt-8 flex w-full h-[28rem] md:h-[32rem] gap-2 md:gap-4">
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
                            className={`absolute inset-0 flex flex-col p-6 md:p-8 transition-opacity duration-500 delay-150 ${isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}
                        >
                            <div className="flex items-start justify-between flex-1">
                                <span className="text-4xl md:text-5xl font-black text-blue-900/10">{num}</span>
                                <div className="p-3 rounded-2xl bg-white/50 ring-1 ring-[#3768FF]/10 backdrop-blur-sm">
                                    <Icon size={24} className="text-[#3768FF]" />
                                </div>
                            </div>
                            <div className="mt-auto min-w-[200px] max-w-sm relative z-10">
                                <p className="text-xl md:text-2xl font-bold text-blue-950 mb-3 leading-tight">
                                    {card.fullTitle}
                                </p>
                                <p className="text-sm md:text-base leading-relaxed text-blue-800">
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
