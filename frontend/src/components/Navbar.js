"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, ChevronDown, Bell, X, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userInfo, setUserInfo] = useState({ name: "", role: "" });
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [contentCreators, setContentCreators] = useState([]);

    const router = useRouter();

    useEffect(() => {
        const storedName = localStorage.getItem("username");
        const storedRole = localStorage.getItem("userRole");

        if (storedName || storedRole) {
            setUserInfo({
                name: storedName || "User",
                role: storedRole ? storedRole : "Guest"
            });
        }
    }, []);

    // Notification Logic (Only for Superusers)
    useEffect(() => {
        if (['SUPERUSER', 'ADMIN'].includes(userInfo.role)) {
            fetchNotifications();
            fetchCreators();

            // Poll every 30 seconds for updates
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [userInfo.role]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/?role=SUPERUSER');
            if (response.ok) {
                const data = await response.json();
                // Filter logic
                const pending = data.filter(req => {
                    const isActive = req.status === 'TO_DO' || req.status === 'IN_PROGRESS';
                    const isUnassigned = !req.assigned_to;
                    const hasSuggestion = req.notes && req.notes.includes("Suggested assignment");
                    return isActive && (isUnassigned || hasSuggestion);
                });
                setNotifications(pending);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const fetchCreators = async () => {
        try {
            const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/content-creators/');
            if (response.ok) {
                const data = await response.json();
                setContentCreators(data);
            }
        } catch (error) {
            console.error("Error fetching creators:", error);
        }
    };

    const handleConfirmAssignment = async (requestId) => {
        try {
            const userId = localStorage.getItem('userId');
            const confirmUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/${requestId}/confirm-assignment/`);
            if (userId) confirmUrl.searchParams.append('user_id', userId);

            const response = await fetch(
                confirmUrl.toString(),
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            );
            if (response.ok) {
                // Remove confirmed request locally to update UI instantly
                setNotifications(prev => prev.filter(n => n.id !== requestId));
            }
        } catch (error) {
            console.error("Error confirming assignment:", error);
        }
    };

    const handleReassign = async (requestId, creatorId) => {
        try {
            const userId = localStorage.getItem('userId');
            const reassignUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/${requestId}/reassign/`);
            if (userId) reassignUrl.searchParams.append('user_id', userId);

            const response = await fetch(
                reassignUrl.toString(),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ creator_id: creatorId })
                }
            );
            if (response.ok) {
                // Remove assigned request locally
                setNotifications(prev => prev.filter(n => n.id !== requestId));
            }
        } catch (error) {
            console.error("Error reassigning:", error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const displayRole = userInfo.role ? userInfo.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "...";
    const isAdmin = ['SUPERUSER', 'ADMIN'].includes(userInfo.role);

    return (
        <nav className="w-full bg-transparent px-8 py-4 sticky top-0 z-50">
            <div className="flex justify-end items-center w-full gap-4">

                {/* Admin Notifications */}
                {isAdmin && (
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative ${showNotifications ? 'bg-indigo-100 text-indigo-700' : 'bg-white/50 border border-indigo-100 text-gray-500 hover:text-indigo-600 hover:bg-white'}`}
                        >
                            <Bell size={20} />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 top-full mt-3 w-96 max-h-[600px] overflow-hidden flex flex-col bg-white/95 backdrop-blur-xl border border-indigo-100 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5 z-50">
                                <div className="p-5 border-b border-indigo-50 bg-indigo-50/50 flex items-center justify-between shrink-0">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base">Pending Assignments</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            {notifications.length} request{notifications.length !== 1 ? 's' : ''} require attention
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="p-1.5 hover:bg-white/50 rounded-full text-slate-400 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent">
                                    {notifications.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400 px-8">
                                            <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <p className="font-medium text-sm text-slate-600">All caught up!</p>
                                            <p className="text-xs mt-1 text-slate-400">Every request has an owner.</p>
                                        </div>
                                    ) : (
                                        notifications.map(req => (
                                            <div key={req.id} className="p-4 bg-white hover:bg-indigo-50/30 rounded-2xl border border-indigo-50 transition-all group relative shadow-sm">
                                                {/* Stripe indicator */}
                                                <div className={`absolute left-0 inset-y-4 w-1 rounded-r-full ${req.notes?.includes("Suggested") ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>

                                                <div className="pl-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400/80 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            {req.month}
                                                        </span>
                                                        {req.notes?.includes("Suggested") && (
                                                            <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                                <Sparkles size={10} /> Suggested
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 className="font-bold text-sm text-slate-800 mb-1">
                                                        {req.client_details?.username}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mb-3 line-clamp-1">
                                                        {req.content_text || "No content details yet..."}
                                                    </p>

                                                    {/* Action Area */}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {req.assigned_to_details ? (
                                                            // Case: Suggested Assignment
                                                            <div className="flex items-center gap-2 w-full bg-slate-50 p-2 rounded-xl border border-indigo-50/50">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <div className="w-6 h-6 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-[9px] font-bold text-slate-700 shrink-0">
                                                                        {req.assigned_to_details.username[0].toUpperCase()}
                                                                    </div>
                                                                    <span className="text-xs font-semibold truncate text-slate-600">
                                                                        {req.assigned_to_details.username}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleConfirmAssignment(req.id)}
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-indigo-200"
                                                                >
                                                                    Confirm
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            // Case: Unassigned
                                                            <div className="w-full">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <AlertCircle size={14} className="text-orange-500" />
                                                                    <span className="text-xs font-bold text-orange-600">Unassigned Task</span>
                                                                </div>
                                                                <select
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-2 font-medium text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                    onChange={(e) => {
                                                                        if (e.target.value) handleReassign(req.id, e.target.value);
                                                                    }}
                                                                    defaultValue=""
                                                                >
                                                                    <option value="" disabled>Assign Content Creator...</option>
                                                                    {contentCreators.map(cc => (
                                                                        <option key={cc.id} value={cc.id}>{cc.username}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFF8FF] border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 group dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                    >
                        <div className="h-8 w-8 bg-[#192853] rounded-full flex items-center justify-center group-hover:bg-[#FFE14F] transition-colors">
                            <User size={18} className="text-white group-hover:text-[#192853] transition-colors" />
                        </div>

                        <div className="flex flex-col items-start min-w-[80px]">
                            <span className="text-sm font-bold text-[#192853] leading-none dark:text-slate-100">{userInfo.name || "Loading..."}</span>
                            <span className="text-xs text-gray-500 font-medium dark:text-slate-400">{displayRole}</span>
                        </div>

                        <ChevronDown
                            size={16}
                            className={`text-gray-600 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-indigo-100 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
