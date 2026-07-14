"use client";
import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, ChevronDown, ChevronLeft, X, MessageSquare, Sparkles } from 'lucide-react';

export default function QAPage() {
    const [clientName, setClientName] = useState("");
    const [items, setItems] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [feedback, setFeedback] = useState("");

    const fetchRequests = async () => {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');

        if (!userId || !userRole) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }

        try {
            const url = new URL('http://localhost:8000/api/contents/monthly-requests/');
            if (userId) url.searchParams.append('user_id', userId);
            if (userRole) url.searchParams.append('role', userRole);

            const response = await fetch(url.toString());
            if (response.ok) {
                const data = await response.json();

                // Filter for items in 'QA' status
                const qaItems = data.filter(req => req.status === 'QA').map(req => {
                    const isAdhoc = req.request_type !== 'MONTHLY_CONTENT';
                    return {
                        id: req.id,
                        type: isAdhoc ? 'adhoc_request' : 'client',
                        name: req.client_details ? req.client_details.username : `Client #${req.client}`,
                        month: req.month,
                        status: req.status,
                        // Extract simplistic content type or default
                        content_text: req.content_text,
                        ai_caption: req.ai_caption,
                        contentType: isAdhoc ? (req.notes?.match(/Content Type: (\w+)/)?.[1] || 'General') : 'Monthly Content',
                        instructions: req.notes,
                        asignee: req.assigned_to_details?.username,
                        originalData: req
                    };
                });

                setItems(qaItems);
            } else {
                console.error("Failed to fetch requests");
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    };

    // Initialize Data
    useEffect(() => {
        fetchRequests();
    }, []);

    // Sync header name
    useEffect(() => {
        if (items[activeItemIndex]) {
            setClientName(items[activeItemIndex].name);
            setFeedback(""); // Reset feedback when changing items
        }
    }, [activeItemIndex, items]);

    const activeItem = items[activeItemIndex];

    // Mock ID for the current item
    const currentId = activeItem ? (activeItem.type === 'adhoc_request' ? `REQ-${activeItem.id}`.slice(0, 12) : `MTH-${activeItem.id}`) : "";

    const handleUpdateStatus = async (newStatus, resolution) => {
        if (!activeItem) return;

        try {
            const userId = localStorage.getItem('userId');
            const updateUrl = new URL(`http://localhost:8000/api/contents/monthly-requests/${activeItem.id}/`);
            if (userId) updateUrl.searchParams.append('user_id', userId);

            // Optimistic update for demo purposes if backend isn't fully ready
            // But we try to call the API
            const response = await fetch(updateUrl.toString(), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    feedback: feedback // Assuming backend accepts feedback/notes field
                })
            });

            if (response.ok) {
                // Remove item from list
                const updatedItems = items.filter((_, idx) => idx !== activeItemIndex);
                setItems(updatedItems);

                // Adjust index
                if (activeItemIndex >= updatedItems.length) {
                    setActiveItemIndex(Math.max(0, updatedItems.length - 1));
                }

                setFeedback("");
                // alert(`Request ${resolution}: Passed to ${newStatus}`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Failed to update status:", errorData);
                alert(`Failed to update status: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert(`Error updating status: ${error.message}`);
        }
    };

    const handleApprove = () => {
        // QA aprueba → pasa a revisión del cliente
        handleUpdateStatus('CLIENT_REVIEW', 'Approved');
    };

    const handleDeny = () => {
        // "si no regresará a monthly content pero con un estatus de revisión"
        handleUpdateStatus('IN_REVISION', 'Denied');
    };

    return (
        <div className="w-full h-full flex flex-col p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] w-full max-w-[1800px] mx-auto">
                {/* Header Area */}
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">QA Review</h1>
                        <p className="text-muted-foreground mt-2 text-lg font-medium">Review content before sending to revision</p>
                    </div>

                    {/* Integrated Client Selector */}
                    <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</span>
                        <div className="h-4 w-px bg-border"></div>
                        {activeItem && activeItem.originalData?.client_details?.client_profile?.logo ? (
                            <img
                                src={`http://localhost:8000${activeItem.originalData.client_details.client_profile.logo}`}
                                alt={clientName}
                                className="w-8 h-8 rounded-full object-cover border border-border ring-2 ring-background"
                            />
                        ) : activeItem ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-border">
                                {clientName.charAt(0).toUpperCase()}
                            </div>
                        ) : null}
                        <span className="text-foreground font-bold text-sm min-w-[120px] text-center truncate max-w-[200px]">
                            {clientName || "Select Item..."}
                        </span>
                        <ChevronDown size={14} className="text-muted-foreground" />
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-card/60 backdrop-blur-xl rounded-[2rem] border border-white/20 dark:border-border shadow-2xl flex-1 flex flex-col min-h-0 relative overflow-hidden">

                    {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                                <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center border-4 border-primary/10 shadow-2xl relative z-10">
                                    <Check className="w-16 h-16 text-primary" strokeWidth={4} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">All Caught Up!</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto text-lg font-medium">No items pending Quality Assurance review.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-secondary/20 lg:p-1">

                            {/* Sidebar - Pending List */}
                            <div className={`${isSidebarCollapsed ? 'w-20 items-center' : 'w-full lg:w-72 xl:w-80'} transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] bg-card/50 lg:bg-transparent border-b lg:border-b-0 lg:border-r border-border flex flex-col shrink-0 lg:ml-1`}>

                                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-6' : 'justify-between py-6 px-6'}`}>
                                    {!isSidebarCollapsed && (
                                        <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                                            Pending QA
                                            <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm">
                                                {items.length}
                                            </span>
                                        </h2>
                                    )}
                                    <button
                                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                                    >
                                        {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                                    </button>
                                </div>

                                <div className={`flex-1 overflow-y-auto custom-scrollbar space-y-2 pb-6 ${isSidebarCollapsed ? 'px-3 overflow-x-hidden' : 'px-4'}`}>
                                    {items.map((item, index) => {
                                        const isActive = index === activeItemIndex;
                                        const isRequest = item.type === 'adhoc_request';

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setActiveItemIndex(index)}
                                                className={`
                                                    group flex items-center transition-all cursor-pointer border relative overflow-hidden
                                                    ${isSidebarCollapsed
                                                        ? 'justify-center p-3 rounded-2xl aspect-square'
                                                        : 'gap-4 p-4 rounded-2xl'}
                                                    ${isActive
                                                        ? 'bg-primary border-primary shadow-lg shadow-primary/25'
                                                        : 'bg-card border-transparent hover:border-border hover:bg-muted/50'}
                                                `}
                                            >
                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all duration-300
                                                    ${isActive
                                                        ? 'border-white/20 bg-white/20 text-white'
                                                        : 'border-border bg-slate-50 dark:bg-slate-900 text-muted-foreground group-hover:bg-white'}
                                                `}>
                                                    <span className="text-sm font-black">{isRequest ? 'R' : index + 1}</span>
                                                </div>

                                                {!isSidebarCollapsed && (
                                                    <div className="flex flex-col min-w-0 z-10">
                                                        <span className={`text-sm font-bold truncate leading-tight ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                                                            {item.name}
                                                        </span>
                                                        <span className={`text-[11px] font-medium truncate mt-0.5 ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                            {isRequest ? 'Request' : 'Monthly'}
                                                        </span>
                                                    </div>
                                                )}

                                                {!isSidebarCollapsed && isActive && (
                                                    <ChevronRight size={18} className="text-primary-foreground/50 ml-auto" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Main Interaction Area */}
                            {activeItem && (
                                <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden bg-card/30">

                                    {/* Left Column: Visualizer */}
                                    <div className="lg:w-[52%] xl:w-1/2 flex flex-col gap-6 min-h-0 border-b lg:border-b-0 lg:border-r border-border p-6 lg:p-8">

                                        {/* Header */}
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                <Sparkles size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">Review Content</h3>
                                                <p className="text-sm text-muted-foreground font-medium">For <span className="text-foreground">{activeItem.name}</span></p>
                                            </div>
                                        </div>

                                        {/* Visualizer Frame */}
                                        <div className="flex-1 bg-secondary/30 rounded-3xl border border-border/50 relative flex items-center justify-center overflow-hidden group min-h-[350px] shadow-inner">

                                            {/* Pattern Overlay */}
                                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

                                            {/* ID Badge */}
                                            <div className="absolute top-6 left-6 bg-card/80 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 shadow-sm z-20">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">ID</span>
                                                <span className="text-sm font-black text-foreground">{currentId}</span>
                                            </div>

                                            {/* Content Preview */}
                                            <div className="w-[85%] h-[85%] bg-card rounded-2xl border border-border shadow-2xl shadow-black/5 flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-xl">
                                                {(() => {
                                                    const items = activeItem.originalData?.content_items || [];
                                                    if (activeItem.originalData?.linked_image_details && items.length === 0) {
                                                        items.push({ media_type: 'IMAGE', gallery_image_details: activeItem.originalData.linked_image_details });
                                                    }
                                                    if (items.length > 0) {
                                                        const ci = items[0];
                                                        const imgSrc = ci.gallery_image_details?.image_url || ci.file_url || activeItem.originalData?.linked_image_details?.image_url;
                                                        if (imgSrc) {
                                                            if (ci.media_type === 'VIDEO') {
                                                                return (
                                                                    <video src={imgSrc} controls className="w-full h-full object-contain" />
                                                                );
                                                            }
                                                            return (
                                                                <>
                                                                    <img src={imgSrc} alt={ci.gallery_image_details?.title || "Media"} className="w-full h-full object-contain" />
                                                                    {ci.gallery_image_details?.folio && (
                                                                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                                                            <span className="text-[10px] font-mono text-white">{ci.gallery_image_details.folio}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        }
                                                    }
                                                    return (
                                                        <div className="text-center p-8">
                                                            <div className="w-24 h-24 bg-secondary/50 rounded-full mx-auto mb-6 flex items-center justify-center text-muted-foreground">
                                                                <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <h4 className="text-lg font-bold text-foreground mb-1">Content Preview</h4>
                                                            <p className="text-sm text-muted-foreground">No linked media for this request yet</p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Details & Actions */}
                                    <div className="lg:w-[48%] xl:w-1/2 flex flex-col overflow-y-auto px-6 lg:px-8 py-6 custom-scrollbar min-h-0 bg-card">
                                        <div className="flex flex-col h-full w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
                                            <div className="mb-5 pb-4 border-b border-border/60">
                                                <h3 className="text-xl font-black text-foreground tracking-tight">QA Review Panel</h3>
                                                <p className="text-sm text-muted-foreground font-medium">Validate content, add feedback and complete review.</p>
                                            </div>

                                            {/* Meta */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                                <div className="p-4 rounded-2xl border border-border bg-secondary/20 shadow-sm">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Type</label>
                                                    <p className="font-bold text-foreground capitalize">{activeItem.contentType}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl border border-border bg-secondary/20 shadow-sm">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Status</label>
                                                    <p className="font-bold text-primary">QA Review</p>
                                                </div>
                                            </div>

                                            {/* Content Sections */}
                                            <div className="space-y-5 flex-1">
                                                <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50">
                                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Client Preferences</label>
                                                    <textarea
                                                        readOnly
                                                        className="w-full bg-input/50 border border-input rounded-xl px-4 py-3 text-foreground text-xs font-mono focus:outline-none resize-none"
                                                        rows={4}
                                                        value={(() => {
                                                            const profile = activeItem.originalData?.client_details?.client_profile;
                                                            if (!profile) return "No client preferences found.";

                                                            // Simplified preference display for cleaner UI
                                                            const voice = profile.overall_voice ? `Voice: ${profile.overall_voice}` : '';
                                                            const goal = profile.primary_goal ? `Goal: ${profile.primary_goal}` : '';

                                                            return [voice, goal].filter(Boolean).join('\n') || "Preferences available in full profile.";
                                                        })()}
                                                    />
                                                </div>

                                                <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50">
                                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">Developed Content</label>

                                                    {activeItem.content_text ? (
                                                        <div className="mb-4 p-3 rounded-xl border border-border/50 bg-card/70">
                                                            <span className="text-[10px] font-bold text-muted-foreground block mb-1">Content Text</span>
                                                            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                                                {activeItem.content_text}
                                                            </p>
                                                        </div>
                                                    ) : null}

                                                    {activeItem.ai_caption ? (
                                                        <div className="p-3 rounded-xl border border-border/50 bg-card/70">
                                                            <span className="text-[10px] font-bold text-muted-foreground block mb-1">Caption</span>
                                                            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap italic text-muted-foreground">
                                                                {activeItem.ai_caption}
                                                            </p>
                                                        </div>
                                                    ) : null}

                                                    {!activeItem.content_text && !activeItem.ai_caption && (
                                                        <p className="text-muted-foreground text-sm italic">No text content provided.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Feedback + Actions */}
                                            <div className="mt-5 pt-5 border-t border-border/60 space-y-4">
                                                <div className="space-y-2 min-h-[120px]">
                                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                                        <MessageSquare size={12} />
                                                        Feedback for Creator
                                                    </label>
                                                    <textarea
                                                        rows={4}
                                                        value={feedback}
                                                        onChange={(e) => setFeedback(e.target.value)}
                                                        className="w-full bg-input/50 border border-input rounded-2xl px-5 py-4 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-sm leading-relaxed"
                                                        placeholder="Enter feedback rationale here (required for denial)..."
                                                    />
                                                </div>

                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={handleDeny}
                                                        className="flex-1 py-4 bg-background hover:bg-destructive/5 text-destructive border border-border hover:border-destructive/20 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <X size={20} />
                                                        <span>Denegar</span>
                                                    </button>
                                                    <button
                                                        onClick={handleApprove}
                                                        className="flex-[2] py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Check size={20} />
                                                        <span>Aprobar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
