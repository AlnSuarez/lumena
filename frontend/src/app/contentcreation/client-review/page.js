"use client";

import { useEffect, useMemo, useState } from "react";
import { 
    CheckCircle2, 
    ChevronDown, 
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
    Send
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function ClientReviewPage() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isRequestsLoading, setIsRequestsLoading] = useState(false);
    const [revisionRequest, setRevisionRequest] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");

    const fetchPendingRequests = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        setIsRequestsLoading(true);
        try {
            const url = new URL(`${API_BASE}/contents/monthly-requests/`);
            url.searchParams.append("user_id", userId);
            url.searchParams.append("role", "CLIENT");

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
            const updateUrl = new URL(`${API_BASE}/contents/monthly-requests/${requestId}/`);
            if (userId) updateUrl.searchParams.append('user_id', userId);

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
            const updateUrl = new URL(`${API_BASE}/contents/monthly-requests/${revisionRequest.id}/`);
            if (userId) updateUrl.searchParams.append('user_id', userId);

            const response = await fetch(updateUrl.toString(), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "IN_REVISION",
                    feedback: feedbackText
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                            {pendingRequests.map((req) => {
                                const Icon = getRequestTypeIcon(req.request_type);
                                return (
                                    <div key={req.id} className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col gap-5 hover:shadow-lg transition-all">
                                        
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

                                        {/* Preview Mockup */}
                                        <div className="aspect-video bg-secondary/30 rounded-2xl overflow-hidden relative border border-border/50 flex items-center justify-center">
                                            {req.linked_image_details ? (
                                                <img 
                                                    src={req.linked_image_details.image_compressed || req.linked_image_details.image} 
                                                    alt={req.linked_image_details.title} 
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <ImageIcon size={32} className="mx-auto text-muted-foreground/60 mb-2" />
                                                    <p className="text-xs text-muted-foreground font-bold">Visual Asset Pending Upload</p>
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
