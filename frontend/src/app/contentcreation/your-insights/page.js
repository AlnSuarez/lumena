"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, HelpCircle, ArrowUpRight } from "lucide-react";
import { toast, Toaster } from "sonner";
import "../content-board.css";
import "./your-insights.css";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

const FALLBACK = {
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

function normalizeData(raw) {
    const safe = raw && typeof raw === "object" ? raw : {};
    const keyMetrics = Array.isArray(safe.key_metrics) ? safe.key_metrics.slice(0, 4) : [];
    while (keyMetrics.length < 4) {
        keyMetrics.push(FALLBACK.key_metrics[keyMetrics.length]);
    }

    return {
        timeframe: safe.timeframe || FALLBACK.timeframe,
        key_metrics: keyMetrics.map((metric, idx) => ({
            label: metric?.label || FALLBACK.key_metrics[idx].label,
            value: metric?.value || FALLBACK.key_metrics[idx].value,
            change: metric?.change || FALLBACK.key_metrics[idx].change,
            period: metric?.period || FALLBACK.key_metrics[idx].period,
        })),
        performance_snapshot: Array.isArray(safe.performance_snapshot) && safe.performance_snapshot.length > 0
            ? safe.performance_snapshot
            : FALLBACK.performance_snapshot,
        opportunity_title: safe.opportunity_title || FALLBACK.opportunity_title,
        opportunity_description: safe.opportunity_description || FALLBACK.opportunity_description,
        focus_next_month: Array.isArray(safe.focus_next_month) && safe.focus_next_month.length > 0
            ? safe.focus_next_month
            : FALLBACK.focus_next_month,
    };
}

function changeTone(change) {
    const text = String(change || "").trim();
    if (text.startsWith("+") && !text.startsWith("+0")) return "up";
    if (text.startsWith("-") && !text.startsWith("-0")) return "down";
    return "flat";
}

export default function YourInsightsPage() {
    const [data, setData] = useState(FALLBACK);
    const [loading, setLoading] = useState(true);
    const [question, setQuestion] = useState("");

    useEffect(() => {
        const fetchInsights = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_BASE}/users/manage/`);
                if (!response.ok) return;
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

    const handleAsk = (event) => {
        event.preventDefault();
        if (!question.trim()) return;
        toast.message("Use chat in the top bar to send this to your team.");
        setQuestion("");
    };

    return (
        <div className="content-board your-insights">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Your Insights</h1>
                    <p>How the last stretch performed, and what to focus on next.</p>
                </div>
                <div className="cb-header__actions">
                    <span className="yi-time">{data.timeframe}</span>
                </div>
            </div>

            {loading ? (
                <div className="cb-empty"><strong>Loading insights…</strong></div>
            ) : (
                <div className="yi-scroll">
                    <div className="cb-summary">
                        {data.key_metrics.map((metric) => (
                            <div key={metric.label} className="cb-chip">
                                <span>
                                    {metric.label}
                                    <small>{metric.period}</small>
                                </span>
                                <div>
                                    <strong>{metric.value}</strong>
                                    <div className={`yi-change is-${changeTone(metric.change)}`}>{metric.change}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <section className="yi-section">
                        <h2>Performance snapshot</h2>
                        <div className="yi-list">
                            {(data.performance_snapshot || []).map((item, idx) => (
                                <div key={`snapshot-${idx}`} className="yi-row">
                                    <CheckCircle2 size={16} />
                                    <p>{item}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="yi-split">
                        <section className="yi-section">
                            <h2>Opportunity</h2>
                            <div className="yi-card">
                                <h3>{data.opportunity_title}</h3>
                                <p className="yi-card__lead">{data.opportunity_description}</p>
                            </div>
                        </section>
                        <section className="yi-section">
                            <h2>Focus for next month</h2>
                            <div className="yi-card">
                                <ul className="yi-focus">
                                    {(data.focus_next_month || []).map((item, idx) => (
                                        <li key={`focus-${idx}`}>
                                            <ArrowUpRight size={16} />
                                            <p>{item}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            <form className="yi-ask" onSubmit={handleAsk}>
                <span className="cb-icon-btn" aria-hidden="true"><HelpCircle size={18} /></span>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question…"
                    aria-label="Ask a question"
                />
                <button type="submit" className="cb-btn cb-btn--primary">Send</button>
            </form>
        </div>
    );
}
