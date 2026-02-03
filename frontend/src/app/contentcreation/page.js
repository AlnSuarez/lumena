"use client";

import React, { useState, useEffect } from "react";
import {
    Layout, CheckCircle2, Clock, AlertCircle, FileText, Video,
    MessageSquare, Filter, Search, MoreHorizontal, User as UserIcon, X, Sparkles, Activity, Calendar
} from "lucide-react";

export default function ContentBoardPage() {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState("ALL");
    const [filterUser, setFilterUser] = useState("ALL");

    // Board Columns Configuration
    const columns = [
        { id: 'TO_DO', title: 'To Do', color: 'bg-slate-400', icon: AlertCircle },
        { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-[#FFE14F]', icon: Clock },
        { id: 'QA', title: 'QA', color: 'bg-purple-400', icon: CheckCircle2 },
        { id: 'IN_REVISION', title: 'In Revision', color: 'bg-orange-400', icon: MessageSquare },
        { id: 'DONE', title: 'Done', color: 'bg-emerald-400', icon: CheckCircle2 },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Requests (assuming an admin view or similar that returns everything)
            // In a real app, you'd pass role=SUPERUSER or similar to see all
            const [reqResponse, userResponse] = await Promise.all([
                fetch('http://localhost:8000/api/contents/monthly-requests/?role=SUPERUSER'),
                fetch('http://localhost:8000/api/users/manage/') // Fetch all users for filter
            ]);

            if (reqResponse.ok) {
                const data = await reqResponse.json();
                setRequests(data);
            }
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUsers(userData);
            }
        } catch (error) {
            console.error("Error fetching board data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived Data
    const filteredRequests = requests.filter(req => {
        const matchesType = filterType === 'ALL' || req.request_type === filterType;
        const matchesUser = filterUser === 'ALL' ||
            (req.client_details?.id && String(req.client_details.id) === filterUser) ||
            (req.assigned_to_details?.id && String(req.assigned_to_details.id) === filterUser);

        return matchesType && matchesUser;
    });

    const getColumnRequests = (status) => filteredRequests.filter(req => req.status === status);

    const getRequestTypeDetails = (type) => {
        switch (type) {
            case 'MONTHLY_CONTENT': return {
                label: 'Monthly',
                color: 'bg-blue-100 text-blue-900',
                badgeColor: 'bg-blue-600 text-white',
                borderColor: 'border-l-4 border-blue-600',
                icon: Layout
            };
            case 'VIDEO_SHOOT': return {
                label: 'Video Shoot',
                color: 'bg-purple-100 text-purple-900',
                badgeColor: 'bg-purple-600 text-white',
                borderColor: 'border-l-4 border-purple-600',
                icon: Video
            };
            case 'CONTENT_REQUEST': return {
                label: 'Request',
                color: 'bg-orange-100 text-orange-900',
                badgeColor: 'bg-orange-600 text-white',
                borderColor: 'border-l-4 border-orange-600',
                icon: FileText
            };
            default: return {
                label: 'Task',
                color: 'bg-gray-100 text-gray-900',
                badgeColor: 'bg-gray-600 text-white',
                borderColor: 'border-l-4 border-gray-600',
                icon: FileText
            };
        }
    };

    return (
        <div className="w-full flex flex-col px-0 py-2">
            <div className="bg-[#F3F0E9] rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0 relative">
                {/* Header & Filters */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 flex-shrink-0">
                    <div>
                        <h1 className="text-3xl font-semibold text-black">Content Board</h1>
                        <p className="mt-1 text-slate-600 text-sm">Visualise and manage the content pipeline.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Type Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter size={16} className="text-[#192853]/50" />
                            </div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-white border border-[#192853]/10 rounded-xl text-sm font-bold text-[#192853] focus:ring-2 focus:ring-[#192853]/20 focus:border-[#192853] outline-none shadow-sm cursor-pointer appearance-none hover:bg-slate-50 transition-colors min-w-[180px]"
                            >
                                <option value="ALL">All Content Types</option>
                                <option value="MONTHLY_CONTENT">Monthly Contents</option>
                                <option value="VIDEO_SHOOT">Video Shoots</option>
                                <option value="CONTENT_REQUEST">Content Requests</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-[#192853]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        {/* User Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon size={16} className="text-[#192853]/50" />
                            </div>
                            <select
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-white border border-[#192853]/10 rounded-xl text-sm font-bold text-[#192853] focus:ring-2 focus:ring-[#192853]/20 focus:border-[#192853] outline-none shadow-sm cursor-pointer appearance-none hover:bg-slate-50 transition-colors min-w-[180px]"
                            >
                                <option value="ALL">All Users</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-[#192853]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        <button className="px-5 py-3 bg-[#192853] text-white rounded-xl font-bold hover:bg-[#203163] transition-all shadow-lg flex items-center gap-2">
                            <span>+ New</span>
                        </button>
                    </div>
                </div>

                {/* Board Container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 min-h-0">
                    <div className="flex gap-8 min-w-[1400px] h-full"> {/* Ensure min width for horizontal scroll if needed */}

                        {columns.map(col => {
                            const colRequests = getColumnRequests(col.id);
                            const Icon = col.icon;

                            return (
                                <div key={col.id} className="flex-1 flex flex-col min-w-[320px] bg-white rounded-2xl p-4">
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full ${col.color.replace('text-', 'bg-').split(' ')[0]}`}></div> {/* Hacky color extract or just use bg */}
                                            <h2 className="text-lg font-extrabold text-[#192853]">{col.title}</h2>
                                            <span className="bg-[#192853] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                                {colRequests.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column Content */}
                                    <div className="flex-1 bg-white rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto scrollbar-hide min-h-0">
                                        {colRequests.length === 0 ? (
                                            <div className="text-center py-10 opacity-40">
                                                <p className="text-sm font-bold text-[#192853]">No items</p>
                                            </div>
                                        ) : (
                                            colRequests.map(req => {
                                                const typeDetails = getRequestTypeDetails(req.request_type);
                                                const TypeIcon = typeDetails.icon;

                                                return (
                                                    <div
                                                        key={req.id}
                                                        onClick={() => setSelectedRequest(req)}
                                                        className={`${typeDetails.color} p-4 rounded-2xl transition-all group hover:-translate-y-1 duration-300 cursor-pointer hover:shadow-lg border border-transparent hover:border-[#192853]/10`}
                                                    >

                                                        {/* Card Header */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full flex items-center gap-1.5 ${typeDetails.badgeColor}`}>
                                                                <TypeIcon size={10} />
                                                                {typeDetails.label}
                                                            </span>
                                                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-[#192853]/40 hover:text-[#192853] transition-all">
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                        </div>

                                                        {/* Card Title */}
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {req.client_details && (
                                                                <img
                                                                    src={req.client_details.client_profile?.logo ? `http://localhost:8000${req.client_details.client_profile.logo}` : `https://ui-avatars.com/api/?name=${req.client_details.username}&background=6366f1&color=fff`}
                                                                    alt={req.client_details.username}
                                                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white"
                                                                    title={`Client: ${req.client_details.username}`}
                                                                />
                                                            )}
                                                            <h3 className="font-bold text-[#192853] text-sm line-clamp-2 leading-snug">
                                                                {req.client_details ? (
                                                                    <span className="font-black text-[#192853]">{req.client_details.username}:</span>
                                                                ) : null}
                                                                {req.notes || "Untitled Request"}
                                                            </h3>
                                                        </div>

                                                        {/* Optional: Date or Detail */}
                                                        <div className="text-xs text-[#192853]/70 mb-3 font-semibold flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {req.month}
                                                        </div>

                                                        {/* Card Footer */}
                                                        <div className="flex items-center justify-between border-t border-[#192853]/10 pt-3 mt-3">

                                                            {/* Avatar (Client or Assignee) */}
                                                            <div className="flex -space-x-2">
                                                                {req.client_details && (
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shadow-md" title={`Client: ${req.client_details.username}`}>
                                                                        {req.client_details.username.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                {req.assigned_to_details && (
                                                                    <div className="w-8 h-8 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shadow-md" title={`Assigned: ${req.assigned_to_details.username}`}>
                                                                        {req.assigned_to_details.username.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Example Tag/Priority */}
                                                            <div className="flex items-center gap-1">

                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detail Modal */}
                {selectedRequest && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-[#192853]/20 backdrop-blur-sm rounded-3xl animate-in fade-in duration-200">
                        <div className="bg-white w-full h-full rounded-3xl shadow-2xl flex overflow-hidden border border-slate-200 relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedRequest(null); }}
                                className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition-colors border border-slate-200"
                            >
                                <X size={20} />
                            </button>

                            {/* Left: Content Preview */}
                            <div className="flex-1 flex flex-col bg-slate-50 p-6 sm:p-8 lg:p-10 overflow-y-auto">
                                <div className="max-w-3xl mx-auto w-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-[#192853]">Content Preview</h2>
                                            <p className="text-slate-500 text-sm">Visualizing content for {selectedRequest.client_details?.username}</p>
                                        </div>
                                    </div>

                                    {/* Mock Phone Preview or Card */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            {selectedRequest.client_details?.client_profile?.logo ? (
                                                <img src={`http://localhost:8000${selectedRequest.client_details.client_profile.logo}`} alt="Client Logo" className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                                            )}
                                            <div>
                                                <div className="h-4 w-32 bg-slate-100 rounded mb-1">
                                                    {selectedRequest.client_details?.username && <span className="text-sm font-bold text-[#192853]">{selectedRequest.client_details.username}</span>}
                                                </div>
                                                <div className="h-3 w-20 bg-slate-100 rounded"></div>
                                            </div>
                                        </div>

                                        {/* Media Placeholder */}
                                        <div className="aspect-square bg-slate-100 rounded-xl mb-4 flex items-center justify-center text-slate-300 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                                            <div className="text-center">
                                                <Video size={48} className="mx-auto mb-2 opacity-50" />
                                                <span className="text-sm font-medium">Visual Media Placeholder</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-4 mb-4 text-slate-300">
                                            <div className="w-6 h-6 rounded-full bg-slate-100"></div>
                                            <div className="w-6 h-6 rounded-full bg-slate-100"></div>
                                            <div className="w-6 h-6 rounded-full bg-slate-100"></div>
                                        </div>

                                        {/* Caption */}
                                        <div className="space-y-2">
                                            <p className="text-[#192853] text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedRequest.ai_caption ? (
                                                    <span className="block mb-2 font-medium">{selectedRequest.ai_caption}</span>
                                                ) : (
                                                    <span className="italic text-slate-400">No caption generated yet...</span>
                                                )}
                                            </p>
                                            {selectedRequest.content_text && (
                                                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200 mt-4">
                                                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Content Strategy / Notes</span>
                                                    {selectedRequest.content_text}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: History Timeline Sidebar */}
                            <div className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full shrink-0">
                                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-bold text-[#192853] flex items-center gap-2">
                                        <Activity size={18} />
                                        Activity History
                                    </h3>
                                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                                        {selectedRequest.history ? selectedRequest.history.length : 0}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {selectedRequest.history && selectedRequest.history.length > 0 ? (
                                        selectedRequest.history.map((hist, idx) => (
                                            <div key={hist.id || idx} className="relative pl-6 pb-6 border-l-2 border-slate-100 last:pb-0 last:border-l-0 group">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 group-hover:scale-110 transition-transform"></div>

                                                <div className="flex flex-col gap-1 -mt-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            {new Date(hist.timestamp).toLocaleDateString()}
                                                            <span className="mx-1">•</span>
                                                            {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

                                                        </span>
                                                    </div>

                                                    <div className="text-sm font-medium text-[#192853]">
                                                        Status changed to <span className="font-bold text-indigo-600">{hist.new_status.replace('_', ' ')}</span>
                                                    </div>

                                                    {hist.changed_by_details && (
                                                        <div className="text-xs text-slate-500">
                                                            Change made by: <span className="font-semibold">@{hist.changed_by_details.username}</span>
                                                        </div>
                                                    )}

                                                    {hist.notes && (
                                                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg mt-2 text-xs text-slate-600 italic">
                                                            &quot;{hist.notes}&quot;
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 opacity-50">
                                            <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm text-slate-400">No activity recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
