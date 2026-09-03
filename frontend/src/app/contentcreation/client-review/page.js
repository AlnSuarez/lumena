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
    Palette,
    FileEdit,
    RotateCcw,
    Check,
    Clock,
    AlertTriangle,
    LayoutGrid,
    List,
    SlidersHorizontal,
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
    if (!req) return [];
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
    return req?.client_details?.client_profile?.practice_name || req?.client_details?.username || "Brand Account";
}

function typeLabel(type) {
    if (!type) return "Publication";
    switch (type) {
        case "VIDEO_SHOOT": return "Video shoot";
        case "CAROUSEL": return "Carousel post";
        case "MONTHLY_CONTENT": return "Monthly content";
        case "CONTENT_REQUEST": return "Content request";
        default: return type.replaceAll("_", " ").toLowerCase();
    }
}

function monthLabel(month) {
    const parsed = new Date(month);
    if (Number.isNaN(parsed.getTime())) return month || "";
    return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function requestTypeIcon(type) {
    switch (type) {
        case "VIDEO_SHOOT": return Video;
        case "CAROUSEL": return Layers;
        case "MONTHLY_CONTENT": return Layout;
        default: return Type;
    }
}

const REVISION_CATEGORIES = [
    { id: "DESIGN", label: "Visual & Design", icon: Palette, hint: "Images, artwork typography, framing, or colors" },
    { id: "COPY", label: "Copy & Text", icon: FileEdit, hint: "Message, spelling, call to action (CTA), or tone of voice" },
    { id: "GENERAL", label: "General & Details", icon: Sparkles, hint: "Dates, pricing, tags, or overall concept" },
];

const QUICK_PILLS_BY_CAT = {
    DESIGN: [
        "Change main image",
        "Fix text in artwork / headline",
        "Adjust colors or contrast",
        "Improve cropping / framing",
        "Update brand logo",
        "Change typography in design",
    ],
    COPY: [
        "Fix spelling or grammar",
        "Adjust brand tone of voice",
        "Modify call to action (CTA)",
        "Update dates, hours, or pricing",
        "Add or change hashtags",
        "Tag account or mention link in bio",
    ],
    GENERAL: [
        "Doesn't match monthly campaign",
        "Offer or service has changed",
        "Key commercial details missing",
        "Change publication format",
    ],
};

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
                {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
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
    const [allRequests, setAllRequests] = useState([]);
    const [isRequestsLoading, setIsRequestsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("pending"); // "pending" | "approved" | "in_revision"
    const [viewMode, setViewMode] = useState("studio"); // "studio" (zero-scroll) | "grid"
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [cardIndices, setCardIndices] = useState({});

    // Lightbox modal
    const [previewRequest, setPreviewRequest] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(0);

    // Approval state
    const [approvingRequest, setApprovingRequest] = useState(null);
    const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Structured rework state
    const [revisionRequest, setRevisionRequest] = useState(null);
    const [revisionCategory, setRevisionCategory] = useState("DESIGN");
    const [selectedSlide, setSelectedSlide] = useState("ALL");
    const [selectedPills, setSelectedPills] = useState([]);
    const [feedbackText, setFeedbackText] = useState("");

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

    const fetchRequests = async ({ silent = false } = {}) => {
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
                setAllRequests(data);
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
        fetchRequests();
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
                toast.success("Post approved successfully! Moving to scheduling.");
                setApprovingRequest(null);
                await fetchRequests({ silent: true });
            } else {
                toast.error("Could not approve this post.");
            }
        } catch (error) {
            console.error("Error approving content:", error);
            toast.error("Network error while approving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkApprove = async () => {
        const pending = allRequests.filter((r) => r.status === "CLIENT_REVIEW");
        if (pending.length === 0) return;
        setIsSaving(true);
        try {
            const promises = pending.map((req) =>
                patchRequest(req.id, { status: "APPROVED" })
            );
            const results = await Promise.all(promises);
            const allOk = results.every((r) => r.ok);
            if (allOk) {
                toast.success(`Great! All ${pending.length} pending posts have been approved.`);
                setIsBulkApproveModalOpen(false);
                await fetchRequests({ silent: true });
            } else {
                toast.warning("Some posts could not be approved.");
                await fetchRequests({ silent: true });
            }
        } catch (err) {
            console.error(err);
            toast.error("Error processing batch approval.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUndoStatus = async (req) => {
        setIsSaving(true);
        try {
            const response = await patchRequest(req.id, { status: "CLIENT_REVIEW" });
            if (response.ok) {
                toast.success("Post returned to Pending review.");
                await fetchRequests({ silent: true });
            } else {
                toast.error("Could not restore status.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error restoring post.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenRevisionModal = (req) => {
        setRevisionRequest(req);
        setRevisionCategory("DESIGN");
        setSelectedSlide("ALL");
        setSelectedPills([]);
        setFeedbackText("");
    };

    const handleTogglePill = (pill) => {
        setSelectedPills((prev) =>
            prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill]
        );
    };

    const handleSendRevision = async (e) => {
        e.preventDefault();
        if (selectedPills.length === 0 && !feedbackText.trim()) {
            toast.error("Please select at least one reason or enter adjustment details.");
            return;
        }

        const catObj = REVISION_CATEGORIES.find((c) => c.id === revisionCategory);
        const catLabel = catObj?.label || revisionCategory;

        let slideTag = "";
        if (selectedSlide !== "ALL") {
            slideTag = ` • Slide ${Number(selectedSlide) + 1}`;
        }

        const parts = [];
        parts.push(`[${catLabel}${slideTag}]`);
        if (selectedPills.length > 0) {
            parts.push(`Reasons: ${selectedPills.join(", ")}.`);
        }
        if (feedbackText.trim()) {
            parts.push(`Details: ${feedbackText.trim()}`);
        }

        const structuredFeedback = parts.join(" ");

        setIsSaving(true);
        try {
            const response = await patchRequest(revisionRequest.id, {
                status: "IN_REVISION",
                feedback: structuredFeedback,
                client_feedback: structuredFeedback,
            });

            if (response.ok) {
                toast.success("Rework feedback sent to creative team.");
                setRevisionRequest(null);
                setFeedbackText("");
                setSelectedPills([]);
                setSelectedSlide("ALL");
                await fetchRequests({ silent: true });
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

    // Filtered lists
    const pendingRequests = allRequests.filter((r) => r.status === "CLIENT_REVIEW");
    const approvedRequests = allRequests.filter((r) => r.status === "APPROVED");
    const revisionRequests = allRequests.filter((r) => r.status === "IN_REVISION");

    const totalReviewable = pendingRequests.length + approvedRequests.length + revisionRequests.length;
    const completedCount = approvedRequests.length + revisionRequests.length;
    const progressPercent = totalReviewable > 0 ? Math.round((completedCount / totalReviewable) * 100) : 100;

    let displayList = [];
    if (activeTab === "pending") displayList = pendingRequests;
    else if (activeTab === "approved") displayList = approvedRequests;
    else if (activeTab === "in_revision") displayList = revisionRequests;

    // Synchronize selected post for zero-scroll studio
    useEffect(() => {
        if (displayList.length > 0) {
            if (!selectedRequestId || !displayList.some((r) => r.id === selectedRequestId)) {
                setSelectedRequestId(displayList[0].id);
            }
        } else {
            setSelectedRequestId(null);
        }
    }, [displayList, selectedRequestId]);

    const activeRequest = displayList.find((r) => r.id === selectedRequestId) || displayList[0] || null;
    const activeIndex = displayList.findIndex((r) => r.id === activeRequest?.id);

    const handlePrevPost = () => {
        if (activeIndex > 0) {
            setSelectedRequestId(displayList[activeIndex - 1].id);
        }
    };

    const handleNextPost = () => {
        if (activeIndex < displayList.length - 1) {
            setSelectedRequestId(displayList[activeIndex + 1].id);
        }
    };

    // Lightbox items
    const previewItems = previewRequest ? requestItems(previewRequest) : [];
    const previewSafeIndex = Math.min(previewIndex, Math.max(0, previewItems.length - 1));
    const previewItem = previewItems[previewSafeIndex] || {};
    const previewSrc = itemSrc(previewItem, previewRequest);

    const renderPostCard = (req, isStudioActive = false) => {
        const Icon = requestTypeIcon(req.request_type);
        const items = requestItems(req);
        const totalItems = items.length;
        const safeIdx = Math.min(cardIndices[req.id] || 0, Math.max(0, totalItems - 1));
        const current = items[safeIdx] || {};
        const src = itemSrc(current, req);
        const caption = req.content_text || req.ai_caption;
        const isCarousel = totalItems > 1;

        return (
            <article key={req.id} className={`cr-feed-post${isStudioActive ? " is-studio-main" : ""}`}>
                {/* Post Header */}
                <div className="cr-post-header">
                    <div className="cr-post-author">
                        <div className="cr-post-avatar-ring">
                            <span className="cr-avatar">
                                {req.client_details?.client_profile?.logo ? (
                                    <img src={normalizeUrl(req.client_details.client_profile.logo)} alt="" />
                                ) : (
                                    brandName(req).charAt(0).toUpperCase()
                                )}
                            </span>
                        </div>
                        <div className="cr-post-author-info">
                            <div className="cr-post-author-row">
                                <strong className="cr-author-name">{brandName(req)}</strong>
                                <span className="cr-verified-badge" title="Verified account">✓</span>
                            </div>
                            <span className="cr-post-meta-sub">
                                {typeLabel(req.request_type)} • {monthLabel(req.month)} • Original audio
                            </span>
                        </div>
                    </div>
                    <div className="cr-post-header-tools">
                        <span className="cr-type-badge">
                            <Icon size={12} />
                            <span>{typeLabel(req.request_type)}</span>
                        </span>
                        {isCarousel && (
                            <span className="cr-slide-pill">{safeIdx + 1}/{totalItems}</span>
                        )}
                    </div>
                </div>

                {/* Media Frame */}
                <div className={`cr-media-frame${src ? "" : " is-empty"}`}>
                    {src ? (
                        <>
                            <MediaBlock
                                src={src}
                                item={current}
                                alt={current.gallery_image_details?.title || current.file_name}
                            />
                            <button
                                type="button"
                                className="cr-media-expand-btn"
                                title="View fullscreen"
                                aria-label="View fullscreen"
                                onClick={() => {
                                    setPreviewRequest(req);
                                    setPreviewIndex(safeIdx);
                                }}
                            >
                                <Maximize2 size={15} />
                            </button>
                            {isCarousel && safeIdx > 0 && (
                                <button
                                    type="button"
                                    className="cr-media-nav is-prev"
                                    onClick={(e) => handlePrevCardItem(e, req.id, totalItems)}
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                            )}
                            {isCarousel && safeIdx < totalItems - 1 && (
                                <button
                                    type="button"
                                    className="cr-media-nav is-next"
                                    onClick={(e) => handleNextCardItem(e, req.id, totalItems)}
                                    aria-label="Next slide"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="cr-media-placeholder">
                            <ImageIcon size={30} />
                            <h4>Visual asset in progress</h4>
                            <p>The creative team is finalizing visual assets.</p>
                        </div>
                    )}
                </div>

                {/* Carousel Mini Dots */}
                {isCarousel && (
                    <div className="cr-carousel-bar">
                        <div className="cr-carousel-dots">
                            {items.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`cr-carousel-dot${idx === safeIdx ? " is-active" : ""}`}
                                    onClick={() => setCardIndices((prev) => ({ ...prev, [req.id]: idx }))}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Social Interaction Action Bar */}
                <div className="cr-social-action-bar">
                    <div className="cr-social-left">
                        <button type="button" className="cr-social-icon" title="Like"><Heart size={18} /></button>
                        <button type="button" className="cr-social-icon" title="Comment"><MessageSquare size={18} /></button>
                        <button type="button" className="cr-social-icon" title="Share"><Send size={17} /></button>
                    </div>
                    <button type="button" className="cr-social-icon" title="Bookmark"><Bookmark size={18} /></button>
                </div>

                {/* Social Likes Counter */}
                <div className="cr-social-likes">
                    Liked by <strong>lumena_creative</strong> and <strong>others</strong>
                </div>

                {/* Post Caption Section */}
                <div className="cr-post-caption-section">
                    <div className="cr-post-caption-text">
                        <strong>{brandName(req)}</strong>
                        <p>{caption || "No caption text specified yet."}</p>
                    </div>

                    {req.ai_caption && req.content_text && req.ai_caption !== req.content_text && (
                        <div className="cr-caption-ai-note">
                            <Sparkles size={13} />
                            <span><strong>AI Suggestion:</strong> {req.ai_caption}</span>
                        </div>
                    )}
                </div>

                {/* Status Banners */}
                {req.status === "APPROVED" && (
                    <div className="cr-status-banner is-approved">
                        <div className="cr-status-banner-content">
                            <CheckCircle2 size={16} />
                            <div>
                                <strong>Post approved</strong>
                                <p>Ready for schedule and automated publishing.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="cr-btn-undo"
                            onClick={() => handleUndoStatus(req)}
                            disabled={isSaving}
                        >
                            <RotateCcw size={12} /> Undo
                        </button>
                    </div>
                )}

                {req.status === "IN_REVISION" && (
                    <div className="cr-status-banner is-revision">
                        <div className="cr-status-banner-content">
                            <AlertTriangle size={16} />
                            <div>
                                <strong>In rework process</strong>
                                <p>{req.client_feedback || req.feedback || "Changes requested by client."}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="cr-btn-undo"
                            onClick={() => handleUndoStatus(req)}
                            disabled={isSaving}
                        >
                            <RotateCcw size={12} /> Undo
                        </button>
                    </div>
                )}

                {/* Decision Bar */}
                {req.status === "CLIENT_REVIEW" && (
                    <div className="cr-decision-bar">
                        <button
                            type="button"
                            className="cr-decision-btn is-revision"
                            onClick={() => handleOpenRevisionModal(req)}
                            disabled={isSaving}
                        >
                            <ThumbsDown size={15} />
                            <span>Request changes</span>
                        </button>
                        <button
                            type="button"
                            className="cr-decision-btn is-approve"
                            onClick={() => setApprovingRequest(req)}
                            disabled={isSaving}
                        >
                            <CheckCircle2 size={16} />
                            <span>Approve post</span>
                        </button>
                    </div>
                )}
            </article>
        );
    };

    return (
        <div className="content-board client-review">
            <Toaster position="bottom-right" richColors />

            {/* Top Header */}
            <div className="cb-header cr-top-header">
                <div className="cb-header__titles">
                    <h1>Client Review & Approval</h1>
                    <p>Review your content in native social feed format, approve drafts, or request adjustments.</p>
                </div>
                <div className="cb-header__actions">
                    <div className="cr-view-toggle">
                        <button
                            type="button"
                            className={`cr-view-btn${viewMode === "studio" ? " is-active" : ""}`}
                            onClick={() => setViewMode("studio")}
                            title="Zero-scroll Studio View"
                        >
                            <List size={14} />
                            <span>Studio</span>
                        </button>
                        <button
                            type="button"
                            className={`cr-view-btn${viewMode === "grid" ? " is-active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="Grid Overview"
                        >
                            <LayoutGrid size={14} />
                            <span>Grid</span>
                        </button>
                    </div>
                    <button
                        type="button"
                        className="cb-btn cb-btn--ghost"
                        onClick={() => fetchRequests({ silent: true })}
                        disabled={isRequestsLoading || isRefreshing}
                    >
                        <RefreshCw size={14} className={isRefreshing ? "cr-spin" : ""} />
                        {isRefreshing || isRequestsLoading ? "Refreshing…" : "Refresh"}
                    </button>
                    {pendingRequests.length > 0 && (
                        <button
                            type="button"
                            className="cb-btn cb-btn--primary"
                            onClick={() => setIsBulkApproveModalOpen(true)}
                        >
                            <CheckCircle2 size={15} />
                            Approve all ({pendingRequests.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Review Progress Deck & Status Tabs */}
            <div className="cr-review-deck">
                <div className="cr-progress-bar-wrap">
                    <div className="cr-progress-info">
                        <span>Approval Progress: <strong>{completedCount} of {totalReviewable} posts</strong></span>
                        <span className="cr-progress-percentage">{progressPercent}%</span>
                    </div>
                    <div className="cr-progress-track">
                        <div className="cr-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>

                <div className="cr-tabs" role="tablist">
                    <button
                        type="button"
                        className={`cr-tab${activeTab === "pending" ? " is-active" : ""}`}
                        onClick={() => setActiveTab("pending")}
                    >
                        <Clock size={14} />
                        <span>Pending review</span>
                        <span className="cr-tab-badge is-pending">{pendingRequests.length}</span>
                    </button>
                    <button
                        type="button"
                        className={`cr-tab${activeTab === "approved" ? " is-active" : ""}`}
                        onClick={() => setActiveTab("approved")}
                    >
                        <Check size={14} />
                        <span>Approved</span>
                        <span className="cr-tab-badge is-approved">{approvedRequests.length}</span>
                    </button>
                    <button
                        type="button"
                        className={`cr-tab${activeTab === "in_revision" ? " is-active" : ""}`}
                        onClick={() => setActiveTab("in_revision")}
                    >
                        <RotateCcw size={13} />
                        <span>In revision</span>
                        <span className="cr-tab-badge is-revision">{revisionRequests.length}</span>
                    </button>
                </div>
            </div>

            {/* Main Stage Content */}
            {isRequestsLoading ? (
                <div className="cb-empty">
                    <RefreshCw size={24} className="cr-spin" />
                    <strong>Loading content for review…</strong>
                </div>
            ) : displayList.length === 0 ? (
                <div className="cb-empty">
                    <div className="cb-empty__icon is-ok">
                        <CheckCircle2 size={24} />
                    </div>
                    <strong>
                        {activeTab === "pending"
                            ? "All caught up! No pending posts to review."
                            : activeTab === "approved"
                            ? "No approved posts yet."
                            : "No posts currently in rework."}
                    </strong>
                    <p>
                        {activeTab === "pending"
                            ? "When your creative team prepares new monthly content or requests, they will appear here."
                            : "Explore the other tabs to check your content history."}
                    </p>
                </div>
            ) : viewMode === "studio" ? (
                /* Zero-Scroll Studio Layout */
                <div className="cr-studio-stage">
                    {/* Left Posts Queue */}
                    <div className="cr-queue-panel">
                        <div className="cr-queue-header">
                            <span className="cr-queue-title">Review Queue</span>
                            <span className="cr-queue-count">{displayList.length} items</span>
                        </div>
                        <div className="cr-queue-list">
                            {displayList.map((req, idx) => {
                                const isSelected = req.id === activeRequest?.id;
                                const items = requestItems(req);
                                const thumbSrc = itemSrc(items[0] || {}, req);
                                const Icon = requestTypeIcon(req.request_type);

                                return (
                                    <button
                                        key={req.id}
                                        type="button"
                                        className={`cr-queue-item${isSelected ? " is-selected" : ""}`}
                                        onClick={() => setSelectedRequestId(req.id)}
                                    >
                                        <div className="cr-queue-thumb">
                                            {thumbSrc ? (
                                                <img src={thumbSrc} alt="" />
                                            ) : (
                                                <Icon size={16} />
                                            )}
                                        </div>
                                        <div className="cr-queue-item-info">
                                            <div className="cr-queue-item-row">
                                                <span className="cr-queue-item-title">{typeLabel(req.request_type)}</span>
                                                <span className="cr-queue-item-idx">#{idx + 1}</span>
                                            </div>
                                            <span className="cr-queue-item-sub">{monthLabel(req.month)}</span>
                                            <div className="cr-queue-item-status">
                                                {req.status === "APPROVED" && <span className="cr-pill-ok">Approved</span>}
                                                {req.status === "IN_REVISION" && <span className="cr-pill-warn">Rework</span>}
                                                {req.status === "CLIENT_REVIEW" && <span className="cr-pill-wait">Pending</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Center Zero-Scroll Mockup Stage */}
                    <div className="cr-mockup-stage">
                        {activeRequest && renderPostCard(activeRequest, true)}

                        {/* Quick Queue Navigator Bar */}
                        <div className="cr-stage-nav-bar">
                            <button
                                type="button"
                                className="cr-stage-nav-btn"
                                onClick={handlePrevPost}
                                disabled={activeIndex <= 0}
                            >
                                <ChevronLeft size={16} />
                                <span>Previous</span>
                            </button>
                            <span className="cr-stage-nav-counter">
                                Post <strong>{activeIndex + 1}</strong> of <strong>{displayList.length}</strong>
                            </span>
                            <button
                                type="button"
                                className="cr-stage-nav-btn"
                                onClick={handleNextPost}
                                disabled={activeIndex >= displayList.length - 1}
                            >
                                <span>Next</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Grid Overview Layout */
                <div className="cr-posts-container is-grid">
                    {displayList.map((req) => renderPostCard(req, false))}
                </div>
            )}

            {/* Lightbox Modal */}
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
                                        <video src={previewSrc} controls autoPlay />
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
                                                    <ChevronLeft size={22} />
                                                </button>
                                            )}
                                            {previewSafeIndex < previewItems.length - 1 && (
                                                <button type="button" className="cr-lightbox__nav is-next" onClick={() => setPreviewIndex(previewSafeIndex + 1)} aria-label="Next">
                                                    <ChevronRight size={22} />
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
                                    <ImageIcon size={32} />
                                    No media files available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Structured Rework Feedback Modal */}
            {revisionRequest && (
                <div className="cb-overlay" onClick={() => setRevisionRequest(null)}>
                    <div className="cr-rework-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="cr-rework-head">
                            <div className="cr-rework-title-wrap">
                                <div className="cr-rework-icon-badge">
                                    <FileEdit size={18} />
                                </div>
                                <div>
                                    <h3>Request changes for rework</h3>
                                    <p>Specify what the creative team needs to adjust to make it perfect.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="cr-modal-close"
                                onClick={() => setRevisionRequest(null)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSendRevision} className="cr-rework-form">
                            {/* Step 1: Area / Category Selector */}
                            <div className="cr-rework-field">
                                <label className="cr-rework-label">1. Which area requires changes?</label>
                                <div className="cr-cat-grid">
                                    {REVISION_CATEGORIES.map((cat) => {
                                        const CatIcon = cat.icon;
                                        const isSelected = revisionCategory === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                className={`cr-cat-btn${isSelected ? " is-selected" : ""}`}
                                                onClick={() => {
                                                    setRevisionCategory(cat.id);
                                                    setSelectedPills([]);
                                                }}
                                            >
                                                <CatIcon size={16} />
                                                <div className="cr-cat-text">
                                                    <strong>{cat.label}</strong>
                                                    <small>{cat.hint}</small>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2: Slide Selector (if Carousel) */}
                            {requestItems(revisionRequest).length > 1 && (
                                <div className="cr-rework-field">
                                    <label className="cr-rework-label">2. Which slide needs adjustments?</label>
                                    <div className="cr-slide-selector">
                                        <button
                                            type="button"
                                            className={`cr-slide-chip${selectedSlide === "ALL" ? " is-selected" : ""}`}
                                            onClick={() => setSelectedSlide("ALL")}
                                        >
                                            All slides
                                        </button>
                                        {requestItems(revisionRequest).map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className={`cr-slide-chip${selectedSlide === idx ? " is-selected" : ""}`}
                                                onClick={() => setSelectedSlide(idx)}
                                            >
                                                Slide {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Quick Reason Pills */}
                            <div className="cr-rework-field">
                                <label className="cr-rework-label">
                                    {requestItems(revisionRequest).length > 1 ? "3." : "2."} Common reasons (click to toggle):
                                </label>
                                <div className="cr-pills-wrap">
                                    {(QUICK_PILLS_BY_CAT[revisionCategory] || []).map((pill) => {
                                        const isPillSelected = selectedPills.includes(pill);
                                        return (
                                            <button
                                                key={pill}
                                                type="button"
                                                className={`cr-quick-pill${isPillSelected ? " is-active" : ""}`}
                                                onClick={() => handleTogglePill(pill)}
                                            >
                                                {isPillSelected ? <Check size={12} /> : <span>+</span>}
                                                <span>{pill}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 4: Detailed Instructions */}
                            <div className="cr-rework-field">
                                <label htmlFor="cr-feedback" className="cr-rework-label">
                                    {requestItems(revisionRequest).length > 1 ? "4." : "3."} Additional instructions for the team:
                                </label>
                                <textarea
                                    id="cr-feedback"
                                    rows={3}
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Explain in detail what needs to change, exact text, correct dates, or visual guidance…"
                                    className="cr-rework-textarea"
                                />
                            </div>

                            {/* Actions */}
                            <div className="cr-rework-actions">
                                <button
                                    type="button"
                                    className="cb-btn cb-btn--ghost"
                                    onClick={() => setRevisionRequest(null)}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="cb-btn cb-btn--danger"
                                    disabled={isSaving || (selectedPills.length === 0 && !feedbackText.trim())}
                                >
                                    <Send size={14} />
                                    {isSaving ? "Sending…" : "Send for Rework"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Single Approval Modal */}
            {approvingRequest && (
                <div className="cb-overlay cb-overlay--top" onClick={() => setApprovingRequest(null)}>
                    <div className="cb-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="cb-dialog__body">
                            <div className="cb-dialog__intro">
                                <div className="cb-dialog__icon cr-ok-icon">
                                    <ThumbsUp size={20} />
                                </div>
                                <div>
                                    <h3>Approve post</h3>
                                    <p>This post will be marked as approved and ready for schedule.</p>
                                </div>
                            </div>
                            <div className="cb-warn">
                                Approve <strong>{typeLabel(approvingRequest.request_type)}</strong> for {monthLabel(approvingRequest.month)}?
                            </div>
                        </div>
                        <div className="cb-dialog__actions">
                            <button
                                type="button"
                                className="cb-btn cb-btn--ghost"
                                onClick={() => setApprovingRequest(null)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="cb-btn cb-btn--primary"
                                onClick={handleApproveConfirm}
                                disabled={isSaving}
                            >
                                {isSaving ? "Approving…" : "Yes, approve post"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Approval Modal */}
            {isBulkApproveModalOpen && (
                <div className="cb-overlay cb-overlay--top" onClick={() => setIsBulkApproveModalOpen(false)}>
                    <div className="cb-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="cb-dialog__body">
                            <div className="cb-dialog__intro">
                                <div className="cb-dialog__icon cr-ok-icon">
                                    <CheckCircle2 size={22} />
                                </div>
                                <div>
                                    <h3>Approve all pending posts</h3>
                                    <p>All {pendingRequests.length} pending posts will be approved in one action.</p>
                                </div>
                            </div>
                            <div className="cb-warn">
                                All pending posts will be marked as approved and sent to scheduling for publication.
                            </div>
                        </div>
                        <div className="cb-dialog__actions">
                            <button
                                type="button"
                                className="cb-btn cb-btn--ghost"
                                onClick={() => setIsBulkApproveModalOpen(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="cb-btn cb-btn--primary"
                                onClick={handleBulkApprove}
                                disabled={isSaving}
                            >
                                {isSaving ? "Approving all…" : `Approve all ${pendingRequests.length} posts`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
