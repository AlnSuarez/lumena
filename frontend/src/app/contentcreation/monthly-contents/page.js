"use client";
import React, { useState } from 'react';
import { ChevronRight, Sparkles, Check, ChevronDown, ChevronLeft } from 'lucide-react';

export default function MonthlyContentsPage() {
    const [clientName, setClientName] = useState("");

    // Dummy clients list
    // Combined list of Monthly Clients and Adhoc Requests
    const [items, setItems] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [counts, setCounts] = useState({
        photos: 4,
        carousels: 4,
        videos: 4,
        stories: 4
    });

    const steps = [
        { id: 'photos', label: 'Photos', count: counts.photos },
        { id: 'carousels', label: 'Carousels', count: counts.carousels },
        { id: 'videos', label: 'Videos', count: counts.videos },
        { id: 'stories', label: 'Stories', count: counts.stories }
    ];

    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Initialize Data
    React.useEffect(() => {
        const fetchRequests = async () => {
            const userId = localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole');

            if (!userId || !userRole) {
                // Redirect to login if not authenticated
                window.location.href = '/login';
                return;
            }

            try {
                // Construct URL with query params for our "simulated" auth
                const url = new URL('http://localhost:8000/api/contents/monthly-requests/');
                url.searchParams.append('user_id', userId);
                url.searchParams.append('role', userRole);

                const response = await fetch(url.toString());
                if (response.ok) {
                    const data = await response.json();

                    // Transform API data to Component Item format
                    const apiItems = data
                        .filter(req => req.status !== 'QA' && req.status !== 'DONE' && req.status !== 'CONTENT_REVISION')
                        .map(req => {
                            const isAdhoc = req.request_type !== 'MONTHLY_CONTENT';
                            return {
                                id: req.id,
                                type: isAdhoc ? 'adhoc_request' : 'client',
                                name: req.client_details ? req.client_details.username : `Client #${req.client}`,
                                completed: false, // Since we filter, all remaining are "pending" for user
                                month: req.month,
                                status: req.status,
                                // If adhoc, we need some fields mapped or extracted from notes if possible
                                contentType: isAdhoc ? (req.notes.match(/Content Type: (\w+)/)?.[1] || 'General') : null,
                                instructions: req.notes,
                                asignee: req.assigned_to_details?.username,
                                feedback: req.feedback,
                                originalData: req // Keep original data for robust usage
                            };
                        });

                    setItems(apiItems);

                } else {
                    console.error("Failed to fetch requests");
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            }
        };

        fetchRequests();
    }, []);

    // Sync header name
    React.useEffect(() => {
        if (items[activeItemIndex]) {
            setClientName(items[activeItemIndex].name);
        }
    }, [activeItemIndex, items]);

    const [contentText, setContentText] = useState("");
    const [aiCaption, setAiCaption] = useState("");

    // Reset inputs when active item changes
    React.useEffect(() => {
        if (items[activeItemIndex]) {
            // If the item already has these fields (e.g. if we fetched them), load them
            // For now, assuming we start fresh or from previous props if available
            setContentText(items[activeItemIndex].originalData?.content_text || "");
            setAiCaption(items[activeItemIndex].originalData?.ai_caption || "");
        }
    }, [activeItemIndex, items]);

    const activeItem = items[activeItemIndex] || {};
    const isAdhoc = activeItem.type === 'adhoc_request';

    // Mock ID for the current item
    const currentId = isAdhoc ? `REQ-${activeItem.id}`.slice(0, 12) : "IMG-2024-00" + (5 - steps[currentStepIndex].count);

    const updateRequestStatus = async (id, status, extraData = {}) => {
        try {
            await fetch(`http://localhost:8000/api/contents/monthly-requests/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status, ...extraData })
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleNext = () => {
        const dataToUpdate = {
            content_text: contentText,
            ai_caption: aiCaption
        };

        if (isAdhoc) {
            // Logic for completing a request
            // remove item from list
            const updatedItems = items.filter((_, idx) => idx !== activeItemIndex);

            // Adjust active index
            let newIndex = activeItemIndex;
            if (newIndex >= updatedItems.length) {
                newIndex = Math.max(0, updatedItems.length - 1);
            }

            setItems(updatedItems);
            setActiveItemIndex(newIndex);

            // Update status to QA in backend with content
            updateRequestStatus(activeItem.id, 'QA', dataToUpdate);

            if (updatedItems.length === 0) {
                alert("All pending items reviewed!");
            }
            return;
        }

        // Logic for Monthly Client Stepper
        const currentStepKey = steps[currentStepIndex].id;

        if (counts[currentStepKey] > 1) {
            setCounts(prev => ({
                ...prev,
                [currentStepKey]: prev[currentStepKey] - 1
            }));
            // We should probably save the content for this specific item/step, but for now
            // as per simplified requirements, we are updating the request itself.
            // CAUTION: If we update the request on every step, we overwrite. 
            // The user request implies "resolve a content request... what was written... has to appear".
            // Since Monthly Request is one big object for the whole month, this might be tricky if there are multiple assets.
            // But the current implementation seems to treat the whole "Request" as one item in the sidebar, 
            // even though the counters imply multiple assets.
            // Ideally, we'd have a separate model for ContentItem.
            // But I will stick to the requested scope: save what is written when "Resolving".

            // However, the "Approve & Next" button is here.
            // If I save now, it overwrites.
            // But since I don't have a ContentItem model, I will update the MonthlyRequest.
            // This might mean only the LAST written content is saved if multiple assets are made.
            // Given the constraints and the user prompt "what was written... has to appear", I will save it.
            updateRequestStatus(activeItem.id, 'IN_PROGRESS', dataToUpdate); // Keep it safe or update partial?
            // Actually, the user says "resolved a content request", which implies finishing it.
            // Finishing happens when `counts` reach 0 or `Finish All`.

            // For now, I will clear the inputs for the next asset to simulate fresh start,
            // but I can't really "save" multiple contents without a new model.
            // I will assume the prompt refers to the Request level text.
            setContentText("");
            setAiCaption("");

        } else {
            if (currentStepIndex < steps.length - 1) {
                setCounts(prev => ({ ...prev, [currentStepKey]: 0 }));
                setCurrentStepIndex(prev => prev + 1);
                setContentText(""); // Clear for next step
                setAiCaption("");
            } else {
                setCounts(prev => ({ ...prev, [currentStepKey]: 0 }));

                // Remove item from list
                const updatedItems = items.filter((_, idx) => idx !== activeItemIndex);

                // Adjust active index
                let newIndex = activeItemIndex;
                if (newIndex >= updatedItems.length) {
                    newIndex = Math.max(0, updatedItems.length - 1);
                }

                setItems(updatedItems);
                setActiveItemIndex(newIndex);

                // Update status to QA in backend
                updateRequestStatus(activeItem.id, 'QA', dataToUpdate);

                // Reset internal steps for the new item now at activeItemIndex
                if (updatedItems.length > 0) {
                    setCounts({ photos: 4, carousels: 4, videos: 4, stories: 4 });
                    setCurrentStepIndex(0);
                    // Content fields will be reset by useEffect
                } else {
                    alert("All clients completed!");
                }
            }
        }
    };

    return (
        <div className="w-full flex flex-col px-0 py-2">
            <div className="bg-[#595556] rounded-3xl p-2 flex flex-col h-[85vh] min-h-0 mx-0">

                {/* Header Area */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 ml-8 mt-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-white">Monthly Content</h1>
                        <p className="text-slate-300 mt-1 text-sm">Customize and approve monthly assets</p>
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

                        {/* Sidebar - Client Checklist */}
                        <div className={`${isSidebarCollapsed ? 'w-20 items-center' : 'w-full lg:w-80'} transition-all duration-500 ease-in-out bg-slate-50 rounded-2xl py-6 border border-slate-200 flex flex-col shrink-0`}>

                            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center mb-6' : 'justify-between mb-4 px-6'}`}>
                                {!isSidebarCollapsed && (
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                                        <span>Pending</span>
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
                                    const isReturned = item.status === 'IN_REVISION';

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                if (index !== activeItemIndex) {
                                                    setActiveItemIndex(index);
                                                }
                                            }}
                                            className={`
                                        group flex items-center transition-all cursor-pointer border
                                        ${isSidebarCollapsed
                                                    ? 'justify-center p-2 rounded-xl aspect-square'
                                                    : 'gap-3 p-3 rounded-xl'}
                                        ${isActive
                                                    ? 'bg-[#192853] border-[#192853]'
                                                    : item.completed
                                                        ? 'bg-emerald-50 border-emerald-200 opacity-60 hover:opacity-100'
                                                        : isReturned
                                                            ? 'bg-red-50 border-red-200 hover:bg-red-100' // Red style for returned
                                                            : isRequest
                                                                ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                                                                : 'bg-white border-slate-200 hover:bg-slate-50'}
                                    `}
                                            title={isSidebarCollapsed ? item.name : ''}
                                        >
                                            <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors
                                        ${isActive
                                                    ? 'border-white/20 bg-white/10 text-white'
                                                    : item.completed
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : isReturned
                                                            ? 'bg-red-500 border-red-500 text-white' // Red icon
                                                            : isRequest
                                                                ? 'bg-orange-500 border-orange-500 text-white'
                                                                : 'border-slate-200 bg-white text-slate-300 group-hover:border-slate-300'}
                                    `}>
                                                {item.completed ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-bold">{isReturned ? '!' : (isRequest ? 'R' : index + 1)}</span>}
                                            </div>

                                            {!isSidebarCollapsed && (
                                                <div className="flex flex-col min-w-0 overflow-hidden">
                                                    <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : item.completed ? 'text-emerald-700' : isReturned ? 'text-red-700' : 'text-[#192853]'}`}>
                                                        {item.name}
                                                    </span>
                                                    <span className={`text-[10px] font-medium truncate ${isActive ? 'text-white/60' : item.completed ? 'text-emerald-600/60' : isReturned ? 'text-red-600/80' : 'text-[#5B75A9]'}`}>
                                                        {item.completed ? 'Completed' : isActive ? 'Reviewing' : isReturned ? 'Returned by QA' : isRequest ? 'Adhoc Request' : 'Monthly Plan'}
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

                        {/* Main Card */}
                        <div className="flex-1 bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 flex flex-col lg:flex-row gap-8 min-w-0 overflow-hidden">

                            {items.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 animate-in fade-in duration-500 min-h-[400px]">
                                    <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl">
                                        <Sparkles className="w-16 h-16 text-emerald-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-[#192853] mb-3">
                                        All Caught Up!
                                    </h3>
                                    <p className="text-slate-500 max-w-sm mx-auto text-lg">
                                        There are no pending content requests for this month. Great job!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Left Column: Visualizer & Progress */}
                                    <div className="lg:w-7/12 flex flex-col gap-6 min-h-0">

                                        {/* Conditional Header: Stepper or Request Info */}
                                        {isAdhoc ? (
                                            <div className="flex items-center gap-4 px-2 py-2">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <Sparkles size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-[#192853]">Adhoc Request</h3>
                                                    <p className="text-sm text-slate-500 font-medium">Requested by {activeItem.name || 'Unknown'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Compact Stepper */
                                            <div className="flex justify-between items-center relative px-2 py-2 shrink-0">
                                                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10"></div>
                                                {steps.map((step, index) => {
                                                    const isActive = index === currentStepIndex;
                                                    const isCompleted = index < currentStepIndex;
                                                    return (
                                                        <div key={step.id} className="flex flex-col items-center gap-2 bg-transparent z-10 transition-all duration-300">
                                                            <div className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                                                        ${isActive ? 'bg-[#FF6B4A] border-[#FF6B4A] text-white scale-110 shadow-lg shadow-[#FF6B4A]/30' :
                                                                    isCompleted ? 'bg-[#192853] border-[#192853] text-white' : 'bg-white border-slate-200 text-slate-300'}
                                                    `}>
                                                                {isCompleted ? <Check size={14} strokeWidth={3} /> : step.count}
                                                            </div>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#192853]' : 'text-slate-300'}`}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Image/Video Visualizer Frame */}
                                        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 relative flex items-center justify-center overflow-hidden group min-h-[300px]">

                                            {/* ID Badge */}
                                            <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm z-20">
                                                <span className="text-[10px] font-bold text-[#5B75A9] uppercase tracking-wider block">Asset ID</span>
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
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Vertical Divider (Desktop only) */}
                                    <div className="hidden lg:block w-px bg-slate-100 my-4 shrink-0"></div>

                                    {/* Right Column: Form Inputs */}
                                    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                                        {isAdhoc ? (
                                            /* --- Adhoc Request Form --- */
                                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="pb-2">
                                                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded uppercase tracking-wider">
                                                        Request Review
                                                    </span>
                                                    <h3 className="text-2xl font-bold text-[#192853] mt-2">Request Details</h3>
                                                </div>

                                                <div className="space-y-6 flex-1">
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                        <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider block mb-2">Instructions</label>
                                                        <p className="text-[#192853] text-sm leading-relaxed">
                                                            {activeItem.instructions || "No specific instructions provided."}
                                                        </p>

                                                    </div>

                                                    {/* QA Feedback Display */}
                                                    {activeItem.feedback && (
                                                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-2">
                                                            <label className="text-xs font-bold text-red-500 uppercase tracking-wider block mb-2">QA Feedback</label>
                                                            <p className="text-red-700 text-sm leading-relaxed font-medium">
                                                                {activeItem.feedback}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider block mb-1">Type</label>
                                                            <p className="font-bold text-[#192853] capitalize">{activeItem.contentType || "General"}</p>
                                                        </div>
                                                        <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider block mb-1">Status</label>
                                                            <p className="font-bold text-orange-500">Pending Review</p>
                                                        </div>
                                                    </div>

                                                    {/* Content Text */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider ml-1">Content Text</label>
                                                        <textarea
                                                            rows={5}
                                                            value={contentText}
                                                            onChange={(e) => setContentText(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[#192853] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all resize-none text-sm leading-relaxed"
                                                            placeholder="Enter the content text here..."
                                                        />
                                                    </div>

                                                    {/* AI Caption */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider ml-1">AI Caption</label>
                                                            <button className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-white px-2 py-1 rounded-md shadow-sm border border-orange-500/20 hover:bg-orange-500/5 transition-colors">
                                                                <Sparkles size={12} />
                                                                Generate
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={4}
                                                            value={aiCaption}
                                                            onChange={(e) => setAiCaption(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[#192853] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all resize-none text-sm leading-relaxed"
                                                            placeholder="AI generated caption..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4 flex gap-3">
                                                    <button
                                                        onClick={handleNext}
                                                        className="w-full py-4 bg-[#192853] hover:bg-[#203262] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#192853]/30 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Check size={20} />
                                                        <span>Submit to QA</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* --- Standard Monthly Form --- */
                                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="pb-2 shrink-0">
                                                    <span className="text-xs font-bold text-[#FF6B4A] bg-[#FF6B4A]/10 px-2 py-1 rounded uppercase tracking-wider">
                                                        Editing {steps[currentStepIndex].label.slice(0, -1)}
                                                    </span>
                                                    <h3 className="text-2xl font-bold text-[#192853] mt-2">Customize Details</h3>
                                                </div>

                                                <div className="space-y-4 flex-1">

                                                    {/* QA Feedback Display for Monthly Content */}
                                                    {activeItem.feedback && (
                                                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                                            <label className="text-xs font-bold text-red-500 uppercase tracking-wider block mb-2">QA Feedback</label>
                                                            <p className="text-red-700 text-sm leading-relaxed font-medium">
                                                                {activeItem.feedback}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {/* AI Content */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider ml-1">AI Generated Content</label>
                                                            <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF6B4A] bg-white px-2 py-1 rounded-md shadow-sm border border-[#FF6B4A]/20 hover:bg-[#FF6B4A]/5 transition-colors">
                                                                <Sparkles size={12} />
                                                                Regenerate
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={5}
                                                            value={contentText}
                                                            onChange={(e) => setContentText(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[#192853] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#FF6B4A] focus:ring-4 focus:ring-[#FF6B4A]/5 transition-all resize-none text-sm leading-relaxed"
                                                            placeholder="AI content will appear here..."
                                                        />
                                                    </div>

                                                    {/* Caption */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-[#5B75A9] uppercase tracking-wider ml-1">Caption</label>
                                                        <textarea
                                                            rows={4}
                                                            value={aiCaption}
                                                            onChange={(e) => setAiCaption(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[#192853] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#192853] focus:ring-4 focus:ring-[#192853]/5 transition-all resize-none text-sm leading-relaxed"
                                                            placeholder="Refine the caption..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* Next Button */}
                                                <div className="pt-2 shrink-0">
                                                    <button
                                                        onClick={handleNext}
                                                        className="w-full py-4 bg-[#192853] hover:bg-[#203262] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#192853]/30 hover:shadow-[#192853]/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group"
                                                    >
                                                        <span>{currentStepIndex === steps.length - 1 && counts.stories <= 1 ? "Finish All" : "Approve & Next"}</span>
                                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

