"use client";

import React, { useState, useEffect } from "react";
import { 
    Clock, 
    ImageIcon, 
    Heart, 
    MessageCircle, 
    Send, 
    Bookmark, 
    Sparkles,
    AlertCircle,
    Hash,
    Trash2,
    Eye,
    TrendingUp,
    TrendingDown
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function PublicationLogPage() {
    const [clients, setClients] = useState([]);
    const [logPosts, setLogPosts] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);
    
    // Filters
    const [filterLogClient, setFilterLogClient] = useState("ALL");
    const [filterLogStatus, setFilterLogStatus] = useState("ALL");
    
    // Active post & metrics
    const [activeLogPost, setActiveLogPost] = useState(null);
    const [logMetrics, setLogMetrics] = useState({});
    
    const primaryColor = "#6366F1"; // Indigo
    const borderRadius = "rounded-3xl";

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeletePost = async (postId) => {
        if (!confirm("Are you sure you want to delete this content? This will also cancel it on Postproxy if scheduled.")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/scheduler/schedules/${postId}/`, {
                method: "DELETE",
            });
            if (res.ok) {
                setLogPosts(prev => prev.filter(p => p.id !== postId));
                setActiveLogPost(null);
            } else {
                alert("Failed to delete content.");
            }
        } catch (err) {
            console.error("Error deleting post:", err);
            alert("Error connecting to server to delete.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Fetch clients
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch(`${API_BASE}/clients/`);
                if (res.ok) {
                    const data = await res.json();
                    setClients(data);
                }
            } catch (err) {
                console.error("Error fetching clients:", err);
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Fetch logs with filters
    useEffect(() => {
        const fetchLogs = async () => {
            setLoadingLogs(true);
            try {
                let url = `${API_BASE}/scheduler/schedules/`;
                const params = [];
                if (filterLogClient !== "ALL") params.push(`client_id=${filterLogClient}`);
                if (filterLogStatus !== "ALL") params.push(`status=${filterLogStatus}`);
                
                if (params.length > 0) {
                    url += `?${params.join("&")}`;
                }
                
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    // Sort logs by date (newest first)
                    const sorted = data.sort((a, b) => {
                        const dateA = new Date(a.published_at || a.scheduled_at || 0);
                        const dateB = new Date(b.published_at || b.scheduled_at || 0);
                        return dateB - dateA;
                    });
                    setLogPosts(sorted);
                    
                    // Maintain active selection if it still exists in list, otherwise select first
                    if (sorted.length > 0) {
                        const exists = sorted.find(p => p.id === activeLogPost?.id);
                        if (!exists) {
                            setActiveLogPost(sorted[0]);
                            if (sorted[0].status === 'PUBLISHED') fetchPostMetrics(sorted[0].id);
                        }
                    } else {
                        setActiveLogPost(null);
                    }
                }
            } catch (err) {
                console.error("Error fetching publication logs:", err);
            } finally {
                setLoadingLogs(false);
            }
        };
        fetchLogs();
    }, [filterLogClient, filterLogStatus]);

    const formatMetric = (num) => {
        if (num === undefined || num === null) return null;
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "k";
        return num.toLocaleString();
    };

    // Fetch metrics from API
    const fetchPostMetrics = async (postId) => {
        if (logMetrics[postId]) return; // Already cached
        try {
            const res = await fetch(`${API_BASE}/scheduler/schedules/${postId}/metrics/`);
            if (res.ok) {
                const data = await res.json();
                const metricsObj = data.metrics || data;
                setLogMetrics(prev => ({
                    ...prev,
                    [postId]: metricsObj
                }));

                // Update local status and error message if fetched status differs
                if (data.status) {
                    setLogPosts(prevPosts => 
                        prevPosts.map(p => 
                            p.id === postId 
                                ? { ...p, status: data.status, error_message: data.error_message } 
                                : p
                        )
                    );
                    setActiveLogPost(prevActive => 
                        prevActive && prevActive.id === postId 
                            ? { ...prevActive, status: data.status, error_message: data.error_message } 
                            : prevActive
                    );
                }
            }
        } catch (err) {
            console.error("Error fetching post metrics:", err);
        }
    };

    return (
        <div className="w-full flex flex-col px-0 py-2 h-full">
            <div className={`bg-secondary ${borderRadius} flex flex-col h-[85vh] min-h-0 mx-0 overflow-hidden transition-all duration-300`}>
                
                {/* Header */}
                <div className="px-8 pt-6 pb-5 flex items-start justify-between flex-shrink-0 border-b border-border">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                            <Sparkles size={32} style={{ color: primaryColor }} />
                            Publication Log
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Review published history, reactions, and scheduled queue
                        </p>
                    </div>
                </div>

                {/* Main 2-Column Body */}
                <div className="flex flex-1 min-h-0 gap-0">
                    
                    {/* Left Panel: Filters & Log List */}
                    <div className="w-[350px] flex-shrink-0 flex flex-col border-r border-border bg-background/25">
                        {/* Filter Bar */}
                        <div className="p-4 border-b border-border/85 bg-card/20 space-y-3 shrink-0">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest block">Client</label>
                                    <select
                                        value={filterLogClient}
                                        onChange={e => setFilterLogClient(e.target.value)}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="ALL">All Clients</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest block">Status</label>
                                    <select
                                        value={filterLogStatus}
                                        onChange={e => setFilterLogStatus(e.target.value)}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="ALL">All Status</option>
                                        <option value="SCHEDULED">Scheduled</option>
                                        <option value="PUBLISHED">Published</option>
                                        <option value="DRAFT">Draft</option>
                                        <option value="FAILED">Failed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Logs List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loadingLogs ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
                                    ))}
                                </div>
                            ) : logPosts.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <Clock size={32} className="mx-auto mb-2 opacity-35 animate-pulse" />
                                    <p className="text-sm font-semibold">No publications logs found.</p>
                                </div>
                            ) : (
                                logPosts.map(post => {
                                    const isActive = activeLogPost?.id === post.id;
                                    const cDetails = post.content_details || {};
                                    const clDetails = post.client_details || {};
                                    
                                    const matchedClient = clients.find(c => c.id === post.client);
                                    const cInitials = matchedClient ? matchedClient.initials : (clDetails.username ? clDetails.username.slice(0,1).toUpperCase() : 'U');
                                    const cColor = matchedClient ? matchedClient.color : '#6B7280';
                                    
                                    const thumb = cDetails.linked_image_details?.image_compressed || cDetails.linked_image_details?.image || null;
                                    const pubTime = post.published_at || post.scheduled_at;

                                    return (
                                        <div
                                            key={post.id}
                                            onClick={() => {
                                                setActiveLogPost(post);
                                                if (post.status === 'PUBLISHED') fetchPostMetrics(post.id);
                                            }}
                                            className={`group flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer hover:shadow-md ${
                                                isActive 
                                                    ? 'bg-card border-transparent shadow-md scale-[1.01]' 
                                                    : 'bg-card/40 border-border/40 hover:border-border'
                                            }`}
                                            style={isActive ? { borderLeft: `4px solid ${primaryColor}` } : {}}
                                        >
                                            {/* Left Profile initials */}
                                            <div 
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0"
                                                style={{ backgroundColor: cColor }}
                                            >
                                                {cInitials}
                                            </div>

                                            {/* Center Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1.5">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                                                        {matchedClient ? matchedClient.name : (clDetails.username || 'Client')}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 tracking-widest ${
                                                        post.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' :
                                                        post.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400' :
                                                        post.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400' :
                                                        'bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                                                    }`}>
                                                        {post.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-black text-foreground truncate mt-1">
                                                    {post.caption || 'Untitled post'}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2">
                                                    <Clock size={10} />
                                                    <span>
                                                        {pubTime ? new Date(pubTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right thumbnail preview */}
                                            {thumb && (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border/40 shrink-0 relative">
                                                    <img src={thumb} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Post Details, Visual Feed & Social Statistics */}
                    <div className="flex-1 flex flex-col min-w-0 bg-background/5 p-8 overflow-y-auto">
                        {!activeLogPost ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Clock size={36} className="mb-3 opacity-30 animate-pulse" style={{ color: primaryColor }} />
                                <h3 className="font-bold text-foreground text-sm mb-1">Select a Log Entry</h3>
                                <p className="text-xs max-w-xs leading-relaxed">
                                    Click on any post in the left panel to review its publication details, live visual preview, and real-time social metrics.
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-3xl w-full mx-auto space-y-8 animate-in fade-in duration-200">
                                {/* Details Header Card */}
                                <div className="bg-card border border-border/60 rounded-3xl p-6 relative flex items-start gap-4 shadow-sm">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            Log Details #{activeLogPost.id}
                                        </span>
                                        <h2 className="text-xl font-black text-foreground tracking-tight mt-1">
                                            {activeLogPost.client_details?.username}'s Post
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} />
                                                <span>
                                                    {activeLogPost.published_at ? 'Published: ' : 'Scheduled: '}
                                                    <strong>
                                                        {new Date(activeLogPost.published_at || activeLogPost.scheduled_at).toLocaleString()}
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-xl tracking-widest ${
                                            activeLogPost.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' :
                                            activeLogPost.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400' :
                                            activeLogPost.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400' :
                                            'bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                                        }`}>
                                            {activeLogPost.status}
                                        </span>
                                        {activeLogPost.error_message && (
                                            <span className="text-[9px] text-red-500 font-bold max-w-[150px] text-right truncate" title={activeLogPost.error_message}>
                                                {activeLogPost.error_message}
                                            </span>
                                        )}
                                        {(activeLogPost.status === 'SCHEDULED' || activeLogPost.status === 'FAILED' || activeLogPost.status === 'DRAFT') && (
                                            <button
                                                onClick={() => handleDeletePost(activeLogPost.id)}
                                                disabled={isDeleting}
                                                className="mt-1 flex items-center gap-1 px-2.5 py-1 rounded-xl border border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-905/30 dark:hover:bg-red-950/20 text-[11px] font-bold text-red-500 transition-all duration-200 disabled:opacity-50"
                                            >
                                                <Trash2 size={11} />
                                                Delete Content
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Main Grid: Media & Statistics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    
                                    {/* Visual Feed Mock */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block">Visual Preview</label>
                                        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                                            {/* Instagram layout header */}
                                            <div className="flex items-center gap-2.5 p-4 border-b border-border/40 shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {activeLogPost.client_details?.username?.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground leading-none">{activeLogPost.client_details?.username || 'Client'}</p>
                                                    <p className="text-[9px] text-muted-foreground mt-0.5">Sponsored</p>
                                                </div>
                                            </div>

                                            {/* Feed Image/Video */}
                                            <div className="aspect-square w-full bg-secondary/40 relative flex items-center justify-center overflow-hidden border-b border-border/40 select-none">
                                                {(() => {
                                                    const thumb = activeLogPost.content_details?.linked_image_details?.image_url || activeLogPost.content_details?.linked_image_details?.image || null;
                                                    if (thumb) {
                                                        return <img src={thumb} alt="Preview" className="w-full h-full object-cover" />;
                                                    }
                                                    return (
                                                        <div className="text-center p-6 text-muted-foreground">
                                                            <ImageIcon size={28} className="mx-auto mb-2 opacity-30" />
                                                            <span className="text-xs">No media preview available</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Bottom bar caption preview */}
                                            <div className="p-4 space-y-2">
                                                <p className="text-xs text-foreground leading-relaxed">
                                                    <span className="font-bold mr-1.5">{activeLogPost.client_details?.username}</span>
                                                    {activeLogPost.caption || 'No caption provided.'}
                                                </p>
                                                {activeLogPost.hashtags && activeLogPost.hashtags.length > 0 && (
                                                    <p className="text-[10px] text-primary/80 font-bold">
                                                        {activeLogPost.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                     {/* Metrics (Likes, Comments, Shares, Vistas/Reach) */}
                                     <div className="space-y-3">
                                         <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block">Post Analysis (Postproxy)</label>
                                         
                                         {activeLogPost.status !== 'PUBLISHED' ? (
                                             <div className="bg-card border border-border/60 rounded-3xl p-6 text-center text-muted-foreground">
                                                 <Clock size={28} className="mx-auto mb-2 opacity-30 animate-pulse" />
                                                 <p className="text-xs font-semibold">Metrics only available for Published posts.</p>
                                             </div>
                                         ) : (
                                             <div className="space-y-4">
                                                 <div className="grid grid-cols-2 gap-4">
                                                     {/* Likes */}
                                                     <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm relative flex flex-col justify-between h-28 hover:border-primary/40 transition-colors">
                                                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                             <Heart size={14} className="text-rose-500 fill-rose-500" />
                                                             Likes
                                                         </span>
                                                         <div>
                                                             <span className="text-2xl font-black text-foreground block">
                                                                 {logMetrics[activeLogPost.id]?.likes !== undefined ? (
                                                                     formatMetric(logMetrics[activeLogPost.id]?.likes)
                                                                 ) : (
                                                                     <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
                                                                 )}
                                                             </span>
                                                             {logMetrics[activeLogPost.id]?.likes !== undefined && (
                                                                 <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 flex items-center gap-0.5 mt-1">
                                                                     <TrendingUp size={10} /> {logMetrics[activeLogPost.id]?.likes_trend || "+14%"}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     </div>

                                                     {/* Comments */}
                                                     <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm relative flex flex-col justify-between h-28 hover:border-primary/40 transition-colors">
                                                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                             <MessageCircle size={14} className="text-sky-500" />
                                                             Comments
                                                         </span>
                                                         <div>
                                                             <span className="text-2xl font-black text-foreground block">
                                                                 {logMetrics[activeLogPost.id]?.comments !== undefined ? (
                                                                     formatMetric(logMetrics[activeLogPost.id]?.comments)
                                                                 ) : (
                                                                     <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
                                                                 )}
                                                             </span>
                                                             {logMetrics[activeLogPost.id]?.comments !== undefined && (
                                                                 <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 flex items-center gap-0.5 mt-1">
                                                                     <TrendingDown size={10} /> {logMetrics[activeLogPost.id]?.comments_trend || "-2%"}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     </div>

                                                     {/* Shares */}
                                                     <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm relative flex flex-col justify-between h-28 hover:border-primary/40 transition-colors">
                                                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                             <Send size={14} className="text-emerald-500" />
                                                             Shares
                                                         </span>
                                                         <div>
                                                             <span className="text-2xl font-black text-foreground block">
                                                                 {logMetrics[activeLogPost.id]?.shares !== undefined ? (
                                                                     formatMetric(logMetrics[activeLogPost.id]?.shares)
                                                                 ) : (
                                                                     <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
                                                                 )}
                                                             </span>
                                                             {logMetrics[activeLogPost.id]?.shares !== undefined && (
                                                                 <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 flex items-center gap-0.5 mt-1">
                                                                     <TrendingUp size={10} /> {logMetrics[activeLogPost.id]?.shares_trend || "+8%"}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     </div>

                                                     {/* Vistas / Reach */}
                                                     <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm relative flex flex-col justify-between h-28 hover:border-primary/40 transition-colors">
                                                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                             <Eye size={14} className="text-indigo-500" />
                                                             Vistas
                                                         </span>
                                                         <div>
                                                             <span className="text-2xl font-black text-foreground block">
                                                                 {logMetrics[activeLogPost.id]?.views !== undefined ? (
                                                                     formatMetric(logMetrics[activeLogPost.id]?.views || logMetrics[activeLogPost.id]?.impressions)
                                                                 ) : (
                                                                     <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
                                                                 )}
                                                             </span>
                                                             {logMetrics[activeLogPost.id]?.views !== undefined && (
                                                                 <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 flex items-center gap-0.5 mt-1">
                                                                     <TrendingUp size={10} /> {logMetrics[activeLogPost.id]?.views_trend || "+21%"}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     </div>
                                                 </div>

                                                 {/* Bottom summary bar: Engagement Rate & Saves */}
                                                 <div className="grid grid-cols-2 gap-4">
                                                     <div className="bg-card border border-border/60 rounded-2xl p-3.5 shadow-sm flex items-center justify-between">
                                                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                             Engagement Rate
                                                         </span>
                                                         <span className="text-base font-black text-primary">
                                                             {logMetrics[activeLogPost.id]?.engagement_rate ?? '0%'}
                                                         </span>
                                                     </div>
                                                     <div className="bg-card border border-border/60 rounded-2xl p-3.5 shadow-sm flex items-center justify-between">
                                                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                             <Bookmark size={11} className="text-amber-500" /> Saves
                                                         </span>
                                                         <span className="text-base font-black text-foreground">
                                                             {logMetrics[activeLogPost.id]?.saves !== undefined ? formatMetric(logMetrics[activeLogPost.id]?.saves) : '0'}
                                                         </span>
                                                     </div>
                                                 </div>
                                             </div>
                                         )}
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
