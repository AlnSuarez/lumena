"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Clock,
    Image as ImageIcon,
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    Eye,
    Trash2,
    User as UserIcon,
    Filter,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import ContentMediaPreview, { isPdfMedia, isVideoMedia } from "../../../components/ContentMediaPreview";
import "../content-board.css";
import "./publication-log.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUSES = [
    { id: "ALL", label: "All", meaning: "Everything in the log" },
    { id: "PUBLISHED", label: "Published", meaning: "Live on social" },
    { id: "SCHEDULED", label: "Scheduled", meaning: "Waiting to go out" },
    { id: "FAILED", label: "Failed", meaning: "Needs attention" },
    { id: "DRAFT", label: "Draft", meaning: "Not sent yet" },
];

const normalizeMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url}`;
};

const getClientName = (post, clients) => {
    const matched = clients.find((c) => String(c.id) === String(post.client));
    return (
        matched?.name
        || post?.client_details?.client_profile?.practice_name
        || post?.client_details?.username
        || "Untitled client"
    );
};

const getClientUsername = (post) => post?.client_details?.username || "client";

const getThumbnail = (post) => {
    const items = post?.content_details?.content_items || [];
    const first = items[0];
    return normalizeMediaUrl(
        first?.gallery_image_details?.image_url
        || first?.gallery_image_details?.image_compressed
        || first?.gallery_image_details?.image
        || first?.file_url
        || post?.content_details?.linked_image_details?.image_url
        || post?.content_details?.linked_image_details?.image_compressed
        || post?.content_details?.linked_image_details?.image
    );
};

const getFirstContentItem = (post) => post?.content_details?.content_items?.[0] || null;

const getRotation = (post) => post?.content_details?.content_items?.[0]?.rotation || 0;

const formatWhen = (post) => {
    const value = post.published_at || post.scheduled_at;
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const formatMetric = (num) => {
    if (num === undefined || num === null) return "—";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return Number(num).toLocaleString();
};

const statusDetails = (status) => STATUSES.find((s) => s.id === status) || { label: status, meaning: "" };

export default function PublicationLogPage() {
    const [clients, setClients] = useState([]);
    const [logPosts, setLogPosts] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [filterLogClient, setFilterLogClient] = useState("ALL");
    const [filterLogStatus, setFilterLogStatus] = useState("ALL");
    const [activeLogPost, setActiveLogPost] = useState(null);
    const [logMetrics, setLogMetrics] = useState({});
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/clients/`);
                if (res.ok) setClients(await res.json());
            } catch (err) {
                console.error("Error fetching clients:", err);
            }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoadingLogs(true);
            try {
                const url = new URL(`${API_BASE}/api/scheduler/schedules/`);
                if (filterLogClient !== "ALL") url.searchParams.set("client_id", filterLogClient);

                const res = await fetch(url.toString());
                if (!res.ok) {
                    toast.error("Could not load the publication log.");
                    setLogPosts([]);
                    setActiveLogPost(null);
                    return;
                }

                const data = await res.json();
                const sorted = [...data].sort((a, b) => {
                    const dateA = new Date(a.published_at || a.scheduled_at || 0);
                    const dateB = new Date(b.published_at || b.scheduled_at || 0);
                    return dateB - dateA;
                });
                setLogPosts(sorted);
                setActiveLogPost((prev) => {
                    const existing = prev && sorted.find((p) => p.id === prev.id);
                    return existing || sorted[0] || null;
                });
            } catch (err) {
                console.error("Error fetching publication logs:", err);
                toast.error("Could not load the publication log.");
            } finally {
                setLoadingLogs(false);
            }
        };
        fetchLogs();
    }, [filterLogClient]);

    const fetchPostMetrics = async (postId) => {
        if (logMetrics[postId]) return;
        try {
            const res = await fetch(`${API_BASE}/api/scheduler/schedules/${postId}/metrics/`);
            if (!res.ok) return;
            const data = await res.json();
            const metricsObj = data.metrics || data;
            setLogMetrics((prev) => ({ ...prev, [postId]: metricsObj }));

            if (data.status) {
                setLogPosts((prevPosts) => prevPosts.map((p) => (
                    p.id === postId ? { ...p, status: data.status, error_message: data.error_message } : p
                )));
                setActiveLogPost((prevActive) => (
                    prevActive && prevActive.id === postId
                        ? { ...prevActive, status: data.status, error_message: data.error_message }
                        : prevActive
                ));
            }
        } catch (err) {
            console.error("Error fetching post metrics:", err);
        }
    };

    useEffect(() => {
        if (activeLogPost?.status === "PUBLISHED") fetchPostMetrics(activeLogPost.id);
    }, [activeLogPost?.id, activeLogPost?.status]);

    const handleDeletePost = async () => {
        if (!activeLogPost) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/api/scheduler/schedules/${activeLogPost.id}/`, {
                method: "DELETE",
            });
            if (res.ok || res.status === 204) {
                setLogPosts((prev) => prev.filter((p) => p.id !== activeLogPost.id));
                setActiveLogPost(null);
                setShowDeleteConfirm(false);
                toast.success("Content removed from the log.");
            } else {
                toast.error("Could not delete this content.");
            }
        } catch (err) {
            console.error("Error deleting post:", err);
            toast.error("Network error while deleting.");
        } finally {
            setIsDeleting(false);
        }
    };

    const counts = useMemo(() => ({
        total: logPosts.length,
        published: logPosts.filter((p) => p.status === "PUBLISHED").length,
        scheduled: logPosts.filter((p) => p.status === "SCHEDULED").length,
        failed: logPosts.filter((p) => p.status === "FAILED").length,
    }), [logPosts]);

    const visiblePosts = useMemo(
        () => (filterLogStatus === "ALL" ? logPosts : logPosts.filter((p) => p.status === filterLogStatus)),
        [logPosts, filterLogStatus]
    );

    useEffect(() => {
        if (filterLogStatus === "ALL") return;
        setActiveLogPost((prev) => {
            if (prev && prev.status === filterLogStatus) return prev;
            return logPosts.find((p) => p.status === filterLogStatus) || null;
        });
    }, [filterLogStatus, logPosts]);

    const canDelete = activeLogPost && ["SCHEDULED", "FAILED", "DRAFT"].includes(activeLogPost.status);
    const metrics = activeLogPost ? logMetrics[activeLogPost.id] : null;
    const activeWhen = activeLogPost ? formatWhen(activeLogPost) : null;
    const activeStatus = activeLogPost ? statusDetails(activeLogPost.status) : null;

    return (
        <div className="content-board publication-log">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Publication Log</h1>
                    <p>See what went live, what is queued, and what failed.</p>
                </div>
                <div className="cb-header__actions">
                    <div className="cb-select-wrap">
                        <UserIcon size={16} />
                        <select
                            value={filterLogClient}
                            onChange={(e) => setFilterLogClient(e.target.value)}
                            className="cb-select"
                            aria-label="Filter by client"
                        >
                            <option value="ALL">All clients</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>{c.name || c.username}</option>
                            ))}
                        </select>
                    </div>
                    <div className="cb-select-wrap">
                        <Filter size={16} />
                        <select
                            value={filterLogStatus}
                            onChange={(e) => setFilterLogStatus(e.target.value)}
                            className="cb-select"
                            aria-label="Filter by status"
                        >
                            {STATUSES.map((status) => (
                                <option key={status.id} value={status.id}>{status.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="cb-summary">
                <button type="button" className={`cb-chip${filterLogStatus === "ALL" ? " is-active" : ""}`} onClick={() => setFilterLogStatus("ALL")}>
                    <span>In this view<small>All matching posts</small></span>
                    <strong>{counts.total}</strong>
                </button>
                <button type="button" className={`cb-chip${filterLogStatus === "PUBLISHED" ? " is-active" : ""}`} onClick={() => setFilterLogStatus("PUBLISHED")}>
                    <span>Published<small>Live on social</small></span>
                    <strong>{counts.published}</strong>
                </button>
                <button type="button" className={`cb-chip${filterLogStatus === "SCHEDULED" ? " is-active" : ""}`} onClick={() => setFilterLogStatus("SCHEDULED")}>
                    <span>Scheduled<small>Waiting to go out</small></span>
                    <strong>{counts.scheduled}</strong>
                </button>
                <button type="button" className={`cb-chip${filterLogStatus === "FAILED" ? " is-active" : ""}`} onClick={() => setFilterLogStatus("FAILED")}>
                    <span>Failed<small>Needs attention</small></span>
                    <strong>{counts.failed}</strong>
                </button>
            </div>

            <div className="pl-body">
                <section className="pl-list" aria-label="Publication entries">
                    <div className="pl-list__head">
                        <h2>Entries</h2>
                        <span>{loadingLogs ? "Loading" : `${visiblePosts.length}`}</span>
                    </div>
                    <div className="pl-list__items">
                        {loadingLogs ? (
                            [1, 2, 3, 4].map((i) => <div key={i} className="cb-skel cb-skel--card" />)
                        ) : visiblePosts.length === 0 ? (
                            <div className="cb-empty">
                                <div className="cb-empty__icon"><Clock size={18} /></div>
                                <strong>No entries yet</strong>
                                <p>Nothing matches these filters.</p>
                            </div>
                        ) : (
                            visiblePosts.map((post) => {
                                const isActive = activeLogPost?.id === post.id;
                                const thumb = getThumbnail(post);
                                const when = formatWhen(post);
                                const status = statusDetails(post.status);
                                return (
                                    <button
                                        key={post.id}
                                        type="button"
                                        className={`pl-entry${isActive ? " is-active" : ""}`}
                                        onClick={() => setActiveLogPost(post)}
                                    >
                                        <div className={`pl-entry__thumb${thumb ? "" : " pl-entry__thumb--empty"}`}>
                                            {thumb && isPdfMedia(getFirstContentItem(post), thumb) ? (
                                                <ContentMediaPreview src={thumb} item={getFirstContentItem(post)} variant="thumb" alt="PDF" />
                                            ) : thumb && isVideoMedia(getFirstContentItem(post), thumb) ? (
                                                <video src={thumb} muted playsInline />
                                            ) : thumb ? (
                                                <img src={thumb} alt="" style={{ transform: `rotate(${getRotation(post)}deg)` }} />
                                            ) : (
                                                <ImageIcon size={14} />
                                            )}
                                        </div>
                                        <div className="pl-entry__body">
                                            <div className="pl-entry__top">
                                                <p className="pl-entry__client">{getClientName(post, clients)}</p>
                                                <span className="pl-badge" data-status={post.status} title={status.meaning}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="pl-entry__caption">{post.caption || "No caption"}</p>
                                            <p className="pl-entry__time">{when || "No date"}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="pl-detail" aria-label="Publication details">
                    <div className="pl-detail__scroll">
                        {!activeLogPost ? (
                            <div className="cb-empty">
                                <div className="cb-empty__icon"><Eye size={18} /></div>
                                <strong>Select an entry</strong>
                                <p>Choose a post on the left to see preview, caption, and metrics.</p>
                            </div>
                        ) : (
                            <>
                                <div className="pl-detail__head">
                                    <div>
                                        <h2>{getClientName(activeLogPost, clients)}</h2>
                                        <p>
                                            {activeLogPost.published_at ? "Published" : "Scheduled"}
                                            {activeWhen ? ` · ${activeWhen}` : ""}
                                        </p>
                                        {activeLogPost.error_message && (
                                            <p className="pl-error">{activeLogPost.error_message}</p>
                                        )}
                                    </div>
                                    <div className="pl-detail__actions">
                                        <span className="pl-badge" data-status={activeLogPost.status} title={activeStatus?.meaning}>
                                            {activeStatus?.label}
                                        </span>
                                        {canDelete && (
                                            <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setShowDeleteConfirm(true)}>
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="pl-grid">
                                    <div className="pl-panel">
                                        <p className="pl-panel__label">Preview</p>
                                        <div className="pl-preview__user">
                                            <span className="pl-avatar">{getClientUsername(activeLogPost).slice(0, 2).toUpperCase()}</span>
                                            <div>
                                                <strong>{getClientUsername(activeLogPost)}</strong>
                                                <span>{activeStatus?.meaning}</span>
                                            </div>
                                        </div>
                                        {(() => {
                                            const thumb = getThumbnail(activeLogPost);
                                            const item = getFirstContentItem(activeLogPost);
                                            if (!thumb) {
                                                return (
                                                    <div className="pl-media pl-media--empty">
                                                        <ImageIcon size={22} />
                                                        <span>No media yet</span>
                                                    </div>
                                                );
                                            }
                                            if (isPdfMedia(item, thumb)) {
                                                return (
                                                    <div className="pl-media">
                                                        <ContentMediaPreview src={thumb} item={item} alt={item?.file_name || "PDF"} />
                                                    </div>
                                                );
                                            }
                                            if (isVideoMedia(item, thumb)) {
                                                return (
                                                    <div className="pl-media">
                                                        <video src={thumb} controls playsInline />
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="pl-media">
                                                    <img src={thumb} alt="" style={{ transform: `rotate(${getRotation(activeLogPost)}deg)` }} />
                                                </div>
                                            );
                                        })()}
                                        <div className="pl-caption">
                                            <p>
                                                <strong>{getClientUsername(activeLogPost)}</strong>
                                                {activeLogPost.caption || "No caption provided."}
                                            </p>
                                            {activeLogPost.hashtags?.length > 0 && (
                                                <p className="pl-hashtags">
                                                    {activeLogPost.hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pl-panel">
                                        <p className="pl-panel__label">Performance</p>
                                        {activeLogPost.status !== "PUBLISHED" ? (
                                            <p className="pl-muted-note">
                                                Metrics appear after a post is published.
                                            </p>
                                        ) : !metrics ? (
                                            <p className="pl-muted-note">Loading metrics…</p>
                                        ) : (
                                            <div className="pl-metrics">
                                                <div className="pl-metric">
                                                    <span><Heart size={13} /> Likes</span>
                                                    <strong>{formatMetric(metrics.likes)}</strong>
                                                    {metrics.likes_trend && <small>{metrics.likes_trend}</small>}
                                                </div>
                                                <div className="pl-metric">
                                                    <span><MessageCircle size={13} /> Comments</span>
                                                    <strong>{formatMetric(metrics.comments)}</strong>
                                                    {metrics.comments_trend && <small>{metrics.comments_trend}</small>}
                                                </div>
                                                <div className="pl-metric">
                                                    <span><Send size={13} /> Shares</span>
                                                    <strong>{formatMetric(metrics.shares)}</strong>
                                                    {metrics.shares_trend && <small>{metrics.shares_trend}</small>}
                                                </div>
                                                <div className="pl-metric">
                                                    <span><Eye size={13} /> Views</span>
                                                    <strong>{formatMetric(metrics.views ?? metrics.impressions)}</strong>
                                                    {metrics.views_trend && <small>{metrics.views_trend}</small>}
                                                </div>
                                                <div className="pl-metric pl-metric--wide">
                                                    <span>Engagement</span>
                                                    <strong>{metrics.engagement_rate ?? "—"}</strong>
                                                </div>
                                                <div className="pl-metric pl-metric--wide">
                                                    <span><Bookmark size={13} /> Saves</span>
                                                    <strong>{formatMetric(metrics.saves)}</strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>

            {showDeleteConfirm && activeLogPost && (
                <div className="cb-overlay cb-overlay--top">
                    <div className="cb-dialog">
                        <div className="cb-dialog__body">
                            <div className="cb-dialog__intro">
                                <div className="cb-dialog__icon"><Trash2 size={20} /></div>
                                <div>
                                    <h3>Delete content</h3>
                                    <p>This cannot be undone.</p>
                                </div>
                            </div>
                            <div className="cb-warn">
                                Remove this post for <strong>{getClientName(activeLogPost, clients)}</strong>?
                                If it is scheduled, it will also be cancelled.
                            </div>
                        </div>
                        <div className="cb-dialog__actions">
                            <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button type="button" className="cb-btn cb-btn--danger" onClick={handleDeletePost} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Yes, delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
