"use client";

import { useEffect, useMemo, useState } from "react";
import { 
    CheckCircle2, 
    ChevronDown, 
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
    Loader2,
    Layout,
    Send,
    RefreshCw,
    Heart,
    Bookmark,
    Maximize2,
    Play,
    Pause
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;

function CardVideoPlayer({ src }) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayPause = (e) => {
        e.stopPropagation();
        const video = e.currentTarget.closest('.video-container')?.querySelector('video');
        if (!video) return;
        if (video.paused) {
            video.play().then(() => {
                setIsPlaying(true);
            }).catch(err => console.error("Error playing video:", err));
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div className="video-container relative w-full h-full bg-black flex items-center justify-center group/video">
            <video 
                src={src} 
                className="w-full h-full object-contain" 
                loop
                playsInline
                onClick={handlePlayPause}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            <button
                onClick={handlePlayPause}
                className={`absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white transition-all shadow-lg z-10 duration-200 ${isPlaying ? 'opacity-0 group-hover/video:opacity-100' : 'opacity-100'}`}
            >
                {isPlaying ? (
                    <Pause size={20} fill="white" />
                ) : (
                    <Play size={20} fill="white" className="ml-1" />
                )}
            </button>
        </div>
    );
}

const normalizeUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${url}`;
};

export default function ClientReviewPage() {
    const { requireQAReview } = useTheme();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isRequestsLoading, setIsRequestsLoading] = useState(false);
    const [revisionRequest, setRevisionRequest] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [previewRequest, setPreviewRequest] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [cardIndices, setCardIndices] = useState({});

    const handlePrevCardItem = (e, reqId, totalItems) => {
        e.stopPropagation();
        setCardIndices(prev => ({
            ...prev,
            [reqId]: Math.max(0, (prev[reqId] || 0) - 1)
        }));
    };

    const handleNextCardItem = (e, reqId, totalItems) => {
        e.stopPropagation();
        setCardIndices(prev => ({
            ...prev,
            [reqId]: Math.min(totalItems - 1, (prev[reqId] || 0) + 1)
        }));
    };

    const fetchPendingRequests = async () => {
        const userId = localStorage.getItem("userId");
        const userRole = localStorage.getItem("userRole");
        if (!userId) return;

        setIsRequestsLoading(true);
        try {
            const url = new URL(`${API_BASE}/contents/monthly-requests/`);
            url.searchParams.append("user_id", userId);
            url.searchParams.append("role", userRole || "CLIENT");

            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();
                // Filter requests in CLIENT_REVIEW status
                const pending = data.filter(req => req.status === "CLIENT_REVIEW");
                setPendingRequests(pending);
            }
        } catch (error) {
            console.error("Error loading pending requests:", error);
        } finally {
            setIsRequestsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const handleApprove = async (requestId) => {
        const confirmApprove = window.confirm("Are you sure you want to approve this content? It will be sent to the Scheduler for publishing.");
        if (!confirmApprove) return;

        try {
            const userId = localStorage.getItem("userId");
            const userRole = localStorage.getItem("userRole");
            const updateUrl = new URL(`${API_BASE}/contents/monthly-requests/${requestId}/`);
            if (userId) updateUrl.searchParams.append('user_id', userId);
            if (userRole) updateUrl.searchParams.append('role', userRole);

            const response = await fetch(updateUrl.toString(), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: "APPROVED" })
            });

            if (response.ok) {
                alert("Content approved successfully!");
                fetchPendingRequests();
            } else {
                alert("Failed to approve content.");
            }
        } catch (error) {
            console.error("Error approving content:", error);
        }
    };

    const handleRequestRevision = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) {
            alert("Please describe the adjustments required.");
            return;
        }

        try {
            const userId = localStorage.getItem("userId");
            const userRole = localStorage.getItem("userRole");
            const updateUrl = new URL(`${API_BASE}/contents/monthly-requests/${revisionRequest.id}/`);
            if (userId) updateUrl.searchParams.append('user_id', userId);
            if (userRole) updateUrl.searchParams.append('role', userRole);

            const response = await fetch(updateUrl.toString(), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "IN_REVISION",
                    feedback: feedbackText,
                    client_feedback: feedbackText
                })
            });

            if (response.ok) {
                alert("Revision feedback sent to creators.");
                setRevisionRequest(null);
                setFeedbackText("");
                fetchPendingRequests();
            } else {
                alert("Failed to send feedback.");
            }
        } catch (error) {
            console.error("Error requesting revision:", error);
        }
    };

    const getRequestTypeIcon = (type) => {
        switch (type) {
            case 'VIDEO_SHOOT': return Video;
            case 'CAROUSEL': return Layers;
            case 'MONTHLY_CONTENT': return Layout;
            default: return Type;
        }
    };

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full">
            <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Client Review</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Approve or request changes on the draft publications.</p>
                    </div>
                    <button
                        onClick={fetchPendingRequests}
                        disabled={isRequestsLoading}
                        title="Refresh to check for new content"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-secondary hover:bg-card hover:shadow-md text-sm font-bold text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw
                            size={15}
                            className={isRequestsLoading ? "animate-spin text-primary" : "text-muted-foreground"}
                        />
                        {isRequestsLoading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                <div className="h-px bg-border mb-6" />

                <div className="flex-1 overflow-y-auto">
                    {isRequestsLoading ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
                            <Loader2 className="animate-spin text-primary" size={24} />
                            Loading pending approvals...
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                                <CheckCircle2 size={36} />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">All Caught Up!</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">There are no pending content requests waiting for your approval right now.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                            {pendingRequests.map((req) => {
                                const Icon = getRequestTypeIcon(req.request_type);
                                return (
                                    <div key={req.id} className="bg-card border border-border rounded-3xl p-4 shadow-md flex flex-col gap-4 hover:shadow-lg transition-all max-w-sm w-full mx-auto">
                                        
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                                                    <Icon size={18} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-black text-foreground">{req.request_type.replace('_', ' ')}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{new Date(req.month).toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                                                Pending Your Review
                                            </span>
                                        </div>

                                        {/* Preview Mockup - Styled as Social Media Post */}
                                        <div className="border border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm flex flex-col">
                                            {/* Mockup Header */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                                                        {req.client_details?.client_profile?.logo ? (
                                                            <img 
                                                                src={normalizeUrl(req.client_details.client_profile.logo)} 
                                                                alt="Logo" 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-xs font-bold text-primary">
                                                                {(req.client_details?.client_profile?.practice_name || req.client_details?.username || "C").charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-foreground leading-none">
                                                            {req.client_details?.client_profile?.practice_name || req.client_details?.username || "Brand Account"}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">Content Preview</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                    Preview
                                                </span>
                                            </div>

                                            {/* Media Viewer Area */}
                                            <div className="aspect-square bg-black/5 relative flex items-center justify-center overflow-hidden group">
                                                {(() => {
                                                    const items = req.content_items || [];
                                                    if (req.linked_image_details && items.length === 0) {
                                                        items.push({ media_type: 'IMAGE', gallery_image_details: req.linked_image_details });
                                                    }
                                                    const totalItems = items.length;
                                                    const currentIdx = cardIndices[req.id] || 0;
                                                    const safeIdx = Math.min(currentIdx, Math.max(0, totalItems - 1));

                                                    if (totalItems > 0) {
                                                        const ci = items[safeIdx];
                                                        const src = ci.gallery_image_details?.image_url || ci.gallery_image_details?.image_compressed || ci.gallery_image_details?.image || normalizeUrl(ci.file_url) || normalizeUrl(req.linked_image_details?.image_compressed) || normalizeUrl(req.linked_image_details?.image);

                                                        if (src) {
                                                            const isVideo = ci.media_type === 'VIDEO' || 
                                                                (typeof src === 'string' && (
                                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.mp4') || 
                                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.mov') || 
                                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.webm') || 
                                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.mkv') || 
                                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.avi') ||
                                                                    src.toLowerCase().includes('/videos/')
                                                                ));
                                                            return (
                                                                <>
                                                                    {isVideo ? (
                                                                         <CardVideoPlayer src={src} />
                                                                    ) : (
                                                                        <img src={src} alt={ci.gallery_image_details?.title || "Media"} className="w-full h-full object-cover transition-transform duration-300" style={{ transform: `rotate(${ci.rotation || 0}deg)` }} />
                                                                    )}

                                                                    {/* Maximize Button on Hover */}
                                                                    <button
                                                                        onClick={() => {
                                                                            setPreviewRequest(req);
                                                                            setPreviewIndex(safeIdx);
                                                                        }}
                                                                        className="absolute top-3 right-3 z-30 p-2 bg-black/60 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Expand Preview"
                                                                    >
                                                                        <Maximize2 size={14} />
                                                                    </button>

                                                                    {/* Carousel Arrows */}
                                                                    {totalItems > 1 && (
                                                                        <>
                                                                            {safeIdx > 0 && (
                                                                                <button
                                                                                    onClick={(e) => handlePrevCardItem(e, req.id, totalItems)}
                                                                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all shadow-md"
                                                                                >
                                                                                    <ChevronLeft size={18} />
                                                                                </button>
                                                                            )}
                                                                            {safeIdx < totalItems - 1 && (
                                                                                <button
                                                                                    onClick={(e) => handleNextCardItem(e, req.id, totalItems)}
                                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all shadow-md"
                                                                                >
                                                                                    <ChevronRight size={18} />
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </>
                                                            );
                                                        }
                                                    }
                                                    return (
                                                        <div className="text-center p-4">
                                                            <ImageIcon size={32} className="mx-auto text-muted-foreground/60 mb-2" />
                                                            <p className="text-xs text-muted-foreground font-bold">Visual Asset Pending Upload</p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Mockup Action Bar */}
                                            <div className="px-4 py-2.5 flex items-center justify-between border-t border-border/30 bg-secondary/5">
                                                <div className="flex items-center gap-3">
                                                    <button className="text-muted-foreground hover:text-red-500 transition-colors" disabled>
                                                        <Heart size={16} />
                                                    </button>
                                                    <button className="text-muted-foreground" disabled>
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <button className="text-muted-foreground" disabled>
                                                        <Send size={14} className="-rotate-12" />
                                                    </button>
                                                </div>

                                                {/* Carousel indicators inside mockup */}
                                                {(() => {
                                                    const items = req.content_items || [];
                                                    if (req.linked_image_details && items.length === 0) {
                                                        items.push({ media_type: 'IMAGE', gallery_image_details: req.linked_image_details });
                                                    }
                                                    const totalItems = items.length;
                                                    const currentIdx = cardIndices[req.id] || 0;
                                                    const safeIdx = Math.min(currentIdx, Math.max(0, totalItems - 1));

                                                    if (totalItems > 1) {
                                                        return (
                                                            <div className="flex gap-1">
                                                                {items.map((_, idx) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                                                                            idx === safeIdx ? 'bg-primary w-3' : 'bg-muted-foreground/30'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                <div>
                                                    <button className="text-muted-foreground" disabled>
                                                        <Bookmark size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mockup Caption */}
                                            {(req.ai_caption || req.content_text) && (
                                                <div className="px-4 pb-3 pt-1 text-xs border-t border-border/10 bg-secondary/5">
                                                    <p className="text-foreground leading-relaxed font-medium line-clamp-3">
                                                        <span className="font-black mr-1.5 text-foreground">
                                                            {req.client_details?.client_profile?.practice_name || req.client_details?.username || "Brand Account"}
                                                        </span>
                                                        {req.ai_caption || req.content_text}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Strategist Text */}
                                        {req.content_text && (
                                            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <FileText size={10} />
                                                    Strategy Copy
                                                </p>
                                                <p className="text-xs text-foreground leading-relaxed font-medium">{req.content_text}</p>
                                            </div>
                                        )}

                                        {/* AI Caption */}
                                        {req.ai_caption && (
                                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <Sparkles size={10} />
                                                    Suggested Caption
                                                </p>
                                                <p className="text-xs text-foreground leading-relaxed font-medium">{req.ai_caption}</p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mt-auto pt-2 border-t border-border/50">
                                            <button
                                                onClick={() => setRevisionRequest(req)}
                                                className="flex-1 py-3 bg-secondary hover:bg-destructive/10 text-foreground hover:text-destructive border border-border rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ThumbsDown size={14} />
                                                Request Changes
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ThumbsUp size={14} />
                                                Approve Content
                                            </button>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Instagram-style Preview Modal */}
            {previewRequest && (() => {
                const items = [...(previewRequest.content_items || [])];
                if (previewRequest.linked_image_details && items.length === 0) {
                    items.push({ media_type: 'IMAGE', gallery_image_details: previewRequest.linked_image_details });
                }
                const totalItems = items.length;
                const safeIndex = Math.min(previewIndex, Math.max(0, totalItems - 1));
                const ci = items[safeIndex] || {};
                const src = ci.gallery_image_details?.image_url || ci.gallery_image_details?.image_compressed || ci.gallery_image_details?.image || normalizeUrl(ci.file_url) || normalizeUrl(previewRequest.linked_image_details?.image_compressed) || normalizeUrl(previewRequest.linked_image_details?.image);

                return (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setPreviewRequest(null)}
                    >
                        <div
                            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setPreviewRequest(null)}
                                className="absolute -top-12 right-0 z-50 p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            {/* Media display */}
                            <div className="relative bg-black/40 rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px] max-h-[75vh]">
                                {src ? (
                                    <>
                                        {(() => {
                                            const isVideo = ci.media_type === 'VIDEO' || 
                                                (typeof src === 'string' && (
                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.mp4') || 
                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.mov') || 
                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.webm') || 
                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.mkv') || 
                                                    src.toLowerCase().split('?')[0].split('#')[0].endsWith('.avi') ||
                                                    src.toLowerCase().includes('/videos/')
                                                ));
                                            return isVideo ? (
                                                <video src={src} controls className="w-full h-full object-contain max-h-[75vh]" />
                                            ) : (
                                                <img src={src} alt={ci.gallery_image_details?.title || "Media"} className="w-full h-full object-contain max-h-[75vh] transition-transform duration-300" style={{ transform: `rotate(${ci.rotation || 0}deg)` }} />
                                            );
                                        })()}

                                        {/* Navigation arrows - always shown when >1 items */}
                                        {totalItems > 1 && (
                                            <>
                                                {safeIndex > 0 && (
                                                    <button
                                                        onClick={() => setPreviewIndex(safeIndex - 1)}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all"
                                                    >
                                                        <ChevronLeft size={24} />
                                                    </button>
                                                )}
                                                {safeIndex < totalItems - 1 && (
                                                    <button
                                                        onClick={() => setPreviewIndex(safeIndex + 1)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all"
                                                    >
                                                        <ChevronRight size={24} />
                                                    </button>
                                                )}

                                                {/* Instagram-style dots */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
                                                    {items.map((_ci, ciIdx) => (
                                                        <button
                                                            key={_ci.id || ciIdx}
                                                            onClick={() => setPreviewIndex(ciIdx)}
                                                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                                ciIdx === safeIndex
                                                                    ? 'bg-white scale-110'
                                                                    : 'bg-white/40 hover:bg-white/60'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Counter */}
                                                <div className="absolute top-4 right-4 z-30 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white font-medium">
                                                    {safeIndex + 1}/{totalItems}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center p-8 text-white/60">
                                        <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-bold">No media available</p>
                                    </div>
                                )}
                            </div>

                            {/* Media info below preview */}
                            {ci.media_type && (
                                <div className="mt-3 flex items-center gap-2 text-white/60 text-xs font-medium">
                                    <span className="bg-white/10 px-2 py-0.5 rounded-full">{ci.media_type.replace('_', ' ')}</span>
                                    {ci.gallery_image_details?.folio && (
                                        <span className="font-mono">Folio: {ci.gallery_image_details.folio}</span>
                                    )}
                                    {ci.caption && <span className="truncate ml-auto">Caption: {ci.caption}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Revision Request Slide-in Dialog */}
            {revisionRequest && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-foreground">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Request Changes</h3>
                                <p className="text-xs text-muted-foreground mt-1">Submit feedback to send the content back for revisions.</p>
                            </div>
                            <button
                                onClick={() => { setRevisionRequest(null); setFeedbackText(""); }}
                                className="p-1.5 bg-muted hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleRequestRevision} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Adjustments Required</label>
                                <textarea
                                    required
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Please describe exactly what needs to be changed..."
                                    className="w-full h-32 px-4 py-3 bg-secondary/15 border border-input focus:bg-card focus:border-primary rounded-xl text-foreground placeholder-muted-foreground/50 resize-none outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setRevisionRequest(null); setFeedbackText(""); }}
                                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-secondary text-xs font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-destructive text-white hover:bg-destructive/95 text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
                                >
                                    <Send size={12} />
                                    Send Feedback
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
