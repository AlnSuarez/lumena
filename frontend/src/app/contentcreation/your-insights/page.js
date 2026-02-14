"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, HelpCircle } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const fallbackData = {
    timeframe: "Last 30 days",
    key_metrics: [
        { label: "Reach", value: "0", change: "+0%", period: "last month" },
        { label: "Saves", value: "0", change: "+0%", period: "last month" },
        { label: "Save Rate", value: "0%", change: "+0%", period: "last month" },
        { label: "Profile Visits", value: "0", change: "+0%", period: "last month" },
    ],
    performance_snapshot: [
        "Posting consistency: On track",
        "Content focus: Educational + Authority",
        "Engagement trend: Improving",
        "Platform focus: Primary focus on Instagram",
    ],
    opportunity_title: "Opportunity Insight",
    opportunity_description: "Short Q&A-style videos are generating the most shares and saves.",
    focus_next_month: [
        "Produce more Q&A style videos",
        "Strengthen thought-leadership content",
        "Continue building Instagram presence",
    ],
};

const normalizeData = (raw) => {
    const safe = raw && typeof raw === "object" ? raw : {};
    const keyMetrics = Array.isArray(safe.key_metrics) ? safe.key_metrics.slice(0, 4) : [];
    while (keyMetrics.length < 4) keyMetrics.push(fallbackData.key_metrics[keyMetrics.length]);

    return {
        timeframe: safe.timeframe || fallbackData.timeframe,
        key_metrics: keyMetrics.map((metric, idx) => ({
            label: metric?.label || fallbackData.key_metrics[idx].label,
            value: metric?.value || fallbackData.key_metrics[idx].value,
            change: metric?.change || fallbackData.key_metrics[idx].change,
            period: metric?.period || fallbackData.key_metrics[idx].period,
        })),
        performance_snapshot: Array.isArray(safe.performance_snapshot) && safe.performance_snapshot.length > 0
            ? safe.performance_snapshot
            : fallbackData.performance_snapshot,
        opportunity_title: safe.opportunity_title || fallbackData.opportunity_title,
        opportunity_description: safe.opportunity_description || fallbackData.opportunity_description,
        focus_next_month: Array.isArray(safe.focus_next_month) && safe.focus_next_month.length > 0
            ? safe.focus_next_month
            : fallbackData.focus_next_month,
    };
};

export default function YourInsightsPage() {
    const [data, setData] = useState(fallbackData);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/users/manage/`);
                if (!response.ok) {
                    setLoading(false);
                    return;
                }

                const users = await response.json();
                const currentUser = users.find((u) => String(u.id) === String(userId));
                setData(normalizeData(currentUser?.insights_metrics));
            } catch (error) {
                console.error("Error loading insights data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, []);

    const [metric1, metric2, metric3, metric4] = useMemo(() => data.key_metrics, [data.key_metrics]);

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full">
            <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Your Insights</h1>
                        <p className="text-muted-foreground mt-2 text-lg">An overview of your recent performance and strategy focus.</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground inline-flex items-center gap-2">
                        {data.timeframe}
                        <ChevronDown size={16} />
                    </button>
                </div>

                <div className="h-px bg-border mb-6" />

                {loading ? (
                    <div className="flex-1 grid place-items-center text-muted-foreground">Loading insights...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-6 pb-2">
                        <h2 className="text-2xl font-bold text-foreground">Performance Snapshot</h2>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                                {(data.performance_snapshot || []).map((item, idx) => (
                                    <div key={`snapshot-${idx}`} className={`flex items-center justify-between gap-3 px-5 py-4 ${idx !== 0 ? "border-t border-border" : ""}`}>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                            <p className="text-foreground text-lg">{item}</p>
                                        </div>
                                        <ChevronDown size={16} className="text-muted-foreground" />
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-5">
                                <h3 className="text-3xl font-bold text-foreground mb-4">Key Metrics</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[metric1, metric2, metric3, metric4].map((metric, idx) => (
                                        <div key={`metric-card-${idx}`} className="rounded-xl border border-border bg-background/60 p-4">
                                            <p className="text-lg font-semibold text-foreground">{metric.label}</p>
                                            <p className="text-4xl font-black text-foreground mt-1">{metric.value}</p>
                                            <p className="text-base font-semibold text-emerald-600 mt-1">{metric.change} <span className="font-medium text-muted-foreground">{metric.period}</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <div>
                                <h3 className="text-3xl font-bold text-foreground mb-3">{data.opportunity_title}</h3>
                                <div className="rounded-2xl border border-border overflow-hidden">
                                    <div className="bg-muted px-6 py-5 text-2xl font-semibold text-foreground leading-tight">
                                        {data.opportunity_description}
                                    </div>
                                    <div className="bg-card px-6 py-4 text-base text-muted-foreground">
                                        Patients are responding well to short, engaging videos where you answer common questions in a Q&amp;A style.
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-3xl font-bold text-foreground mb-4">Focus for Next Month</h3>
                                <div className="space-y-3">
                                    {(data.focus_next_month || []).map((item, idx) => (
                                        <div key={`focus-${idx}`} className="flex items-center gap-3">
                                            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                            <p className="text-foreground text-xl">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex items-center gap-3">
                    <button className="h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
                        <HelpCircle size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        className="flex-1 h-12 rounded-xl border border-border bg-card px-4 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                    />
                    <button className="h-12 px-8 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
