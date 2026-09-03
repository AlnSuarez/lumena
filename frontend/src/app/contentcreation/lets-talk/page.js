"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    Mail,
    Phone,
    RefreshCw,
    Stethoscope,
    AlertTriangle,
    X,
} from "lucide-react";
import "./lets-talk.css";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

const FILTERS = [
    { id: "ALL", label: "All" },
    { id: "PENDING", label: "Pending" },
    { id: "REVIEWED", label: "Reviewed" },
];

const formatDateTime = (value) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString();
};

function Toast({ message, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className="lt-toast">
            <AlertTriangle size={16} />
            {message}
            <button type="button" onClick={onClose} aria-label="Dismiss">
                <X size={14} />
            </button>
        </div>
    );
}

export default function LetsTalkAdminPage() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [savingId, setSavingId] = useState(null);
    const [toast, setToast] = useState(null);

    const loadSubmissions = async ({ silent = false } = {}) => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        if (silent) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const url = new URL(`${API_BASE}/contents/lets-talk/admin/`);
            url.searchParams.append("user_id", userId);

            const response = await fetch(url.toString());
            if (!response.ok) {
                setToast("Could not load Let’s Talk submissions.");
                return;
            }

            const data = await response.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading lets-talk submissions:", error);
            setToast("Could not load Let’s Talk submissions.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, []);

    const pendingCount = items.filter((item) => !item.reviewed).length;
    const reviewedCount = items.filter((item) => item.reviewed).length;

    const filteredItems = useMemo(() => {
        if (statusFilter === "PENDING") return items.filter((item) => !item.reviewed);
        if (statusFilter === "REVIEWED") return items.filter((item) => item.reviewed);
        return items;
    }, [items, statusFilter]);

    const markReviewed = async (id, reviewed) => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        setSavingId(id);
        try {
            const url = new URL(`${API_BASE}/contents/lets-talk/admin/${id}/reviewed/`);
            url.searchParams.append("user_id", userId);

            const response = await fetch(url.toString(), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reviewed }),
            });

            if (!response.ok) {
                setToast("Could not update submission status.");
                return;
            }

            const updated = await response.json();
            setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
        } catch (error) {
            console.error("Error updating reviewed state:", error);
            setToast("Could not update submission status.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="lets-talk">
            <header className="lt-header">
                <div className="lt-header__titles">
                    <h1>Let&apos;s Talk</h1>
                    <p>New contact requests from the public landing page.</p>
                </div>
                <div className="lt-header__actions">
                    <span className="lt-chip">
                        <span className="lt-chip__dot" />
                        {items.length} leads
                    </span>
                    {pendingCount > 0 && (
                        <span className="lt-chip lt-chip--pending">
                            <span className="lt-chip__dot is-pending" />
                            {pendingCount} pending
                        </span>
                    )}
                    <button
                        type="button"
                        className="lt-btn lt-btn--primary"
                        onClick={() => loadSubmissions({ silent: true })}
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={16} className={isRefreshing ? "lt-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </header>

            <div className="lt-workspace">
                <div className="lt-stats">
                    {FILTERS.map((opt) => {
                        const count =
                            opt.id === "PENDING"
                                ? pendingCount
                                : opt.id === "REVIEWED"
                                    ? reviewedCount
                                    : items.length;
                        const tone =
                            opt.id === "PENDING"
                                ? " is-pending"
                                : opt.id === "REVIEWED"
                                    ? " is-reviewed"
                                    : "";
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                className={`lt-stat${tone}${statusFilter === opt.id ? " is-on" : ""}`}
                                onClick={() => setStatusFilter(opt.id)}
                            >
                                {opt.label} <b>{count}</b>
                            </button>
                        );
                    })}
                </div>

                {isLoading ? (
                    <div className="lt-empty">Loading submissions...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="lt-empty">No submissions found.</div>
                ) : (
                    <div className="lt-list">
                        {filteredItems.map((item) => (
                            <article
                                key={item.id}
                                className={`lt-lead${item.reviewed ? " is-reviewed" : " is-pending"}`}
                            >
                                <div className="lt-lead__head">
                                    <div>
                                        <h2>{item.name}</h2>
                                        <p>Submitted {formatDateTime(item.created_at)}</p>
                                    </div>
                                    <span className={`lt-badge${item.reviewed ? " is-reviewed" : " is-pending"}`}>
                                        {item.reviewed ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                                        {item.reviewed ? "Reviewed" : "Pending"}
                                    </span>
                                </div>

                                <div className="lt-meta">
                                    <span className="lt-meta__chip is-email">
                                        <Mail size={15} />
                                        {item.email}
                                    </span>
                                    <span className="lt-meta__chip is-phone">
                                        <Phone size={15} />
                                        {item.phone || "-"}
                                    </span>
                                    <span className="lt-meta__chip is-specialty">
                                        <Stethoscope size={15} />
                                        {item.specialty || "-"}
                                    </span>
                                </div>

                                <p className="lt-message">{item.message || "No message provided."}</p>

                                <div className="lt-lead__actions">
                                    <button
                                        type="button"
                                        className="lt-btn lt-btn--primary"
                                        onClick={() => markReviewed(item.id, true)}
                                        disabled={savingId === item.id || item.reviewed}
                                    >
                                        Mark as reviewed
                                    </button>
                                    <button
                                        type="button"
                                        className="lt-btn lt-btn--ghost"
                                        onClick={() => markReviewed(item.id, false)}
                                        disabled={savingId === item.id || !item.reviewed}
                                    >
                                        Mark as pending
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
