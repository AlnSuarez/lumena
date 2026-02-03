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
            // Optimistic update for demo purposes if backend isn't fully ready
            // But we try to call the API
            const response = await fetch(`http://localhost:8000/api/contents/monthly-requests/${activeItem.id}/`, {
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
        // "Si se aprueba va a pasar al step de content revision"
        handleUpdateStatus('CONTENT_REVISION', 'Approved');
    };

    const handleDeny = () => {
        // "si no regresará a monthly content pero con un estatus de revisión"
        handleUpdateStatus('IN_REVISION', 'Denied');
    };

    // Empty State
    if (items.length === 0) {
        return (
            <div className="w-full flex flex-col px-0 py-2">
                <div className="bg-[#595556] rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0 items-center justify-center text-center">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 text-white">
                        <Check size={40} />
                    </div>
                    <h1 className="text-3xl font-semibold text-white">All Caught Up!</h1>
                    <p className="text-slate-300 mt-2">No items pending Quality Assurance review.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col px-0 py-2">
            <div className="bg-[#595556] rounded-3xl p-2 flex flex-col h-[85vh] min-h-0 mx-0">

                {/* Header Area */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 ml-8 mt-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-white">QA Review</h1>
                        <p className="text-slate-300 mt-1 text-sm">Review content before sending to revision</p>
                    </div>

                    {/* Integrated Client Selector */}
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client</span>
                        <div className="h-4 w-px bg-slate-200"></div>
                        {activeItem && activeItem.originalData?.client_details?.client_profile?.logo ? (
                            <img
                                src={`http://localhost:8000${activeItem.originalData.client_details.client_profile.logo}`}
                                alt={clientName}
                                className="w-6 h-6 rounded-full object-cover border border-slate-300"
                            />
                        ) : activeItem ? (
                            <div className="w-6 h-6 rounded-full bg-[#192853]/10 flex items-center justify-center text-[#192853] font-bold text-xs">
                                {clientName.charAt(0).toUpperCase()}
                            </div>
                        ) : null}
                        <span className="text-[#192853] font-bold text-sm min-w-[100px] text-center truncate max-w-[200px]">
                            {clientName || "Select Item..."}
                        </span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-[#595556] rounded-2xl p-6 flex-1 flex flex-col min-h-0">

                    {/* Content Area Wrapper */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

                        {/* Sidebar */}
                        <div className={`${isSidebarCollapsed ? 'w-20 items-center' : 'w-full lg:w-80'} transition-all duration-500 ease-in-out bg-slate-50 rounded-2xl py-6 border border-slate-200 flex flex-col shrink-0`}>
                            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center mb-6' : 'justify-between mb-4 px-6'}`}>
                                {!isSidebarCollapsed && (
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                                        <span>Pending QA</span>
                                        <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                            {items.length}
                                        </span>
                                    </h2>
                                )}
                                <button
                                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                    {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                                </button>
                            </div>

                            <div className={`flex-1 overflow-y-auto custom-scrollbar space-y-3 ${isSidebarCollapsed ? 'px-2 overflow-x-hidden' : 'px-6'}`}>
                                {items.map((item, index) => {
                                    const isActive = index === activeItemIndex;
                                    const isRequest = item.type === 'adhoc_request';

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setActiveItemIndex(index)}
                                            className={`
                                                group flex items-center transition-all cursor-pointer border
                                                ${isSidebarCollapsed ? 'justify-center p-2 rounded-xl aspect-square' : 'gap-3 p-3 rounded-xl'}
                                                ${isActive ? 'bg-[#192853] border-[#192853]' : 'bg-white border-slate-200 hover:bg-slate-50'}
                                            `}
                                        >
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors
                                                ${isActive ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-300'}
                                            `}>
                                                <span className="text-xs font-bold">{isRequest ? 'R' : index + 1}</span>
                                            </div>

                                            {!isSidebarCollapsed && (
                                                <div className="flex flex-col min-w-0 overflow-hidden">
                                                    <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-[#192853]'}`}>
                                                        {item.name}
                                                    </span>
                                                    <span className={`text-[10px] font-medium truncate ${isActive ? 'text-white/60' : 'text-[#5B75A9]'}`}>
                                                        {isRequest ? 'Request' : 'Monthly'}
                                                    </span>
                                                </div>
                                            )}

                                            {!isSidebarCollapsed && isActive && (
                                                <ChevronRight size={16} className="text-white/40 ml-auto" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Main Detail Area */}
                        {activeItem && (
                            <div className="flex-1 bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 flex flex-col lg:flex-row gap-8 min-w-0 overflow-hidden">

                                {/* Left Column: Visuals Layout */}
                                <div className="lg:w-7/12 flex flex-col gap-6 min-h-0">

                                    {/* Info Header above Visualizer */}
                                    <div className="flex justify-between items-center relative px-2 py-2 shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[#192853]">Review Content</h3>
                                                <p className="text-sm text-slate-500 font-medium">For {activeItem.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visualizer Frame */}
                                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 relative flex items-center justify-center overflow-hidden group min-h-[300px]">

                                        {/* ID Badge */}
                                        <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm z-20">
                                            <span className="text-[10px] font-bold text-[#5B75A9] uppercase tracking-wider block">ID</span>
                                            <span className="text-sm font-black text-[#192853]">{currentId}</span>
                                        </div>

                                        {/* Content Placeholder */}
                                        <div className="w-[80%] h-[80%] bg-white rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden transition-transform duration-700 group-hover:scale-[1.02]">
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                                            <div className="text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-300">
                                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-slate-400 font-medium">Content Preview</p>
                                                <p className="text-xs text-slate-300 mt-2">Images/Video would appear here</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Details & Actions */}
                                <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">

                                        {/* Meta */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                                <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider block mb-1">Type</label>
                                                <p className="font-bold text-[#192853] capitalize">{activeItem.contentType}</p>
                                            </div>
                                            <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                                <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider block mb-1">Status</label>
                                                <p className="font-bold text-purple-600">QA Review</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider block mb-2">Client Preferences</label>
                                            <textarea
                                                readOnly
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#192853] text-xs font-mono mb-2 focus:outline-none resize-none"
                                                rows={6}
                                                value={(() => {
                                                    const profile = activeItem.originalData?.client_details?.client_profile;
                                                    if (!profile) return "No client preferences found.";

                                                    const parts = [];

                                                    if (profile.primary_brand_pillars) parts.push(`[BRAND PILLARS]\n${profile.primary_brand_pillars}`);

                                                    const voice = [];
                                                    if (profile.overall_voice) voice.push(`Voice: ${profile.overall_voice}`);
                                                    if (profile.formality_level) voice.push(`Formality: ${profile.formality_level}`);
                                                    if (profile.humor) voice.push(`Humor: ${profile.humor}`);
                                                    if (profile.emojis) voice.push(`Emojis: ${profile.emojis}`);
                                                    if (profile.words_to_use) voice.push(`Use: ${profile.words_to_use}`);
                                                    if (profile.words_to_avoid) voice.push(`Avoid: ${profile.words_to_avoid}`);
                                                    if (voice.length) parts.push(`[VOICE & TONE]\n${voice.join('\n')}`);

                                                    const boundaries = [];
                                                    if (profile.topics_to_emphasize) boundaries.push(`Emphasize: ${profile.topics_to_emphasize}`);
                                                    if (profile.topics_to_avoid) boundaries.push(`Avoid: ${profile.topics_to_avoid}`);
                                                    if (profile.faces_allowed) boundaries.push(`Faces Allowed: ${profile.faces_allowed}`);
                                                    if (boundaries.length) parts.push(`[BOUNDARIES]\n${boundaries.join('\n')}`);

                                                    if (profile.primary_goal) parts.push(`[GOALS]\n${profile.primary_goal}`);

                                                    return parts.join('\n\n');
                                                })()}
                                            />
                                        </div>

                                        {/* Instructions */}
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider block mb-2">Instructions</label>
                                            <p className="text-[#192853] text-sm leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                                {activeItem.instructions || "No specific instructions."}
                                            </p>
                                        </div>

                                        {/* Content Review - NEW */}
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider block mb-2">Developed Content</label>

                                            {activeItem.content_text && (
                                                <div className="mb-3">
                                                    <span className="text-xs font-bold text-slate-400 block mb-1">Content Text</span>
                                                    <p className="text-[#192853] text-sm leading-relaxed whitespace-pre-wrap">
                                                        {activeItem.content_text}
                                                    </p>
                                                </div>
                                            )}

                                            {activeItem.ai_caption && (
                                                <div>
                                                    <span className="text-xs font-bold text-slate-400 block mb-1">Caption</span>
                                                    <p className="text-[#192853] text-sm leading-relaxed whitespace-pre-wrap italic text-slate-600">
                                                        {activeItem.ai_caption}
                                                    </p>
                                                </div>
                                            )}

                                            {!activeItem.content_text && !activeItem.ai_caption && (
                                                <p className="text-slate-400 text-sm italic">No text content provided.</p>
                                            )}
                                        </div>

                                        {/* Feedback Input (NEW) */}
                                        <div className="space-y-2 flex-1 min-h-[100px]">
                                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider ml-1 flex items-center gap-2">
                                                <MessageSquare size={12} />
                                                Feedback for Creator
                                            </label>
                                            <textarea
                                                rows={5}
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                className="w-full h-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[#192853] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 transition-all resize-none text-sm leading-relaxed"
                                                placeholder="Enter feedback rationale here (required for denial)..."
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="pt-4 flex gap-3 mt-auto">
                                            <button
                                                onClick={handleDeny}
                                                className="flex-1 py-4 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <X size={20} />
                                                <span>Denegar</span>
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                className="flex-1 py-4 bg-[#192853] hover:bg-[#203262] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#192853]/30 hover:shadow-[#192853]/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                                            >
                                                <Check size={20} />
                                                <span>Aprobar</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
