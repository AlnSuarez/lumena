"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, Layers, Instagram, Linkedin, Twitter, Facebook, Music } from "lucide-react";

const PLATFORMS_MAP = {
    instagram: { label: "Instagram", icon: Instagram, color: "text-[#E1306C]" },
    linkedin: { label: "LinkedIn", icon: Linkedin, color: "text-[#0A66C2]" },
    twitter: { label: "X / Twitter", icon: Twitter, color: "text-foreground" },
    facebook: { label: "Facebook", icon: Facebook, color: "text-[#1877F2]" },
    tiktok: { label: "TikTok", icon: Music, color: "text-foreground" }
};

export default function CompletedContentPage() {
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState("GUEST");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const role = localStorage.getItem("userRole") || "GUEST";
        const uid = localStorage.getItem("userId");
        setUserRole(role);
        if (uid) {
            const parsedUid = parseInt(uid);
            setUserId(parsedUid);
            fetchScheduledPosts(parsedUid, role);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchScheduledPosts = async (uid, role) => {
        setLoading(true);
        try {
            // If SUPERUSER, load all. If CLIENT, load only their own
            let url = "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/scheduler/schedules/";
            if (role === "CLIENT") {
                url += `?client_id=${uid}`;
            }
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                // Sort by date (newest first)
                data.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
                setPosts(data);
            }
        } catch (error) {
            console.error("Error fetching scheduled posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, errMsg) => {
        switch (status) {
            case "PUBLISHED":
                return (
                    <span className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        <CheckCircle2 size={12} />
                        Published
                    </span>
                );
            case "SCHEDULED":
                return (
                    <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        <Clock size={12} />
                        Pending
                    </span>
                );
            case "PUBLISHING":
                return (
                    <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                        <RefreshCw size={12} className="animate-spin" />
                        Publishing...
                    </span>
                );
            case "FAILED":
                return (
                    <span 
                        className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider cursor-help"
                        title={errMsg || "Unknown error"}
                    >
                        <AlertCircle size={12} />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Draft
                    </span>
                );
        }
    };

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full animate-in fade-in duration-300">
            <div className="bg-secondary rounded-3xl p-8 flex flex-col h-[85vh] min-h-0 mx-0 relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Layers className="text-primary" size={32} />
                            Completed & Scheduled Content
                        </h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Track the status of all your content pieces scheduled to publish on social channels.
                        </p>
                    </div>
                    <button
                        onClick={() => fetchScheduledPosts(userId, userRole)}
                        className="p-3 bg-muted hover:bg-muted/80 rounded-full text-foreground transition-all active:scale-95"
                        title="Refresh List"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto pr-4 space-y-6 pb-10">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl text-muted-foreground">
                            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-bold text-lg text-foreground mb-1">No scheduled content found</p>
                            <p className="text-sm">You haven't scheduled any publications yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {posts.map((post) => {
                                const scheduledDate = new Date(post.scheduled_at);
                                return (
                                    <div key={post.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/40 transition-all">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Thumbnail Fallback */}
                                            <div className="w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center border border-border overflow-hidden flex-shrink-0">
                                                {post.content_details?.linked_image_details?.image_compressed ? (
                                                    <img 
                                                        src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${post.content_details.linked_image_details.image_compressed}`} 
                                                        alt="Thumbnail" 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <Layers className="text-primary/45" size={24} />
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                                                        {post.content_details?.request_type?.replace(/_/g, " ") || "Publication"}
                                                    </h3>
                                                    {post.client_details && (
                                                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                                            {post.client_details.username}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 max-w-xl">
                                                    {post.caption}
                                                </p>
                                                <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={13} />
                                                        {scheduledDate.toLocaleDateString(undefined, {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={13} />
                                                        {scheduledDate.toLocaleTimeString(undefined, {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col items-end gap-3 justify-between w-full md:w-auto border-t md:border-t-0 border-border pt-3 md:pt-0">
                                            {getStatusBadge(post.status, post.error_message)}
                                            
                                            {/* Target platforms */}
                                            <div className="flex items-center gap-1.5">
                                                {post.platforms.map((plat) => {
                                                    const config = PLATFORMS_MAP[plat.toLowerCase()];
                                                    if (!config) return null;
                                                    const IconComponent = config.icon;
                                                    return (
                                                        <div key={plat} className="p-1.5 bg-muted rounded-lg" title={config.label}>
                                                            <IconComponent size={14} className={config.color} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
