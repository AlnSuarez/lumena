"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    X,
    MessageSquare,
    Sparkles,
    FileText,
    Image as ImageIcon,
    Video,
    Layers,
    Type,
    ThumbsUp,
    ThumbsDown,
    Layout,
    Send,
    RefreshCw,
    Heart,
    Bookmark,
    Maximize2,
    Play,
    Pause,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import ContentMediaPreview, { isPdfMedia, isVideoMedia } from "../../../components/ContentMediaPreview";
import "../content-board.css";
import "./client-review.css";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

function normalizeUrl(url) {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${url}`;
}

function requestItems(req) {
    const items = [...(req.content_items || [])];
    if (req.linked_image_details && items.length === 0) {
        items.push({ media_type: "IMAGE", gallery_image_details: req.linked_image_details });
    }
    return items;
}

function itemSrc(ci, req) {
    return (
        ci?.gallery_image_details?.image_url
        || ci?.gallery_image_details?.image_compressed
        || ci?.gallery_image_details?.image
        || normalizeUrl(ci?.file_url)
        || normalizeUrl(req?.linked_image_details?.image_compressed)
        || normalizeUrl(req?.linked_image_details?.image)
    );
}

function brandName(req) {
    return req.client_details?.client_profile?.practice_name || req.client_details?.username || "Brand Account";
}

function typeLabel(type) {
    return (type || "").replaceAll("_", " ").toLowerCase();
}

function monthLabel(month) {
    const parsed = new Date(month);
    if (Number.isNaN(parsed.getTime())) return month || "";
    return parsed.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function requestTypeIcon(type) {
    switch (type) {
        case "VIDEO_SHOOT": return Video;
        case "CAROUSEL": return Layers;
        case "MONTHLY_CONTENT": return Layout;
        default: return Type;
    }
}

function CardVideoPlayer({ src }) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayPause = (e) => {
        e.stopPropagation();
        const video = e.currentTarget.closest(".cr-video")?.querySelector("video");
        if (!video) return;
        if (video.paused) {
            video.play().then(() => setIsPlaying(true)).catch((err) => console.error("Error playing video:", err));
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div className={`cr-video${isPlaying ? " is-playing" : ""}`}>
            <video
                src={src}
                loop
                playsInline
                onClick={handlePlayPause}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            <button type="button" className="cr-video__play" onClick={handlePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
            </button>
        </div>
    );
}

function MediaBlock({ src, item, alt }) {
    if (!src) return null;
    if (isPdfMedia(item, src)) return <ContentMediaPreview src={src} item={item} alt={alt || "PDF"} />;
    if (isVideoMedia(item, src)) return <CardVideoPlayer src={src} />;
    return <img src={src} alt={alt || "Media"} style={{ transform: `rotate(${item?.rotation || 0}deg)` }} />;
}

export default function ClientReviewPage() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isRequestsLoading, setIsRequestsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [revisionRequest, setRevisionRequest] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [previewRequest, setPreviewRequest] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [cardIndices, setCardIndices] = useState({});
    const [approvingRequest, setApprovingRequest] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handlePrevCardItem = (e, reqId, totalItems) => {
        e.stopPropagation();
        setCardIndices((prev) => ({
            ...prev,
            [reqId]: Math.max(0, (prev[reqId] || 0) - 1),
        }));
    };

    const handleNextCardItem = (e, reqId, totalItems) => {
        e.stopPropagation();
        setCardIndices((prev) => ({
            ...prev,
            [reqId]: Math.min(totalItems - 1, (prev[reqId] || 0) + 1),
        }));
    };

    const fetchPendingRequests = async ({ silent = false } = {}) => {
        const userId = localStorage.getItem("userId");
        const userRole = localStorage.getItem("userRole");
        if (!userId) return;

        if (silent) setIsRefreshing(true);
        else setIsRequestsLoading(true);

        try {
            const url = new URL(`${API_BASE}/contents/monthly-requests/`);
            url.searchParams.append("user_id", userId);
            url.searchParams.append("role", userRole || "CLIENT");

            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data.filter((req) => req.status === "CLIENT_REVIEW"));
            } else {
                toast.error("Could not load content for review.");
            }
        } catch (error) {
            console.error("Error loading pending requests:", error);
            toast.error("Network error while loading reviews.");
        } finally {
            setIsRequestsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const patchRequest = async (requestId, body) => {
        const userId = localStorage.getItem("userId");
        const userRole = localStorage.getItem("userRole");
        const updateUrl = new URL(`${API_BASE}/contents/monthly-requests/${requestId}/`);
        if (userId) updateUrl.searchParams.append("user_id", userId);
        if (userRole) updateUrl.searchParams.append("role", userRole);

        return fetch(updateUrl.toString(), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    };

    const handleApproveConfirm = async () => {
        if (!approvingRequest) return;
        setIsSaving(true);
        try {
            const response = await patchRequest(approvingRequest.id, { status: "APPROVED" });
            if (response.ok) {
                toast.success("Content approved. It will go to the scheduler.");
                setApprovingRequest(null);
                fetchPendingRequests({ silent: true });
            } else {
                toast.error("Could not approve this content.");
            }
        } catch (error) {
            console.error("Error approving content:", error);
            toast.error("Network error while approving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRequestRevision = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) {
            toast.error("Describe the adjustments required.");
            return;
        }

        setIsSaving(true);
        try {
            const response = await patchRequest(revisionRequest.id, {
                status: "IN_REVISION",
                feedback: feedbackText,
                client_feedback: feedbackText,
            });

            if (response.ok) {
                toast.success("Revision sent to your team.");
                setRevisionRequest(null);
                setFeedbackText("");
                fetchPendingRequests({ silent: true });
            } else {
                toast.error("Could not send feedback.");
            }
        } catch (error) {
            console.error("Error requesting revision:", error);
            toast.error("Network error while sending feedback.");
        } finally {
            setIsSaving(false);
        }
    };

    const previewItems = previewRequest ? requestItems(previewRequest) : [];
    const previewSafeIndex = Math.min(previewIndex, Math.max(0, previewItems.length - 1));
    const previewItem = previewItems[previewSafeIndex] || {};
    const previewSrc = itemSrc(previewItem, previewRequest);

    return (
        <div className="content-board client-review">
            <Toaster position="bottom-right" richColors />

            <div className="cb-header">
                <div className="cb-header__titles">
                    <h1>Client Review</h1>
                    <p>Approve drafts or send them back with notes.</p>
                </div>
                <div className="cb-header__actions">
                    <button
                        type="button"
                        className="cb-btn cb-btn--ghost"
                        onClick={() => fetchPendingRequests({ silent: true })}
                        disabled={isRequestsLoading || isRefreshing}
                    >
                        <RefreshCw size={15} />
                        {isRefreshing || isRequestsLoading ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            {isRequestsLoading ? (
                <div className="cb-empty"><strong>Loading pending approvals…</strong></div>
            ) : pendingRequests.length === 0 ? (
                <div className="cb-empty">
                    <div className="cb-empty__icon is-ok">
                        <CheckCircle2 size={18} />
                    </div>
                    <strong>All caught up</strong>
                    <p>Nothing is waiting for your approval right now.</p>
                </div>
            ) : (
                <div className="cr-grid">
                    {pendingRequests.map((req) => {
                        const Icon = requestTypeIcon(req.request_type);
                        const items = requestItems(req);
                        const totalItems = items.length;
                        const safeIdx = Math.min(cardIndices[req.id] || 0, Math.max(0, totalItems - 1));
                        const current = items[safeIdx] || {};
                        const src = itemSrc(current, req);
                        const caption = req.ai_caption || req.content_text;

                        return (
                            <article key={req.id} className="cr-card">
                                <div className="cr-card__head">
                                    <div className="cr-card__type">
                                        <span className="cr-card__icon"><Icon size={16} /></span>
                                        <div>
                                            <strong>{typeLabel(req.request_type)}</strong>
                                            <span>{monthLabel(req.month)}</span>
                                        </div>
                                    </div>
                                    <span className="cr-pending">Pending review</span>
                                </div>

                                <div className="cr-post">
                                    <div className="cr-post__head">
                                        <div className="cr-post__who">
                                            <span className="cr-avatar">
                                                {req.client_details?.client_profile?.logo ? (
                                                    <img src={normalizeUrl(req.client_details.client_profile.logo)} alt="" />
                                                ) : (
                                                    brandName(req).charAt(0).toUpperCase()
                                                )}
                                            </span>
                                            <div>
                                                <strong>{brandName(req)}</strong>
                                                <span>Content preview</span>
                                            </div>
                                        </div>
                                        <span className="cr-preview-tag">Preview</span>
                                    </div>

                                    <div className={`cr-media${src ? "" : " cr-media--empty"}`}>
                                        {src ? (
                                            <>
                                                <MediaBlock src={src} item={current} alt={current.gallery_image_details?.title || current.file_name} />
                                                <button
                                                    type="button"
                                                    className="cr-media__expand"
                                                    title="Expand preview"
                                                    aria-label="Expand preview"
                                                    onClick={() => {
                                                        setPreviewRequest(req);
                                                        setPreviewIndex(safeIdx);
                                                    }}
                                                >
                                                    <Maximize2 size={14} />
                                                </button>
                                                {totalItems > 1 && safeIdx > 0 && (
                                                    <button type="button" className="cr-media__nav is-prev" onClick={(e) => handlePrevCardItem(e, req.id, totalItems)} aria-label="Previous">
                                                        <ChevronLeft size={16} />
                                                    </button>
                                                )}
                                                {totalItems > 1 && safeIdx < totalItems - 1 && (
                                                    <button type="button" className="cr-media__nav is-next" onClick={(e) => handleNextCardItem(e, req.id, totalItems)} aria-label="Next">
                                                        <ChevronRight size={16} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon size={22} />
                                                Visual asset pending
                                            </>
                                        )}
                                    </div>

                                    <div className="cr-post__bar">
                                        <div className="cr-post__bar-actions">
                                            <button type="button" disabled aria-hidden="true"><Heart size={15} /></button>
                                            <button type="button" disabled aria-hidden="true"><MessageSquare size={15} /></button>
                                            <button type="button" disabled aria-hidden="true"><Send size={13} /></button>
                                        </div>
                                        {totalItems > 1 && (
                                            <div className="cr-dots">
                                                {items.map((_, idx) => (
                                                    <i key={idx} className={idx === safeIdx ? "is-on" : ""} />
                                                ))}
                                            </div>
                                        )}
                                        <button type="button" disabled aria-hidden="true"><Bookmark size={15} /></button>
                                    </div>

                                    {caption && (
                                        <div className="cr-post__caption">
                                            <p><strong>{brandName(req)}</strong>{caption}</p>
                                        </div>
                                    )}
                                </div>

                                {req.content_text && (
                                    <div className="cr-note">
                                        <small><FileText size={10} /> Strategy copy</small>
                                        <p>{req.content_text}</p>
                                    </div>
                                )}

                                {req.ai_caption && (
                                    <div className="cr-note cr-note--caption">
                                        <small><Sparkles size={10} /> Suggested caption</small>
                                        <p>{req.ai_caption}</p>
                                    </div>
                                )}

                                <div className="cr-card__actions">
                                    <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setRevisionRequest(req)}>
                                        <ThumbsDown size={14} /> Request changes
                                    </button>
                                    <button type="button" className="cb-btn cb-btn--primary" onClick={() => setApprovingRequest(req)}>
                                        <ThumbsUp size={14} /> Approve
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {previewRequest && (
                <div className="cr-lightbox" onClick={() => setPreviewRequest(null)}>
                    <div className="cr-lightbox__frame" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="cr-lightbox__close" onClick={() => setPreviewRequest(null)} aria-label="Close">
                            <X size={18} />
                        </button>
                        <div className="cr-lightbox__stage">
                            {previewSrc ? (
                                <>
                                    {isPdfMedia(previewItem, previewSrc) ? (
                                        <ContentMediaPreview src={previewSrc} item={previewItem} alt={previewItem.file_name || "PDF"} />
                                    ) : isVideoMedia(previewItem, previewSrc) ? (
                                        <video src={previewSrc} controls />
                                    ) : (
                                        <img
                                            src={previewSrc}
                                            alt={previewItem.gallery_image_details?.title || "Media"}
                                            style={{ transform: `rotate(${previewItem.rotation || 0}deg)` }}
                                        />
                                    )}
                                    {previewItems.length > 1 && (
                                        <>
                                            {previewSafeIndex > 0 && (
                                                <button type="button" className="cr-lightbox__nav is-prev" onClick={() => setPreviewIndex(previewSafeIndex - 1)} aria-label="Previous">
                                                    <ChevronLeft size={20} />
                                                </button>
                                            )}
                                            {previewSafeIndex < previewItems.length - 1 && (
                                                <button type="button" className="cr-lightbox__nav is-next" onClick={() => setPreviewIndex(previewSafeIndex + 1)} aria-label="Next">
                                                    <ChevronRight size={20} />
                                                </button>
                                            )}
                                            <div className="cr-lightbox__dots">
                                                {previewItems.map((item, idx) => (
                                                    <button
                                                        key={item.id || idx}
                                                        type="button"
                                                        className={idx === previewSafeIndex ? "is-on" : ""}
                                                        onClick={() => setPreviewIndex(idx)}
                                                        aria-label={`Slide ${idx + 1}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="cr-lightbox__count">{previewSafeIndex + 1}/{previewItems.length}</div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="cr-lightbox__empty">
                                    <ImageIcon size={28} />
                                    No media available
                                </div>
                            )}
                        </div>
                        {previewItem.media_type && (
                            <div className="cr-lightbox__meta">
                                <span>{typeLabel(previewItem.media_type)}</span>
                                {previewItem.gallery_image_details?.folio && <span>Folio {previewItem.gallery_image_details.folio}</span>}
                                {previewItem.caption && <span>{previewItem.caption}</span>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {revisionRequest && (
                <div className="cb-overlay">
                    <div className="cb-dialog">
                        <form onSubmit={handleRequestRevision}>
                            <div className="cb-dialog__body">
                                <div className="cb-dialog__intro">
                                    <div className="cb-dialog__icon"><ThumbsDown size={18} /></div>
                                    <div>
                                        <h3>Request changes</h3>
                                        <p>Send this draft back to your team.</p>
                                    </div>
                                </div>
                                <div className="cb-field">
                                    <label htmlFor="cr-feedback">Adjustments required</label>
                                    <textarea
                                        id="cr-feedback"
                                        required
                                        rows={5}
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Describe exactly what needs to change…"
                                    />
                                </div>
                            </div>
                            <div className="cb-dialog__actions">
                                <button type="button" className="cb-btn cb-btn--ghost" onClick={() => { setRevisionRequest(null); setFeedbackText(""); }} disabled={isSaving}>
                                    Cancel
                                </button>
                                <button type="submit" className="cb-btn cb-btn--danger" disabled={isSaving}>
                                    <Send size={14} /> {isSaving ? "Sending…" : "Send feedback"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {approvingRequest && (
                <div className="cb-overlay cb-overlay--top">
                    <div className="cb-dialog">
                        <div className="cb-dialog__body">
                            <div className="cb-dialog__intro">
                                <div className="cb-dialog__icon cr-ok-icon">
                                    <ThumbsUp size={18} />
                                </div>
                                <div>
                                    <h3>Approve content</h3>
                                    <p>It will be sent to the scheduler to publish.</p>
                                </div>
                            </div>
                            <div className="cb-warn">
                                Approve <strong>{typeLabel(approvingRequest.request_type)}</strong> for {monthLabel(approvingRequest.month)}?
                            </div>
                        </div>
                        <div className="cb-dialog__actions">
                            <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setApprovingRequest(null)} disabled={isSaving}>Cancel</button>
                            <button type="button" className="cb-btn cb-btn--primary" onClick={handleApproveConfirm} disabled={isSaving}>
                                {isSaving ? "Approving…" : "Yes, approve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
