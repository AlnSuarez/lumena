"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Layers,
    Instagram,
    Linkedin,
    Twitter,
    Facebook,
    Music,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import "../content-board.css";
import "./completed-content.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PLATFORMS = {
    instagram: { label: "Instagram", icon: Instagram },
    linkedin: { label: "LinkedIn", icon: Linkedin },
    twitter: { label: "X / Twitter", icon: Twitter },
    facebook: { label: "Facebook", icon: Facebook },
    tiktok: { label: "TikTok", icon: Music },
};

const STATUSES = [
    { id: "ALL", label: "All", meaning: "Everything scheduled" },
    { id: "PUBLISHED", label: "Published", meaning: "Live on social" },
    { id: "SCHEDULED", label: "Scheduled", meaning: "Waiting to go out" },
    { id: "PUBLISHING", label: "Publishing", meaning: "Going out now" },
    { id: "FAILED", label: "Failed", meaning: "Needs attention" },
    { id: "DRAFT", label: "Draft", meaning: "Not sent yet" },
];

const STATUS_ICONS = {
    PUBLISHED: CheckCircle2,
    SCHEDULED: Clock,
    PUBLISHING: RefreshCw,
    FAILED: AlertCircle,
    DRAFT: Layers,
};

const STATUS_LABELS = {
    PUBLISHED: "Published",
    SCHEDULED: "Scheduled",
    PUBLISHING: "Publishing",
    FAILED: "Failed",
    DRAFT: "Draft",
};

function normalizeUrl(url) {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url}`;
}

function getThumbnail(post) {
    const items = post?.content_details?.content_items || [];
    const first = items[0];
    return normalizeUrl(
        first?.gallery_image_details?.image_url
        || first?.gallery_image_details?.image_compressed
        || first?.gallery_image_details?.image
        || first?.file_url
        || post?.content_details?.linked_image_details?.image_url
        || post?.content_details?.linked_image_details?.image_compressed
        || post?.content_details?.linked_image_details?.image
    );
}

function getRotation(post) {
    return post?.content_details?.content_items?.[0]?.rotation || 0;
}

function typeLabel(type) {
    return (type || "Publication").replaceAll("_", " ");
}

function formatWhen(value, part) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    if (part === "date") {
        return parsed.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    }
    return parsed.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function CompletedContentPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");

    const loadPosts = async ({ silent = false } = {}) => {
        const role = localStorage.getItem("userRole") || "GUEST";
        const uid = localStorage.getItem("userId");
        if (!uid) {
            setLoading(false);
            return;
        }

        if (silent) setRefreshing(true);
        else setLoading(true);

        try {
            const url = new URL(`${API_BASE}/api/scheduler/schedules/`);
            if (role === "CLIENT") url.searchParams.set("client_id", uid);

            const response = await fetch(url.toString());
            if (!response.ok) {
                toast.error("Could not load completed content.");
                setPosts([]);
                return;
            }

            const data = await response.json();
            data.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
            setPosts(data);
        } catch (error) {
            console.error("Error fetching scheduled posts:", error);
            toast.error("Network error while loading content.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const counts = useMemo(() => ({
        ALL: posts.length,
        PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
        SCHEDULED: posts.filter((p) => p.status === "SCHEDULED").length,
        PUBLISHING: posts.filter((p) => p.status === "PUBLISHING").length,
        FAILED: posts.filter((p) => p.status === "FAILED").length,
        DRAFT: posts.filter((p) => !p.status || p.status === "DRAFT").length,
    }), [posts]);

    const filtered = statusFilter === "ALL"
        ? posts
        : statusFilter === "DRAFT"
            ? posts.filter((post) => !post.status || post.status === "DRAFT")
            : posts.filter((post) => post.status === statusFilter);

    return (
        <div className="content-board completed-content">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Completed Content</h1>
                    <p>Scheduled and published pieces on your social channels.</p>
                </div>
                <div className="cb-header__actions">
                    <button
                        type="button"
                        className="cb-btn cb-btn--ghost"
                        onClick={() => loadPosts({ silent: true })}
                        disabled={loading || refreshing}
                    >
                        <RefreshCw size={15} />
                        {refreshing || loading ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            <div className="cb-summary">
                {STATUSES.map((status) => (
                    <button
                        key={status.id}
                        type="button"
                        className={`cb-chip${statusFilter === status.id ? " is-active" : ""}`}
                        onClick={() => setStatusFilter(status.id)}
                    >
                        <span>{status.label}<small>{status.meaning}</small></span>
                        <strong>{counts[status.id]}</strong>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="cb-empty"><strong>Loading publications…</strong></div>
            ) : filtered.length === 0 ? (
                <div className="cb-empty">
                    <div className="cb-empty__icon"><Calendar size={18} /></div>
                    <strong>{posts.length === 0 ? "No scheduled content" : "Nothing in this filter"}</strong>
                    <p>{posts.length === 0 ? "Nothing has been scheduled to publish yet." : "Try another status."}</p>
                </div>
            ) : (
                <div className="cc-list">
                    {filtered.map((post) => {
                        const thumb = getThumbnail(post);
                        const StatusIcon = STATUS_ICONS[post.status] || Layers;
                        return (
                            <article key={post.id} className="cc-row">
                                <div className="cc-thumb">
                                    {thumb ? (
                                        <img
                                            src={thumb}
                                            alt=""
                                            style={{ transform: `rotate(${getRotation(post)}deg)` }}
                                        />
                                    ) : (
                                        <Layers size={18} />
                                    )}
                                </div>
                                <div className="cc-meta">
                                    <div className="cc-meta__top">
                                        <h3>{typeLabel(post.content_details?.request_type)}</h3>
                                        {post.client_details?.username && (
                                            <span className="cc-client">@{post.client_details.username}</span>
                                        )}
                                    </div>
                                    {post.caption && <p className="cc-caption">{post.caption}</p>}
                                    <div className="cc-when">
                                        <span><Calendar size={12} /> {formatWhen(post.scheduled_at, "date")}</span>
                                        <span><Clock size={12} /> {formatWhen(post.scheduled_at, "time")}</span>
                                    </div>
                                </div>
                                <div className="cc-side">
                                    <span
                                        className="cc-status"
                                        data-status={post.status || "DRAFT"}
                                        title={post.error_message || undefined}
                                    >
                                        <StatusIcon size={12} />
                                        {STATUS_LABELS[post.status] || "Draft"}
                                    </span>
                                    <div className="cc-plats">
                                        {(post.platforms || []).map((plat) => {
                                            const config = PLATFORMS[plat.toLowerCase()];
                                            if (!config) return null;
                                            const Icon = config.icon;
                                            return (
                                                <span key={plat} className="cc-plat" data-platform={plat.toLowerCase()} title={config.label}>
                                                    <Icon size={13} />
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
