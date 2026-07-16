"use client";

import React, { useState, useEffect } from "react";
import {
    Layout, CheckCircle2, Clock, AlertCircle, FileText, Video,
    MessageSquare, Filter, MoreHorizontal, User as UserIcon, X, Sparkles, Activity, ArrowRight,
    Plus, Calendar, Type, Image as ImageIcon, Layers, Search, Check, Users
} from "lucide-react";

export default function ContentBoardPage() {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [contentCreators, setContentCreators] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [assignmentMenu, setAssignmentMenu] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState("ALL");
    const [filterUser, setFilterUser] = useState("ALL");
    const [currentUserRole, setCurrentUserRole] = useState("GUEST");
    const [currentUserId, setCurrentUserId] = useState("");

    // Create Task Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createContentType, setCreateContentType] = useState('story');
    const [createAssignedUser, setCreateAssignedUser] = useState('');
    const [createInstructions, setCreateInstructions] = useState('');
    const [createSelectedClient, setCreateSelectedClient] = useState('');
    const [createDueDate, setCreateDueDate] = useState('');
    const [createPostDate, setCreatePostDate] = useState('');
    
    // Gallery search inside Create Modal
    const [showCreateFolioSearch, setShowCreateFolioSearch] = useState(false);
    const [createFolioSearch, setCreateFolioSearch] = useState('');
    const [createSearchedImage, setCreateSearchedImage] = useState(null);
    const [createFolioSearchLoading, setCreateFolioSearchLoading] = useState(false);
    const [createFolioSearchError, setCreateFolioSearchError] = useState(null);

    const contentTypes = [
        { id: 'story', label: 'Story', icon: Type, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
        { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'carousel', label: 'Carousel', icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { id: 'video', label: 'Video', icon: Video, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    ];

    const handleCreateRequest = async () => {
        if (!createAssignedUser) {
            alert("Please assign the request to a team member.");
            return;
        }

        if (!createSelectedClient) {
            alert("Please select a client.");
            return;
        }

        const payload = {
            client: createSelectedClient,
            assigned_to: createAssignedUser,
            request_type: 'CONTENT_REQUEST',
            month: createDueDate || new Date().toISOString().split('T')[0],
            linked_image: createSearchedImage ? createSearchedImage.id : null,
            notes: `${createInstructions}\n\n[Meta]\nContent Type: ${createContentType}\nPost Date: ${createPostDate}${createSearchedImage ? `\nGallery Image: ${createSearchedImage.folio} - ${createSearchedImage.title}\nImage URL: ${createSearchedImage.image_url}` : ''}`,
            status: 'TO_DO'
        };

        try {
            const userId = localStorage.getItem('userId');
            const createUrl = new URL('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/');
            if (userId) createUrl.searchParams.append('user_id', userId);

            const response = await fetch(createUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("Request created successfully! It has been assigned.");
                setShowCreateModal(false);
                // Reset form
                setCreateInstructions('');
                setCreateAssignedUser('');
                setCreateSelectedClient('');
                setCreateDueDate('');
                setCreatePostDate('');
                setCreateSearchedImage(null);
                setCreateFolioSearch('');
                setCreateFolioSearchError(null);
                // Refresh board data
                fetchData();
            } else {
                const err = await response.json();
                console.error("Error creating request:", err);
                alert("Failed to create request. Check console.");
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Network error.");
        }
    };

    const handleSearchByFolio = async () => {
        if (!createFolioSearch.trim()) {
            setCreateFolioSearchError('Please enter a folio number');
            return;
        }

        setCreateFolioSearchLoading(true);
        setCreateFolioSearchError(null);
        setCreateSearchedImage(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/gallery/images/search/?folio=${createFolioSearch.trim()}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setCreateSearchedImage(data);
                setCreateFolioSearchError(null);
            } else {
                const errorData = await response.json();
                setCreateFolioSearchError(errorData.error || 'Image not found');
                setCreateSearchedImage(null);
            }
        } catch (error) {
            console.error('Error searching image:', error);
            setCreateFolioSearchError('Failed to search image');
            setCreateSearchedImage(null);
        } finally {
            setCreateFolioSearchLoading(false);
        }
    };

    const handleClearGalleryImage = () => {
        setCreateSearchedImage(null);
        setCreateFolioSearch('');
        setCreateFolioSearchError(null);
    };


    // Board Columns Configuration
    const columns = [
        { id: 'TO_DO', title: 'To Do', color: 'bg-slate-500', icon: AlertCircle },
        { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-500', icon: Clock },
        { id: 'QA', title: 'QA', color: 'bg-purple-500', icon: CheckCircle2 },
        { id: 'IN_REVISION', title: 'In Revision', color: 'bg-orange-500', icon: MessageSquare },
        { id: 'CLIENT_REVIEW', title: 'Client Review', color: 'bg-blue-500', icon: Activity },
        { id: 'APPROVED', title: 'Approved', color: 'bg-emerald-400', icon: CheckCircle2 },
        { id: 'DONE', title: 'Done', color: 'bg-emerald-500', icon: CheckCircle2 },
    ];

    useEffect(() => {
        const role = localStorage.getItem("userRole") || "GUEST";
        const id = localStorage.getItem("userId") || "";
        setCurrentUserRole(role);
        setCurrentUserId(id);
        fetchData(role, id);
    }, []);

    const fetchData = async (role = currentUserRole, userId = currentUserId) => {
        setIsLoading(true);
        try {
            const reqUrl = new URL('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/');
            if (role) reqUrl.searchParams.append('role', role);
            if (userId) reqUrl.searchParams.append('user_id', userId);

            const [reqResponse, userResponse, creatorsResponse, clientsResponse] = await Promise.all([
                fetch(reqUrl.toString()),
                fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/manage/'), // Fetch all users for filter
                fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/content-creators/'), // Fetch content creators
                fetch('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/clients/') // Fetch clients
            ]);

            if (reqResponse.ok) {
                const data = await reqResponse.json();
                setRequests(data);
            }
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUsers(userData);
            }
            if (creatorsResponse.ok) {
                const creatorsData = await creatorsResponse.json();
                setContentCreators(creatorsData);
            }
            if (clientsResponse.ok) {
                const clientsData = await clientsResponse.json();
                setClients(clientsData);
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
            (req.assigned_to_details?.id && String(req.assigned_to_details.id) === filterUser) ||
            (req.qa_assigned_to_details?.id && String(req.qa_assigned_to_details.id) === filterUser);

        return matchesType && matchesUser;
    });

    const getColumnRequests = (status) => filteredRequests.filter(req => req.status === status);

    const getRequestTypeDetails = (type) => {
        switch (type) {
            case 'MONTHLY_CONTENT': return {
                label: 'Monthly',
                color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                badgeColor: 'bg-blue-500 text-white',
                borderColor: 'border-blue-500',
                icon: Layout
            };
            case 'VIDEO_SHOOT': return {
                label: 'Video Shoot',
                color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
                badgeColor: 'bg-purple-500 text-white',
                borderColor: 'border-purple-500',
                icon: Video
            };
            case 'CONTENT_REQUEST': return {
                label: 'Request',
                color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
                badgeColor: 'bg-orange-500 text-white',
                borderColor: 'border-orange-500',
                icon: FileText
            };
            default: return {
                label: 'Task',
                color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
                badgeColor: 'bg-slate-500 text-white',
                borderColor: 'border-slate-500',
                icon: FileText
            };
        }
    };

    // Check if a request has a pending suggestion
    const isPendingSuggestion = (req) => {
        return req.notes && req.notes.includes("Suggested assignment");
    };

    // Confirm the suggested assignment
    const handleConfirmAssignment = async (requestId) => {
        try {
            const userId = localStorage.getItem('userId');
            const confirmUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/contents/monthly-requests/${requestId}/confirm-assignment/`);
            if (userId) confirmUrl.searchParams.append('user_id', userId);

            const response = await fetch(
                confirmUrl.toString(),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (response.ok) {
                fetchData(); // Refresh board
            }
        } catch (error) {
            console.error("Error confirming assignment:", error);
        }
    };

    // Reassign to a different creator
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
                fetchData();
                setAssignmentMenu(null);
            }
        } catch (error) {
            console.error("Error reassigning:", error);
        }
    };

    return (
        <div className="min-h-screen bg-secondary/30 p-4 md:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col h-[calc(100vh-4rem)] min-h-0 mx-auto">
                {/* Header & Filters */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 flex-shrink-0 z-20">
                    <div className="pl-1 border-l-4 border-primary">
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Content Pipeline</h1>
                        <p className="mt-2 text-muted-foreground text-lg">Visualize and manage your content workflow.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">


                        {/* Type Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter size={16} className="text-muted-foreground" />
                            </div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm cursor-pointer appearance-none hover:bg-accent/50 transition-all min-w-[180px]"
                            >
                                <option value="ALL">All Content Types</option>
                                <option value="MONTHLY_CONTENT">Monthly Contents</option>
                                <option value="VIDEO_SHOOT">Video Shoots</option>
                                <option value="CONTENT_REQUEST">Content Requests</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        {/* User Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon size={16} className="text-muted-foreground" />
                            </div>
                            <select
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm cursor-pointer appearance-none hover:bg-accent/50 transition-all min-w-[180px]"
                            >
                                <option value="ALL">All Users</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
 
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                            <span>+ New Task</span>
                        </button>
                    </div>
                </div>

                {/* Board Container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 min-h-0">
                    <div className="flex gap-6 min-w-[1400px] h-full"> {/* Ensure min width for horizontal scroll if needed */}

                        {columns.map(col => {
                            const colRequests = getColumnRequests(col.id);
                            const Icon = col.icon;
                            // Extract color class logic properly
                            const colorClass = col.color;

                            return (
                                <div key={col.id} className="flex-1 flex flex-col min-w-[320px] bg-secondary/50 backdrop-blur-md border border-border/60 rounded-3xl p-4 shadow-sm">
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${colorClass} shadow-[0_0_10px_rgba(0,0,0,0.2)]`}></div>
                                            <h2 className="text-lg font-bold text-foreground tracking-tight">{col.title}</h2>
                                            <span className="bg-foreground/5 text-foreground/70 text-xs font-bold px-2.5 py-1 rounded-full border border-border">
                                                {colRequests.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column Content */}
                                    <div className="flex-1 rounded-2xl flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-0">
                                        {colRequests.length === 0 ? (
                                            <div className="text-center py-12 opacity-40 flex flex-col items-center">
                                                <div className="p-4 rounded-full bg-muted mb-3">
                                                    <Icon className="text-muted-foreground" size={24} />
                                                </div>
                                                <p className="text-sm font-bold text-muted-foreground">No tasks</p>
                                            </div>
                                        ) : (
                                            colRequests.map(req => {
                                                const typeDetails = getRequestTypeDetails(req.request_type);
                                                const TypeIcon = typeDetails.icon;

                                                return (
                                                    <div
                                                        key={req.id}
                                                        onClick={() => setSelectedRequest(req)}
                                                        className="bg-card hover:bg-accent/40 p-5 rounded-2xl transition-all group hover:-translate-y-1 duration-300 cursor-pointer shadow-sm hover:shadow-xl border border-border hover:border-primary/30 relative overflow-hidden flex flex-col"
                                                    >
                                                        {/* Priority Stripe */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeDetails.color.split(' ')[0]}`}></div>

                                                        {/* Card Header */}
                                                        <div className="flex justify-between items-start mb-3 pl-2 shrink-0">
                                                            <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full flex items-center gap-1.5 ${typeDetails.color} border border-transparent`}>
                                                                <TypeIcon size={10} />
                                                                {typeDetails.label}
                                                            </span>
                                                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all">
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                        </div>

                                                        {/* Card Title & Content */}
                                                        <div className="mb-3 pl-2">
                                                            <div className="flex items-start gap-3">
                                                                <h3 className="font-bold text-foreground text-sm leading-relaxed">
                                                                    {req.client_details && (
                                                                        <span className="block text-xs font-black text-primary mb-1 uppercase tracking-wide">
                                                                            {req.client_details.client_profile?.practice_name || req.client_details.username}
                                                                        </span>
                                                                    )}
                                                                    {req.notes || "Untitled Request"}
                                                                </h3>
                                                            </div>
                                                        </div>

                                                        {/* Card Footer */}
                                                        <div className="flex items-center justify-between border-t border-border pt-3 mt-auto shrink-0 pl-2">

                                                            {/* Date */}
                                                            <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                                                                <Clock size={12} />
                                                                {req.month}
                                                            </div>

                                                            {/* Avatars */}
                                                            <div className="flex -space-x-2">
                                                                {req.client_details && (
                                                                    <div
                                                                        className="w-7 h-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary shadow-sm"
                                                                        title={`Client: ${req.client_details.username}`}
                                                                    >
                                                                        {(req.client_details.client_profile?.practice_name?.[0] || req.client_details.username[0]).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                {req.assigned_to_details && (
                                                                    <div
                                                                        className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-secondary-foreground shadow-sm relative"
                                                                        title={`Assigned: ${req.assigned_to_details.username}`}
                                                                    >
                                                                        {req.assigned_to_details.username.charAt(0).toUpperCase()}
                                                                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-card"></div>
                                                                    </div>
                                                                )}
                                                                {req.qa_assigned_to_details && (
                                                                    <div
                                                                        className="w-7 h-7 rounded-full bg-purple-100 border-2 border-card flex items-center justify-center text-[10px] font-bold text-purple-700 shadow-sm relative -ml-2"
                                                                        title={`QA: ${req.qa_assigned_to_details.username}`}
                                                                    >
                                                                        {req.qa_assigned_to_details.username.charAt(0).toUpperCase()}
                                                                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-card"></div>
                                                                    </div>
                                                                )}
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-card w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden border border-border relative animate-in zoom-in-95 duration-200 text-foreground">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedRequest(null); }}
                                className="absolute top-4 right-4 z-10 p-2 bg-background/50 hover:bg-destructive/10 backdrop-blur-md rounded-full text-muted-foreground hover:text-destructive transition-colors border border-border"
                            >
                                <X size={20} />
                            </button>

                            {/* Left: Content Preview */}
                            <div className="flex-1 flex flex-col bg-secondary/20 p-6 sm:p-8 lg:p-10 overflow-y-auto">
                                <div className="max-w-3xl mx-auto w-full">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-foreground tracking-tight">Content Preview</h2>
                                            <p className="text-muted-foreground font-medium">Visualizing content for <span className="text-foreground font-bold">{selectedRequest.client_details?.username}</span></p>
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className="bg-card rounded-3xl border border-border shadow-xl p-8 mb-6">
                                        {/* Header */}
                                        <div className="flex items-center gap-4 mb-6">
                                            {selectedRequest.client_details?.client_profile?.logo ? (
                                                <img src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${selectedRequest.client_details.client_profile.logo}`} alt="Client Logo" className="w-12 h-12 rounded-full border border-border object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-lg">
                                                    {(selectedRequest.client_details?.username?.[0] || 'C').toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-bold text-foreground">{selectedRequest.client_details?.username || 'Client Name'}</span>
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Pro</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Just now</p>
                                            </div>
                                        </div>

                                        {/* Media Placeholder */}
                                        <div className="aspect-square bg-muted/30 rounded-2xl mb-6 flex items-center justify-center text-muted-foreground relative overflow-hidden group border border-border/50">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-50"></div>
                                            <div className="text-center p-6">
                                                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                    <Video size={32} className="text-foreground/80" />
                                                </div>
                                                <span className="text-lg font-bold text-foreground">Media Placeholder</span>
                                                <p className="text-sm text-muted-foreground mt-2">Content pending upload or generation</p>
                                            </div>
                                        </div>

                                        {/* Action Bar Mockup */}
                                        <div className="flex gap-4 mb-6 text-foreground/20">
                                            <div className="w-6 h-6 rounded-full bg-current"></div>
                                            <div className="w-6 h-6 rounded-full bg-current"></div>
                                            <div className="w-6 h-6 rounded-full bg-current"></div>
                                            <div className="flex-1"></div>
                                            <div className="w-6 h-6 rounded-full bg-current"></div>
                                        </div>

                                        {/* Caption */}
                                        <div className="space-y-4">
                                            <p className="text-foreground text-sm leading-7">
                                                {selectedRequest.ai_caption ? (
                                                    <span className="block font-medium">{selectedRequest.ai_caption}</span>
                                                ) : (
                                                    <span className="italic text-muted-foreground/60">No automated caption generated yet...</span>
                                                )}
                                            </p>
                                            {selectedRequest.content_text && (
                                                <div className="p-4 bg-secondary/50 rounded-xl text-xs text-muted-foreground border border-border/50">
                                                    <span className="flex items-center gap-1.5 font-bold text-primary uppercase text-[10px] mb-2">
                                                        <FileText size={10} />
                                                        Content Strategy
                                                    </span>
                                                    {selectedRequest.content_text}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: History Timeline Sidebar */}
                            <div className="w-full lg:w-96 bg-card border-l border-border flex flex-col h-full shrink-0">
                                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/10">
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        <Activity size={18} className="text-primary" />
                                        Activity History
                                    </h3>
                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                                        {selectedRequest.history ? selectedRequest.history.length : 0}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    {selectedRequest.history && selectedRequest.history.length > 0 ? (
                                        selectedRequest.history.map((hist, idx) => {
                                            const actorUsername = hist.changed_by_details?.username || (hist.changed_by ? `user-${hist.changed_by}` : null);
                                            const actorLabel = actorUsername ? `@${actorUsername}` : 'Sistema';
                                            const actorInitial = actorUsername ? actorUsername[0].toUpperCase() : 'S';

                                            return (
                                            <div key={hist.id || idx} className="relative pl-8 pb-0 border-l-2 border-border/60 last:border-l-0 group">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-primary group-hover:scale-125 transition-transform shadow-[0_0_0_4px_var(--color-background)]"></div>

                                                <div className="flex flex-col gap-1.5 -mt-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1">
                                                            {new Date(hist.timestamp).toLocaleDateString()}
                                                            <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                                                            {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    <div className="text-sm font-medium text-foreground">
                                                        Status changed to <span className="font-black text-primary">{hist.new_status.replace('_', ' ')}</span>
                                                    </div>

                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center font-bold text-[9px] text-foreground border border-border">
                                                            {actorInitial}
                                                        </div>
                                                        <span className="font-semibold">{actorLabel}</span>
                                                    </div>

                                                    {hist.notes && (
                                                        <div className="bg-secondary/30 border border-border/50 p-3 rounded-xl mt-2 text-xs text-muted-foreground italic relative">
                                                            <div className="absolute top-0 left-2 -mt-1 w-2 h-2 bg-secondary/30 rotate-45 border-t border-l border-border/50"></div>
                                                            &quot;{hist.notes}&quot;
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                    ) : (
                                        <div className="text-center py-16 opacity-50 flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                                                <Activity size={32} className="text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground">No activity recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10">
                                    <button className="w-full py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                        Add Note <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Request Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-card w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-border relative animate-in zoom-in-95 duration-200 text-foreground overflow-hidden">
                            
                            {/* Modal Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/10 shrink-0">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground tracking-tight">New Request</h2>
                                    <p className="text-xs text-muted-foreground font-medium">Create a task for the content team</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 bg-background hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors border border-border"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-6">
                                
                                {/* Left Side: Content Type & Folio */}
                                <div className="md:w-1/3 flex flex-col gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Content Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {contentTypes.map((type) => {
                                                const Icon = type.icon;
                                                const isSelected = createContentType === type.id;
                                                return (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => setCreateContentType(type.id)}
                                                        className={`
                                                            flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-200
                                                            ${isSelected
                                                                ? 'border-primary bg-primary text-primary-foreground shadow-lg'
                                                                : 'border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-primary'}
                                                        `}
                                                    >
                                                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20 text-white' : type.bg + ' ' + type.color}`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <span className="font-bold text-xs">{type.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="border-t border-border pt-4 mt-auto">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateFolioSearch(true)}
                                            className="w-full flex items-center justify-between p-3.5 bg-muted/30 hover:bg-card border border-border hover:border-primary/50 rounded-xl transition-all shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                                                    {createSearchedImage ? <Check size={16} /> : <Plus size={16} />}
                                                </div>
                                                <div className="text-left">
                                                    <span className="block text-xs font-bold text-foreground">
                                                        {createSearchedImage ? `Linked: ${createSearchedImage.folio}` : 'Link Photo ID'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">
                                                        {createSearchedImage ? createSearchedImage.title : 'Search from gallery'}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px bg-border my-2"></div>

                                {/* Right Side: Fields */}
                                <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
                                    
                                    {/* Instructions */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Instructions</label>
                                        <textarea
                                            value={createInstructions}
                                            onChange={(e) => setCreateInstructions(e.target.value)}
                                            className="w-full h-24 px-4 py-3 bg-secondary/10 border border-input focus:bg-card focus:border-primary rounded-xl text-foreground placeholder-muted-foreground/50 resize-none outline-none transition-all font-medium text-sm"
                                            placeholder="Describe the requirements for this content piece..."
                                        />
                                    </div>

                                    {/* Client Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Client</label>
                                        <div className="relative">
                                            <select
                                                value={createSelectedClient}
                                                onChange={(e) => setCreateSelectedClient(e.target.value)}
                                                className="w-full px-4 py-3 pl-10 bg-secondary/10 border border-input rounded-xl text-foreground font-bold text-sm outline-none focus:border-primary focus:bg-card appearance-none transition-all"
                                            >
                                                <option value="">Select Client...</option>
                                                {clients.map(client => {
                                                    const name = client.first_name && client.last_name ? `${client.first_name} ${client.last_name}` : client.username;
                                                    return (
                                                        <option key={client.id} value={client.id}>{name}</option>
                                                    );
                                                })}
                                            </select>
                                            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        </div>
                                    </div>

                                    {/* Assign To */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Assign To</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <select
                                                value={createAssignedUser}
                                                onChange={(e) => setCreateAssignedUser(e.target.value)}
                                                className="w-full px-4 py-3 bg-secondary/10 border border-input rounded-xl text-foreground font-bold text-sm outline-none focus:border-primary focus:bg-card appearance-none transition-all"
                                            >
                                                <option value="">Select Team Member...</option>
                                                {contentCreators.map(user => {
                                                    const name = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username;
                                                    return (
                                                        <option key={user.id} value={user.id}>{name} ({user.role})</option>
                                                    );
                                                })}
                                            </select>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 border border-border rounded-xl">
                                                {createAssignedUser ? (
                                                    <>
                                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                                                            {contentCreators.find(u => String(u.id) === String(createAssignedUser))?.username?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-xs font-bold text-foreground truncate">{contentCreators.find(u => String(u.id) === String(createAssignedUser))?.username}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{contentCreators.find(u => String(u.id) === String(createAssignedUser))?.role}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground font-medium">No user selected</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Due Date</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={createDueDate}
                                                    onChange={(e) => setCreateDueDate(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-secondary/10 border border-input rounded-xl text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 font-bold text-xs transition-all"
                                                />
                                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Post Date</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={createPostDate}
                                                    onChange={(e) => setCreatePostDate(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-secondary/10 border border-input rounded-xl text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 font-bold text-xs transition-all"
                                                />
                                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-4 shrink-0">
                                        <button
                                            onClick={handleCreateRequest}
                                            className="w-full py-3.5 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <span>Create Request</span>
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Folio Search Modal */}
                {showCreateFolioSearch && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                        <div className="bg-card rounded-3xl shadow-2xl p-6 max-w-xl w-full animate-in zoom-in duration-300 border border-border text-foreground">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Link Gallery Image</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Search by folio number (e.g., C5F12-001)</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateFolioSearch(false);
                                        setCreateFolioSearchError(null);
                                    }}
                                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                >
                                    <X size={16} className="text-muted-foreground" />
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <input
                                            type="text"
                                            value={createFolioSearch}
                                            onChange={(e) => setCreateFolioSearch(e.target.value.toUpperCase())}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearchByFolio()}
                                            placeholder="Enter folio number..."
                                            className="w-full pl-9 pr-3 py-3 border border-border bg-secondary/10 rounded-xl text-foreground font-bold text-sm outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchByFolio}
                                        disabled={createFolioSearchLoading}
                                        className="px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                    >
                                        {createFolioSearchLoading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>

                                {createFolioSearchError && (
                                    <div className="mt-2.5 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-xs text-red-500 font-medium">{createFolioSearchError}</p>
                                    </div>
                                )}
                            </div>

                            {/* Search Result */}
                            {createSearchedImage && (
                                <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={createSearchedImage.image_url}
                                            alt={createSearchedImage.title}
                                            className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-1">
                                                <div>
                                                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{createSearchedImage.folio}</p>
                                                    <h4 className="text-sm font-bold text-foreground">{createSearchedImage.title}</h4>
                                                </div>
                                                <button
                                                    onClick={handleClearGalleryImage}
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setShowCreateFolioSearch(false)}
                                                className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Check size={14} />
                                                Confirm & Attach
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {!createSearchedImage && !createFolioSearchError && (
                                <div className="text-center py-8 border border-dashed border-border rounded-xl">
                                    <ImageIcon size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
                                    <p className="text-xs text-muted-foreground font-medium">Enter a folio number to search</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
